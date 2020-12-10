'use strict';

//keep per-client state (cursors, colors, tool type etc) and do the actual svg stuff
export default class PaperClient {
    constructor(client_id, paper_svg, scratch_svg) {
        this.client_id = client_id;
        this.paper_svg=paper_svg;
        this.scratch_svg=scratch_svg;

        //current svg element we're building/modfiying
        // this.current_element = undefined;
        // this.next_object_id = 0;
        this.drawType=undefined;
        this.element=undefined;

    }


    //store latest cursor postion
    cursorEvent(cursor_event) {
        this.cursor_event = cursor_event;
    }

    // //enqueue all draw increments.
    // drawIncrementEvent(draw_increment) {
    //     this.increment_events.push(draw_increment);
    // }

    animateCursor() {
        //create cursor?
        if (this.client_id != 0 && this.cursor_svg === undefined) {
            this.cursor_svg = this.scratch_svg.group();
            this.cursor_svg.path('M-10,0 L10,0 M0,-10 L0,10').stroke('black');
            this.cursor_svg.text("client " + this.client_id);
        }


        this.cursor_svg.transform({
            translateX: this.cursor_event.x(),
            translateY: this.cursor_event.y()
        });
    }

    // getObjectIdStr(id) {
    //     return ("c" + this.client_id + "o" + id);
    // }

//     //execute a drawing increment, and return the reverse for undo/timeslider purposes.
//     drawIncrement(type, p1, p2, p3) {
//         let reverse = undefined;
//
//         switch (type) {
//             case event.IncrementalType.SelectDrawType:
//                 reverse = [event.IncrementalType.SelectDrawType, this.draw_type];
//                 this.draw_type = p1;
//                 break;
//             case event.IncrementalType.PointerStart:
//                 switch (this.draw_type) {
//                     case event.DrawType.PolyLine:
//                         reverse = [event.IncrementalType.Delete];
//
//                         this.current_element = this.paper_svg.polyline([[p1, p2]]);
//                         // this.current_element = this.paper_svg.path("M"+p1+","+p2);
//                         this.current_element.stroke('black').fill('none').attr('stroke-width', 2);
//                         this.current_element.node.id = this.getObjectIdStr(this.next_object_id);
//                         this.next_object_id++;
//
//                         break;
//                     case event.DrawType.Rectangle:
//                         reverse = [event.IncrementalType.Delete];
//
//                         this.current_element = this.paper_svg.rect().move(p1, p2);
//                         this.current_element.stroke('black').fill('none').attr('stroke-width', 2);
//                         this.current_element.node.id = this.getObjectIdStr(this.next_object_id);
//                         this.next_object_id++;
//
//                         break;
//                     default:
//                         break;
//                 }
//                 break;
//             case event.IncrementalType.PointerMove:
//                 if (this.current_element) {
//
//                     switch (this.draw_type) {
//                         case event.DrawType.PolyLine:
//                             reverse = [event.IncrementalType.DeletePoint, this.current_element.node.points.length];
//                             let p = this.paper_svg.node.createSVGPoint();
//                             p.x = p1;
//                             p.y = p2;
//                             this.current_element.node.points.appendItem(p);
//
//                             // //test with path
//                             // reverse=[event.IncrementalType.DeletePoint ];
//                             // this.current_element.node.setAttribute('d',this.current_element.node.attributes.d.value+"L"+p1+","+p2);
//
//                             break;
//                         case event.DrawType.Rectangle:
//
//
//                             // reverse=[event.IncrementalType.PointerMove,
//                             //     this.current_element.attr().x+this.current_element.attr().width, //current x
//                             //     this.current_element.attr().y+this.current_element.attr().height //current y
//                             // ];
//                             // console.log("MOLVE", p1, this.current_element.attr().x);
//
//                             this.current_element.attr('width', p1 - this.current_element.attr().x);
//                             this.current_element.attr('height', p2 - this.current_element.attr().y);
//
//                             break;
//                         default:
//                             break;
//                     }
//                 }
//                 break;
//             case event.IncrementalType.PointerEnd:
//                 if (this.current_element) {
//
//                     switch (this.draw_type) {
//                         // case event.DrawType.PolyLine:
//                         //     reverse=[event.IncrementalType.DeletePoint, this.current_element.node.points.length ];
//                         //     let p = this.scratch_svg.node.createSVGPoint();
//                         //     p.x = p1;
//                         //     p.y = p2;
//                         //     this.current_element.node.points.appendItem(p);
//                         //
//                         //     break;
//                         case event.DrawType.Rectangle:
// // console.log("END", p1, this.current_element.attr().x);
//                             reverse = [event.IncrementalType.PointerMove,
//                                 this.current_element.attr().x,
//                                 this.current_element.attr().y
//                             ];
//
//                             this.current_element.attr('width', p1 - this.current_element.attr().x);
//                             this.current_element.attr('height', p2 - this.current_element.attr().y);
//
//                             break;
//                         default:
//                             break;
//                     }
//                 }
//                 break;
//             case event.IncrementalType.DeletePoint:
//                 let point = this.current_element.node.points[p1];
//                 reverse = [event.IncrementalType.PointerMove, point[0], point[1]];
//                 this.current_element.node.points.removeItem(p1);
//                 break;
//
//             case event.IncrementalType.Delete:
//                 this.next_object_id--;
//                 this.current_element.remove();
//                 this.current_element = SVG(document.querySelector("#" + this.getObjectIdStr(this.next_object_id - 1)));
//
//                 break;
//
//             case event.IncrementalType.Archive: {
//                 reverse=[event.IncrementalType.Unarchive, p1, p2 ,p3];
//                 const idStr="#c"+p1+"o"+p2;
//                 const e = SVG(document.querySelector(idStr));
//                 if (e)
//                     e.hide();
//                 break;
//             }
//             case event.IncrementalType.Unarchive: {
//                 reverse=[event.IncrementalType.Archive, p1, p2 ,p3];
//                 const idStr="#c"+p1+"o"+p2;
//                 const e = SVG(document.querySelector(idStr));
//                 if (e)
//                     e.show();
//                 break;
//             }
//
//
//             default:
//                 break;
//         }
//
//         return (reverse);
//
//     }
}

