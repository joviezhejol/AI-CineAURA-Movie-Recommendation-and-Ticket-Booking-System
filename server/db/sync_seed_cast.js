const db = require('./database');
const fs = require('fs');

let seedContent = fs.readFileSync(__dirname + '/seed.js', 'utf8');
const movies = db.prepare('SELECT id, cast_members FROM movies').all();

for (const m of movies) {
  const castJson = JSON.stringify(JSON.parse(m.cast_members));
  const reg = new RegExp(`(id:\\s*'${m.id}'[\\s\\S]*?cast_members:\\s*JSON\\.stringify\\()([\\s\\S]*?)(\\),\\s*\\r?\\n\\s*release_date:)`, 'm');
  seedContent = seedContent.replace(reg, `$1${castJson}$3`);
}

fs.writeFileSync(__dirname + '/seed.js', seedContent, 'utf8');
console.log('Successfully synced seed.js with authentic artist portraits!');
