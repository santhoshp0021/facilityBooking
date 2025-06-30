const mongoose = require("mongoose");
const Weektable = require("./models/Weektable");
const { Booking } = require("./models/BookingHistory");
const Facility = require('./models/BookingHistory'); // ✅ fetch from DB

async function updateBookingsForWeek() {

  // Step 1: Define exact weekStart date
  const selectedWeekStart = new Date("2025-06-22T18:30:00.000Z");

  // Step 2: Utility to convert period index to day & slot
  const getDaySlotFromIndex = (index) => {
    const day = Math.floor(index / 8) + 1;
    const slot = (index % 8) + 1;
    return { day, slot };
  };

  try {
    // Step 3: Fetch all facilities from the database
    const facilities = await Facility.find({});
    if (!facilities.length) {
      console.warn("⚠️ No facilities found in DB.");
      return;
    }

    // Step 4: Fetch all weektables for the selected week
    const weektables = await Weektable.find({ weekStart: selectedWeekStart });
    console.log("✅ Found", weektables.length, "weektables");

    // Step 5: Iterate over each user's periods and create Booking docs
    for (const wt of weektables) {
      const userId = wt.userId;

      for (let i = 0; i < wt.periods.length; i++) {
        const p = wt.periods[i];
        const { day, slot } = getDaySlotFromIndex(i);
        const periodId = `${slot}-${day}`;

        // Check if booking already exists
        let booking = await Booking.findOne({ periodId });

        if (!booking) {
          // Build facility list with all free initially
          const facilitiesNew = facilities.map(fac => ({
            name: fac.name,
            type: fac.type,
            free: true,
            bookedBy: ""
          }));
          booking = new Booking({ periodId, facilities: facilitiesNew });
        }

        // Update facilities that are used by user in this period
        for (const fac of booking.facilities) {
          if (
            (p.roomNo && fac.name === p.roomNo) ||
            (p.lab && fac.name === p.lab) ||
            (p.projector && fac.name === p.projector)
          ) {
            fac.free = false;
            fac.bookedBy = userId;
          }
        }

        console.log(`💾 Saved booking for period ${periodId}`);
        await booking.save();
      }
    }

    console.log("🎉 Booking creation complete for week starting:", selectedWeekStart.toISOString());
  } catch (err) {
    console.error("❌ Error in updateBookingsForWeek:", err);
  }
}

module.exports = updateBookingsForWeek;
