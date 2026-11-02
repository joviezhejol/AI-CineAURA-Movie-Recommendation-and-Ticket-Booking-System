const express = require('express');
const router = express.Router();
const { MOODS, VIBES, TRAVEL_MOODS, recommendMovies, generateAuraResponse } = require('../services/aiEngine');

// POST /api/ai/chat
router.post('/chat', (req, res) => {
  try {
    const { message, mood, vibe, travelMood, language, districtId = 'chennai' } = req.body;
    const response = generateAuraResponse({
      userMessage: message,
      mood,
      vibe,
      travelMood,
      language,
      districtId
    });

    res.json(response);
  } catch (err) {
    console.error('Aura AI Error:', err);
    res.status(500).json({ error: 'Aura AI is temporarily processing other cinematic insights' });
  }
});

// GET /api/ai/recommendations
router.get('/recommendations', (req, res) => {
  try {
    const { mood, vibe, travelMood, language, districtId = 'chennai' } = req.query;
    const recommendations = recommendMovies({ mood, vibe, travelMood, language, districtId });
    res.json({ recommendations });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// GET /api/ai/options
router.get('/options', (req, res) => {
  res.json({
    moods: MOODS,
    vibes: VIBES,
    travelMoods: TRAVEL_MOODS
  });
});

module.exports = router;
