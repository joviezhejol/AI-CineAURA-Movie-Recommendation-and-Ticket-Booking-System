const https = require('https');

const list = [
  ['mov-doraemon', 'DKHad8YOuxg'],
  ['mov-thalapathy69', '8PtTmUTTvlw'],
  ['mov-spiderman-nwh', 'JfVOs4VSpmA'],
  ['mov-premalu', 'rR_2ti4l3nM'],
  ['mov-avengers-endgame', 'TcMBFSGVi1c'],
  ['mov-amaran', 'hylIXfZeB4c'],
  ['mov-vettaiyan', 'NQXE3iJCWNI'],
  ['mov-devara', '5cx7rvMvAWo'],
  ['mov-kanguva', 'bdQF3fwv5mw'],
  ['mov-inside-out-2', 'LEjhY15eCx0'],
  ['mov-deadpool-wolverine', '73_1biulkYk'],
  ['mov-manjummel-boys', 'id848Ww1YLo'],
  ['mov-aavesham', 'L0yEMl8PXnw'],
  ['mov-lubber-pandhu', 'oP88LHBukW8'],
  ['mov-meiyazhagan', 'Ahp840_aCoI'],
  ['mov-lucky-baskhar', 'FonKx5wvuHI'],
  ['mov-stree2', 'KVnheXywIbY'],
  ['mov-leo', 'Po3jStA673E'],
  ['mov-jailer', 'Y5BeWdODPqo'],
  ['mov-interstellar', 'zSWdZVtXT7E']
];

function checkUrl(id, ytId) {
  return new Promise((resolve) => {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const j = JSON.parse(data);
            resolve({ id, ytId, ok: true, ytTitle: j.title });
          } catch(e) {
            resolve({ id, ytId, ok: false, status: res.statusCode });
          }
        } else {
          resolve({ id, ytId, ok: false, status: res.statusCode, data });
        }
      });
    }).on('error', (e) => {
      resolve({ id, ytId, ok: false, error: e.message });
    });
  });
}

async function run() {
  let successCount = 0;
  for (const [id, ytId] of list) {
    const res = await checkUrl(id, ytId);
    if (res.ok) {
      successCount++;
      console.log(`✅ [${res.id}] -> ${res.ytId} | "${res.ytTitle}"`);
    } else {
      console.log(`❌ [${res.id}] FAILED status: ${res.status || res.error}`);
    }
  }
  console.log(`\nVerified: ${successCount} / ${list.length} trailers.`);
}

run();
