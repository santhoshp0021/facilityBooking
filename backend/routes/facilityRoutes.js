const express = require('express');
const router = express.Router();
const facilities = require('../facilities');
// GET all facilities (rooms, labs, projectors) for reference
router.get('/facilities', (req, res) => {
    res.json(facilities);
});
  
  //POST a facility
router.post('/facilities', (req, res) => {
    const { name, type } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'name and type required' });
    facilities.push({ name, type, free: true, bookedBy: '' });
    res.json({ success: true, facilities });
});
  
  // Update a facility by index
router.put('/facilities/:index', (req, res) => {
    const idx = parseInt(req.params.index, 10);
    if (isNaN(idx) || idx < 0 || idx >= facilities.length) return res.status(404).json({ error: 'Facility not found' });
    const { name, type } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'name and type required' });
    facilities[idx] = { ...facilities[idx], name, type };
    res.json({ success: true, facilities });
});
  
  // Delete a facility by index
router.delete('/facilities/:index', (req, res) => {
    const idx = parseInt(req.params.index, 10);
    if (isNaN(idx) || idx < 0 || idx >= facilities.length) return res.status(404).json({ error: 'Facility not found' });
    facilities.splice(idx, 1);
    res.json({ success: true, facilities });
});

module.exports = router;