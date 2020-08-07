
// Thanks to hkaiser@#boost for helping me with the automatic handler registration:
struct synapseAutoReg
{
    synapseAutoReg(char const* name)
    {
    	Cvar var;
    	var["event"]=name;
        handlers.push_back(var);
    }

    static list<synapse::Cvar> handlers;
};

list<synapse::Cvar> synapseAutoReg::handlers;

//register a hanlder without specifying extra paraters:
#define SYNAPSE_REGISTER(name) \
    synapse::synapseAutoReg BOOST_PP_CAT(synapse_autoreg_, name)(#name, ""); \
    SYNAPSE_HANDLER(name)

//newer method to register handlers, this one uses an extra json string to specify many parameters of the event
//for example one could use:
//SYNAPSE_REGISTER(play_Pause, "{ 'recvGroup': 'everyone', 'sendGroup': 'module' }")
// #define SYNAPSE_REGISTER_2(name, jsonVar) \
//     synapse::synapseAutoReg BOOST_PP_CAT(synapse_autoreg_, name)(#name, #jsonVar); \
//     SYNAPSE_HANDLER(name)

//some helper macros to choose the correct version of SYNAPSE_REGISTER, depending on the number of parameters
//thanks to http://stackoverflow.com/questions/3046889/optional-parameters-with-c-macros
// #define SYNAPSE_REGISTER_CHOOSER(x, A, B, FUNC, ...) FUNC
// #define SYNAPSE_REGISTER(...) SYNAPSE_REGISTER_CHOOSER(, ##__VA_ARGS__, \
//     												SYNAPSE_REGISTER_2(__VA_ARGS__), \
//     												SYNAPSE_REGISTER_1(__VA_ARGS__)\
//     												)

//to determine compatability of module:
extern "C" int synapseVersion() {
	return (SYNAPSE_API_VERSION);
};




extern "C" bool synapseInit(CmessageMan * initMessageMan, CmodulePtr initModule)
{
	messageMan=initMessageMan;
	module=initModule;

	//when this function is called we have a core-lock, so we can register our handlers directly:
	BOOST_FOREACH(synapse::Cvar var, synapseAutoReg::handlers)
	{
		//we dont use core_Register to avoid chicken egg problems when loading the core module
		((CmodulePtr)module)->setHandler(var["event"], var["event"]);

		//are there extra event parameters specified?
		if (var.isSet("sendGroup"))
		{
			CmsgPtr out(new Cmsg);
			out->event="core_ChangeEvent";
			out->dst=1;
			*out=var;
			//dont call out.send, it will deadlock..
			messageMan->sendMessage((CmodulePtr)module, out, 0);
		}
	}
	synapseAutoReg::handlers.clear();

	//this module has its own init function?
	#ifdef SYNAPSE_HAS_INIT
	init();
	#endif
	return true;
}
