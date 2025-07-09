import React, { useEffect, useState } from "react";
import Banner from "../../components/Banner";
import Sidebar from "../../components/Sidebar";

const PERIODS = 40;
const PERIOD_TIMES = [
  { startTime: "08:30", endTime: "09:20" },
  { startTime: "09:25", endTime: "10:15" },
  { startTime: "10:30", endTime: "11:20" },
  { startTime: "11:25", endTime: "12:15" },
  { startTime: "13:10", endTime: "14:00" },
  { startTime: "14:05", endTime: "14:55" },
  { startTime: "15:00", endTime: "15:50" },
  { startTime: "15:55", endTime: "16:45" },
];

function getDayAndPeriod(idx) {
  // idx: 0-39
  const day = Math.floor(idx / 8) + 1; // 1=Monday, ..., 5=Friday
  const periodNo = (idx % 8) + 1; // 1-8
  return { day, periodNo };
}

const TimeTable = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [userId, setUserId] = useState("");
  const [courses, setCourses] = useState([]);
  const [defaultRoom, setDefaultRoom] = useState("");
  const [defaultLab, setDefaultLab] = useState("");
  const [periods, setPeriods] = useState(Array(PERIODS).fill(null));
  const [editIdx, setEditIdx] = useState(null);
  const [editRoom, setEditRoom] = useState("");
  const [editLab, setEditLab] = useState("");

  // Fetch all enrollments for user selection
  useEffect(() => {
    fetch("http://localhost:5000/api/enrollment/all")
      .then(res => res.json())
      .then(data => setEnrollments(data));
  }, []);

  // Fetch courses when userId changes
  useEffect(() => {
    if (!userId) return;
    fetch(`http://localhost:5000/api/enrollment/courses?userId=${userId}`)
      .then(res => res.json())
      .then(data => setCourses(data));
    setPeriods(Array(PERIODS).fill(null));
  }, [userId]);

  // Assign course to period
  const assignCourse = (periodIdx, course) => {
    const { day, periodNo } = getDayAndPeriod(periodIdx);
    setPeriods(periods =>
      periods.map((p, idx) =>
        idx === periodIdx
          ? {
              ...course,
              free: false,
              roomNo: course.lab ? "" : defaultRoom,
              lab: course.lab ? defaultLab : "",
              periodNo,
              day,
              periodId: `${periodNo}-${day}`,
              startTime: PERIOD_TIMES[periodNo - 1].startTime,
              endTime: PERIOD_TIMES[periodNo - 1].endTime,
              staffName: course.staffName || "",
              courseCode: course.courseCode || "",
            }
          : p
      )
    );
  };

  // Remove course from period
  const removeCourse = idx => {
    setPeriods(periods => periods.map((p, i) => (i === idx ? null : p)));
  };

  // Edit room/lab for a period
  const handleEdit = idx => {
    setEditIdx(idx);
    setEditRoom(periods[idx]?.roomNo || "");
    setEditLab(periods[idx]?.lab || "");
  };
  const saveEdit = idx => {
    setPeriods(periods =>
      periods.map((p, i) =>
        i === idx ? { ...p, roomNo: editRoom, lab: editLab } : p
      )
    );
    setEditIdx(null);
  };

  // Submit timetable
  const handleSubmit = async () => {
    const filled = periods.map((p, idx) => {
      const { day, periodNo } = getDayAndPeriod(idx);
      return p
        ? p
        : {
            periodNo,
            day,
            periodId: `${periodNo}-${day}`,
            free: true,
            roomNo: "",
            lab: "",
            staffName: "",
            courseCode: "",
            startTime: PERIOD_TIMES[periodNo - 1].startTime,
            endTime: PERIOD_TIMES[periodNo - 1].endTime,
          };
    });
    await fetch("http://localhost:5000/api/timetable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, periods: filled }),
    });
    alert("Timetable submitted!");
  };

  return (
    <div style={{ padding: 24 }}>
      <Banner/>
      <Sidebar/>
      <h2 style={{paddingTop:96}}>Build Timetable</h2>
      <div>
        <label>User ID: </label>
        <select value={userId} onChange={e => setUserId(e.target.value)}>
          <option value="">Select User</option>
          {enrollments.map(e => (
            <option key={e.userId} value={e.userId}>
              {e.userId}
            </option>
          ))}
        </select>
      </div>
      {userId && (
        <>
          <div style={{ margin: "16px 0" }}>
            <label>Default Room: </label>
            <input
              value={defaultRoom}
              onChange={e => setDefaultRoom(e.target.value)}
              style={{ marginRight: 16 }}
            />
            <label>Default Lab: </label>
            <input
              value={defaultLab}
              onChange={e => setDefaultLab(e.target.value)}
            />
          </div>
          <div>
            <h4>Courses</h4>
            <div style={{ display: "flex", gap: 12 }}>
              {courses.map((c, i) => (
                <button
                  key={i}
                  onClick={() => alert("Drag or select a period to assign")}
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setData("courseIdx", i);
                  }}
                  style={{
                    padding: 8,
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    background: "#f7f7f7",
                  }}
                >
                  {c.courseCode} - {c.courseName} ({c.lab ? "Lab" : "Room"})
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 24 }}>
            <h4>40 Periods</h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(8, 1fr)",
                gap: 8,
              }}
            >
              {Array.from({ length: PERIODS }).map((_, idx) => {
                const { day, periodNo } = getDayAndPeriod(idx);
                return (
                  <div
                    key={idx}
                    onDrop={e => {
                      e.preventDefault();
                      const courseIdx = e.dataTransfer.getData("courseIdx");
                      if (courseIdx !== "") assignCourse(idx, courses[courseIdx]);
                    }}
                    onDragOver={e => e.preventDefault()}
                    style={{
                      minHeight: 80,
                      border: "1px solid #aaa",
                      borderRadius: 6,
                      background: periods[idx] ? "#e3f7e3" : "#fafafa",
                      padding: 6,
                      position: "relative",
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>
                      {["Mon", "Tue", "Wed", "Thu", "Fri"][day - 1]} P{periodNo}
                      <div style={{ fontSize: 12, color: "#888" }}>
                        {PERIOD_TIMES[periodNo - 1].startTime} - {PERIOD_TIMES[periodNo - 1].endTime}
                      </div>
                    </div>
                    {periods[idx] ? (
                      editIdx === idx ? (
                        <div>
                          <div>
                            Room:{" "}
                            <input
                              value={editRoom}
                              onChange={e => setEditRoom(e.target.value)}
                            />
                          </div>
                          <div>
                            Lab:{" "}
                            <input
                              value={editLab}
                              onChange={e => setEditLab(e.target.value)}
                            />
                          </div>
                          <button onClick={() => saveEdit(idx)}>Save</button>
                        </div>
                      ) : (
                        <div>
                          <div>
                            <b>{periods[idx].courseCode}</b> - {periods[idx].staffName}
                          </div>
                          <div>
                            Room: {periods[idx].roomNo} | Lab: {periods[idx].lab}
                          </div>
                          <button onClick={() => handleEdit(idx)}>Edit</button>
                          <button onClick={() => removeCourse(idx)}>Remove</button>
                        </div>
                      )
                    ) : (
                      <div style={{ color: "#aaa" }}>Free</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <button
            style={{ marginTop: 24, padding: "10px 30px", fontSize: 18 }}
            onClick={handleSubmit}
          >
            Submit Timetable
          </button>
        </>
      )}
    </div>
  );
};

export default TimeTable;