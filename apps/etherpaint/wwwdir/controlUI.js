//control UI for foomatic-ui

export default class ControlUI {

    constructor(paperSend) {

        const self=this;

        this.hideTools();

        $('.paper-click.paper-tool').on('click', function () {
            self.highlightTool(this);
        })



        //make sure paper starts after toolbar
        document.querySelector('#paper-container').style.top = document.querySelector("#topbar").offsetHeight + "px";

    }

    hideTools() {
        const self=this;
        this.hidable_values = [];
        let skipped = false;
        $('.paper-hidable-tool').each(function () {
            if (!skipped)
                skipped = true
            else
                $(this).hide();

            self.hidable_values.push({
                name: this.title,
                value: this.id,
                icon: $("i", this)[0].className
            })
        })

        //show dropdown and activate hidden tool
        $('.paper-tool-dropdown').dropdown({
                onChange: function (value, text, $choice) {

                    $(".paper-hidable-tool").hide();
                    $("#" + value).addClass("active").show();
                    $("#" + value).trigger('click');

                    // $('.ui.dropdown').dropdown('hide');
                },
                values: this.hidable_values
            }
        );

    }

    highlightTool(e) {
        //deselect others
        $('.paper-click.paper-tool').removeClass('active');
        $(e).addClass('active');
    }

    toggleFullScreen() {
        var doc = window.document;
        var docEl = doc.documentElement;

        var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
        var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

        if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
            requestFullScreen.call(docEl);
        } else {
            // cancelFullScreen.call(doc);
        }
    }


    // function toggleMenu() {
    //     document.querySelector('#toolmenu').classList.toggle('is-active');
    //     document.querySelector('.navbar-burger').classList.toggle('is-active');
    //
    // }

    // $('#paper-container').on('click', function() {
    //     console.log("GA");
    //     toggleFullScreen();
    // });
//            window.scrollTo(0, 1);



    //move toolbar tools around according to screen width
    // new ResizeObserver(function () {
    //     const burger = document.querySelector("#mainbar .burger");
    //     for (const e of document.querySelectorAll("#mainbar .control")) {
    //         // e.classList.remove("is-hidden");
    //         // console.log(e.offsetLeft+e.offsetWidth, document.querySelector("#mainbar").offsetWidth);
    //     }
    //
    //
    //     var nodesArray = Array.prototype.slice.call(document.querySelectorAll("#mainbar .control"));
    //     for (const e of nodesArray.reverse()) {
    //         e.classList.remove("is-hidden");
    //         const right = e.offsetLeft + e.offsetWidth;
    //         if (right > document.querySelector("#mainbar").offsetWidth - 10) {
    //
    //             // e.classList.add("is-hidden");
    //
    //         }
    //         // console.log(e.offsetLeft+e.offsetWidth, document.querySelector("#mainbar").offsetWidth);
    //     }
    //
    //
    // }).observe(document.querySelector("#mainbar"));

    // // controlHamburgers();
    // document.querySelector(".navbar-burger").addEventListener('click', () => {
    //     toggleMenu();
    // });



    //
    //
    // });
}
