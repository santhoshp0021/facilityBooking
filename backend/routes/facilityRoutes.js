const express = require('express');
const router = express.Router();
const {Facility} = require('../models/BookingHistory');

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

// GET projectors
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

module.exports = router;