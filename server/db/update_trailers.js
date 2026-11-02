const db = require('./database');

const updates = [
  ['https://www.youtube.com/embed/QFpN2oCJBfU', 'mov-thalapathy69'],
  ['https://www.youtube.com/embed/nXmNcT6Dink', 'mov-doraemon'],
  ['https://www.youtube.com/embed/LPZE6xU4j58', 'mov-premalu'],
  ['https://www.youtube.com/embed/kfyP_DJJleU', 'mov-amaran'],
  ['https://www.youtube.com/embed/e7q75ZMi4oc', 'mov-vettaiyan'],
  ['https://www.youtube.com/embed/CDrRCJBsWEQ', 'mov-devara'],
  ['https://www.youtube.com/embed/26rMkBgfFxA', 'mov-kanguva'],
  ['https://www.youtube.com/embed/YMPkXiD6VN4', 'mov-manjummel-boys'],
  ['https://www.youtube.com/embed/3EGKJ5NjlKI', 'mov-aavesham'],
  ['https://www.youtube.com/embed/TiX0javDQyI', 'mov-lubber-pandhu'],
  ['https://www.youtube.com/embed/2WXbXXhL5WA', 'mov-meiyazhagan'],
  ['https://www.youtube.com/embed/HVUiJwGpEkI', 'mov-lucky-baskhar'],
  ['https://www.youtube.com/embed/HHZw5XQpFMg', 'mov-stree2'],
  ['https://www.youtube.com/embed/LZFbfGNHMQQ', 'mov-leo'],
  ['https://www.youtube.com/embed/H9S4wSznG5k', 'mov-jailer']
];

const stmt = db.prepare('UPDATE movies SET trailer_url = ? WHERE id = ?');
let count = 0;
for (const [url, id] of updates) {
  const res = stmt.run(url, id);
  count += res.changes;
}

console.log(`Successfully updated ${count} movie trailer URLs in SQLite database.`);

const check = db.prepare('SELECT id, title, trailer_url FROM movies WHERE trailer_url LIKE ?').all('%dQw4w9WgXcQ%');
console.log(`Movies with placeholder Rick Astley trailer remaining: ${check.length}`);

const allMovies = db.prepare('SELECT id, title, trailer_url FROM movies').all();
console.log(`Total movies in database: ${allMovies.length}`);
for (const m of allMovies) {
  console.log(`- ${m.title} (${m.id}): ${m.trailer_url}`);
}
