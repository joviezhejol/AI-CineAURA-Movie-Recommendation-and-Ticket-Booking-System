const fs = require('fs');
const path = require('path');
const db = require('./database');

const publicCastDir = path.join(__dirname, '..', '..', 'client', 'public', 'cast');
const distCastDir = path.join(__dirname, '..', '..', 'client', 'dist', 'cast');
fs.mkdirSync(publicCastDir, { recursive: true });
fs.mkdirSync(distCastDir, { recursive: true });

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
}

// Custom titles mapping for Wikipedia disambiguation
const titleOverrides = {
  'Thalapathy Vijay': 'Vijay (actor)',
  'Prashanth': 'Prashanth (actor)',
  'Dinesh': 'V R Dinesh',
  'Attakathi Dinesh': 'V R Dinesh',
  'Naslen K. Gafoor': 'Naslen',
  'Hipzster': 'Aavesham',
  'Wasabi Mizuta': 'Wasabi Mizuta',
  'Megumi Ohara': 'Megumi Ōhara'
};

async function getWikiImageUrl(name) {
  const title = titleOverrides[name] || name;
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=400`;
  try {
    const res = await fetch(apiUrl, { headers: { 'User-Agent': 'CineAuraBot/1.0 (contact@cineaura.com)' } });
    const data = await res.json();
    const pages = data.query?.pages || {};
    for (const k in pages) {
      if (pages[k].thumbnail?.source) {
        return pages[k].thumbnail.source;
      }
    }
  } catch (err) {
    console.error(`API lookup error for ${name}:`, err.message);
  }
  return null;
}

// Fallback high quality direct URLs
const directFallbacks = {
  'Thalapathy Vijay': 'https://upload.wikimedia.org/wikipedia/commons/1/12/Actor_Vijay.jpg',
  'Prashanth': 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Prashanth_at_Saahasam_Audio_Launch.jpg',
  'Harish Kalyan': 'https://in.bmscdn.com/iedb/artist/images/website/poster/large/harish-kalyan-1047576-1760543496.jpg',
  'Wasabi Mizuta': 'https://upload.wikimedia.org/wikipedia/commons/2/26/Wasabi_002.jpg',
  'Megumi Ohara': 'https://static.wikia.nocookie.net/video-game-audio/images/b/b2/Megumi_Ohara_KC.jpg',
  'Hipzster': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Fahadh_Faasil_2019.jpg/500px-Fahadh_Faasil_2019.jpg'
};

async function downloadToFile(url, dest) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'CineAuraBot/1.0 (contact@cineaura.com)' } });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 500) return false;
    fs.writeFileSync(dest, buf);
    return true;
  } catch (e) {
    return false;
  }
}

async function main() {
  const movies = db.prepare('SELECT id, title, cast_members FROM movies').all();
  const allActors = new Set();
  movies.forEach(m => {
    const cast = JSON.parse(m.cast_members || '[]');
    cast.forEach(c => allActors.add(c.name));
  });

  console.log(`Processing ${allActors.size} actors...`);

  for (const name of allActors) {
    const slug = slugify(name) + '.jpg';
    const pubFile = path.join(publicCastDir, slug);
    const distFile = path.join(distCastDir, slug);

    if (fs.existsSync(pubFile) && fs.statSync(pubFile).size > 1000) {
      fs.copyFileSync(pubFile, distFile);
      console.log(`[ALREADY EXISTS] ${name}`);
      continue;
    }

    let imgUrl = await getWikiImageUrl(name);
    if (!imgUrl && directFallbacks[name]) {
      imgUrl = directFallbacks[name];
    }

    if (imgUrl) {
      console.log(`Downloading ${name} -> ${imgUrl.slice(0, 60)}...`);
      const ok = await downloadToFile(imgUrl, pubFile);
      if (ok) {
        fs.copyFileSync(pubFile, distFile);
        console.log(`✅ Saved ${name}`);
      } else if (directFallbacks[name]) {
        const okFb = await downloadToFile(directFallbacks[name], pubFile);
        if (okFb) {
          fs.copyFileSync(pubFile, distFile);
          console.log(`✅ Saved ${name} via fallback`);
        } else {
          console.log(`❌ Failed to save ${name}`);
        }
      } else {
        console.log(`❌ Failed to download ${name}`);
      }
    } else {
      console.log(`⚠️ No URL found for ${name}`);
    }
  }

  // Update Database with local /cast/ links
  const updateStmt = db.prepare('UPDATE movies SET cast_members = ? WHERE id = ?');
  let updatedMovies = 0;

  for (const m of movies) {
    const cast = JSON.parse(m.cast_members || '[]');
    let changed = false;

    for (const actor of cast) {
      const slug = slugify(actor.name) + '.jpg';
      const pubFile = path.join(publicCastDir, slug);
      if (fs.existsSync(pubFile) && fs.statSync(pubFile).size > 500) {
        actor.photo = `/cast/${slug}`;
        changed = true;
      }
    }

    if (changed) {
      updateStmt.run(JSON.stringify(cast), m.id);
      updatedMovies++;
    }
  }

  console.log(`\nUpdated database cast links for ${updatedMovies} movies!`);
}

main();
