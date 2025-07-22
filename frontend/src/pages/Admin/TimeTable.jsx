import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Sidebar from "../../components/Sidebar";
import Banner from "../../components/Banner";

export default function Timetable() {
  const [userId, setUserId] = useState("");
  const [users, setUsers] = useState([]);
  const [excelFile, setExcelFile] = useState(null);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/enrollment/all")
      .then(res => setUsers(res.data))
      .catch(err => console.error("Error loading users:", err));
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith(".xlsx")) {
      if (file.size <= 2 * 1024 * 1024) {
        setExcelFile(file);
      } else {
        alert("File must be less than or equal to 2MB");
        e.target.value = null;
      }
    } else {
      alert("Only .xlsx files are allowed");
      e.target.value = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId || !excelFile) {
      return alert("Please select user and upload an Excel file");
    }

    const formData = new FormData();
    formData.append("timetable", excelFile);
    formData.append("userId", userId);

    try {
      const res = await axios.post("http://localhost:5000/api/timetable/upload-timetable", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const courses = res.data.courses || [];
      setMessage("✅ Uploaded successfully. Courses: " + courses.map(c => c.courseCode).join(", "));

      setUserId("");
      setExcelFile(null);
      if (fileInputRef.current) fileInputRef.current.value = null;

      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setMessage("❌ Upload failed. Please check your file format or try again.");
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      <Banner />
      <Sidebar />
      <div
        style={{
          maxWidth: "500px",
          margin: "100px auto",
          padding: "24px",
          background: "#fff",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px", textAlign: "center" }}>
          Upload Timetable (.xlsx)
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="userId" style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}>
              Select Rep ID (user)
            </label>
            <select
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                color: "#000",
              }}
            >
              <option value="">-- Select User --</option>
              {users.map(user => (
                <option key={user.userId} value={user.userId}>
                  {user.userId}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="excel" style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}>
              Upload Timetable Excel (.xlsx)
            </label>
            <input
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              ref={fileInputRef}
              required
              style={{ width: "100%", padding: "6px", color: "#000" }}
            />
            <p style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>Max size: 2MB</p>
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              backgroundColor: "#007bff",
              color: "#fff",
              padding: "10px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Upload
          </button>

          {message && (
            <p
              style={{
                marginTop: "16px",
                textAlign: "center",
                color: message.startsWith("✅") ? "green" : "red",
                fontWeight: "500",
              }}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
