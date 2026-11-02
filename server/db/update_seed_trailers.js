const fs = require('fs');

let content = fs.readFileSync('server/db/seed.js', 'utf8');

const mapping = {
  'mov-doraemon': 'DKHad8YOuxg',
  'mov-thalapathy69': '8PtTmUTTvlw',
  'mov-spiderman-nwh': 'JfVOs4VSpmA',
  'mov-premalu': 'rR_2ti4l3nM',
  'mov-avengers-endgame': 'TcMBFSGVi1c',
  'mov-amaran': 'hylIXfZeB4c',
  'mov-vettaiyan': 'NQXE3iJCWNI',
  'mov-devara': '5cx7rvMvAWo',
  'mov-kanguva': 'bdQF3fwv5mw',
  'mov-inside-out-2': 'LEjhY15eCx0',
  'mov-deadpool-wolverine': '73_1biulkYk',
  'mov-manjummel-boys': 'id848Ww1YLo',
  'mov-aavesham': 'L0yEMl8PXnw',
  'mov-lubber-pandhu': 'oP88LHBukW8',
  'mov-meiyazhagan': 'Ahp840_aCoI',
  'mov-lucky-baskhar': 'FonKx5wvuHI',
  'mov-stree2': 'KVnheXywIbY',
  'mov-leo': 'Po3jStA673E',
  'mov-jailer': 'Y5BeWdODPqo',
  'mov-interstellar': 'zSWdZVtXT7E'
};

for (const [id, ytId] of Object.entries(mapping)) {
  const reg = new RegExp(`(id:\\s*'${id}'[\\s\\S]*?trailer_url:\\s*')https:\\/\\/www\\.youtube\\.com\\/embed\\/[^']+(')`, 'm');
  content = content.replace(reg, `$1https://www.youtube.com/embed/${ytId}$2`);
}

fs.writeFileSync('server/db/seed.js', content, 'utf8');
console.log('Successfully updated seed.js with all 20 verified trailer URLs.');
