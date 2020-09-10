'use strict';

class PaperClient {
    constructor(client_id) {
        this.client_id = client_id;
        // this.increment_events = [];

        //current svg element we're building/modfiying
        this.current_element = undefined;
        this.next_object_id=0;

        //create cursor
        this.cursor_svg = paper.scratch_svg.group();
        this.cursor_svg.path('M-10,0 L10,0 M0,-10 L0,10').stroke('black');
        this.cursor_svg.text("client " + client_id);

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
        this.cursor_svg.transform({
            translateX: this.cursor_event.x(),
            translateY: this.cursor_event.y()
        });
    }

    getObjectIdStr(id)
    {
        return("c"+this.client_id+"o"+id);
    }

    //execute a drawing increment, and retrun the reverse for undo/timeslider purposes.
    drawIncrement(type, p1, p2, p3) {
        let reverse;

        switch (type) {
            case event.IncrementalType.SelectDrawType:
                reverse=[event.IncrementalType.SelectDrawType, this.drawtype];
                this.drawtype = p1;
                break;
            case event.IncrementalType.PointerStart:
                switch (this.drawtype) {
                    case event.DrawType.PolyLine:
                        reverse=[event.IncrementalType.Delete];

                        this.current_element = paper.scratch_svg.polyline([[p1,p2]]);
                        this.current_element.stroke('black').fill('none');
                        this.current_element.node.id=this.getObjectIdStr(this.next_object_id);
                        this.next_object_id++;

                        // this.current_points=document.querySelector("#"+this.current_element.id).points;
                        break;
                    default:
                        break;
                }
                break;
            case event.IncrementalType.PointerMove:
                if (this.current_element) {

                    switch (this.drawtype) {
                        case event.DrawType.PolyLine:
                            reverse=[event.IncrementalType.DeletePoint, this.current_element.node.points.length ];
                            let p = paper.scratch_svg.node.createSVGPoint();
                            p.x = p1;
                            p.y = p2;
                            this.current_element.node.points.appendItem(p);

                            break;
                        default:
                            break;
                    }
                }
                break;
            case event.IncrementalType.DeletePoint:
                let point=this.current_element.node.points[p1];
                reverse=[event.IncrementalType.PointerMove, point[0], point[1] ];
                this.current_element.node.points.removeItem(p1);
                break;

            case event.IncrementalType.Delete:
                this.next_object_id--;
                this.current_element.remove();
                this.current_element=SVG(document.querySelector("#"+this.getObjectIdStr(this.next_object_id-1)));

                break;




            default:
                break;
        }

        return(reverse);

    }
}

