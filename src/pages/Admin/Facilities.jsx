import React, { useEffect, useState } from "react";
import Banner from "../../components/Banner";
import Sidebar from "../../components/Sidebar";

const FacilityTypes = ["room", "lab", "projector", "hall"];

export default function Facilities() {
  const [facilities, setFacilities] = useState([]);
  const [mode, setMode] = useState(""); // 'add', 'edit', 'delete'
  const [newFacility, setNewFacility] = useState({ name: "", type: "room", bookable: true });
  const [editIdx, setEditIdx] = useState(null);
  const [editFacility, setEditFacility] = useState({ bookable: true });

  const fetchFacilities = async () => {
    const res = await fetch("http://localhost:5000/api/Facilities");
    const data = await res.json();
    setFacilities(data);
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const addFacility = async () => {
    if (!newFacility.name) return;
    await fetch("http://localhost:5000/api/facilities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newFacility),
    });
    setNewFacility({ name: "", type: "room", bookable: true });
    fetchFacilities();
  };

  const startEdit = (idx) => {
    setEditIdx(idx);
    setEditFacility({ bookable: facilities[idx].bookable });
  };

  const saveEdit = async (id) => {
    await fetch(`http://localhost:5000/api/facilities/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookable: editFacility.bookable }),
    });
    setEditIdx(null);
    fetchFacilities();
  };

  const deleteFacility = async (id) => {
    await fetch(`http://localhost:5000/api/facilities/${id}`, {
      method: "DELETE",
    });
    fetchFacilities();
  };

  return (
    <div style={{ padding: 32, background: "#fdf6e3", minHeight: "100vh", width: "100vw" }}>
      <Banner />
      <Sidebar />
      <h2 style={{ marginTop: 100, textAlign: "center", color: "#7a4f01" }}>Facility Management</h2>

      <div style={{ display: "flex", justifyContent: "center", gap: 20, margin: 24 }}>
        <button onClick={() => setMode("add")} style={buttonStyle}>Add Facility</button>
        <button onClick={() => setMode("edit")} style={buttonStyle}>Edit Facility</button>
        <button onClick={() => setMode("delete")} style={buttonStyle}>Delete Facility</button>
      </div>

      {mode && (
        <div style={{ display: "flex", justifyContent: "center", overflowX: "auto" }}>
          <table style={{ ...tableStyle, width: "90%", maxWidth: "1200px" }}>
            <thead>
              <tr style={{ background: "#ffe4c4" }}>
                <th>#</th>
                <th>Name</th>
                <th>Type</th>
                <th>Bookable</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mode !== "add" && facilities.map((f, idx) => (
                <tr key={f._id} style={{ background: idx % 2 ? "#fff8ee" : "#fff3e0" }}>
                  <td>{idx + 1}</td>
                  <td>{f.name}</td>
                  <td>{f.type}</td>
                  <td>
                    {mode === "edit" && editIdx === idx ? (
                      <input
                        type="checkbox"
                        checked={editFacility.bookable}
                        onChange={(e) => setEditFacility({ bookable: e.target.checked })}
                      />
                    ) : (
                      f.bookable ? "Yes" : "No"
                    )}
                  </td>
                  <td>
                    {mode === "edit" ? (
                      editIdx === idx ? (
                        <>
                          <button onClick={() => saveEdit(f._id)} style={saveBtn}>Save</button>
                          <button onClick={() => setEditIdx(null)} style={cancelBtn}>Cancel</button>
                        </>
                      ) : (
                        <button onClick={() => startEdit(idx)} style={editBtn}>Edit</button>
                      )
                    ) : mode === "delete" ? (
                      <button onClick={() => deleteFacility(f._id)} style={deleteBtn}>Delete</button>
                    ) : null}
                  </td>
                </tr>
              ))}

              {mode === "add" && (
                <tr style={{ background: "#ffe4c4" }}>
                  <td>New</td>
                  <td>
                    <input
                      value={newFacility.name}
                      onChange={(e) => setNewFacility({ ...newFacility, name: e.target.value })}
                    />
                  </td>
                  <td>
                    <select
                      value={newFacility.type}
                      onChange={(e) => setNewFacility({ ...newFacility, type: e.target.value })}
                    >
                      {FacilityTypes.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={newFacility.bookable}
                      onChange={(e) => setNewFacility({ ...newFacility, bookable: e.target.checked })}
                    />
                  </td>
                  <td>
                    <button onClick={addFacility} style={addBtn}>Add</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const tableStyle = {
  borderCollapse: "collapse",
  background: "#fff",
  borderRadius: 12,
  overflow: "hidden",
  boxShadow: "0 2px 12px #e0c9a6",
};

const buttonStyle = {
  padding: "10px 20px",
  background: "#ffb74d",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
};

const editBtn = {
  background: "#4caf50",
  color: "#fff",
  padding: "6px 12px",
  marginRight: 6,
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
};

const saveBtn = {
  ...editBtn,
  background: "#0288d1",
};

const cancelBtn = {
  ...editBtn,
  background: "#f44336",
};

const deleteBtn = {
  ...editBtn,
  background: "#d32f2f",
};

const addBtn = {
  ...editBtn,
  background: "#ff9800",
};
