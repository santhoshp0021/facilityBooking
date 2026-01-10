import React, { useEffect, useState } from "react";
import Banner from "../../components/Banner";
import Sidebar from "../../components/Sidebar";

export default function Facilities() {
  const [facilities, setFacilities] = useState([]);
  const [facilityTypes, setFacilityTypes] = useState([]); // will be array of strings

  const [mode, setMode] = useState(""); // 'add' | 'edit' | 'delete'

  const [newFacility, setNewFacility] = useState({
    name: "",
    type: "",
    bookable: true,
  });

  const [newTypeData, setNewTypeData] = useState({
    typeName: "",
    facilityName: "",
    bookable: true,
  });

  const [editIdx, setEditIdx] = useState(null);
  const [editFacility, setEditFacility] = useState({ bookable: true });

  const [filterType, setFilterType] = useState("all");

  // FETCH FACILITIES
  const fetchFacilities = async () => {
    const res = await fetch("http://localhost:5000/api/facilities");
    const data = await res.json();
    setFacilities(data);
  };

  // FETCH FACILITY TYPES (normalize to array of strings)
  const fetchFacilityTypes = async () => {
    const res = await fetch("http://localhost:5000/api/facilityTypes");
    const raw = await res.json();
    // raw can be ["room", "lab"] or [{name:"room"}, ...]
    const names = Array.isArray(raw)
      ? raw.map((t) => (typeof t === "string" ? t : t.name))
      : [];
    setFacilityTypes(names);
  };

  useEffect(() => {
    fetchFacilities();
    fetchFacilityTypes();
  }, []);

  const filteredFacilities =
    filterType === "all"
      ? facilities
      : facilities.filter((f) => f.type === filterType);

  // ADD FACILITY (existing type)
  const addFacility = async () => {
    if (!newFacility.name || !newFacility.type) return;

    await fetch("http://localhost:5000/api/facilities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newFacility),
    });

    setNewFacility({ name: "", type: "", bookable: true });
    fetchFacilities();
  };

  // ADD NEW FACILITY TYPE + FIRST FACILITY
  const addNewFacilityType = async () => {
    if (!newTypeData.typeName || !newTypeData.facilityName) return;

    // 1. Add type (if you store types in their own collection)
    await fetch("http://localhost:5000/api/facilityTypes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTypeData.typeName }),
    });

    // 2. Add first facility under this type
    await fetch("http://localhost:5000/api/facilities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newTypeData.facilityName,
        type: newTypeData.typeName,
        bookable: newTypeData.bookable,
      }),
    });

    setNewTypeData({ typeName: "", facilityName: "", bookable: true });

    fetchFacilityTypes();
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
    <div
      style={{
        padding: 32,
        background: "#fdf6e3",
        minHeight: "100vh",
        width: "100vw",
      }}
    >
      <Banner />
      <Sidebar />

      <h2 style={{ marginTop: 100, textAlign: "center", color: "#7a4f01" }}>
        Facility Management
      </h2>

      {/* MODE BUTTONS */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 20,
          margin: 24,
        }}
      >
        <button onClick={() => setMode("add")} style={buttonStyle}>
          Add Facility
        </button>
        <button onClick={() => setMode("edit")} style={buttonStyle}>
          Edit Facility
        </button>
        <button onClick={() => setMode("delete")} style={buttonStyle}>
          Delete Facility
        </button>
      </div>

      {/* FILTER BY TYPE */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ padding: 8, borderRadius: 6 }}
        >
          <option value="all">ALL</option>
          {facilityTypes.map((t, idx) => (
            <option key={idx} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      

      {/* FACILITIES TABLE */}
      <div style={{ display: "flex", justifyContent: "center", overflowX: "auto" }}>
        <table style={{ ...tableStyle, width: "90%", maxWidth: "1200px" }}>
          <thead>
            <tr style={{ background: "#ffe4c4" }}>
              <th style={{ textAlign: "left", paddingLeft: 10 }}>#</th>
              <th style={{ textAlign: "left", paddingLeft: 10 }}>Name</th>
              <th style={{ textAlign: "left", paddingLeft: 10 }}>Type</th>
              <th style={{ textAlign: "left", paddingLeft: 10 }}>Bookable</th>
              {mode !== "add" && mode !== "" && (<th style={{ textAlign: "left", paddingLeft: 10 }}>Actions</th>)}
            </tr>
          </thead>

          <tbody>
            {filteredFacilities.map((f, idx) => (
              <tr key={f._id} style={{ background: idx % 2 ? "#fff8ee" : "#fff3e0" }}>
                <td>{idx + 1}</td>
                <td>{f.name}</td>
                <td>{f.type}</td>

                <td>
                  {mode === "edit" && editIdx === idx ? (
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={editFacility.bookable}
                        onChange={(e) =>
                          setEditFacility({ bookable: e.target.checked })
                        }
                      />
                      <span className="slider round"></span>
                    </label>
                  ) : f.bookable ? (
                    "Yes"
                  ) : (
                    "No"
                  )}
                </td>

                <td>
                  {mode === "edit" ? (
                    editIdx === idx ? (
                      <>
                        <button onClick={() => saveEdit(f._id)} style={saveBtn}>
                          Save
                        </button>
                        <button onClick={() => setEditIdx(null)} style={cancelBtn}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button onClick={() => startEdit(idx)} style={editBtn}>
                        Edit
                      </button>
                    )
                  ) : mode === "delete" ? (
                    <button
                      onClick={() => deleteFacility(f._id)}
                      style={deleteBtn}
                    >
                      Delete
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ADD MODE: TWO PARALLEL SECTIONS */}
      {mode === "add" && (
        <div style={{ padding: 20, marginBottom: 30 }}>
          <h3 style={{ textAlign: "center" }}>Add Facilities</h3>

          <div
            style={{
              display: "flex",
              gap: "20px",
              justifyContent: "center",
              alignItems: "flex-start",
              marginTop: 20,
              flexWrap: "wrap",
            }}
          >
            {/* LEFT BOX — Add Facility to Existing Type */}
            <div style={sectionBox}>
              <h4>Add Facility (Existing Type)</h4>

              <input
                placeholder="Facility Name"
                value={newFacility.name}
                onChange={(e) =>
                  setNewFacility({ ...newFacility, name: e.target.value })
                }
                style={inputStyle}
              />

              <select
                value={newFacility.type}
                onChange={(e) =>
                  setNewFacility({ ...newFacility, type: e.target.value })
                }
                style={inputStyle}
              >
                <option value="">Select Type</option>
                {facilityTypes.map((t, idx) => (
                  <option key={idx} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <div style={toggleRow}>
                <span>Bookable:</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={newFacility.bookable}
                    onChange={(e) =>
                      setNewFacility({
                        ...newFacility,
                        bookable: e.target.checked,
                      })
                    }
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              <button onClick={addFacility} style={addBtn}>
                Add Facility
              </button>
            </div>

            {/* RIGHT BOX — Add NEW Facility Type + First Facility */}
            <div style={sectionBox}>
              <h4>Add New Facility Type</h4>

              <input
                placeholder="New Type Name"
                value={newTypeData.typeName}
                onChange={(e) =>
                  setNewTypeData({
                    ...newTypeData,
                    typeName: e.target.value,
                  })
                }
                style={inputStyle}
              />

              <input
                placeholder="First Facility Name"
                value={newTypeData.facilityName}
                onChange={(e) =>
                  setNewTypeData({
                    ...newTypeData,
                    facilityName: e.target.value,
                  })
                }
                style={inputStyle}
              />

              <div style={toggleRow}>
                <span>Bookable:</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={newTypeData.bookable}
                    onChange={(e) =>
                      setNewTypeData({
                        ...newTypeData,
                        bookable: e.target.checked,
                      })
                    }
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              <button onClick={addNewFacilityType} style={addBtn}>
                Add Type + Facility
              </button>
            </div>
          </div>
        </div>
      )}
      {/* TOGGLE SWITCH CSS */}
      <style>
        {`
          .switch {
            position: relative;
            display: inline-block;
            width: 55px;
            height: 28px;
            margin-left: 8px;
          }

          .switch input {
            opacity: 0;
            width: 0;
            height: 0;
          }

          .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
            border-radius: 34px;
          }

          .slider:before {
            position: absolute;
            content: "";
            height: 22px;
            width: 22px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
          }

          input:checked + .slider {
            background-color: #4caf50;
          }

          input:checked + .slider:before {
            transform: translateX(26px);
          }
        `}
      </style>
    </div>
  );
}

/* STYLES */
const sectionBox = {
  background: "#fff8e6",
  padding: 20,
  borderRadius: 12,
  marginBottom: 20,
  boxShadow: "0 2px 10px #e6d2b0",
  minWidth: "320px",
  maxWidth: "360px",
};

const inputStyle = {
  padding: 8,
  borderRadius: 6,
  marginBottom: 10,
  width: "100%",
  border: "1px solid #ccc",
};

const toggleRow = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 4,
};

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

const saveBtn = { ...editBtn, background: "#0288d1" };
const cancelBtn = { ...editBtn, background: "#f44336" };
const deleteBtn = { ...editBtn, background: "#d32f2f" };
const addBtn = { ...editBtn, background: "#ff9800", marginTop: 12 };
