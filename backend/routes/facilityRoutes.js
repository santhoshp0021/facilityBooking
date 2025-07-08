const express = require('express');
const router = express.Router();
const {Facility} = require('../models/BookingHistory');
// GET all facilities (rooms, labs, projectors) for reference
// router.get('/facilities', (req, res) => {
//     res.json(facilities);
// });

// GET all available facilities
router.get('/allFacilities', async (req, res) => {
  try {
    const facilities = await Facility.find({ bookable: true });
    res.json(facilities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch facilities' });
  }
});
// GET /api/facilities/projectors
router.get("/facilities/projectors", async (req, res) => {
  try {
    const projectors = await Facility.find({ type: "projector", bookable:"true" }).select("name type -_id");
    res.json(projectors);
  } catch (error) {
    console.error("Error fetching projectors:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// Get all facilities
router.get("/Facilities", async (req, res) => {
  try {
    const all = await Facility.find();
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch facilities" });
  }
});
// Add a new facility
router.post("/facilities", async (req, res) => {
  try {
    const { name, type, bookable } = req.body;
    const facility = new Facility({ name, type, bookable });
    await facility.save();
    res.status(201).json(facility);
  } catch (err) {
    res.status(400).json({ error: "Failed to add facility", details: err.message });
  }
});

// Update only the 'bookable' field
router.put("/facilities/:id", async (req, res) => {
  try {
    const { bookable } = req.body;
    const updated = await Facility.findByIdAndUpdate(
      req.params.id,
      { bookable },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Facility not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Failed to update facility", details: err.message });
  }
});

// Delete a facility
router.delete("/facilities/:id", async (req, res) => {
  try {
    const deleted = await Facility.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Facility not found" });
    res.json({ message: "Facility deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: "Failed to delete facility", details: err.message });
  }
});



//   //POST a facility
// router.post('/facilities', (req, res) => {
//     const { name, type } = req.body;
//     if (!name || !type) return res.status(400).json({ error: 'name and type required' });
//     facilities.push({ name, type, free: true, bookedBy: '' });
//     res.json({ success: true, facilities });
// });
  
//   // Update a facility by index
// router.put('/facilities/:index', (req, res) => {
//     const idx = parseInt(req.params.index, 10);
//     if (isNaN(idx) || idx < 0 || idx >= facilities.length) return res.status(404).json({ error: 'Facility not found' });
//     const { name, type } = req.body;
//     if (!name || !type) return res.status(400).json({ error: 'name and type required' });
//     facilities[idx] = { ...facilities[idx], name, type };
//     res.json({ success: true, facilities });
// });
  
//   // Delete a facility by index
// router.delete('/facilities/:index', (req, res) => {
//     const idx = parseInt(req.params.index, 10);
//     if (isNaN(idx) || idx < 0 || idx >= facilities.length) return res.status(404).json({ error: 'Facility not found' });
//     facilities.splice(idx, 1);
//     res.json({ success: true, facilities });
// });

module.exports = router;