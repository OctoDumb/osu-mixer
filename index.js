var { app, BrowserWindow, globalShortcut, ipcMain: ipc } = require('electron');

/**
 * @type {BrowserWindow}
 */
let window;

app.on('second-instance', (e) => {
    e.preventDefault();
    if(window) {
        if(!window.isVisible())
            window.show();
        if(window.isMinimized())
            window.maximize();
    }
});

app.on('ready', () => {
    window = new BrowserWindow({
        width: 1000,
        height: 700,
        frame: false,
        minWidth: 1000,
        minHeight: 700,
        title: "osu! mixer",
        icon: "assets/osu-mixer-logo.png",
        show: false,
        webPreferences: {
            nodeIntegration: true
        }
    });

    window.loadFile("./pages/index.html");

    window.on('ready-to-show', () => {
        window.show();
    });
});

app.on('window-all-closed', app.exit);

/**
 * 
 * @param {{keys:String[],action:String}[]} shortcuts 
 */
function registerShortcuts(shortcuts) {
    globalShortcut.unregisterAll();
    for(let i = 0; i < shortcuts.length; i++) {
        globalShortcut.register(shortcuts[i].keys.join("+"), () => {
            window.webContents.executeJavaScript(`vars.settings.settings.run("${shortcuts[i].action}")`);
        });
    }
}

ipc.on("shortcuts", (_ev, shortcuts) => {
    registerShortcuts(shortcuts);
});