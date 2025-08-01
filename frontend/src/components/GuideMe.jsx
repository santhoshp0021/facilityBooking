import React from "react";

export default function GuideMe() {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const handleDownload = () => {
    if (!user || !user.role) return;

    let fileName = "";
    let downloadName = "";

    switch (user.role) {
      case "admin":
        fileName = "/admin guide.pdf";
        downloadName = "facilityBooking_repository_guide_me_page_Admin.pdf";
        break;
      case "faculty":
        fileName = "/faculty guide.pdf";
        downloadName = "facilityBooking_repository_guide_me_page_Faculty.pdf";
        break;
      case "csea_member":
        fileName = "/csea_member guide.pdf";
        downloadName = "facilityBooking_repository_guide_me_page_CSEA.pdf";
        break;
      case "student_rep":
        fileName = "/student_rep guide.pdf";
        downloadName = "facilityBooking_repository_guide_me_page_StudentRep.pdf";
        break;
      default:
        return;
    }

    const link = document.createElement("a");
    link.href = fileName;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <button
        onClick={handleDownload}
        id="guide-button"
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          backgroundColor: "#d97706", // amber-600
          color: "white",
          fontWeight: "bold",
          fontSize: "18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.25)",
          cursor: "pointer",
          border: "none",
          transition: "background-color 0.2s ease"
        }}
        onMouseOver={(e) => (e.target.style.backgroundColor = "#f59e0b")} // amber-400
        onMouseOut={(e) => (e.target.style.backgroundColor = "#d97706")}
        title="Download User Guide"
      >
        ?
      </button>
    </div>
  );
}
