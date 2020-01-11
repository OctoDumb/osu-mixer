var sqlite = require('sqlite3').verbose();

class Database {
    constructor(name) {
        this.db = new sqlite.Database(name);
    }

    async get(stmt, opts = []) {
        return new Promise(r => {
            this.db.get(stmt, opts, (err, row) => {
                r(row);
            });
        });
    }
    
    async all(stmt, opts = []) {
        return new Promise(r => {
            this.db.all(stmt, opts, (err, row) => {
                r(row);
            });
        });
    }
    
    async run(stmt, opts = []) {
        return new Promise(r => {
            this.db.run(stmt, opts, (err, row) => {
                r(row);
            });
        });
    }
}

module.exports = Database;