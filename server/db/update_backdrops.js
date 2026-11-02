const fs = require('fs');

let content = fs.readFileSync('server/db/seed.js', 'utf8');

// Replace backdrop_url in movies array with its matching poster_url
content = content.replace(/(poster_url:\s*'(\/posters\/[^']+)',\s*\r?\n\s*)backdrop_url:\s*'https:\/\/images\.unsplash\.com\/[^']+'/g, "$1backdrop_url: '$2'");

fs.writeFileSync('server/db/seed.js', content, 'utf8');
console.log('Successfully updated seed.js movie backdrops to local original posters!');
