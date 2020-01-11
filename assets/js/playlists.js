var   Database = require('./db'),
            fs = require('fs'),
    { remote } = require('electron'),
         osudb = require('osudb'),
          util = require('util'),
        exists = util.promisify(fs.exists),
    readOsuDB = async function(path) {
        return new Promise(r => {
            osudb.readOsuDB(path, (data) => {
                r(data);
            });
        });
    };

class Playlist {
    /**
     * @param {PlaylistManager} manager
     * @param {String} name
     * @param {Number[]} ids
     */
    constructor(manager, name, ids) {
        this.manager = manager;
        this.name = name;
        this.ids = ids;
    }

    toJSON() {
        return {
            name: this.name,
            songs: this.ids
        };
    }

    addSong(id) {
        if(!this.hasSong(id)) {
            this.ids.push(id);
            this.manager.save();
        }
    }

    removeSong(id) {
        if(this.hasSong(id)) {
            this.ids.splice(this.ids.indexOf(id), 1);
            this.manager.save();
        }
    }

    hasSong(id) {
        return this.ids.includes(id);
    }

    getSongs() {
        return this.manager.songs.filter(s => this.hasSong(s.id));
    }
}

class PlaylistManager {
    /**
     * 
     * @param {Database} db 
     * @param {String} file
     */
    constructor(db, file) {
        this.db = db;
        this.file = remote.app.getPath("userData") + "\\" + file;
        /** @type {Song[]} */this.songs = [];
        /** @type {Playlist[]} */this.playlists = [];
    }

    async init() {
        this.songs = await this.db.all("SELECT * FROM songs") || [];
        if(!fs.existsSync(this.file))
            fs.writeFileSync(this.file, "[]");
        this.playlists = JSON.parse(fs.readFileSync(this.file).toString()).map(pl => new Playlist(this, pl.name, pl.songs));
    }


    /**
     * 
     * @param {String} path 
     * @param {Vue} vue
     */
    async update(path, vue) {
        let bgReg = /0,0,"(?<file>.*)"(,0,0)?/;

        console.log("Reading osu!.db");
        let osuDB = await readOsuDB(path + "/osu!.db");
        let sInDB = this.songs.map(s => s.id);

        console.log(`Found ${osuDB.beatmaps.length} beatmaps`);

        console.log("Filter beatmaps");
        let bms = osuDB.beatmaps
            .filter((map, index, ctx) => index === ctx.findIndex(m => m.beatmapSetId == map.beatmapSetId && m.audioFilename == map.audioFilename))
            // Remove maps that are not uploaded
            .filter(map => map.beatmapSetId != -1 && map.beatmapId != 0);
        let delIds = [...sInDB];
        let bmLength = bms.length;

        console.log(`Checking songs (${bmLength})`);
        for(let i = 0; i < bmLength; i++) {
            if(i % 100 == 0) console.log(i);

            vue.progress = ((i + 1) / bmLength) * 1e2; // Update progress
            
            let bm = bms[i];
            // if(bm.beatmapSetId == -1 || bm.beatmapId == 0) continue; // Skip maps that are not uploaded (to avoid Vue errors)

            let file = `${path}/Songs/${bm.beatmapFolder}/${bm.audioFilename}`;
            let fExists = await exists(file); // Maybe async works better...
            if(!fExists) continue; // Skip maps that don't have audio
            if(delIds.includes(bm.beatmapId))
                delIds.splice(delIds.indexOf(bm.beatmapId), 1); // Don't delete songs that are found in osu!.db

            if(sInDB.includes(bm.beatmapId)) continue; // Skip maps that already exists in database

            try {
                let osu = fs.readFileSync(`${path}/Songs/${bm.beatmapFolder}/${bm.osuPath}`).toString();
                let bg = bgReg.test(osu) ? `${path}/Songs/${bm.beatmapFolder}/${osu.match(bgReg).groups.file}` : '';
                this.db.run("INSERT INTO songs (id, artist, title, file, tags, source, creator, bg) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
                    bm.beatmapId, bm.artist,
                    bm.title, file, bm.tags,
                    bm.source, bm.creator, bg
                ]);
            }catch(e){}
        }
        console.log(delIds);
        if(delIds[0]) {
            vue.title = "Removing database garbage...";
            vue.progress = 0;
            for(let i = 0; i < delIds.length; i++) {
                vue.progress = (i / delIds.length) * 1e2;
                await this.db.run("DELETE FROM songs WHERE id = ?", [delIds[i]]);
            }
            vue.progress = 100;
        }
        vue.title = "Starting...";
        this.songs = await this.db.all("SELECT * FROM songs") || [];
    }

    save() {
        fs.writeFile(this.file, JSON.stringify(this.playlists.map(pl => pl.toJSON())), () => {});
    }

    createPlaylist(name) {
        this.playlists.push(new Playlist(this, name, []));
        this.save();
    }

    /**
     * @param {String} tags
     * @param {Number} pl
     * 
     * @returns {Promise<Song[]>}
     */
    async search(tags, pl) {
        tags = tags.split(" ");
        let q = [];
        for(let i = 0; i < tags.length; i++)
            q.push("((title || artist || tags || source || creator) LIKE ?)");
        let songs = (await this.db.all("SELECT * FROM songs WHERE " + q.join(" OR "), tags.map(tag => `%${tag}%`)));
        if(pl >= 0)
            songs = songs.filter(s => this.playlists[pl].hasSong(s.id))
        
        return songs;
    }
}

module.exports = PlaylistManager;