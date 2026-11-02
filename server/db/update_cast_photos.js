const db = require('./database');
const fs = require('fs');

const artistMap = JSON.parse(fs.readFileSync(__dirname + '/artist_photos_final.json', 'utf8'));

const movies = db.prepare('SELECT id, title, cast_members FROM movies').all();
const updateStmt = db.prepare('UPDATE movies SET cast_members = ? WHERE id = ?');

let totalUpdated = 0;

for (const m of movies) {
  try {
    const cast = JSON.parse(m.cast_members || '[]');
    let changed = false;
    for (const actor of cast) {
      const realPhoto = artistMap[actor.name] || artistMap[actor.name.trim()];
      if (realPhoto) {
        actor.photo = realPhoto;
        changed = true;
      }
    }
    if (changed) {
      updateStmt.run(JSON.stringify(cast), m.id);
      totalUpdated++;
      console.log(`Updated cast photos for: ${m.title}`);
    }
  } catch (err) {
    console.error(`Error processing ${m.title}:`, err);
  }
}

console.log(`\nSuccessfully updated cast portraits for ${totalUpdated} movies in SQLite database.`);
