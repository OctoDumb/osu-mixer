var { remote } = require('electron'),
    Database = require('./db'),
    Search = require('./search'),
    ProgressBar = require('./progressbar'),
    Parallax = require('./parallax'),
    Visualizer = require('./visualizer'),
    PlaylistManager = require('./playlists'),
    Settings = require('./settings'); // vars.player.playlist

var db = new Database(remote.app.getPath("userData") + "\\database.db");

db.run("CREATE TABLE IF NOT EXISTS songs (id INTEGER, artist TEXT, title TEXT, file TEXT, tags TEXT, source TEXT, creator TEXT, bg TEXT)");

var audio = new Audio();
audio.volume = 0.1;

var frame = new Vue({
    el: "#window-frame",
    methods: {
        minimize() {
            remote.getCurrentWindow().minimize();
        },
        maximize() {
            if(remote.getCurrentWindow().isMaximized())
                remote.getCurrentWindow().unmaximize();
            else
                remote.getCurrentWindow().maximize();
        },
        close() {
            remote.getCurrentWindow().close();
        }
    }
});

var menu = new Vue({
    el: "#menu",
    data: {
        title: "Updating songs database...",
        progress: 0
    }
});

var playlist = new Vue({
    el: "#playlist",
    data: {
        songs: [],
        shown: 50
    },
    methods: {
        play(id) {
            player.playSong(id);
        },
        getPlaying() {
            return player.playing;
        }
    }
});

var player = new Vue({
    el: "#player",
    data: {
        playlist: [],
        pl: -1,
        playing: 0,
        title: "Nothing is playing",
        time: '-:--/-:--',
        progress: 0,
        speed: 1,
        repeat: false
    },
    methods: {
        playSong(id) {
            if(id == 0)
                id = this.playlist[0].id;
            let song = this.playlist.find(s => s.id == id);
            if(!song)
                return console.error("Wata fak))))");
            if(id == this.playing) { // Pause
                this.playing = -this.playing;
                audio.pause();
            } else if(id == -this.playing) { // Unpause
                this.playing = -this.playing;
                audio.play();
            } else {
                if(!audio.paused)
                audio.pause();
                audio.src = `file:///${song.file}`;
                this.title = `${song.artist} - ${song.title}`;
                background.setImage(song.bg);
                this.playing = song.id;
                audio.play();
            }
        },
        playpause() {
            this.playSong(Math.abs(this.playing));
        },
        prev() {
            if(this.playing == 0)
                this.playing = this.playlist[this.playlist.length - 1].id;
            let index = this.playlist.findIndex(s => s.id == Math.abs(this.playing))
            if(index == -1) {
                audio.currentTime = 0;
                this.playing = -this.playing;
            } else {
                let i = (index == 0 ? this.playlist.length : index) - 1;
                this.playing = this.playlist[i].id;
                audio.src = `file:///${this.playlist[i].file}`;
                player.title = `${this.playlist[i].artist} - ${this.playlist[i].title}`;
                background.setImage(this.playlist[i].bg);
                audio.play();
            }
        },
        next() {
            if(this.playing == 0)
                this.playing = this.playlist[0].id;
            let index = this.playlist.findIndex(s => s.id == Math.abs(this.playing));
            if(index == -1) {
                audio.currentTime = 0;
                this.playing = -this.playing;
            } else {
                let i = index == (this.playlist.length -1) ? 0 : index + 1;
                this.playing = this.playlist[i].id;
                audio.src = `file:///${this.playlist[i].file}`;
                player.title = `${this.playlist[i].artist} - ${this.playlist[i].title}`;
                background.setImage(this.playlist[i].bg);
                audio.play();                
            }
        },
        ended() {
            if(this.repeat)
                return audio.play();
            this.next();
        },
        shuffle() {
            let rndSort = () => Math.random() * 2 - 1;
            this.playlist = this.playlist.sort(rndSort);
        },
        formatTime(seconds) {
            seconds = Math.floor(seconds);
            let f = (n) => n < 10 ? `0${n}` : `${n}`;
            return `${Math.floor(seconds / 60)}:${f(seconds % 60)}`;
        },
        getTime() {
            if(!isFinite(audio.duration))
                return `-:--/-:--`;
            return `${this.formatTime(audio.currentTime)}/${this.formatTime(audio.duration)}`
        },
        getProgress() {
            if(!isFinite(audio.duration))
                return 0;
            return audio.currentTime / audio.duration * 100;
        },
        updateTime() {
            this.time = this.getTime();
            this.progress = this.getProgress();
        },
        switchSpeed() {
            this.speed = this.speed == 1 ? 1.5 : 1;
            audio.defaultPlaybackRate = this.speed;
            audio.playbackRate = this.speed;
        },
        switchRepeat() {
            this.repeat = !this.repeat;
        }
    }
});

var settings = new Vue({
    el: "#shortcuts",
    data: {
        settings: new Settings("#settings", player)
    },
    methods: {
        capitalize(text) {
            return text[0].toUpperCase() + text.slice(1);
        }
    }
});

audio.onended = player.ended;
audio.ontimeupdate = player.updateTime;

playlist.$el.addEventListener("scroll", () => {
    if(playlist.$el.scrollTop > playlist.$el.scrollHeight - playlist.$el.clientHeight - 100) {
        playlist.shown += 50;
    }
});

var visualizer = new Visualizer(document.getElementsByClassName("visualizer")[0], audio);

var search = new Search(document.getElementById("searchInput"), 400);

var bar = new ProgressBar(document.getElementById("progress-bar"));

bar.on('start', () => {
    if(player.playing == 0)
        return;
    if(player.playing > 0)
        audio.pause();
});

bar.on('move', (pos) => {
    if(player.playing == 0)
        return;
    audio.currentTime = audio.duration * (pos.x / 100);
    document.getElementsByClassName("progress-inner")[0].style.width = `${pos.x}%`;
});

bar.on('stop', () => {
    if(player.playing == 0)
        return;
    if(player.playing > 0)
        audio.play();
});

var background = new Parallax(document.getElementById("parallax"));

var Playlists = new PlaylistManager(db, "playlists.json");

(async function(path) {
    background.resize();
    visualizer.resize();
    console.log("Initializing manager");
    await Playlists.init();
    console.log("Updating database")
    await Playlists.update(path, menu);
    console.log("Loading finished");
    player.playlist = Playlists.songs;
    playlist.songs = Playlists.songs;
    menu.$el.style.display = "none";
    settings.settings.switchShortcuts();
    search.on("change", async value => {
        if(!value.length)
            playlist.songs = player.playlist;
        else {
            let songs = await Playlists.search(value, player.pl);
            playlist.songs = songs;
        }
        playlist.shown = 50;
    });
})("F:/osu!");

module.exports = {
    db, audio, menu, playlist, player, visualizer, search, bar, background, Playlists, settings
}; // https://github.com/OctoDumb/osu-Direct/blob/master/default-bg.png