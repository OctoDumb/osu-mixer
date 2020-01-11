var { ipcRenderer: ipc } = require('electron');

class Settings {
    /**
     * 
     * @param {String} el 
     * @param {Vue} player 
     */
    constructor(el, player) {
        this.el = el;
        this.player = player;
        this.usable = false;

        this.switches = {
            discord: true,
            visualizer: true,
            parallax: true
        };

        this.shortcuts = [
            {
                keys: ["ctrl", "shift", "p"],
                action: "pause"
            },
            {
                keys: ["ctrl", "shift", "["],
                action: "prev"
            },
            {
                keys: ["ctrl", "shift", "]"],
                action: "next"
            },
            {
                keys: ["ctrl", "shift", "m"],
                action: "mute"
            }
        ]

        this.saveShorcuts();
    }

    /**
     * 
     * @param {String} action 
     */
    run(action) {
        if(!this.usable) return;
        console.log("Shortcut", action);
        switch(action) {
            case "pause":
                return this.player.playpause();
            case "prev":
                return this.player.prev();
            case "next":
                return this.player.next();
            case "speed":
                return this.player.switchSpeed();
            case "repeat":
                return this.player.switchRepeat();
            case "vol+":
                return false;
            case "vol-":
                return false;
            case "mute":
                return false;
            default:
                throw "Unknown action";
        }
    }

    switchShortcuts() {
        this.usable = !this.usable;
    }

    saveShorcuts() {
        ipc.send("shortcuts", this.shortcuts);
    }

    getActionName(id) {
        let a = {pause:"Pause",prev:"Previous song",next:"Next song",speed:"Switch timerate",repeat:"Switch repeating","vol+":"Increase volume","vol-":"Decrease volume",mute:"Mute volume"};
        return a[id] || "Unknown action";
    }
}

module.exports = Settings;