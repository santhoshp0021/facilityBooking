import React from "react";

export default function OfficeAutomation() {
  const links = [
    { name: "Student OD Request and Approval", href: "http://10.5.12.1:81" },
    { name: "Student Achievement Repository", href: "http://10.5.12.1:92" },
    { name: "Faculty OD Request and Approval", href: "http://10.5.10.23:83" },
    { name: "Events", href: "http://10.5.12.1:84" },
    { name: "FacilityBooking", href: "http://10.5.12.1:85" },
    { name: "Timetable and Workload", href: "http://10.5.14.94:98" },
    { name: "Student Course Feedback and Grievances", href: "http://10.5.14.94:97" },
    { name: "Project Review", href: "http://10.5.14.94:88" },
    { name: "PG Examinations", href: "http://10.5.14.94:86" },
    { name: "Claim Bills 2-5 Lakhs", href: "http://10.5.14.94:89" },
    { name: "Claim Bills above 5 Lakhs", href: "http://10.5.14.94:90" },
    { name: "Claim Bills Direct Purchase Portal", href: "http://10.5.14.94:91" },
  ];

  return (
    <div className="oa-wrapper">
      <style>{`
        .oa-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f9fafb;
          font-family: Arial, sans-serif;
        }
        .oa-card {
          width: 100%;
          max-width: 700px;
          background: #fff;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }
        .oa-title {
          margin: 0 0 24px 0;
          font-size: 28px;
          text-align: center;
          font-weight: bold;
          color: #1f2937;
        }
        .oa-links {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .oa-links li {
          background: #f3f4f6;
          border-radius: 8px;
          text-align: center;
          padding: 12px;
          transition: background 0.2s;
        }
        .oa-links li:hover {
          background: #e5e7eb;
        }
        .oa-links a {
          text-decoration: none;
          color: #111827;
          font-weight: 600;
        }
      `}</style>

      <div className="oa-card">
        <h1 className="oa-title">DCSE OFFICE AUTOMATION</h1>
        <ul className="oa-links">
          {links.map((link, idx) => (
            <li key={idx}>
              <a href={link.href} target="_blank" rel="noopener noreferrer">
                {link.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

