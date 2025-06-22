import React, { useEffect, useState } from "react";
import Banner from "../../components/Banner";
import Sidebar from "../../components/Sidebar";

const FacilityTypes = ["room", "lab", "projector"];

export default function Facilities() {
  const [facilities, setFacilities] = useState([]);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("room");
  const [editIdx, setEditIdx] = useState(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("room");

  // Fetch facilities
  useEffect(() => {
    fetch("http://localhost:5000/api/facilities")
      .then(res => res.json())
      .then(setFacilities);
  }, []);

  // Add facility
  const addFacility = async () => {
    if (!newName) return;
    await fetch("http://localhost:5000/api/facilities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, type: newType }),
    });
    setNewName("");
    setNewType("room");
    fetch("http://localhost:5000/api/facilities")
      .then(res => res.json())
      .then(setFacilities);
  };

  // Start editing
  const startEdit = (idx) => {
    setEditIdx(idx);
    setEditName(facilities[idx].name);
    setEditType(facilities[idx].type);
  };

  // Save edit
  const saveEdit = async (idx) => {
    await fetch(`http://localhost:5000/api/facilities/${idx}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, type: editType }),
    });
    setEditIdx(null);
    fetch("http://localhost:5000/api/facilities")
      .then(res => res.json())
      .then(setFacilities);
  };

  // Delete facility
  const deleteFacility = async (idx) => {
    await fetch(`http://localhost:5000/api/facilities/${idx}`, {
      method: "DELETE",
    });
    fetch("http://localhost:5000/api/facilities")
      .then(res => res.json())
      .then(setFacilities);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "bisque",
        minHeight: "100vh",
        fontFamily: "Segoe UI, Arial, sans-serif",
        overflow: "auto",
        zIndex: 1,
      }}
    >
      <Banner/>
      <Sidebar/>
      <h2 style={{ paddingTop:96,textAlign: "center", color: "#7a4f01", marginTop: 32 }}>Facilities</h2>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
        <table
          style={{
            borderCollapse: "collapse",
            background: "#fff8ee",
            boxShadow: "0 2px 12px #e0c9a6",
            borderRadius: 12,
            overflow: "hidden",
            minWidth: 420,
            width: "80vw",
            maxWidth: 900,
          }}
        >
          <thead>
            <tr style={{ background: "#ffe4c4" }}>
              <th style={{ padding: 12, fontWeight: 600 }}>#</th>
              <th style={{ padding: 12, fontWeight: 600 }}>Name</th>
              <th style={{ padding: 12, fontWeight: 600 }}>Type</th>
              <th style={{ padding: 12, fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {facilities.map((f, idx) =>
              editIdx === idx ? (
                <tr key={idx} style={{ background: "#fff3e0" }}>
                  <td style={{ padding: 10 }}>{idx + 1}</td>
                  <td style={{ padding: 10 }}>
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      style={{
                        padding: 6,
                        borderRadius: 4,
                        border: "1px solid #e0c9a6",
                        width: "90%",
                      }}
                    />
                  </td>
                  <td style={{ padding: 10 }}>
                    <select
                      value={editType}
                      onChange={e => setEditType(e.target.value)}
                      style={{
                        padding: 6,
                        borderRadius: 4,
                        border: "1px solid #e0c9a6",
                        width: "90%",
                      }}
                    >
                      {FacilityTypes.map(t => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: 10 }}>
                    <button
                      onClick={() => saveEdit(idx)}
                      style={{
                        background: "#ffb74d",
                        border: "none",
                        borderRadius: 4,
                        padding: "6px 14px",
                        marginRight: 6,
                        color: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditIdx(null)}
                      style={{
                        background: "#e57373",
                        border: "none",
                        borderRadius: 4,
                        padding: "6px 14px",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={idx} style={{ background: idx % 2 ? "#fff8ee" : "#fff3e0" }}>
                  <td style={{ padding: 10 }}>{idx + 1}</td>
                  <td style={{ padding: 10 }}>{f.name}</td>
                  <td style={{ padding: 10 }}>{f.type}</td>
                  <td style={{ padding: 10 }}>
                    <button
                      onClick={() => startEdit(idx)}
                      style={{
                        background: "#81c784",
                        border: "none",
                        borderRadius: 4,
                        padding: "6px 14px",
                        marginRight: 6,
                        color: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteFacility(idx)}
                      style={{
                        background: "#e57373",
                        border: "none",
                        borderRadius: 4,
                        padding: "6px 14px",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            )}
            <tr style={{ background: "#ffe4c4" }}>
              <td style={{ padding: 10, fontWeight: 600 }}>New</td>
              <td style={{ padding: 10 }}>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  style={{
                    padding: 6,
                    borderRadius: 4,
                    border: "1px solid #e0c9a6",
                    width: "90%",
                  }}
                />
              </td>
              <td style={{ padding: 10 }}>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value)}
                  style={{
                    padding: 6,
                    borderRadius: 4,
                    border: "1px solid #e0c9a6",
                    width: "90%",
                  }}
                >
                  {FacilityTypes.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </td>
              <td style={{ padding: 10 }}>
                <button
                  onClick={addFacility}
                  style={{
                    background: "#ffb74d",
                    border: "none",
                    borderRadius: 4,
                    padding: "6px 18px",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Add
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    );
}