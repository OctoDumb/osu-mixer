var { EventEmitter } = require('events');
var { setTimeout, clearTimeout } = require('timers');

class TimedInput extends EventEmitter {
    /**
     * 
     * @param {HTMLInputElement} el
     * @param {Number} period 
     */
    constructor(el, period = 1000) {
        super();
        /**
         * @type {NodeJS.Timeout}
         */
        this.timer = null;
        el.oninput = (e) => {
            if(e.type == "submit") {
                if(this.timer) {
                    clearTimeout(this.timer);
                    this.timer = null;
                }
                this.emit("change", el.value);
            } else {
                if(this.timer)
                    clearTimeout(this.timer);
                this.timer = setTimeout(() => {
                    this.emit("change", el.value);
                    this.timer = null;
                }, period);
            }
        }
    }
}

module.exports = TimedInput;