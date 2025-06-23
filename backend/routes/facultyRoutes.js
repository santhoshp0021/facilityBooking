const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Weektable = require('../models/Weektable');
const {BookingHistory ,Booking} = require('../models/BookingHistory');
const facilities = require('../facilities.js');
const { getWeekStart } = require('../utils');

router.get("/facilities/available", async (req, res) => {
    const { date, slot, userId } = req.query;
    if (!date || slot === undefined || !userId) {
      return res.status(400).json({ error: "Missing date, slot or userId" });
    }
    // 1) Compute weekStart and slot index
    const monday = getWeekStart(date);
    monday.setHours(0,0,0,0);
    const dayNum = new Date(date).getDay();     // 1–5
    const slotNum = parseInt(slot,10);          // 0–7
    if (dayNum < 1 || dayNum > 5 || slotNum < 0 || slotNum > 7) {
      return res.status(400).json({ error: "Invalid date or slot" });
    }
    const index = (dayNum - 1) * 8 + slotNum;
  
    try {
      // 2) Load all weektables for that week
      const weektables = await Weektable.find({ weekStart: monday });
      // 3) Collect globally used by others
      const usedRooms      = new Set();
      const usedLabs       = new Set();
      const usedProjectors = new Set();
      let userPeriod;
      for (const wt of weektables) {
        const p = wt.periods[index];
        if (!p) continue;
  
        // Find this user’s own slotData
        if (wt.userId === userId) {
          userPeriod = p;
        }
  
        // Mark global usage
        if (!p.free) {
          if (p.roomNo)      usedRooms.add(p.roomNo);
          if (p.lab)         usedLabs.add(p.lab);
        }
        if (p.projector) {
          usedProjectors.add(p.projector);
        }
      }
  
      // Must have found the user's period
      if (!userPeriod) {
        return res.status(404).json({ error: "No period data for this user/week" });
      }

      // 4) Branch based on userPeriod.free & projector
      // a) Already booked & has a projector ⇒ no one can book anything
      if (userPeriod.free === false && userPeriod.projector !== "") {
        return res.json([]);
      }
  
      // b) Slot taken (room/lab) but no projector yet ⇒ only projector choices
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
      //c) Projector booked so class/lab can be booked
      if (userPeriod.free === true && userPeriod.projector !== "") {
        const availablefacilities = facilities
          .filter(f => f.type === "room"|| f.type == 'lab')
          .map(f => {
            let isUsed;
            if (f.type ==='room') isUsed = usedRooms.has(f.name);
            else                   isUsed = usedLabs.has(f.name);
            return { ...f,free: !isUsed};
          });
        return res.json(availablefacilities);
      }
  
      // d) Slot is free ⇒ rooms & labs available, projectors but some may be taken
      const available = facilities
        .filter(f => f.type === "room" || f.type === "lab" || f.type === "projector")
        .map(f => {
          let isUsed;
          if (f.type === "room")      isUsed = usedRooms.has(f.name);
          else if (f.type === "lab")  isUsed = usedLabs.has(f.name);
          else /* projector */        isUsed = usedProjectors.has(f.name);
  
          return { ...f, free: !isUsed };
        });
      return res.json(available);
    } catch (err) {
      console.error("Facility availability error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  });
  
  router.post("/facilities/book", async (req, res) => {
    const { date, slot, facility, type, userId } = req.body;
  
    if (!date || slot === undefined || !facility || !type || !userId) {
      return res.status(400).json({ error: "Missing fields" });
    }
  
    // 1) Compute weekStart (Monday 00:00) for this date
    const weekstart = getWeekStart(date);
    weekstart.setHours(0, 0, 0, 0);
  
    // Also compute end of that week (next Monday)
    const weekEnd = new Date(weekstart);
    weekEnd.setDate(weekEnd.getDate() + 7);
  
    // 2) Parse day/slot
    const dateObj = new Date(date);
    
    const dayNum = dateObj.getDay();         // 1–5
    const slotNum = parseInt(slot, 10);      // 0–7
    if (dayNum < 1 || dayNum > 5 || slotNum < 0 || slotNum > 7) {
      return res.status(400).json({ error: "Invalid date or slot" });
    }
    const index    = (dayNum - 1) * 8 + slotNum;
    const periodId = `${slotNum + 1}-${dayNum}`;
    try {
      // 3) Update Weektable
      const wt = await Weektable.findOne({ userId, weekStart: weekstart });
      if (!wt) {
        return res.status(404).json({ error: "No Weektable for this user & week" });
      }
  
      // Ensure the slot exists
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

      if((type ==='room' || type === 'lab' ) && !slotData.free) {
        return res.status(409).json({ error: "Already booked another room/lab for this slot" });
      }
      if(type === 'projector' && slotData.projector){
        return res.status(409).json({ error: "Already booked another projector for this slot" });
      }
      if (type === "room")      {console.log('c3');slotData.roomNo    = facility;slotData.free = false;}
      else if (type === "lab")  {console.log('c4');slotData.lab       = facility;slotData.free = false;}
      else if (type === "projector") {console.log('c5');slotData.projector = facility;}
      else return res.status(400).json({ error: "Invalid facility type" });
      await wt.save();
      const userObj = await User.findOne({ userId });
       await BookingHistory.create({
            userId:userObj._id,
            periodId,
            facility: { name: facility, type, free: false }
          });
      if (dateObj < weekstart || dateObj >= weekEnd) return 
      await Booking.findOneAndUpdate(
        {periodId},
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
      res.json({ message: "Facility booked successfully" });
    } catch (err) {
      console.error("Booking Error:", err);
      res.status(500).json({ error: "Server error during booking" });
    }
  });
  
module.exports = router;
