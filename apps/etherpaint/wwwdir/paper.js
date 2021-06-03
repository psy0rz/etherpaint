import {m} from "./messages.js";
import PaperDraw from "./paperDraw";
import PaperSend from "./paperSend.js";
import PaperReceive from "./paperReceive.js";
import ControlDrawing from "./controlDrawing.js";
import ControlUI from "./controlUI.js";

export default function main()
{
    window.addEventListener('load', (event) => {

        document.version = "v0.5";
        let paperDraw = new PaperDraw(
            document.querySelector("#paper"),
            document.querySelector("#scratch")
        );

        let paperSend = new PaperSend(m);

        let paperReceive = new PaperReceive(m, paperDraw, paperSend);
        paperSend.paperReceive = paperReceive;

        let controlUI = new ControlUI(m);
        let controlDrawing = new ControlDrawing(paperSend);


        // //start websocket messaging:
        m.start();

        //XXX
        // $(".paper-attribute-pallet").click();

    })
}

