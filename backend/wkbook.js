const mongoose = require("mongoose");
const Weektable = require("./models/Weektable");
const {Booking} = require("./models/BookingHistory");

async function updateBookingsForWeek() {
  // Connect to MongoDB
  
  // Step 1: Define exact weekStart date
  const selectedWeekStart = new Date("2025-06-22T18:30:00.000Z");

  // Step 2: Utility to convert period index to day & slot
  const getDaySlotFromIndex = (index) => {
    const day = Math.floor(index / 8) + 1;
    const slot = (index % 8) + 1;
    return { day, slot };
  };

  // Step 3: Define full list of facilities
  const allFacilities = [
    { name: 'KP-107', type: 'room' },
    { name: 'KP-102', type: 'room' },
    { name: 'KP-210', type: 'room' },
    { name: 'KP-303', type: 'room' },
    { name: 'KP-307', type: 'room' },
    { name: 'KP-106', type: 'room' },
    { name: 'KP-206', type: 'room' },
    { name: 'KP-407', type: 'room' },
    { name: 'KP-406', type: 'room' },
    { name: 'R-1', type: 'room' },
    { name: 'R-2', type: 'room' },
    { name: 'R-3', type: 'room' },
    { name: 'Ground Floor Lab', type: 'lab' },
    { name: 'First Floor Lab', type: 'lab' },
    { name: 'Second Floor Lab', type: 'lab' },
    { name: 'Temenos Floor Lab', type: 'lab' },
    { name: 'Projector1', type: 'projector' },
    { name: 'Projector2', type: 'projector' },
    { name: 'Projector3', type: 'projector' }
  ];

  // Step 4: Fetch all weektables for selected week
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
        const facilities = allFacilities.map(fac => ({
          name: fac.name,
          type: fac.type,
          free: true,
          bookedBy: ""
        }));

        booking = new Booking({ periodId, facilities });
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

      await booking.save();
    }
  }

  console.log("🎉 Booking creation complete for week starting:", selectedWeekStart.toISOString());
 
}
module.exports = updateBookingsForWeek;
