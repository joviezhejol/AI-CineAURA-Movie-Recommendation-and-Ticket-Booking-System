const db = require('./database');

const trailers = [
  ['https://www.youtube.com/embed/DKHad8YOuxg', 'mov-doraemon'],
  ['https://www.youtube.com/embed/8PtTmUTTvlw', 'mov-thalapathy69'],
  ['https://www.youtube.com/embed/JfVOs4VSpmA', 'mov-spiderman-nwh'],
  ['https://www.youtube.com/embed/rR_2ti4l3nM', 'mov-premalu'],
  ['https://www.youtube.com/embed/TcMBFSGVi1c', 'mov-avengers-endgame'],
  ['https://www.youtube.com/embed/hylIXfZeB4c', 'mov-amaran'],
  ['https://www.youtube.com/embed/NQXE3iJCWNI', 'mov-vettaiyan'],
  ['https://www.youtube.com/embed/5cx7rvMvAWo', 'mov-devara'],
  ['https://www.youtube.com/embed/bdQF3fwv5mw', 'mov-kanguva'],
  ['https://www.youtube.com/embed/LEjhY15eCx0', 'mov-inside-out-2'],
  ['https://www.youtube.com/embed/73_1biulkYk', 'mov-deadpool-wolverine'],
  ['https://www.youtube.com/embed/id848Ww1YLo', 'mov-manjummel-boys'],
  ['https://www.youtube.com/embed/L0yEMl8PXnw', 'mov-aavesham'],
  ['https://www.youtube.com/embed/oP88LHBukW8', 'mov-lubber-pandhu'],
  ['https://www.youtube.com/embed/Ahp840_aCoI', 'mov-meiyazhagan'],
  ['https://www.youtube.com/embed/FonKx5wvuHI', 'mov-lucky-baskhar'],
  ['https://www.youtube.com/embed/KVnheXywIbY', 'mov-stree2'],
  ['https://www.youtube.com/embed/Po3jStA673E', 'mov-leo'],
  ['https://www.youtube.com/embed/Y5BeWdODPqo', 'mov-jailer'],
  ['https://www.youtube.com/embed/zSWdZVtXT7E', 'mov-interstellar']
];

const stmt = db.prepare('UPDATE movies SET trailer_url = ? WHERE id = ?');
let updated = 0;
for (const [url, id] of trailers) {
  updated += stmt.run(url, id).changes;
}

console.log(`Successfully updated ${updated} movie trailers in SQLite database.`);
