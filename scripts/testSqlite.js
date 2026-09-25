import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync(':memory:');
db.exec('CREATE TABLE test (id INT, name TEXT)');
const insert = db.prepare('INSERT INTO test (id, name) VALUES (?, ?)');
insert.run(1, 'Volvo AB');
const rows = db.prepare('SELECT * FROM test').all();
console.log('✅ node:sqlite SUCCESS:', rows);
