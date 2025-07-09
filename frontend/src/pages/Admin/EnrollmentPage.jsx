
import React, { useState, useEffect } from "react";
import Sidebar from '../../components/Sidebar';
import Banner from '../../components/Banner';
const EnrollmentPage = () => {
  const [userId, setUserId] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [staffName, setStaffName] = useState("");
  const [lab, setLab] = useState(false);
  const [courses, setCourses] = useState([]);
  const [message, setMessage] = useState("");
  const [editIdx, setEditIdx] = useState(null);
  const [editCourse, setEditCourse] = useState({ courseCode: "", courseName: "", staffName: "", lab: false });
  const [allEnrollments, setAllEnrollments] = useState([]);

  // Color theme
  const theme = {
    primary: "#2d6cdf",
    secondary: "#fff8ee",
    accent: "#f7b731",
    danger: "#e74c3c",
    text: "#222",
    border: "#e0e0e0",
    bisque: "bisque"
  };

  // Fetch all enrollments on mount or after submit/delete
  const fetchEnrollments = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/enrollment/all");
      if (res.ok) {
        const data = await res.json();
        setAllEnrollments(data);
      }
    } catch (err) {
      // Optionally handle error
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const handleAddCourse = (e) => {
    e.preventDefault();
    if (courseCode && courseName && staffName) {
      setCourses([
        ...courses,
        { courseCode, courseName, staffName, lab }
      ]);
      setCourseCode("");
      setCourseName("");
      setStaffName("");
      setLab(false);
    }
  };

  const handleEditClick = (idx) => {
    setEditIdx(idx);
    setEditCourse({ ...courses[idx] });
  };

  const handleEditChange = (e) => {
    const { name, type, checked, value } = e.target;
    setEditCourse({
      ...editCourse,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const handleEditSave = (idx) => {
    const updated = [...courses];
    updated[idx] = { ...editCourse };
    setCourses(updated);
    setEditIdx(null);
    setEditCourse({ courseCode: "", courseName: "", staffName: "", lab: false });
  };

  const handleEditCancel = () => {
    setEditIdx(null);
    setEditCourse({ courseCode: "", courseName: "", staffName: "", lab: false });
  };

  const handleDeleteCourse = (idx) => {
    setCourses(courses.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!userId || courses.length === 0) {
      setMessage("Please enter User ID and add at least one course.");
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/api/enrollment/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, enrolled: courses }),
      });
      if (res.ok) {
        setMessage("Enrollment successful!");
        setCourses([]);
        fetchEnrollments();
      } else {
        const data = await res.json();
        setMessage(data.error || "Error enrolling.");
      }
    } catch (err) {
      setMessage("Server error.");
    }
  };

  // Delete enrollment by userId
  const handleDelete = async (delUserId) => {
    if (!window.confirm(`Delete enrollment for userId: ${delUserId}?`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/enrollment/${delUserId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMessage("Enrollment deleted.");
        fetchEnrollments();
      } else {
        setMessage("Error deleting enrollment.");
      }
    } catch (err) {
      setMessage("Server error.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: theme.bisque,
        padding: 0,
        margin: 0,
        position: "absolute",
        left: 0,
        top: 0
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "2rem auto",
          background: theme.secondary,
          borderRadius: 16,
          boxShadow: "0 2px 16px #0002",
          padding: 36,
          color: theme.text,
          fontFamily: "Segoe UI, Arial, sans-serif"
        }}
      >
        <Banner/>
        <Sidebar/>
        <h2 style={{ paddingTop:96,color: theme.primary, marginBottom: 24, textAlign: "center" }}>Enroll in Courses</h2>
        <form onSubmit={handleSubmit} style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 18 }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ fontWeight: 500 }}>User ID:</label>
              <input
                type="text"
                value={userId}
                onChange={e => setUserId(e.target.value)}
                required
                style={{
                  marginLeft: 10,
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: `1px solid ${theme.border}`,
                  width: "80%",
                  background: "#fff"
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ fontWeight: 500 }}>Course Code:</label>
              <input
                type="text"
                value={courseCode}
                onChange={e => setCourseCode(e.target.value)}
                style={{
                  marginLeft: 10,
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: `1px solid ${theme.border}`,
                  width: "80%",
                  background: "#fff"
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ fontWeight: 500 }}>Course Name:</label>
              <input
                type="text"
                value={courseName}
                onChange={e => setCourseName(e.target.value)}
                style={{
                  marginLeft: 10,
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: `1px solid ${theme.border}`,
                  width: "80%",
                  background: "#fff"
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ fontWeight: 500 }}>Staff Name:</label>
              <input
                type="text"
                value={staffName}
                onChange={e => setStaffName(e.target.value)}
                style={{
                  marginLeft: 10,
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: `1px solid ${theme.border}`,
                  width: "80%",
                  background: "#fff"
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 120, display: "flex", alignItems: "center" }}>
              <label style={{ fontWeight: 500, marginRight: 8 }}>Lab:</label>
              <input
                type="checkbox"
                checked={lab}
                onChange={e => setLab(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button
                onClick={handleAddCourse}
                style={{
                  background: theme.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "10px 22px",
                  fontWeight: 500,
                  cursor: "pointer",
                  marginLeft: 10,
                  marginBottom: 2
                }}
                type="button"
              >
                Add Course
              </button>
            </div>
          </div>
          {courses.length > 0 && (
            <div style={{ marginTop: 10, marginBottom: 18 }}>
              <h4 style={{ color: theme.primary }}>Courses to Enroll:</h4>
              <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 8 }}>
                <thead>
                  <tr style={{ background: theme.secondary }}>
                    <th style={{ padding: 8, borderBottom: `1px solid ${theme.border}` }}>Course Code</th>
                    <th style={{ padding: 8, borderBottom: `1px solid ${theme.border}` }}>Course Name</th>
                    <th style={{ padding: 8, borderBottom: `1px solid ${theme.border}` }}>Staff Name</th>
                    <th style={{ padding: 8, borderBottom: `1px solid ${theme.border}` }}>Lab</th>
                    <th style={{ padding: 8, borderBottom: `1px solid ${theme.border}` }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c, idx) =>
                    editIdx === idx ? (
                      <tr key={idx} style={{ background: "#f9fafc" }}>
                        <td style={{ padding: 6 }}>
                          <input
                            name="courseCode"
                            value={editCourse.courseCode}
                            onChange={handleEditChange}
                            style={{
                              padding: "4px 8px",
                              borderRadius: 4,
                              border: `1px solid ${theme.border}`,
                              width: "90%"
                            }}
                          />
                        </td>
                        <td style={{ padding: 6 }}>
                          <input
                            name="courseName"
                            value={editCourse.courseName}
                            onChange={handleEditChange}
                            style={{
                              padding: "4px 8px",
                              borderRadius: 4,
                              border: `1px solid ${theme.border}`,
                              width: "90%"
                            }}
                          />
                        </td>
                        <td style={{ padding: 6 }}>
                          <input
                            name="staffName"
                            value={editCourse.staffName}
                            onChange={handleEditChange}
                            style={{
                              padding: "4px 8px",
                              borderRadius: 4,
                              border: `1px solid ${theme.border}`,
                              width: "90%"
                            }}
                          />
                        </td>
                        <td style={{ padding: 6, textAlign: "center" }}>
                          <input
                            name="lab"
                            type="checkbox"
                            checked={!!editCourse.lab}
                            onChange={handleEditChange}
                            style={{ width: 18, height: 18 }}
                          />
                        </td>
                        <td style={{ padding: 6 }}>
                          <button
                            onClick={() => handleEditSave(idx)}
                            style={{
                              background: theme.primary,
                              color: "#fff",
                              border: "none",
                              borderRadius: 4,
                              padding: "4px 10px",
                              marginRight: 6,
                              cursor: "pointer"
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={handleEditCancel}
                            style={{
                              background: theme.danger,
                              color: "#fff",
                              border: "none",
                              borderRadius: 4,
                              padding: "4px 10px",
                              cursor: "pointer"
                            }}
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={idx}>
                        <td style={{ padding: 6 }}>{c.courseCode}</td>
                        <td style={{ padding: 6 }}>{c.courseName}</td>
                        <td style={{ padding: 6 }}>{c.staffName}</td>
                        <td style={{ padding: 6, textAlign: "center" }}>
                          {c.lab ? (
                            <span style={{ color: "#27ae60", fontWeight: 600 }}>Yes</span>
                          ) : (
                            <span style={{ color: "#e74c3c", fontWeight: 600 }}>No</span>
                          )}
                        </td>
                        <td style={{ padding: 6 }}>
                          <button
                            onClick={() => handleEditClick(idx)}
                            style={{
                              background: theme.primary,
                              color: "#fff",
                              border: "none",
                              borderRadius: 4,
                              padding: "4px 10px",
                              marginRight: 6,
                              cursor: "pointer"
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCourse(idx)}
                            style={{
                              background: theme.danger,
                              color: "#fff",
                              border: "none",
                              borderRadius: 4,
                              padding: "4px 10px",
                              cursor: "pointer"
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ textAlign: "center" }}>
            <button
              type="submit"
              style={{
                background: theme.accent,
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "10px 28px",
                fontWeight: 600,
                fontSize: 18,
                cursor: "pointer",
                marginTop: 10
              }}
            >
              Submit Enrollment
            </button>
          </div>
        </form>
        {message && (
          <div
            style={{
              marginTop: 18,
              background: "#fff",
              borderRadius: 6,
              padding: "10px 18px",
              color: message.includes("success") ? theme.primary : theme.danger,
              border: `1px solid ${theme.border}`,
              fontWeight: 500,
              textAlign: "center"
            }}
          >
            {message}
          </div>
        )}

        {/* Display all enrollments */}
        <div style={{ marginTop: 40 }}>
          <h3 style={{ color: theme.primary, textAlign: "center" }}>All Enrollments</h3>
          {allEnrollments.length === 0 ? (
            <div style={{ textAlign: "center", color: "#888" }}>No enrollments found.</div>
          ) : (
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                boxShadow: "0 1px 8px #0001",
                padding: 24,
                marginTop: 16,
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  fontSize: 16,
                  background: "#fff",
                }}
              >
                <thead>
                  <tr style={{ background: theme.secondary }}>
                    <th style={{ padding: "14px 10px", borderBottom: `2px solid ${theme.primary}`, textAlign: "left" }}>#</th>
                    <th style={{ padding: "14px 10px", borderBottom: `2px solid ${theme.primary}`, textAlign: "left" }}>User ID</th>
                    <th style={{ padding: "14px 10px", borderBottom: `2px solid ${theme.primary}`, textAlign: "left" }}>Courses Enrolled</th>
                    <th style={{ padding: "14px 10px", borderBottom: `2px solid ${theme.primary}` }}></th>
                  </tr>
                </thead>
                <tbody>
                  {allEnrollments.map((enroll, idx) => (
                    <tr
                      key={idx}
                      style={{
                        background: idx % 2 === 0 ? "#f9f9f9" : "#fff",
                        borderBottom: `1px solid ${theme.border}`,
                        verticalAlign: "top"
                      }}
                    >
                      <td style={{ padding: "12px 10px", color: "#888" }}>{idx + 1}</td>
                      <td style={{ padding: "12px 10px", fontWeight: 600, color: theme.primary }}>{enroll.userId}</td>
                      <td style={{ padding: "12px 10px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {enroll.enrolled.map((c, i) => (
                            <div
                              key={i}
                              style={{
                                background: "#f7faff",
                                border: `1px solid ${theme.border}`,
                                borderRadius: 8,
                                padding: "8px 14px",
                                marginBottom: 6,
                                minWidth: 180,
                                boxShadow: "0 1px 3px #0001"
                              }}
                            >
                              <div style={{ fontWeight: 500, color: theme.text }}>
                                <span style={{ color: theme.accent }}>{c.courseCode}</span> — {c.courseName}
                              </div>
                              <div style={{ fontSize: 14, color: "#666" }}>
                                <span style={{ fontWeight: 500 }}>Staff:</span> {c.staffName}
                              </div>
                              <div style={{ fontSize: 14, color: c.lab ? "#27ae60" : "#e74c3c", fontWeight: 600 }}>
                                Lab: {c.lab ? "Yes" : "No"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: "12px 10px", textAlign: "center" }}>
                        <button
                          style={{
                            background: theme.danger,
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            padding: "7px 18px",
                            cursor: "pointer",
                            fontWeight: 500,
                            fontSize: 15,
                            boxShadow: "0 1px 4px #0001"
                          }}
                          onClick={() => handleDelete(enroll.userId)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default EnrollmentPage;