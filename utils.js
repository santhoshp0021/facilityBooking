const User = require('./models/User');
const Weektable = require('./models/Weektable');
const Timetable = require('./models/Timetable');

// Helper: Get 00:00 IST as UTC Date
function getISTMidnightUTC(date) {
  return new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0, -330, 0, 0 // 00:00 IST = UTC - 5:30
  ));
}

// Helper to get this week's Monday (00:00 IST)
function getCurrentWeekStart() {
  const now = new Date();
  const day = now.getDay(); // Sunday = 0, Monday = 1
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  now.setDate(now.getDate() + diffToMonday);
  return getISTMidnightUTC(now);
}

// Helper to get Monday of given date (00:00 IST)
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diffToMonday);
  return getISTMidnightUTC(d);
}

// Helper to get next week's Monday (00:00 IST)
function getNextWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const daysUntilNextMonday = ((8 - day) % 7) || 7;
  now.setDate(now.getDate() + daysUntilNextMonday);
  return getISTMidnightUTC(now);
}

// Helper to get Monday offset by N weeks (00:00 IST)
function getWeekStartWithOffset(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  now.setDate(now.getDate() + diffToMonday + offset * 7);
  return getISTMidnightUTC(now);
}

// Helper to get next 4 Mondays (00:00 IST)
function getNext4WeekStarts() {
  const weeks = [];
  const baseMonday = getCurrentWeekStart();
  for (let i = 0; i < 4; i++) {
    const monday = new Date(baseMonday);
    monday.setDate(monday.getDate() + i * 7);
    weeks.push(getISTMidnightUTC(monday));
  }
  return weeks;
}

// Ensure Weektables Exist for All Users
async function ensureWeektablesForAllUsers() {
  const users = await User.find({});
  
  for (let weekOffset = 0; weekOffset < 5; weekOffset++) {
    const weekStart = getWeekStartWithOffset(weekOffset);

    for (const user of users) {
      let weektable = await Weektable.findOne({ userId: user.userId, weekStart });

      const timetable = await Timetable.findOne({ userId: user.userId });

      let periods = [];

      if (timetable && Array.isArray(timetable.periods) && timetable.periods.length > 0) {
        periods = timetable.periods.map(period => ({
          periodNo: period.periodNo,
          day: period.day,
          periodId: period.periodId,
          free: period.free,
          roomNo: period.roomNo || '',
          courseCode: period.courseCode || '',
          staffName: period.staffName || '',
          lab: period.lab || '',
          projector: '',
          startTime: period.startTime || '',
          endTime: period.endTime || ''
        }));
      } else {
        // Fallback to default 40-periods
        const startTimes = ["08:30", "09:25", "10:30", "11:25", "13:10", "14:05", "15:00", "15:55"];
        const endTimes   = ["09:20", "10:15", "11:20", "12:15", "14:00", "14:55", "15:50", "16:45"];

        for (let day = 1; day <= 5; day++) {
          for (let periodNo = 1; periodNo <= 8; periodNo++) {
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
              startTime: startTimes[periodNo - 1],
              endTime: endTimes[periodNo - 1]
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

module.exports = {
  getWeekStart,
  getNextWeekStart,
  getNext4WeekStarts,
  getCurrentWeekStart,
  getWeekStartWithOffset,
  ensureWeektablesForAllUsers
};
