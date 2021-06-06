import Messages from "./messages.js";
import PaperDraw from "./paperDraw.js";
import PaperSend from "./paperSend.js";
import PaperReceive from "./paperReceive.js";
import ControlDrawing from "./controlDrawing.js";
import ControlUI from "./controlUI.js";

import jQuery from 'jquery';
window.jQuery=jQuery;
require("fomantic-ui-css/semantic");

export default function main()
{
    window.addEventListener('load', (event) => {

        document.version = "v0.6";
        let paperDraw = new PaperDraw(
            document.querySelector("#paper"),
            document.querySelector("#scratch")
        );

        let messages= new Messages();

        let paperSend = new PaperSend(messages);

        let paperReceive = new PaperReceive(messages, paperDraw, paperSend);
        paperSend.paperReceive = paperReceive;

        let controlUI = new ControlUI(messages);
        let controlDrawing = new ControlDrawing(paperSend);


        // //start websocket messaging:
        messages.start();

    })
}

