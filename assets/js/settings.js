var { ipcRenderer: ipc, remote } = require('electron');
var fs = require('fs');

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
        this.allActions = {pause:"Play / Pause",prev:"Previous song",next:"Next song",speed:"Switch timerate",repeat:"Switch repeating","vol+":"Increase volume","vol-":"Decrease volume",mute:"Mute volume"};

        this.switches = {
            discord: true,
            visualizer: true,
            parallax: true
        };

        this.shortcuts = fs.existsSync(`${remote.app.getPath("userData")}\\shortcuts.json`) ? 
            JSON.parse(
                fs.readFileSync(`${remote.app.getPath("userData")}\\shortcuts.json`).toString()
            ) : [];

        this.saveShortcuts();
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

    addShortcut(keys, action) {
        this.shortcuts.push({
            keys,
            action
        });
        this.saveShortcuts();
    }

    deleteShortcut(i) {
        this.shortcuts.splice(i, 1);
        this.saveShortcuts();
    }

    switchShortcuts() {
        this.usable = !this.usable;
    }

    saveShortcuts() {
        ipc.send("shortcuts", this.shortcuts);
    }

    getActionName(id) {
        return this.allActions[id] || "Unknown action";
    }

    getAllActions() {
        return Object.keys(this.allActions).map(key => [key, this.allActions[key]]);
    }
}

module.exports = Settings;