import React, { useEffect, useState } from 'react';
import Banner from '../../components/Banner';
import Sidebar from '../../components/Sidebar';

const getPeriodInfo = (periodId) => {
  // periodId format: "periodNo-dayNo" (e.g., "3-5")
  if (!periodId) return { periodNo: '', periodDay: '' };
  const [no, day] = periodId.split('-');
  const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return {
    periodNo: no || '',
    periodDay: days[parseInt(day, 10)] || ''
  };
};

const Historypage = ({ User }) => {
  const [history, setHistory] = useState([]);
  const [hallRequests, setHallRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hallReqLoading, setHallReqLoading] = useState(true);
  const [hallReqError, setHallReqError] = useState('');

  // which section is visible: 'general' or 'hall'
  const [activeTab, setActiveTab] = useState('general');

  // General filters (non-date)
  const [facilityTypeFilter, setFacilityTypeFilter] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('');
  const [facilityTypeOptions, setFacilityTypeOptions] = useState([]);
  const [facilityNameOptions, setFacilityNameOptions] = useState([]);

  // Hall filters (non-date)
  const [hallNameFilter, setHallNameFilter] = useState('');
  const [hallNameOptions, setHallNameOptions] = useState([]);

  // ------- GLOBAL DATE FILTERS (for BOTH general & hall) -------
  // 'none' | 'usage' | 'booked'
  const [activeDateFilter, setActiveDateFilter] = useState('none');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleActivateDateFilter = (type) => {
    setActiveDateFilter((prev) => {
      if (prev === type) {
        // turning off if clicked again
        setDateFrom('');
        setDateTo('');
        return 'none';
      }
      // switching to another filter → clear dates
      setDateFrom('');
      setDateTo('');
      return type;
    });
  };

  const handleDateFromChange = (value) => {
    setDateFrom(value);
    if (dateTo && value && dateTo < value) {
      alert('End date cannot be earlier than start date.');
      setDateTo('');
    }
  };

  const handleDateToChange = (value) => {
    if (dateFrom && value && value < dateFrom) {
      alert('End date cannot be earlier than start date.');
      return;
    }
    setDateTo(value);
  };

  // Helper: apply global date filter to arrays
  const applyDateFilter = (items, kind) => {
  if (activeDateFilter === 'none' || !dateFrom || !dateTo) return items;

  return items.filter((item) => {
    let rawDate;

    if (kind === 'general') {
      // General table:
      // Usage date -> item.usageDate
      // Booked date -> item.date
      rawDate =
        activeDateFilter === 'usage'
          ? item.usageDate
          : item.date;
    } else {
      // Hall table:
      // Usage date -> item.date
      // Booked date -> item.bookedAt
      rawDate =
        activeDateFilter === 'usage'
          ? item.date
          : item.bookedAt;
    }

    if (!rawDate) return false;

    const d = new Date(rawDate);
    if (Number.isNaN(d.getTime())) return false;

    let dStr;

    // ❗ IMPORTANT: use LOCAL date for GENERAL + USAGE
    if (kind === 'general' && activeDateFilter === 'usage') {
      const year = d.getFullYear();              // local year
      const month = String(d.getMonth() + 1).padStart(2, '0'); // local month
      const day = String(d.getDate()).padStart(2, '0');        // local day
      dStr = `${year}-${month}-${day}`;         // yyyy-mm-dd (LOCAL)
    } else {
      // keep existing behaviour for everything else
      dStr = d.toISOString().slice(0, 10);      // yyyy-mm-dd (UTC)
    }

    return dStr >= dateFrom && dStr <= dateTo;
  });
};

  // -------------------- GENERAL BOOKINGS FETCH (ON LOAD + TYPE/FACILITY) --------------------
  useEffect(() => {
    setLoading(true);
    setError('');

    const params = [];
    if (facilityTypeFilter) params.push(`type=${encodeURIComponent(facilityTypeFilter)}`);
    if (facilityFilter) params.push(`facilityName=${encodeURIComponent(facilityFilter)}`);

    // ❌ NO from/to here – date filter is purely frontend
    const query = params.length ? `?${params.join('&')}` : '';

    fetch(`http://localhost:5000/api/booking-history${query}`)
      .then(async (res) => {
        if (!res.ok) {
          setError('Failed to fetch booking history');
          setHistory([]);
          setLoading(false);
          return;
        }
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          setHistory(Array.isArray(data) ? data : []);
        } catch {
          setError('Invalid response from server');
          setHistory([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Could not connect to backend');
        setHistory([]);
        setLoading(false);
      });
  }, [facilityTypeFilter, facilityFilter]); // ⬅️ no date deps

  // -------------------- HALL BOOKINGS FETCH (ON LOAD + HALL NAME) --------------------
  useEffect(() => {
    setHallReqLoading(true);
    setHallReqError('');

    const params = [];
    if (hallNameFilter) params.push(`hallName=${encodeURIComponent(hallNameFilter)}`);
    // ❌ NO from/to here – date filter is purely frontend
    const query = params.length ? `?${params.join('&')}` : '';

    fetch(`http://localhost:5000/api/hall-requests/filter${query}`)
      .then(async (res) => {
        if (!res.ok) {
          setHallReqError('Failed to fetch hall bookings');
          setHallRequests([]);
          setHallReqLoading(false);
          return;
        }
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          setHallRequests(Array.isArray(data) ? data : []);
        } catch {
          setHallReqError('Invalid response from server');
          setHallRequests([]);
        }
        setHallReqLoading(false);
      })
      .catch(() => {
        setHallReqError('Could not connect to backend');
        setHallRequests([]);
        setHallReqLoading(false);
      });
  }, [hallNameFilter]); // ⬅️ no date deps

  // -------------------- FACILITY TYPES (for general type filter) --------------------
  useEffect(() => {
    fetch('http://localhost:5000/api/facilityTypes')
      .then((res) => res.json())
      .then((raw) => {
        const names = Array.isArray(raw)
          ? raw.map((t) => (typeof t === 'string' ? t : t.name))
          : [];
        const filtered = names.filter((n) => n && n.toLowerCase() !== 'hall');
        setFacilityTypeOptions(filtered);
      })
      .catch(() => setFacilityTypeOptions([]));
  }, []);

  // When general type filter changes, fetch facility names for that type
  useEffect(() => {
    setFacilityFilter('');
    setFacilityNameOptions([]);
    if (!facilityTypeFilter) return;

    fetch(`http://localhost:5000/api/facilities?type=${encodeURIComponent(facilityTypeFilter)}`)
      .then((res) => res.json())
      .then((raw) => {
        const names = Array.isArray(raw) ? raw.map((f) => f.name).filter(Boolean) : [];
        setFacilityNameOptions(names);
      })
      .catch(() => setFacilityNameOptions([]));
  }, [facilityTypeFilter]);

  // -------------------- HALL NAMES (for hall dropdown) --------------------
  useEffect(() => {
    fetch('http://localhost:5000/api/facilities')
      .then((res) => res.json())
      .then((raw) => {
        const names = Array.isArray(raw)
          ? [
              ...new Set(
                raw
                  .filter((f) => f.type === 'hall')
                  .map((f) => f.name)
                  .filter(Boolean)
              ),
            ]
          : [];
        setHallNameOptions(names);
      })
      .catch(() => setHallNameOptions([]));
  }, []);

  // -------------------- CSV DOWNLOADS (use filtered arrays) --------------------
  const handleDownload = (dataToDownload) => {
    const header = [
      'User',
      'Period ID',
      'Period Day',
      'Period No',
      'Facility Name',
      'Facility Type',
      'Booked/Free',
      'Usage Date',
      'Date'
    ];

    const rows = dataToDownload.map((rec) => {
      const { periodNo, periodDay } = getPeriodInfo(rec.periodId);

      const usageDateFormatted = rec.usageDate
        ? new Date(rec.usageDate).toLocaleDateString('en-GB')
        : '';

      const dateFormatted = rec.date ? new Date(rec.date).toLocaleString() : '';

      return [
        rec.userId?.userId || rec.userId || '',
        rec.periodId,
        periodDay,
        periodNo,
        rec.facility?.name || '',
        rec.facility?.type || '',
        rec.facility?.free === false ? 'Booked' : 'Freed',
        usageDateFormatted,
        dateFormatted
      ].join(',');
    });

    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'booking_history.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadHallRequests = (dataToDownload) => {
    const header = ['User', 'Hall Name', 'Date', 'Start Time', 'End Time', 'Status', 'Booked At'];
    const rows = dataToDownload.map((req) =>
      [
        req.userId,
        req.hallName,
        req.date,
        req.startTime,
        req.endTime,
        req.status,
        req.bookedAt ? new Date(req.bookedAt).toLocaleString() : ''
      ].join(',')
    );
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hall_bookings.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // -------------------- APPLY DATE FILTERS TO DATA --------------------
  const filteredHistory = applyDateFilter(history, 'general');
  const filteredHallRequests = applyDateFilter(hallRequests, 'hall');

  // -------------------- RENDER --------------------
  return (
    <div
      style={{
        paddingTop: 96,
        minHeight: '100vh',
        minWidth: '100vw',
        background: 'linear-gradient(135deg, #f5f5dc 0%, #e3d9c6 100%)',
        fontFamily: 'Segoe UI, Arial, sans-serif',
        padding: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <Banner />
      <Sidebar />

      {/* TAB BUTTONS */}
      <div style={{ marginTop: 110, marginBottom: 10, display: 'flex', gap: 16 }}>
        <button
          onClick={() => setActiveTab('general')}
          style={{
            padding: '8px 18px',
            borderRadius: 8,
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'general' ? '#b6894a' : '#e3d9c6',
            color: activeTab === 'general' ? '#fff' : '#5a4520'
          }}
        >
          General Bookings
        </button>
        <button
          onClick={() => setActiveTab('hall')}
          style={{
            padding: '8px 18px',
            borderRadius: 8,
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'hall' ? '#b6894a' : '#e3d9c6',
            color: activeTab === 'hall' ? '#fff' : '#5a4520'
          }}
        >
          Hall Bookings
        </button>
      </div>

      {/* GLOBAL DATE FILTERS (shared by BOTH tabs) */}
      <div
        style={{
          marginBottom: 18,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}
      >
        <span style={{ fontWeight: 600, color: '#5a4520' }}>Date Filter:&nbsp;</span>

        <button
          type='button'
          onClick={() => handleActivateDateFilter('usage')}
          style={{
            padding: '0.4rem 0.9rem',
            borderRadius: 6,
            border: 'none',
            background: activeDateFilter === 'usage' ? '#7a5c1c' : '#d1c4a3',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Usage Date
        </button>

        <button
          type='button'
          onClick={() => handleActivateDateFilter('booked')}
          style={{
            padding: '0.4rem 0.9rem',
            borderRadius: 6,
            border: 'none',
            background: activeDateFilter === 'booked' ? '#7a5c1c' : '#d1c4a3',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Booked Date
        </button>

        {activeDateFilter !== 'none' && (
          <>
            <label>Start:&nbsp;</label>
            <input
              type='date'
              value={dateFrom}
              onChange={(e) => handleDateFromChange(e.target.value)}
              style={{
                padding: '0.4rem',
                borderRadius: 6,
                border: '1px solid #e3d9c6',
                fontSize: '1rem'
              }}
            />
            <label>End:&nbsp;</label>
            <input
              type='date'
              value={dateTo}
              onChange={(e) => handleDateToChange(e.target.value)}
              style={{
                padding: '0.4rem',
                borderRadius: 6,
                border: '1px solid #e3d9c6',
                fontSize: '1rem'
              }}
            />
            <button
              type='button'
              onClick={() => {
                setActiveDateFilter('none');
                setDateFrom('');
                setDateTo('');
              }}
              style={{
                padding: '0.4rem 0.9rem',
                borderRadius: 6,
                border: 'none',
                background: '#b0a080',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          </>
        )}
      </div>

      {/* ================= GENERAL BOOKINGS ================= */}
      {activeTab === 'general' && (
        <>
          <h2
            style={{
              color: '#7a5c1c',
              fontSize: '2rem',
              margin: '1rem 0 1.5rem 0',
              letterSpacing: 1
            }}
          >
            Booking History
          </h2>

          {/* Filters: type + facility (non-date) */}
          <div
            style={{
              marginBottom: 18,
              display: 'flex',
              gap: 16,
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}
          >
            <select
              value={facilityTypeFilter}
              onChange={(e) => {
                setFacilityTypeFilter(e.target.value);
                setFacilityFilter('');
              }}
              style={{
                padding: '0.5rem',
                borderRadius: 6,
                border: '1px solid #e3d9c6',
                fontSize: '1rem',
                minWidth: 180
              }}
            >
              <option value=''>Filter by Type</option>
              {facilityTypeOptions.map((t, idx) => (
                <option key={idx} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              value={facilityFilter}
              onChange={(e) => setFacilityFilter(e.target.value)}
              disabled={!facilityTypeFilter}
              style={{
                padding: '0.5rem',
                borderRadius: 6,
                border: '1px solid #e3d9c6',
                fontSize: '1rem',
                minWidth: 200,
                backgroundColor: facilityTypeFilter ? '#fff' : '#f0ede3'
              }}
            >
              <option value=''>Filter by Facility Name</option>
              {facilityNameOptions.map((name, idx) => (
                <option key={idx} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 4px 16px rgba(182,137,74,0.10)',
              padding: 24,
              width: '100%',
              maxWidth: 1100,
              marginBottom: 40
            }}
          >
            {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
            {loading && <div>Loading...</div>}
            {!loading && !error && filteredHistory.length === 0 && (
              <div>No booking history found.</div>
            )}
            {!loading && !error && filteredHistory.length > 0 && (
              <>
                <button
                  style={{
                    background: '#388e3c',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '0.6rem 1.4rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '1rem',
                    marginBottom: 18
                  }}
                  onClick={() => handleDownload(filteredHistory)}
                >
                  Download Table
                </button>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '1rem'
                  }}
                >
                  <thead>
                    <tr style={{ background: '#e3d9c6' }}>
                      <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>User</th>
                      <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Period No</th>
                      <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Facility Name</th>
                      <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Facility Type</th>
                      <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Usage Date</th>
                      <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Booked/Free</th>
                      <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((rec, idx) => {
                      const { periodNo } = getPeriodInfo(rec.periodId);

                      const usageDateFormatted = rec.usageDate
                        ? new Date(rec.usageDate).toLocaleDateString('en-GB')
                        : '';

                      const dateFormatted = rec.date
                        ? new Date(rec.date).toLocaleString()
                        : '';

                      return (
                        <tr key={rec._id || idx} style={{ background: '#fffbe6' }}>
                          <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>
                            {rec.userId?.userId || rec.userId || ''}
                          </td>
                          <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{periodNo}</td>
                          <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>
                            {rec.facility?.name || ''}
                          </td>
                          <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>
                            {rec.facility?.type || ''}
                          </td>
                          <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>
                            {usageDateFormatted}
                          </td>
                          <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>
                            {rec.facility?.free === false ? 'Booked' : 'Freed'}
                          </td>
                          <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>
                            {dateFormatted}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </>
      )}

      {/* ================= HALL BOOKINGS ================= */}
      {activeTab === 'hall' && (
        <>
          <h2
            style={{
              color: '#7a5c1c',
              fontSize: '2rem',
              margin: '1rem 0 1.5rem 0',
              letterSpacing: 1
            }}
          >
            Hall Bookings
          </h2>

          {/* Hall Filters: hall name (non-date) */}
          <div
            style={{
              marginBottom: 18,
              display: 'flex',
              gap: 16,
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}
          >
            <select
              value={hallNameFilter}
              onChange={(e) => setHallNameFilter(e.target.value)}
              style={{
                padding: '0.5rem',
                borderRadius: 6,
                border: '1px solid #e3d9c6',
                fontSize: '1rem',
                minWidth: 200
              }}
            >
              <option value=''>Filter by Hall Name</option>
              {hallNameOptions.map((name, idx) => (
                <option key={idx} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 4px 16px rgba(182,137,74,0.10)',
              padding: 24,
              width: '100%',
              maxWidth: 1100
            }}
          >
            {hallReqError && (
              <div style={{ color: 'red', marginBottom: 16 }}>{hallReqError}</div>
            )}
            {hallReqLoading && <div>Loading...</div>}
            {!hallReqLoading && !hallReqError && filteredHallRequests.length === 0 && (
              <div>No hall bookings found.</div>
            )}
            {!hallReqLoading && !hallReqError && filteredHallRequests.length > 0 && (
              <>
                <button
                  style={{
                    background: '#388e3c',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '0.6rem 1.4rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '1rem',
                    marginBottom: 18
                  }}
                  onClick={() => handleDownloadHallRequests(filteredHallRequests)}
                >
                  Download Table
                </button>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '1rem'
                  }}
                >
                  <thead>
                    <tr style={{ background: '#e3d9c6' }}>
                      <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>User</th>
                      <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Hall Name</th>
                      <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Date</th>
                      <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Start Time</th>
                      <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>End Time</th>
                      <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Status</th>
                      <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Booked At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHallRequests.map((req, idx) => (
                      <tr key={req._id || idx} style={{ background: '#fffbe6' }}>
                        <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{req.userId}</td>
                        <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>
                          {req.hallName}
                        </td>
                        <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{req.date}</td>
                        <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>
                          {req.startTime}
                        </td>
                        <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{req.endTime}</td>
                        <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{req.status}</td>
                        <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>
                          {req.bookedAt ? new Date(req.bookedAt).toLocaleString() : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Historypage;
