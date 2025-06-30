const User =  require('./models/User');
const Weektable =  require('./models/Weektable');
const Timetable =  require('./models/Timetable');
const Period =  require('./models/Period');
const { Booking } = require('./models/BookingHistory');
// Helper to get next 4 Monday dates
function getNext4WeekStarts() {
    const weeks = [];
    const today = new Date();
    const monday = new Date(today.setDate(today.getDate() - today.getDay() + 1));
    monday.setHours(0, 0, 0, 0);
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(monday);
      weekStart.setDate(monday.getDate() + i * 7);
      weeks.push(new Date(weekStart.setUTCHours(18, 30, 0, 0)));
    }
    return weeks;
}

//Helper to get this week's monday
function getCurrentWeekStart() {
    const d = new Date();
    const weekStart = new Date(d.setDate(d.getDate() - d.getDay() ));
    weekStart.setUTCHours(18, 30, 0, 0);
    return weekStart;
}

//Helper to get given week's monday
function getWeekStart(date) {
    const d = new Date(date);
    const weekStart = new Date(d.setDate(d.getDate() - d.getDay() ));
    weekStart.setUTCHours(18, 30, 0, 0);
    return weekStart;
}

// Helper to get next week's Monday
function getNextWeekStart() {
  const now = new Date();
  const day = now.getDay();
  // 0=Sunday, 1=Monday, ..., 6=Saturday
  const daysUntilNextMonday = ((8 - day) % 7) || 7;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilNextMonday);
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday;
}

// Helper to get Monday of a week, offset by n weeks from now
function getWeekStartWithOffset(offset = 0) {
  const now = new Date();
  const monday = new Date(now.setDate(now.getDate() - now.getDay() + 1 + offset * 7));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

async function ensureWeektablesForAllUsers() {
    const users = await User.find({});
    //console.log(users);
    for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
      const weekStart = getWeekStartWithOffset(weekOffset);
  
      for (const user of users) {
        let weektable = await Weektable.findOne({ userId: user.userId, weekStart });
  
        // Try to get user's timetable
        const timetable = await Timetable.findOne({ userId: user.userId });
  
        let periods = [];
  
        if (timetable && Array.isArray(timetable.periods) && timetable.periods.length > 0) {
          const periodDocs = await Period.find({ _id: { $in: timetable.periods } });
  
          periods = periodDocs.map(period => ({
            periodNo: period.periodNo,
            day: period.day,
            periodId: period.periodId,
            free: period.free,
            roomNo: period.roomNo || '',
            courseCode: period.courseCode || '',
            staffName: period.staffName || '',
            lab: period.lab || '',
            projector: "",
            startTime: period.startTime || '',
            endTime: period.endTime || ''
          }));
        } else {
          // 👇 Fallback: generate default 40-period week
          const startTimes = ["08:30", "09:25", "10:30", "11:25", "13:10", "14:05", "15:00", "15:55"];
          const endTimes   = ["09:20", "10:15", "11:20", "12:15", "14:00", "14:55", "15:50", "16:45"];
  
          for (let day = 1; day <= 5; day++) {
            for (let periodNo = 1; periodNo < 9; periodNo++) {
              periods.push({
                periodNo,
                day,
                periodId: `${periodNo}-${day}`,
                free: true,
                roomNo: '',
                courseCode: '',
                staffName: '',
                lab: '',
                projector: '',
                startTime: startTimes[periodNo-1],
                endTime: endTimes[periodNo-1]
              });
            }
          }
        }
  
        if (!weektable) {
          await Weektable.create({
            userId: user.userId,
            periods,
            weekStart
          });
        } else {
          weektable.periods = periods;
          await weektable.save();
        }
      }
    }
  }

// Update Booking facilities' free and bookedBy status based on this week's weektables
async function syncFacilityStatusWithWeektables() {
    const thisMonday = getCurrentWeekStart();
    // Find all weektables for this week
    const weektables = await Weektable.find({ weekStart: thisMonday });
  
    for (const weektable of weektables) {
      if (!Array.isArray(weektable.periods)) continue;
      for (const period of weektable.periods) {
        // Find the Booking record for this periodId
        const booking = await Booking.findOne({ periodId: period.periodId });
        if (booking && Array.isArray(booking.facilities)) {
          let updated = false;
          for (const fac of booking.facilities) {
            // Update free status for room
            if (
              fac.type === 'room' &&
              period.roomNo &&
              namesMatch(fac.name, period.roomNo)
            ) {
              fac.free = period.free;
              fac.bookedBy = weektable.userId;
              updated = true;
            }
            // Update free status for lab
            if (
              fac.type === 'lab' &&
              period.lab &&
              namesMatch(fac.name, period.lab)
            ) {
              fac.free = period.free;
              fac.bookedBy = weektable.userId;
              updated = true;
            }
            // Update free status for projector
            if (
              fac.type === 'projector' &&
              period.projector &&
              namesMatch(fac.name, period.projector)
            ) {
              fac.free = period.free;
              fac.bookedBy = weektable.userId;
              updated = true;
            }
          }
          if (updated) {
            await booking.save();
          }
        }
      }
    }
  }
  
  async function ensureWeektablesForAllUsersCall() {
    const users = await User.find({});
    const weekStart = getWeekStartWithOffset(3);  // fixed week offset
  
    const startTimes = ["08:30", "09:30", "10:30", "11:25", "13:10", "14:05", "15:00", "15:55"];
    const endTimes   = ["09:25", "10:15", "11:20", "12:15", "14:00", "14:55", "15:50", "16:45"];
  
    for (const user of users) {
      let weektable = await Weektable.findOne({ userId: user.userId, weekStart });
  
      const timetable = await Timetable.findOne({ userId: user.userId });
  
      let periods = [];
  
      if (timetable && Array.isArray(timetable.periods) && timetable.periods.length > 0) {
        const periodDocs = await Period.find({ _id: { $in: timetable.periods } });
  
        periods = periodDocs.map(period => ({
          periodNo: period.periodNo,
          day: period.day,
          periodId: period.periodId,
          free: period.free,
          roomNo: period.roomNo || '',
          courseCode: period.courseCode || '',
          staffName: period.staffName || '',
          lab: period.lab || '',
          projector: "",
          startTime: period.startTime || '',
          endTime: period.endTime || ''
        }));
      } else {
        // Fallback: generate default 40 period entries
        for (let day = 1; day <= 5; day++) {
          for (let periodNo = 1; periodNo < 9; periodNo++) {
            periods.push({
              periodNo,
              day,
              periodId: `${periodNo}-${day}`,
              free: true,
              roomNo: '',
              courseCode: '',
              staffName: '',
              lab: '',
              projector: '',
              startTime: startTimes[periodNo],
              endTime: endTimes[periodNo]
            });
          }
        }
      }
  
      if (!weektable) {
        await Weektable.create({
          userId: user.userId,
          periods,
          weekStart
        });
      } else {
        weektable.periods = periods;
        await weektable.save();
      }
    }
  }
  
  
module.exports = { getWeekStart,getNextWeekStart, getNext4WeekStarts, getCurrentWeekStart, getWeekStartWithOffset, ensureWeektablesForAllUsers, ensureWeektablesForAllUsersCall, syncFacilityStatusWithWeektables };