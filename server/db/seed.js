const db = require('./database');
const bcrypt = require('bcryptjs');

function seedDatabase() {
  console.log('--- Starting CineAura Database Seeding with 20 Blockbuster Movies ---');

  // 1. Seed Districts
  const insertDistrict = db.prepare(`
    INSERT OR REPLACE INTO districts (id, name, state) VALUES (?, ?, ?)
  `);
  
  const districts = [
    { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu' },
    { id: 'chengalpattu', name: 'Chengalpattu', state: 'Tamil Nadu' },
    { id: 'kanchipuram', name: 'Kanchipuram', state: 'Tamil Nadu' }
  ];

  for (const d of districts) {
    insertDistrict.run(d.id, d.name, d.state);
  }

  // 2. Seed Theatres
  const insertTheatre = db.prepare(`
    INSERT OR REPLACE INTO theatres (id, district_id, name, address, city, pin_code, facilities, rating, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const theatres = [
    // Chennai
    {
      id: 'th-chn-phoenix',
      district_id: 'chennai',
      name: 'CineAura IMAX & Luxe - Phoenix Marketcity',
      address: 'Velachery Main Road, Indira Gandhi Nagar, Velachery',
      city: 'Chennai',
      pin_code: '600042',
      facilities: JSON.stringify(['IMAX with Laser', 'Dolby Atmos', 'VIP Recliners', 'Gourmet Cafe', 'Valet Parking']),
      rating: 4.8,
      image_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 'th-chn-palazzo',
      district_id: 'chennai',
      name: 'CineAura Palazzo Multiplex - Nexus Vijaya',
      address: '100 Feet Road, Vadapalani',
      city: 'Chennai',
      pin_code: '600026',
      facilities: JSON.stringify(['4K Laser', 'Dolby Atmos', 'Italian Architecture', 'Snack Bar']),
      rating: 4.7,
      image_url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 'th-chn-escape',
      district_id: 'chennai',
      name: 'CineAura Escape - Express Avenue',
      address: 'Club House Road, Royapettah',
      city: 'Chennai',
      pin_code: '600002',
      facilities: JSON.stringify(['4DX Experience', 'Plush Loungers', 'Dolby 7.1', 'Express Cafe']),
      rating: 4.6,
      image_url: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=800&auto=format&fit=crop&q=80'
    },
    // Chengalpattu
    {
      id: 'th-cpt-marina',
      district_id: 'chengalpattu',
      name: 'CineAura Grand Marina',
      address: 'GST Main Road, Maraimalai Nagar',
      city: 'Chengalpattu',
      pin_code: '603209',
      facilities: JSON.stringify(['Dolby Atmos', 'RGB Laser Projection', 'Spacious Seating', 'Food Street']),
      rating: 4.5,
      image_url: 'https://images.unsplash.com/photo-1595769816263-9b910be24d5f?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 'th-cpt-vgp',
      district_id: 'chengalpattu',
      name: 'CineAura VGP Cineplex - Urapakkam',
      address: 'Grand Southern Trunk Road, Urapakkam',
      city: 'Chengalpattu',
      pin_code: '603210',
      facilities: JSON.stringify(['4K Projection', 'Dolby 7.1', 'Couple Loungers', 'Snack Point']),
      rating: 4.4,
      image_url: 'https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?w=800&auto=format&fit=crop&q=80'
    },
    // Kanchipuram
    {
      id: 'th-kpm-heritage',
      district_id: 'kanchipuram',
      name: 'CineAura Heritage Cineplex',
      address: 'Gandhi Road, Near Varadaraja Temple Area',
      city: 'Kanchipuram',
      pin_code: '631501',
      facilities: JSON.stringify(['Barco 4K Laser', 'Dolby Atmos', 'Premium Recliners', 'Traditional Food Court']),
      rating: 4.6,
      image_url: 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 'th-kpm-silkcity',
      district_id: 'kanchipuram',
      name: 'CineAura Silk City Cinemas',
      address: 'Bangalore Highway, Ennaikaran',
      city: 'Kanchipuram',
      pin_code: '631502',
      facilities: JSON.stringify(['Dolby Digital', 'High-Gain Silver Screen', 'Comfort Seats', 'Drive-in Parking']),
      rating: 4.3,
      image_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80'
    }
  ];

  for (const t of theatres) {
    insertTheatre.run(t.id, t.district_id, t.name, t.address, t.city, t.pin_code, t.facilities, t.rating, t.image_url);
  }

  // 3. Seed Screens
  const insertScreen = db.prepare(`
    INSERT OR REPLACE INTO screens (id, theatre_id, name, total_seats, experience)
    VALUES (?, ?, ?, ?, ?)
  `);

  const screens = [];
  theatres.forEach(t => {
    screens.push({
      id: `${t.id}-scr1`,
      theatre_id: t.id,
      name: 'Screen 1 - Grand Audi',
      total_seats: 56,
      experience: t.facilities.includes('IMAX with Laser') ? 'IMAX' : (t.facilities.includes('4DX Experience') ? '4DX' : 'Dolby Atmos')
    });
    screens.push({
      id: `${t.id}-scr2`,
      theatre_id: t.id,
      name: 'Screen 2 - Atmos Gold',
      total_seats: 56,
      experience: 'Dolby Atmos'
    });
    screens.push({
      id: `${t.id}-scr3`,
      theatre_id: t.id,
      name: 'Screen 3 - Classic Cinema',
      total_seats: 56,
      experience: 'Standard'
    });
  });

  for (const s of screens) {
    insertScreen.run(s.id, s.theatre_id, s.name, s.total_seats, s.experience);
  }

  // 4. Seed Seats for all screens
  const insertSeat = db.prepare(`
    INSERT OR REPLACE INTO seats (id, screen_id, seat_number, row_label, col_number, seat_tier, seat_type, couple_pair_id, base_price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  screens.forEach(scr => {
    rows.forEach(r => {
      for (let c = 1; c <= 8; c++) {
        const seatNum = `${r}${c}`;
        const seatId = `${scr.id}-${seatNum}`;
        let tier = 'Executive';
        let type = 'SINGLE';
        let pairId = null;
        let price = 190.0;

        if (r === 'A' || r === 'B') {
          tier = 'VIP';
          type = 'FAMILY';
          price = 280.0;
        } else if (r === 'C' || r === 'D' || r === 'E') {
          tier = 'Executive';
          type = 'FRIENDS';
          price = 210.0;
        } else if (r === 'G') {
          tier = 'VIP Couple';
          type = 'COUPLE';
          price = 320.0;
          const pairCol = c % 2 === 1 ? c + 1 : c - 1;
          pairId = `${scr.id}-${r}${pairCol}`;
        }

        if (scr.experience === 'IMAX') price += 100;
        else if (scr.experience === '4DX') price += 120;

        insertSeat.run(seatId, scr.id, seatNum, r, c, tier, type, pairId, price);
      }
    });
  });

  // 5. Seed 20 Authentic Blockbuster Movies with Original Theatrical Posters
  const insertMovie = db.prepare(`
    INSERT OR REPLACE INTO movies (
      id, tmdb_id, title, tagline, poster_url, backdrop_url, trailer_url, language,
      secondary_languages, genres, duration_mins, certificate, rating, vote_count,
      overview, director, cast_members, release_date, mood_tags, vibe_tags, travel_tags, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const movies = [
    // 1. Thalapathy 69 / The Greatest of All Time (GOAT)
    {
      id: 'mov-thalapathy69',
      tmdb_id: 1184918,
      title: 'Thalapathy 69',
      tagline: 'A Legend Lives On... The Final Symphony.',
      poster_url: '/posters/thalapathy69.jpg',
      backdrop_url: '/posters/thalapathy69.jpg',
      trailer_url: 'https://www.youtube.com/embed/8PtTmUTTvlw',
      language: 'Tamil',
      secondary_languages: JSON.stringify(['Telugu', 'Hindi']),
      genres: JSON.stringify(['Action', 'Drama', 'Thriller']),
      duration_mins: 168,
      certificate: 'U/A 13+',
      rating: 8.4,
      vote_count: 38400,
      overview: 'A high-voltage emotional political action spectacle following an elite field operative taking on entrenched systemic corruption in an unforgettable confrontation.',
      director: 'H. Vinoth',
      cast_members: JSON.stringify([{"name":"Thalapathy Vijay","role":"Gandhi / Jeevan","photo":"/cast/thalapathy_vijay.jpg"},{"name":"Pooja Hegde","role":"Ananya","photo":"/cast/pooja_hegde.jpg"},{"name":"Prashanth","role":"Sunil","photo":"/cast/prashanth.jpg"}]),
      release_date: '2026-10-15',
      mood_tags: JSON.stringify(['Excited', 'Energetic', 'Motivated']),
      vibe_tags: JSON.stringify(['Mass', 'Action', 'Emotional']),
      travel_tags: JSON.stringify(['Night drive', 'Friends trip', 'Weekend outing']),
      is_active: 1
    },
    // 2. Doraemon: Nobita's Sky Utopia
    {
      id: 'mov-doraemon',
      tmdb_id: 1003580,
      title: "Doraemon: Nobita's Sky Utopia",
      tagline: 'Take Flight to the Floating World of Dreams.',
      poster_url: '/posters/doraemon.jpg',
      backdrop_url: '/posters/doraemon.jpg',
      trailer_url: 'https://www.youtube.com/embed/DKHad8YOuxg',
      language: 'Tamil',
      secondary_languages: JSON.stringify(['English', 'Hindi', 'Japanese']),
      genres: JSON.stringify(['Animation', 'Kids', 'Family', 'Adventure']),
      duration_mins: 110,
      certificate: 'U',
      rating: 8.1,
      vote_count: 8900,
      overview: 'Doraemon, Nobita and friends set off with a time-skimp blimp in search of Paradapia, a utopian airborne realm where everyone lives in peace.',
      director: 'Takumi Doyama',
      cast_members: JSON.stringify([{"name":"Wasabi Mizuta","role":"Doraemon (Voice)","photo":"/cast/wasabi_mizuta.jpg"},{"name":"Megumi Ohara","role":"Nobita (Voice)","photo":"/cast/megumi_ohara.jpg"}]),
      release_date: '2026-08-20',
      mood_tags: JSON.stringify(['Happy', 'Relaxed', 'Bored']),
      vibe_tags: JSON.stringify(['Feel-good', 'Family', 'Fun', 'Adventure']),
      travel_tags: JSON.stringify(['Family trip', 'Weekend outing', 'Relaxing travel']),
      is_active: 1
    },
    // 3. Spider-Man: No Way Home
    {
      id: 'mov-spiderman-nwh',
      tmdb_id: 634649,
      title: 'Spider-Man: No Way Home',
      tagline: 'The Multiverse Unleashed.',
      poster_url: '/posters/spiderman.jpg',
      backdrop_url: '/posters/spiderman.jpg',
      trailer_url: 'https://www.youtube.com/embed/JfVOs4VSpmA',
      language: 'English',
      secondary_languages: JSON.stringify(['Tamil', 'Telugu', 'Hindi']),
      genres: JSON.stringify(['Action', 'Adventure', 'Sci-Fi', 'Superhero']),
      duration_mins: 148,
      certificate: 'U/A 13+',
      rating: 8.7,
      vote_count: 58000,
      overview: 'Peter Parker seeks Doctor Strange’s mystical intervention to restore his secret identity, tearing open the multiverse and summoning iconic villains.',
      director: 'Jon Watts',
      cast_members: JSON.stringify([{"name":"Tom Holland","role":"Peter Parker / Spider-Man","photo":"/cast/tom_holland.jpg"},{"name":"Zendaya","role":"MJ","photo":"/cast/zendaya.jpg"},{"name":"Benedict Cumberbatch","role":"Doctor Strange","photo":"/cast/benedict_cumberbatch.jpg"}]),
      release_date: '2026-09-01',
      mood_tags: JSON.stringify(['Excited', 'Adventurous', 'Emotional']),
      vibe_tags: JSON.stringify(['Action', 'Mind-bending', 'Mass', 'Fun']),
      travel_tags: JSON.stringify(['Friends trip', 'Long journey', 'Night drive']),
      is_active: 1
    },
    // 4. Premalu
    {
      id: 'mov-premalu',
      tmdb_id: 1149791,
      title: 'Premalu',
      tagline: 'Love in the City of Pearls.',
      poster_url: '/posters/premalu.jpg',
      backdrop_url: '/posters/premalu.jpg',
      trailer_url: 'https://www.youtube.com/embed/rR_2ti4l3nM',
      language: 'Malayalam',
      secondary_languages: JSON.stringify(['Tamil', 'Telugu']),
      genres: JSON.stringify(['Romance', 'Comedy']),
      duration_mins: 148,
      certificate: 'U/A 13+',
      rating: 8.2,
      vote_count: 14200,
      overview: 'Sachin pursues romance while tackling career chaos in Hyderabad, sparking laugh-out-loud mishaps with a charming IT professional named Reenu.',
      director: 'Girish A. D.',
      cast_members: JSON.stringify([{"name":"Naslen K. Gafoor","role":"Sachin","photo":"/cast/naslen_k_gafoor.jpg"},{"name":"Mamitha Baiju","role":"Reenu","photo":"/cast/mamitha_baiju.jpg"}]),
      release_date: '2026-07-14',
      mood_tags: JSON.stringify(['Happy', 'Romantic', 'Relaxed']),
      vibe_tags: JSON.stringify(['Feel-good', 'Comedy', 'Romantic', 'Chill']),
      travel_tags: JSON.stringify(['Short trip', 'Weekend outing', 'Solo travel']),
      is_active: 1
    },
    // 5. Avengers: Endgame
    {
      id: 'mov-avengers-endgame',
      tmdb_id: 299534,
      title: 'Avengers: Endgame',
      tagline: 'Part of the Journey is the End.',
      poster_url: '/posters/avengers_endgame.jpg',
      backdrop_url: '/posters/avengers_endgame.jpg',
      trailer_url: 'https://www.youtube.com/embed/TcMBFSGVi1c',
      language: 'English',
      secondary_languages: JSON.stringify(['Tamil', 'Telugu', 'Hindi']),
      genres: JSON.stringify(['Action', 'Sci-Fi', 'Drama', 'Adventure']),
      duration_mins: 182,
      certificate: 'U/A 13+',
      rating: 8.8,
      vote_count: 94000,
      overview: 'After devastating universe-wide losses, the remaining Avengers assemble for one final time-heist stand to undo Thanos’s cosmic snap.',
      director: 'Anthony & Joe Russo',
      cast_members: JSON.stringify([{"name":"Robert Downey Jr.","role":"Tony Stark / Iron Man","photo":"/cast/robert_downey_jr_.jpg"},{"name":"Chris Evans","role":"Steve Rogers / Captain America","photo":"/cast/chris_evans.jpg"},{"name":"Scarlett Johansson","role":"Natasha Romanoff","photo":"/cast/scarlett_johansson.jpg"}]),
      release_date: '2026-06-10',
      mood_tags: JSON.stringify(['Emotional', 'Excited', 'Motivated']),
      vibe_tags: JSON.stringify(['Mass', 'Mind-bending', 'Action', 'Emotional']),
      travel_tags: JSON.stringify(['Long journey', 'Friends trip', 'Night drive']),
      is_active: 1
    },
    // 6. Amaran
    {
      id: 'mov-amaran',
      tmdb_id: 1182047,
      title: 'Amaran',
      tagline: 'The Valour of an Immortal Warrior.',
      poster_url: '/posters/amaran.jpg',
      backdrop_url: '/posters/amaran.jpg',
      trailer_url: 'https://www.youtube.com/embed/hylIXfZeB4c',
      language: 'Tamil',
      secondary_languages: JSON.stringify(['Telugu', 'Hindi']),
      genres: JSON.stringify(['Action', 'Drama', 'Biography']),
      duration_mins: 169,
      certificate: 'U/A 13+',
      rating: 8.6,
      vote_count: 22100,
      overview: 'The extraordinary true story of Major Mukund Varadarajan of the Indian Army Rajput Regiment battling against heavy odds in Kashmir.',
      director: 'Rajkumar Periasamy',
      cast_members: JSON.stringify([{"name":"Sivakarthikeyan","role":"Major Mukund Varadarajan","photo":"/cast/sivakarthikeyan.jpg"},{"name":"Sai Pallavi","role":"Indhu Rebecca Varghese","photo":"/cast/sai_pallavi.jpg"}]),
      release_date: '2026-10-18',
      mood_tags: JSON.stringify(['Emotional', 'Motivated', 'Energetic']),
      vibe_tags: JSON.stringify(['Emotional', 'Mass', 'Family']),
      travel_tags: JSON.stringify(['Night drive', 'Solo travel', 'Long journey']),
      is_active: 1
    },
    // 7. Vettaiyan
    {
      id: 'mov-vettaiyan',
      tmdb_id: 1186947,
      title: 'Vettaiyan',
      tagline: 'The Hunter Arrives.',
      poster_url: '/posters/vettaiyan.jpg',
      backdrop_url: '/posters/vettaiyan.jpg',
      trailer_url: 'https://www.youtube.com/embed/NQXE3iJCWNI',
      language: 'Tamil',
      secondary_languages: JSON.stringify(['Telugu', 'Hindi']),
      genres: JSON.stringify(['Action', 'Drama', 'Thriller']),
      duration_mins: 164,
      certificate: 'U/A 16+',
      rating: 8.5,
      vote_count: 31000,
      overview: 'A ruthlessly honest encounter specialist police officer must confront his own moral compass when an educational racket turns deadly.',
      director: 'T. J. Gnanavel',
      cast_members: JSON.stringify([{"name":"Rajinikanth","role":"SP Athiyan IPS","photo":"/cast/rajinikanth.jpg"},{"name":"Amitabh Bachchan","role":"Justice Sathyadev","photo":"/cast/amitabh_bachchan.jpg"},{"name":"Fahadh Faasil","role":"Patrick","photo":"/cast/fahadh_faasil.jpg"}]),
      release_date: '2026-10-10',
      mood_tags: JSON.stringify(['Excited', 'Energetic', 'Motivated']),
      vibe_tags: JSON.stringify(['Mass', 'Action', 'Thriller']),
      travel_tags: JSON.stringify(['Night drive', 'Friends trip']),
      is_active: 1
    },
    // 8. Devara: Part 1
    {
      id: 'mov-devara',
      tmdb_id: 811941,
      title: 'Devara: Part 1',
      tagline: 'Lord of the Red Sea.',
      poster_url: '/posters/devara.jpg',
      backdrop_url: '/posters/devara.jpg',
      trailer_url: 'https://www.youtube.com/embed/5cx7rvMvAWo',
      language: 'Telugu',
      secondary_languages: JSON.stringify(['Tamil', 'Hindi', 'Malayalam']),
      genres: JSON.stringify(['Action', 'Drama', 'Thriller']),
      duration_mins: 175,
      certificate: 'U/A 16+',
      rating: 7.9,
      vote_count: 18700,
      overview: 'A fearless coastal chieftain vows to safeguard his coastal people against perilous illegal weapon cartels along treacherous waters.',
      director: 'Koratala Siva',
      cast_members: JSON.stringify([{"name":"N. T. Rama Rao Jr.","role":"Devara / Varadha","photo":"/cast/n_t_rama_rao_jr_.jpg"},{"name":"Janhvi Kapoor","role":"Thangam","photo":"/cast/janhvi_kapoor.jpg"},{"name":"Saif Ali Khan","role":"Bhaira","photo":"/cast/saif_ali_khan.jpg"}]),
      release_date: '2026-09-27',
      mood_tags: JSON.stringify(['Excited', 'Energetic']),
      vibe_tags: JSON.stringify(['Mass', 'Action', 'Thriller']),
      travel_tags: JSON.stringify(['Friends trip', 'Night drive']),
      is_active: 1
    },
    // 9. Kanguva
    {
      id: 'mov-kanguva',
      tmdb_id: 940551,
      title: 'Kanguva',
      tagline: 'A Warrior Born Across Millennia.',
      poster_url: '/posters/kanguva.jpg',
      backdrop_url: '/posters/kanguva.jpg',
      trailer_url: 'https://www.youtube.com/embed/bdQF3fwv5mw',
      language: 'Tamil',
      secondary_languages: JSON.stringify(['Telugu', 'Hindi', 'English']),
      genres: JSON.stringify(['Action', 'Fantasy', 'Adventure']),
      duration_mins: 154,
      certificate: 'U/A 16+',
      rating: 8.0,
      vote_count: 16500,
      overview: 'A raw, prehistoric tribal warlord’s timeless battle for his people echoes into the 21st century as a modern bounty hunter unravels destiny.',
      director: 'Siva',
      cast_members: JSON.stringify([{"name":"Suriya","role":"Kanguva / Francis","photo":"/cast/suriya.jpg"},{"name":"Bobby Deol","role":"Udhiran","photo":"/cast/bobby_deol.jpg"},{"name":"Disha Patani","role":"Angelina","photo":"/cast/disha_patani.jpg"}]),
      release_date: '2026-10-25',
      mood_tags: JSON.stringify(['Adventurous', 'Excited', 'Energetic']),
      vibe_tags: JSON.stringify(['Mass', 'Adventure', 'Mind-bending']),
      travel_tags: JSON.stringify(['Long journey', 'Friends trip']),
      is_active: 1
    },
    // 10. Inside Out 2
    {
      id: 'mov-inside-out-2',
      tmdb_id: 1022789,
      title: 'Inside Out 2',
      tagline: 'Make Room for New Emotions.',
      poster_url: '/posters/inside_out_2.jpg',
      backdrop_url: '/posters/inside_out_2.jpg',
      trailer_url: 'https://www.youtube.com/embed/LEjhY15eCx0',
      language: 'English',
      secondary_languages: JSON.stringify(['Tamil', 'Hindi']),
      genres: JSON.stringify(['Animation', 'Family', 'Comedy']),
      duration_mins: 96,
      certificate: 'U',
      rating: 8.5,
      vote_count: 42000,
      overview: 'Teenager Riley faces the arrival of brand-new emotions at Headquarters: Anxiety, Envy, Ennui, and Embarrassment.',
      director: 'Kelsey Mann',
      cast_members: JSON.stringify([{"name":"Amy Poehler","role":"Joy (Voice)","photo":"/cast/amy_poehler.jpg"},{"name":"Maya Hawke","role":"Anxiety (Voice)","photo":"/cast/maya_hawke.jpg"}]),
      release_date: '2026-07-20',
      mood_tags: JSON.stringify(['Happy', 'Emotional', 'Relaxed']),
      vibe_tags: JSON.stringify(['Feel-good', 'Family', 'Comedy', 'Fun']),
      travel_tags: JSON.stringify(['Family trip', 'Weekend outing', 'Relaxing travel']),
      is_active: 1
    },
    // 11. Deadpool & Wolverine
    {
      id: 'mov-deadpool-wolverine',
      tmdb_id: 533535,
      title: 'Deadpool & Wolverine',
      tagline: 'Come Together.',
      poster_url: '/posters/deadpool_wolverine.jpg',
      backdrop_url: '/posters/deadpool_wolverine.jpg',
      trailer_url: 'https://www.youtube.com/embed/73_1biulkYk',
      language: 'English',
      secondary_languages: JSON.stringify(['Tamil', 'Hindi', 'Telugu']),
      genres: JSON.stringify(['Action', 'Comedy', 'Sci-Fi']),
      duration_mins: 128,
      certificate: 'A',
      rating: 8.6,
      vote_count: 48000,
      overview: 'A listless Wade Wilson is pulled out of retirement by the Time Variance Authority, partnering with a cynical Wolverine on an outrageous rescue mission.',
      director: 'Shawn Levy',
      cast_members: JSON.stringify([{"name":"Ryan Reynolds","role":"Wade Wilson / Deadpool","photo":"/cast/ryan_reynolds.jpg"},{"name":"Hugh Jackman","role":"Logan / Wolverine","photo":"/cast/hugh_jackman.jpg"}]),
      release_date: '2026-07-26',
      mood_tags: JSON.stringify(['Excited', 'Energetic', 'Bored']),
      vibe_tags: JSON.stringify(['Comedy', 'Action', 'Fun', 'Mass']),
      travel_tags: JSON.stringify(['Friends trip', 'Night drive', 'Weekend outing']),
      is_active: 1
    },
    // 12. Manjummel Boys
    {
      id: 'mov-manjummel-boys',
      tmdb_id: 1154784,
      title: 'Manjummel Boys',
      tagline: 'Manithan Unarndhukolla Ithu Manitha Kaadhal Alla.',
      poster_url: '/posters/manjummel_boys.jpg',
      backdrop_url: '/posters/manjummel_boys.jpg',
      trailer_url: 'https://www.youtube.com/embed/id848Ww1YLo',
      language: 'Malayalam',
      secondary_languages: JSON.stringify(['Tamil', 'Telugu']),
      genres: JSON.stringify(['Adventure', 'Thriller', 'Drama']),
      duration_mins: 135,
      certificate: 'U',
      rating: 8.7,
      vote_count: 29000,
      overview: 'A tight-knit group of friends from Kochi embark on a trip to Kodaikanal where one of them falls into the notorious Guna Caves, prompting an impossible rescue.',
      director: 'Chidambaram',
      cast_members: JSON.stringify([{"name":"Soubin Shahir","role":"Kuttan","photo":"/cast/soubin_shahir.jpg"},{"name":"Sreenath Bhasi","role":"Subhash","photo":"/cast/sreenath_bhasi.jpg"}]),
      release_date: '2026-06-15',
      mood_tags: JSON.stringify(['Adventurous', 'Emotional', 'Excited']),
      vibe_tags: JSON.stringify(['Adventure', 'Emotional', 'Thriller']),
      travel_tags: JSON.stringify(['Friends trip', 'Long journey', 'Weekend outing']),
      is_active: 1
    },
    // 13. Aavesham
    {
      id: 'mov-aavesham',
      tmdb_id: 1154790,
      title: 'Aavesham',
      tagline: 'Eda Mone! Pure Electrifying Energy.',
      poster_url: '/posters/aavesham.jpg',
      backdrop_url: '/posters/aavesham.jpg',
      trailer_url: 'https://www.youtube.com/embed/L0yEMl8PXnw',
      language: 'Malayalam',
      secondary_languages: JSON.stringify(['Tamil']),
      genres: JSON.stringify(['Action', 'Comedy']),
      duration_mins: 158,
      certificate: 'U/A 13+',
      rating: 8.4,
      vote_count: 24000,
      overview: 'Three college students in Bangalore seeking protection from campus bullies cross paths with Ranga, an eccentric and unpredictable local gangster.',
      director: 'Jithu Madhavan',
      cast_members: JSON.stringify([{"name":"Fahadh Faasil","role":"Ranga","photo":"/cast/fahadh_faasil.jpg"},{"name":"Hipzster","role":"Aju","photo":"/cast/hipzster.jpg"}]),
      release_date: '2026-05-10',
      mood_tags: JSON.stringify(['Energetic', 'Happy', 'Excited']),
      vibe_tags: JSON.stringify(['Mass', 'Comedy', 'Fun']),
      travel_tags: JSON.stringify(['Friends trip', 'Night drive']),
      is_active: 1
    },
    // 14. Lubber Pandhu
    {
      id: 'mov-lubber-pandhu',
      tmdb_id: 1241982,
      title: 'Lubber Pandhu',
      tagline: 'Cricket, Passion, and Heartwarming Rivalry.',
      poster_url: '/posters/lubber_pandhu.jpg',
      backdrop_url: '/posters/lubber_pandhu.jpg',
      trailer_url: 'https://www.youtube.com/embed/oP88LHBukW8',
      language: 'Tamil',
      secondary_languages: JSON.stringify(['Telugu']),
      genres: JSON.stringify(['Drama', 'Comedy']),
      duration_mins: 150,
      certificate: 'U',
      rating: 8.6,
      vote_count: 19800,
      overview: 'An intense gully cricket ego battle between an experienced bowler and an ambitious young batsman spirals into community politics and family ties.',
      director: 'Tamizharasan Pachamuthu',
      cast_members: JSON.stringify([{"name":"Harish Kalyan","role":"Anbu","photo":"/cast/harish_kalyan.jpg"},{"name":"Attakathi Dinesh","role":"Gethu","photo":"/cast/attakathi_dinesh.jpg"}]),
      release_date: '2026-09-20',
      mood_tags: JSON.stringify(['Happy', 'Emotional', 'Motivated']),
      vibe_tags: JSON.stringify(['Feel-good', 'Family', 'Fun', 'Emotional']),
      travel_tags: JSON.stringify(['Weekend outing', 'Family trip', 'Solo travel']),
      is_active: 1
    },
    // 15. Meiyazhagan
    {
      id: 'mov-meiyazhagan',
      tmdb_id: 1219159,
      title: 'Meiyazhagan',
      tagline: 'A Soulful Journey Home.',
      poster_url: '/posters/meiyazhagan.jpg',
      backdrop_url: '/posters/meiyazhagan.jpg',
      trailer_url: 'https://www.youtube.com/embed/Ahp840_aCoI',
      language: 'Tamil',
      secondary_languages: JSON.stringify(['Telugu', 'Malayalam']),
      genres: JSON.stringify(['Drama']),
      duration_mins: 177,
      certificate: 'U',
      rating: 8.7,
      vote_count: 17600,
      overview: 'Arumozhi returns to his ancestral village after 22 years for a cousin’s wedding and spends a transformative night with a relentlessly warm relative.',
      director: 'C. Prem Kumar',
      cast_members: JSON.stringify([{"name":"Karthi","role":"Meiyazhagan","photo":"/cast/karthi.jpg"},{"name":"Arvind Swamy","role":"Arulmozhi Varman","photo":"/cast/arvind_swamy.jpg"}]),
      release_date: '2026-09-27',
      mood_tags: JSON.stringify(['Emotional', 'Relaxed', 'Happy']),
      vibe_tags: JSON.stringify(['Feel-good', 'Emotional', 'Family', 'Chill']),
      travel_tags: JSON.stringify(['Night drive', 'Solo travel', 'Relaxing travel']),
      is_active: 1
    },
    // 16. Lucky Baskhar
    {
      id: 'mov-lucky-baskhar',
      tmdb_id: 1184947,
      title: 'Lucky Baskhar',
      tagline: 'Money Makes the World Go Round.',
      poster_url: '/posters/lucky_baskhar.jpg',
      backdrop_url: '/posters/lucky_baskhar.jpg',
      trailer_url: 'https://www.youtube.com/embed/FonKx5wvuHI',
      language: 'Telugu',
      secondary_languages: JSON.stringify(['Tamil', 'Malayalam', 'Hindi']),
      genres: JSON.stringify(['Drama', 'Thriller']),
      duration_mins: 150,
      certificate: 'U/A 13+',
      rating: 8.4,
      vote_count: 18200,
      overview: 'A modest, middle-class bank cashier in the late 1980s discovers lucrative financial loopholes, descending into high-stakes money laundering.',
      director: 'Venky Atluri',
      cast_members: JSON.stringify([{"name":"Dulquer Salmaan","role":"Baskhar Kumar","photo":"/cast/dulquer_salmaan.jpg"},{"name":"Meenakshi Chaudhary","role":"Sumathi","photo":"/cast/meenakshi_chaudhary.jpg"}]),
      release_date: '2026-10-31',
      mood_tags: JSON.stringify(['Excited', 'Motivated']),
      vibe_tags: JSON.stringify(['Thriller', 'Mind-bending']),
      travel_tags: JSON.stringify(['Long journey', 'Friends trip']),
      is_active: 1
    },
    // 17. Stree 2
    {
      id: 'mov-stree2',
      tmdb_id: 1079091,
      title: 'Stree 2',
      tagline: 'Sarkate Ka Aatank.',
      poster_url: '/posters/stree2.jpg',
      backdrop_url: '/posters/stree2.jpg',
      trailer_url: 'https://www.youtube.com/embed/KVnheXywIbY',
      language: 'Hindi',
      secondary_languages: JSON.stringify(['English']),
      genres: JSON.stringify(['Comedy', 'Horror']),
      duration_mins: 149,
      certificate: 'U/A 13+',
      rating: 8.3,
      vote_count: 27800,
      overview: 'The eccentric town of Chanderi faces a sinister headless phantom named Sarkata, forcing Vicky and the mysterious spirit Stree into an uproarious alliance.',
      director: 'Amar Kaushik',
      cast_members: JSON.stringify([{"name":"Rajkummar Rao","role":"Vicky","photo":"/cast/rajkummar_rao.jpg"},{"name":"Shraddha Kapoor","role":"The Unnamed Girl","photo":"/cast/shraddha_kapoor.jpg"},{"name":"Pankaj Tripathi","role":"Rudra","photo":"/cast/pankaj_tripathi.jpg"}]),
      release_date: '2026-08-15',
      mood_tags: JSON.stringify(['Happy', 'Scared', 'Bored']),
      vibe_tags: JSON.stringify(['Comedy', 'Fun', 'Thriller']),
      travel_tags: JSON.stringify(['Friends trip', 'Weekend outing']),
      is_active: 1
    },
    // 18. Leo
    {
      id: 'mov-leo',
      tmdb_id: 1075794,
      title: 'Leo',
      tagline: 'Bloody Sweet.',
      poster_url: '/posters/leo.jpg',
      backdrop_url: '/posters/leo.jpg',
      trailer_url: 'https://www.youtube.com/embed/Po3jStA673E',
      language: 'Tamil',
      secondary_languages: JSON.stringify(['Telugu', 'Hindi']),
      genres: JSON.stringify(['Action', 'Crime', 'Thriller']),
      duration_mins: 164,
      certificate: 'A',
      rating: 8.3,
      vote_count: 42000,
      overview: 'A mild-mannered cafe owner in Himachal Pradesh becomes a local hero after thwarting an armed gang, dragging him back into a dangerous underworld past.',
      director: 'Lokesh Kanagaraj',
      cast_members: JSON.stringify([{"name":"Thalapathy Vijay","role":"Parthiban / Leo Das","photo":"/cast/thalapathy_vijay.jpg"},{"name":"Trisha Krishnan","role":"Sathya","photo":"/cast/trisha_krishnan.jpg"},{"name":"Sanjay Dutt","role":"Antony Das","photo":"/cast/sanjay_dutt.jpg"}]),
      release_date: '2026-04-10',
      mood_tags: JSON.stringify(['Excited', 'Energetic']),
      vibe_tags: JSON.stringify(['Mass', 'Action', 'Thriller']),
      travel_tags: JSON.stringify(['Night drive', 'Friends trip']),
      is_active: 1
    },
    // 19. Jailer
    {
      id: 'mov-jailer',
      tmdb_id: 998844,
      title: 'Jailer',
      tagline: 'Hukum Tiger Ka Hukum.',
      poster_url: '/posters/jailer.jpg',
      backdrop_url: '/posters/jailer.jpg',
      trailer_url: 'https://www.youtube.com/embed/Y5BeWdODPqo',
      language: 'Tamil',
      secondary_languages: JSON.stringify(['Telugu', 'Hindi', 'Malayalam']),
      genres: JSON.stringify(['Action', 'Comedy', 'Crime']),
      duration_mins: 168,
      certificate: 'U/A 16+',
      rating: 8.2,
      vote_count: 36000,
      overview: 'A retired prison warden leads an unyielding covert manhunt to dismantle an international antique smuggling kingpin who threatened his family.',
      director: 'Nelson Dilipkumar',
      cast_members: JSON.stringify([{"name":"Rajinikanth","role":"Tiger Muthuvel Pandian","photo":"/cast/rajinikanth.jpg"},{"name":"Mohanlal","role":"Mathew","photo":"/cast/mohanlal.jpg"},{"name":"Shiva Rajkumar","role":"Narasimha","photo":"/cast/shiva_rajkumar.jpg"}]),
      release_date: '2026-03-25',
      mood_tags: JSON.stringify(['Excited', 'Energetic']),
      vibe_tags: JSON.stringify(['Mass', 'Action', 'Fun']),
      travel_tags: JSON.stringify(['Friends trip', 'Night drive']),
      is_active: 1
    },
    // 20. Interstellar
    {
      id: 'mov-interstellar',
      tmdb_id: 157336,
      title: 'Interstellar',
      tagline: 'Mankind was Born on Earth. It was Never Meant to Die Here.',
      poster_url: '/posters/interstellar.jpg',
      backdrop_url: '/posters/interstellar.jpg',
      trailer_url: 'https://www.youtube.com/embed/zSWdZVtXT7E',
      language: 'English',
      secondary_languages: JSON.stringify(['Tamil', 'Hindi']),
      genres: JSON.stringify(['Sci-Fi', 'Drama', 'Adventure']),
      duration_mins: 169,
      certificate: 'U/A 13+',
      rating: 8.9,
      vote_count: 88000,
      overview: 'When Earth becomes uninhabitable in the future, a former NASA pilot leads a crew through a newly discovered wormhole near Saturn.',
      director: 'Christopher Nolan',
      cast_members: JSON.stringify([{"name":"Matthew McConaughey","role":"Joseph Cooper","photo":"/cast/matthew_mcconaughey.jpg"},{"name":"Anne Hathaway","role":"Dr. Amelia Brand","photo":"/cast/anne_hathaway.jpg"},{"name":"Jessica Chastain","role":"Murphy Cooper","photo":"/cast/jessica_chastain.jpg"}]),
      release_date: '2026-05-15',
      mood_tags: JSON.stringify(['Emotional', 'Adventurous', 'Motivated']),
      vibe_tags: JSON.stringify(['Mind-bending', 'Emotional', 'Adventure']),
      travel_tags: JSON.stringify(['Long journey', 'Night drive', 'Solo travel']),
      is_active: 1
    }
  ];

  for (const m of movies) {
    insertMovie.run(
      m.id, m.tmdb_id, m.title, m.tagline, m.poster_url, m.backdrop_url, m.trailer_url,
      m.language, m.secondary_languages, m.genres, m.duration_mins, m.certificate,
      m.rating, m.vote_count, m.overview, m.director, m.cast_members, m.release_date,
      m.mood_tags, m.vibe_tags, m.travel_tags, m.is_active
    );
  }

  // 6. Seed Active Shows across Today and the next 6 days
  // Clear old shows first to have a clean distribution
  db.prepare('DELETE FROM shows').run();

  const insertShow = db.prepare(`
    INSERT INTO shows (
      id, movie_id, theatre_id, screen_id, show_date, start_time, end_time, language, experience, ticket_price, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const timeslots = [
    { start: '10:30 AM', end: '01:15 PM' },
    { start: '02:15 PM', end: '05:00 PM' },
    { start: '06:45 PM', end: '09:30 PM' },
    { start: '10:15 PM', end: '01:00 AM' }
  ];

  const today = new Date();
  
  // Distribute shows for 7 days
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const curDate = new Date(today);
    curDate.setDate(today.getDate() + dayOffset);
    const dateStr = curDate.toISOString().split('T')[0];

    theatres.forEach((th, thIdx) => {
      const thScreens = screens.filter(s => s.theatre_id === th.id);
      
      thScreens.forEach((scr, scrIdx) => {
        // Distribute our 20 movies so each district and theatre gets rich variety
        const offsetBase = (thIdx * 3 + scrIdx * 2 + dayOffset) % movies.length;
        
        timeslots.forEach((slot, slotIdx) => {
          const movieIdx = (offsetBase + slotIdx) % movies.length;
          const selectedMovie = movies[movieIdx];
          const showId = `sh-${th.id}-${scr.id}-${dateStr}-${slotIdx}`;
          let price = scr.experience === 'IMAX' ? 350.0 : (scr.experience === '4DX' ? 420.0 : (scr.experience === 'Dolby Atmos' ? 240.0 : 190.0));
          
          insertShow.run(
            showId,
            selectedMovie.id,
            th.id,
            scr.id,
            dateStr,
            slot.start,
            slot.end,
            selectedMovie.language,
            scr.experience,
            price,
            'ACTIVE'
          );
        });
      });
    });
  }

  // 7. Seed Test Users
  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (id, name, email, password_hash, role, phone, district_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const passwordHash = bcrypt.hashSync('password123', 10);
  const now = Date.now();

  const users = [
    {
      id: 'usr-customer-1',
      name: 'Aditya Raman',
      email: 'customer@cineaura.com',
      password_hash: passwordHash,
      role: 'customer',
      phone: '+91 98401 23456',
      district_id: 'chennai',
      created_at: now
    },
    {
      id: 'usr-manager-1',
      name: 'Karthik Sundaram (Chief Cinema Manager)',
      email: 'manager@cineaura.com',
      password_hash: passwordHash,
      role: 'manager',
      phone: '+91 98409 87654',
      district_id: 'chennai',
      created_at: now
    },
    {
      id: 'usr-employee-1',
      name: 'Priya Murugan (Box Office & Gate Attendant)',
      email: 'employee@cineaura.com',
      password_hash: passwordHash,
      role: 'employee',
      phone: '+91 98405 55555',
      district_id: 'chennai',
      created_at: now
    }
  ];

  for (const u of users) {
    insertUser.run(u.id, u.name, u.email, u.password_hash, u.role, u.phone, u.district_id, u.created_at);
  }

  console.log(`--- CineAura Seeding Finished: 20 Movies, ${theatres.length} Theatres, ${screens.length} Screens, 7 Days of Shows Seeded! ---`);
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
