const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Weektable = require('../models/Weektable');
const { BookingHistory, Booking } = require('../models/BookingHistory');
const Facility = require('../models/BookingHistory'); // ✅ dynamically fetched facilities
const { getWeekStart } = require('../utils');

// GET available facilities for a user at a given date and slot
router.get("/facilities/available", async (req, res) => {
  const { date, slot, userId } = req.query;
  if (!date || slot === undefined || !userId) {
    return res.status(400).json({ error: "Missing date, slot or userId" });
  }

  const monday = getWeekStart(date);
  monday.setHours(0, 0, 0, 0);
  const dayNum = new Date(date).getDay(); // 1–5
  const slotNum = parseInt(slot, 10);     // 0–7

  if (dayNum < 1 || dayNum > 5 || slotNum < 0 || slotNum > 7) {
    return res.status(400).json({ error: "Invalid date or slot" });
  }

  const index = (dayNum - 1) * 8 + slotNum;

  try {
    const facilities = await Facility.find({}); // ✅ fetch from DB

    const weektables = await Weektable.find({ weekStart: monday });

    const usedRooms = new Set();
    const usedLabs = new Set();
    const usedProjectors = new Set();
    let userPeriod;

    for (const wt of weektables) {
      const p = wt.periods[index];
      if (!p) continue;

      if (wt.userId === userId) {
        userPeriod = p;
      }

      if (!p.free) {
        if (p.roomNo) usedRooms.add(p.roomNo);
        if (p.lab) usedLabs.add(p.lab);
      }
      if (p.projector) {
        usedProjectors.add(p.projector);
      }
    }

    if (!userPeriod) {
      return res.status(404).json({ error: "No period data for this user/week" });
    }

    if (userPeriod.free === false && userPeriod.projector !== "") {
      return res.json([]);
    }

    if (userPeriod.free === false && userPeriod.projector === "") {
      const projectors = facilities
        .filter(f => f.type === "projector")
        .map(f => ({
          name: f.name,
          type: f.type,
          free: !usedProjectors.has(f.name)
        }));
      return res.json(projectors);
    }

    if (userPeriod.free === true && userPeriod.projector !== "") {
      const availableFacilities = facilities
        .filter(f => f.type === "room" || f.type === "lab")
        .map(f => {
          let isUsed = f.type === "room" ? usedRooms.has(f.name) : usedLabs.has(f.name);
          return { ...f._doc, free: !isUsed };
        });
      return res.json(availableFacilities);
    }

    const available = facilities
      .filter(f => ["room", "lab", "projector"].includes(f.type))
      .map(f => {
        let isUsed = f.type === "room"
          ? usedRooms.has(f.name)
          : f.type === "lab"
            ? usedLabs.has(f.name)
            : usedProjectors.has(f.name);
        return { ...f._doc, free: !isUsed };
      });

    return res.json(available);

  } catch (err) {
    console.error("Facility availability error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST to book a facility
router.post("/facilities/book", async (req, res) => {
  const { date, slot, facility, type, userId } = req.body;

  if (!date || slot === undefined || !facility || !type || !userId) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const weekstart = getWeekStart(date);
  weekstart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekstart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  const dayNum = dateObj.getDay();    // 1–5
  const slotNum = parseInt(slot, 10); // 0–7

  if (dayNum < 1 || dayNum > 5 || slotNum < 0 || slotNum > 7) {
    return res.status(400).json({ error: "Invalid date or slot" });
  }

  const index = (dayNum - 1) * 8 + slotNum;
  const periodId = `${slotNum + 1}-${dayNum}`;

  try {
    const facilityExists = await Facility.findOne({ name: facility, type });
    if (!facilityExists) {
      return res.status(404).json({ error: "Facility not found" });
    }

    const wt = await Weektable.findOne({ userId, weekStart: weekstart });
    if (!wt) {
      return res.status(404).json({ error: "No Weektable for this user & week" });
    }

    if (!wt.periods[index]) {
      wt.periods[index] = {
        periodNo: slotNum + 1,
        day: dayNum,
        periodId,
        free: true,
        roomNo: "",
        courseCode: "",
        staffName: "",
        lab: "",
        projector: ""
      };
    }

    const slotData = wt.periods[index];

    if ((type === 'room' || type === 'lab') && !slotData.free) {
      return res.status(409).json({ error: "Already booked a room/lab for this slot" });
    }
    if (type === 'projector' && slotData.projector) {
      return res.status(409).json({ error: "Already booked a projector for this slot" });
    }

    if (type === "room") {
      slotData.roomNo = facility;
      slotData.free = false;
    } else if (type === "lab") {
      slotData.lab = facility;
      slotData.free = false;
    } else if (type === "projector") {
      slotData.projector = facility;
    } else {
      return res.status(400).json({ error: "Invalid facility type" });
    }

    await wt.save();

    const userObj = await User.findOne({ userId });
    await BookingHistory.create({
      userId: userObj._id,
      periodId,
      usageDate: dateObj,
      facility: { name: facility, type, free: false }
    });

    if (dateObj >= weekstart && dateObj < weekEnd) {
      await Booking.findOneAndUpdate(
        { periodId },
        {
          $set: {
            "facilities.$[f].free": false,
            "facilities.$[f].bookedBy": userId
          }
        },
        {
          arrayFilters: [{ "f.name": facility, "f.type": type }],
          new: true,
          upsert: false
        }
      );
    }

    res.json({ message: "Facility booked successfully" });

  } catch (err) {
    console.error("Booking Error:", err);
    res.status(500).json({ error: "Server error during booking" });
  }
});

module.exports = router;
