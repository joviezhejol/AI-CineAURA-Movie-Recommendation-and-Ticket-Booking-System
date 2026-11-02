const fs = require('fs');
const path = require('path');

const postersDir = path.join(__dirname, '..', 'client', 'public', 'posters');
if (!fs.existsSync(postersDir)) {
  fs.mkdirSync(postersDir, { recursive: true });
}

const posters = [
  {
    filename: 'thalapathy69.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/en/1/1e/The_Greatest_of_All_Time.jpg'
  },
  {
    filename: 'doraemon.jpg',
    url: 'https://image.tmdb.org/t/p/w780/uux6M8z3hxLDkq8LXSzq8528mrq.jpg'
  },
  {
    filename: 'spiderman.jpg',
    url: 'https://image.tmdb.org/t/p/w780/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg'
  },
  {
    filename: 'premalu.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/en/c/c5/Premalu_film_poster.jpg'
  },
  {
    filename: 'avengers_endgame.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/en/0/0d/Avengers_Endgame_poster.jpg'
  },
  {
    filename: 'amaran.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/en/5/54/Amaran_2024_poster.jpg'
  },
  {
    filename: 'vettaiyan.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/en/6/68/Vettaiyan_poster.jpg'
  },
  {
    filename: 'devara.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/en/f/f0/Devara_Part_1.jpg'
  },
  {
    filename: 'kanguva.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/en/e/e8/Kanguva_poster.jpg'
  },
  {
    filename: 'inside_out_2.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/en/f/f7/Inside_Out_2_poster.jpg'
  },
  {
    filename: 'deadpool_wolverine.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/en/4/4c/Deadpool_%26_Wolverine_poster.jpg'
  },
  {
    filename: 'manjummel_boys.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/en/9/99/Manjummel_Boys_poster.jpg'
  },
  {
    filename: 'aavesham.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/en/d/d1/Aavesham.jpg'
  },
  {
    filename: 'lubber_pandhu.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/en/9/91/Lubber_Pandhu.jpg'
  },
  {
    filename: 'meiyazhagan.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/en/1/1c/Meiyazhagan_poster.jpg'
  },
  {
    filename: 'lucky_baskhar.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/en/6/6c/Lucky_Baskhar_film_poster.jpg'
  },
  {
    filename: 'stree2.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/en/a/a1/Stree_2.jpg'
  },
  {
    filename: 'leo.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/en/7/75/Leo_%282023_Indian_film%29.jpg'
  },
  {
    filename: 'jailer.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/en/c/cb/Jailer_2023_Tamil_film_poster.jpg'
  },
  {
    filename: 'interstellar.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/en/b/bc/Interstellar_film_poster.jpg'
  }
];

async function downloadAll() {
  console.log(`--- Downloading ${posters.length} Original Movie Posters ---`);
  for (const item of posters) {
    const dest = path.join(postersDir, item.filename);
    try {
      const res = await fetch(item.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AI-CineAura/1.0 (contact@cineaura.com)'
        }
      });
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(dest, buffer);
        console.log(`[OK] Downloaded: ${item.filename} (${Math.round(buffer.length / 1024)} KB)`);
      } else {
        console.error(`[FAIL] ${item.filename}: HTTP ${res.status}`);
      }
    } catch (err) {
      console.error(`[ERROR] ${item.filename}: ${err.message}`);
    }
    // Small delay between requests
    await new Promise(r => setTimeout(r, 300));
  }
  console.log('--- Finished Poster Downloads ---');
}

downloadAll();
