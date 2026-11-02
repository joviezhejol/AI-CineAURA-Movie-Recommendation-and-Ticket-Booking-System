const fs = require('fs');

async function getPoster(id, title) {
  try {
    const res = await fetch(`https://www.themoviedb.org/movie/${id}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    const html = await res.text();
    // Look for content="https://image.tmdb.org/t/p/w.../....jpg"
    const metaMatch = html.match(/content="(https:\/\/image\.tmdb\.org\/t\/p\/[w0-9_origina]+\/[^"]+\.jpg)"/);
    const poster = metaMatch ? metaMatch[1] : null;
    console.log(`${title} (${id}): ${poster}`);
    return { title, id, poster };
  } catch (err) {
    console.log(`${title} err: ${err.message}`);
    return { title, id, poster: null };
  }
}

async function run() {
  const list = [
    { id: '1149791', title: 'Premalu' },
    { id: '299534', title: 'Avengers Endgame' },
    { id: '1184918', title: 'The Greatest of All Time (GOAT)' },
    { id: '1182047', title: 'Amaran' },
    { id: '974950', title: 'Devara Part 1' },
    { id: '1079091', title: 'Stree 2' },
    { id: '1022789', title: 'Inside Out 2' },
    { id: '533535', title: 'Deadpool & Wolverine' },
    { id: '822119', title: 'Captain Miller' },
    { id: '945961', title: 'Kalki 2898 AD' },
    { id: '1154784', title: 'Manjummel Boys' },
    { id: '1154790', title: 'Aavesham' },
    { id: '940551', title: 'Kanguva' },
    { id: '1186947', title: 'Vettaiyan' },
    { id: '1241982', title: 'Lubber Pandhu' },
    { id: '1219159', title: 'Meiyazhagan' },
    { id: '1184947', title: 'Lucky Baskhar' },
    { id: '1075794', title: 'Leo' },
    { id: '872585', title: 'Oppenheimer' },
    { id: '693134', title: 'Dune: Part Two' },
    { id: '99861', title: 'Avengers: Age of Ultron' },
    { id: '157336', title: 'Interstellar' }
  ];

  for (const item of list) {
    await getPoster(item.id, item.title);
    await new Promise(r => setTimeout(r, 200));
  }
}

run();
