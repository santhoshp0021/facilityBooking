import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Banner from "../components/Banner";

const storedUser = localStorage.getItem("user");
const user = storedUser ? JSON.parse(storedUser) : null;

const timeSlots = [
  "Period 1",
  "Period 2",
  "Period 3",
  "Period 4",
  "Period 5",
  "Period 6",
  "Period 7",
  "Period 8",
];

const PeriodwiseBooking = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [bookedRoom, setBookedRoom] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(false);

  useEffect(() => {
    const today = new Date();
    const dates = [];
    for (let i = 0; i < 15; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const day = date.getDay();
      if (day !== 0 && day !== 6) {
        dates.push(date.toISOString().split("T")[0]);
      }
    }
    setAvailableDates(dates);
  }, []);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedSlotIndex(null);
    setAvailableRooms([]);
    setBookedRoom("");
  };

  const handleSlotClick = async (index) => {
    setSelectedSlotIndex(index);
    setBookedRoom("");
    setAvailableRooms([]);
    setLoadingRooms(true);

    try {
      const response = await fetch(
        `/api/faculty/facilities/available?date=${selectedDate}&slot=${index}&userId=${user.userId}`
      );
      if (!response.ok) throw new Error("Failed to fetch available rooms");
      const data = await response.json();
      setAvailableRooms(data);
    } catch (error) {
      console.error("Error fetching available rooms:", error);
      alert("Could not load available facilities. Please try again.");
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleRoomBooking = async (roomName, type) => {
    const payload = {
      date: selectedDate,
      slot: selectedSlotIndex,
      facility: roomName,
      type: type,
      userId: user.userId,
    };

    try {
      const response = await fetch("/api/faculty/facilities/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Booking failed");
      await response.json();
      setBookedRoom(roomName);
      alert(`Room ${roomName} successfully booked for ${selectedDate} - ${timeSlots[selectedSlotIndex]}`);
      window.location.reload();
      // Update room's `free` flag to false to hide the button
      setAvailableRooms((prevRooms) =>
        prevRooms.map((room) =>
          room.name === roomName ? { ...room, free: false } : room
        )
      );
    } catch (err) {
      console.error("Booking error:", err);
      alert("Booking failed. Try again.");
    }
  };

  const containerStyle = {
    padding: "24px",
    width: "100%",
    margin: "0 auto",
    backgroundColor: "white",
    borderRadius: "10px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
    fontFamily: "Arial, sans-serif",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "8px",
    fontWeight: "bold",
  };

  const selectStyle = {
    width: "100%",
    padding: "10px",
    marginBottom: "16px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    fontSize: "16px",
  };

  const slotButtonStyle = (selected) => ({
    padding: "10px",
    borderRadius: "5px",
    fontSize: "14px",
    backgroundColor: selected ? "#2563eb" : "#f0f0f0",
    color: selected ? "white" : "black",
    border: "none",
    cursor: "pointer",
    marginBottom: "10px",
    width: "100%",
    textAlign: "left",
  });

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "20px",
  };

  return (
    <div style={containerStyle}>
      <Sidebar />
      <Banner />
      <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "16px", paddingTop: 96 }}>
        Faculty Booking
      </h2>

      <label style={labelStyle}>Select Date:</label>
      <select style={selectStyle} value={selectedDate} onChange={handleDateChange}>
        <option value="">-- Select a Weekday --</option>
        {availableDates.map((date) => (
          <option key={date} value={date}>
            {new Date(date).toDateString()}
          </option>
        ))}
      </select>

      {selectedDate && (
        <div>
          <p style={labelStyle}>Choose a Time Slot:</p>
          <div style={gridStyle}>
            {timeSlots.map((slot, index) => (
              <button
                key={index}
                onClick={() => handleSlotClick(index)}
                style={slotButtonStyle(selectedSlotIndex === index)}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedSlotIndex !== null && (
        <div>
          <p style={labelStyle}>Available Facilities:</p>
          {loadingRooms ? (
            <p>Loading available rooms...</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {availableRooms.length > 0 ? (
                <>
                  {["room", "lab", "projector"].map((type) => {
                    const filtered = availableRooms.filter((f) => f.type === type);
                    if (filtered.length === 0) return null;
                    return (
                      <div key={type} style={{ marginBottom: "24px", width: "100%" }}>
                        <h4 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}s
                        </h4>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                          {filtered.map((room) => {
                            const isBooked = !room.free;
                            const isSelected = bookedRoom === room.name;

                            const facilityStyle = {
                              padding: "10px 16px",
                              borderRadius: "5px",
                              border: "1px solid #ccc",
                              backgroundColor: isBooked
                                ? "#dc2626"
                                : isSelected
                                ? "#16a34a"
                                : "#2563eb",
                              color: "white",
                              cursor: isBooked ? "not-allowed" : "pointer",
                              minWidth: "150px",
                            };

                            return (
                              <div key={room.name} style={facilityStyle}>
                                <div style={{ marginBottom: "5px" }}>
                                  <strong>{room.name}</strong>
                                  <br />
                                  <span style={{ fontSize: "12px" }}>({room.type})</span>
                                </div>
                                {!isBooked && (
                                  <button
                                    onClick={() => handleRoomBooking(room.name, type)}
                                    style={{
                                      marginTop: "4px",
                                      backgroundColor: "white",
                                      color: "#2563eb",
                                      padding: "4px 10px",
                                      borderRadius: "4px",
                                      border: "none",
                                      fontWeight: "bold",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Book
                                  </button>
                                )}
                                {isBooked && <div style={{ fontSize: "12px" }}>Booked</div>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <p>No rooms available for this slot.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PeriodwiseBooking;