var { EventEmitter } = require('events');

class DraggableProgressBar extends EventEmitter {
    /**
     * 
     * @param {HTMLDivElement} bar 
     */
    constructor(bar) {
        super();

        this.bar = bar;

        this.dragging = false;

        bar.addEventListener("mousedown", (event) => {
            event.preventDefault();
            this.dragStart(event);
        }, false);

        document.body.addEventListener("mousemove", (event) => {
            this.move(event);
        }, false);

        document.body.addEventListener("mouseup", () => {
            this.drop();
        }, false);

        document.body.addEventListener("mouseleave", () => {
            this.out();
        }, false);

        this.start = {
            x: 0,
            y: 0
        };
    }

    out() {
        if(!this.dragging)
            return;
        this.emit('move', this.getPosition(this.start, this.bar.getBoundingClientRect()));
        this.emit('stop', true);
        this.dragging = false;
    }

    /**
     * 
     * @param {MouseEvent} event 
     */
    dragStart(event) {
        this.dragging = true;
        this.start.x = event.x;
        this.start.y = event.y;
        this.emit('start', true);
        this.emit('move', this.getPosition(event, this.bar.getBoundingClientRect()));
    }

    /**
     * 
     * @param {MouseEvent} event 
     * @param {ClientRect | DOMRect} rect 
     * 
     * @returns {{x: number, y: number}}
     */
    getPosition(event, rect) {
        let x; // X axis

        if(event.x < rect.left)
            x = 0;
        else if(event.x > rect.right)
            x = 100;
        else
            x = (event.x - rect.left) / rect.width * 100;

        let y; // Y axis

        if(event.y < rect.top)
            y = 0;
        else if(event.y > rect.bottom)
            y = 100;
        else
            y = (rect.top - event.y) / rect.height * 100;

        return {
            x, y
        }
    }

    /**
     * 
     * @param {MouseEvent} event 
     */
    move(event) {
        if(!this.dragging)
            return;
        this.emit('move', this.getPosition(event, this.bar.getBoundingClientRect()));
    }

    drop() {
        if(!this.dragging)
            return;
        this.emit('stop', true);
        this.dragging = false;
    }
}

module.exports = DraggableProgressBar;