/**
 * Prueba base (T-01): la base de datos arranca con el esquema de SEMA
 * y ya no contiene la tabla de ejemplo de la plantilla.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sema-test-'));
process.env.DB_PATH = path.join(dir, 'test.db');
const db = require('../lib/db');

function tablas() {
  return db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((t) => t.name);
}

test('crea la tabla usuarios', () => {
  assert.ok(tablas().includes('usuarios'));
});

test('no existe la tabla de ejemplo notas', () => {
  assert.ok(!tablas().includes('notas'));
});

test('las llaves foráneas están activadas', () => {
  assert.equal(db.pragma('foreign_keys', { simple: true }), 1);
});

test.after(() => {
  db.close();
  fs.rmSync(dir, { recursive: true, force: true });
});
