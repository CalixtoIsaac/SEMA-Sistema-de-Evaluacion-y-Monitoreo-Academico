'use strict';


const fs = require('fs');
const path = require('path')
const DB = require('better-sqlite3')

const DEFAULT_RUTE = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'app.db');

const DEFAULT_CONFIG = {

    'calificacion.correcto_min': '80',
    'calificacion.preventivo_min': '70',
    'faltas.preventivo_pct': '50',
    'faltas.critico_pct': '80',
    'faltas.fijo_preventivo': '3',
    'faltas.fijo_critico': '5',
    'evolucion.umbral_puntos': '2',
};

function migrar(db) {

    const version = db.pragma('user_version', {simple: true});

    if(version < 1) {

        const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        db.transaction(() => {
            db.exec('DROP TABLE IF EXISTS notas; DROP TABLE IF EXISTS usuarios;');
            db.exec(sql);
            db.pragma('user_version = 1')
        })();
    }
}

function sembrarConfig(db) {

    const ins = db.prepare('INSERT OR IGNORE INTO configuracion (clave, valor) VALUES (?, ?)');

    db.transaction(() => {

        for(const[clave, valor] of Object.entries(DEFAULT_CONFIG)) ins.run(clave, valor);
    })();
}

function limpiarPrevias(db) {
    return db.prepare(
        `DELETE FROM importaciones
              WHERE estado = 'previa'
                AND creado_en < datetime('now', 'localtime', '-24 hours')`
            ).run().changes;
}

function abrir( ruta = DEFAULT_RUTE) {

    if (ruta !== ':memory:') fs.mkdirSync(path.dirname(ruta), {recursive: true});

    const db = new DB(ruta);

    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    migrar(db);
    sembrarConfig(db);
    limpiarPrevias(db);
    return db;

}
const db = abrir();
module.exports = db;
module.exports.abrir = abrir;
module.exports.DEFAULT_CONFIG = DEFAULT_CONFIG;
module.exports.DB_PATH = DEFAULT_RUTE;
