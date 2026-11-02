const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./database');

const artistUrls = JSON.parse(fs.readFileSync(__dirname + '/artist_photos_final.json', 'utf8'));

// Special manual verified URLs for remaining
artistUrls['Harish Kalyan'] = 'https://in.bmscdn.com/iedb/artist/images/website/poster/large/harish-kalyan-1047576-1760543496.jpg';
artistUrls['Wasabi Mizuta'] = 'https://upload.wikimedia.org/wikipedia/commons/2/26/Wasabi_002.jpg';
artistUrls['Megumi Ohara'] = 'https://static.wikia.nocookie.net/video-game-audio/images/b/b2/Megumi_Ohara_KC.jpg';
artistUrls['Disha Patani'] = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Disha_Patani_2025_%28cropped%29.jpg/400px-Disha_Patani_2025_%28cropped%29.jpg';
artistUrls['Hipzster'] = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Fahadh_Faasil_2019.jpg/400px-Fahadh_Faasil_2019.jpg';

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
}

function download(url, dest) {
  return new Promise((resolve) => {
    if (!url) return resolve(false);
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve);
      }
      if (res.statusCode !== 200) {
        return resolve(false);
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(true);
      });
    });
    req.on('error', () => resolve(false));
    req.setTimeout(8000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function run() {
  const publicCastDir = path.join(__dirname, '..', '..', 'client', 'public', 'cast');
  const distCastDir = path.join(__dirname, '..', '..', 'client', 'dist', 'cast');
  fs.mkdirSync(publicCastDir, { recursive: true });
  fs.mkdirSync(distCastDir, { recursive: true });

  const movies = db.prepare('SELECT id, title, cast_members FROM movies').all();
  const updateStmt = db.prepare('UPDATE movies SET cast_members = ? WHERE id = ?');

  let successCount = 0;

  for (const m of movies) {
    const cast = JSON.parse(m.cast_members || '[]');
    let changed = false;

    for (const actor of cast) {
      const slug = slugify(actor.name) + '.jpg';
      const publicPath = path.join(publicCastDir, slug);
      const distPath = path.join(distCastDir, slug);

      let exists = fs.existsSync(publicPath) && fs.statSync(publicPath).size > 500;
      if (!exists) {
        const remoteUrl = artistUrls[actor.name] || actor.photo;
        console.log(`Downloading ${actor.name} from: ${remoteUrl}`);
        const ok = await download(remoteUrl, publicPath);
        if (ok && fs.existsSync(publicPath) && fs.statSync(publicPath).size > 500) {
          fs.copyFileSync(publicPath, distPath);
          exists = true;
        }
      } else {
        fs.copyFileSync(publicPath, distPath);
      }

      if (exists) {
        actor.photo = `/cast/${slug}`;
        changed = true;
        successCount++;
      }
    }

    if (changed) {
      updateStmt.run(JSON.stringify(cast), m.id);
    }
  }

  console.log(`\nDownloaded and linked local photos for ${successCount} cast members!`);
}

run();
