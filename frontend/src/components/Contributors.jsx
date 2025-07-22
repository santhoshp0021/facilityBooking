import React from 'react';
import santhoshImg from '../assets/Santhosh.jpg';
import vishvaImg from '../assets/Vishva.jpg';
import hariharanImg from '../assets/Hariharan.jpg';
import kavyaImg from '../assets/Kavya.jpg';
import naveenImg from '../assets/Naveen.jpg';

const contributors = [
  {
    name: 'Santhosh P',
    rollNo: '2022103558',
    photo: santhoshImg,
  },
  {
    name: 'Vishva Pranav V',
    rollNo: '2023103068',
    photo: vishvaImg,
  },
  {
    name: 'Hariharan B',
    rollNo: '2023103704',
    photo: hariharanImg,
  },
  {
    name: 'Naveen P',
    rollNo: '2023103056',
    photo: naveenImg,
  },
  {
    name: 'Kavya P',
    rollNo: '2023103041',
    photo: kavyaImg,
  }
];

const SIDEBAR_WIDTH = 220;

const ContributorsList = ({ sidebarOpen }) => (
 <div
  className="contributors-list"
  style={{
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'stretch',
    alignItems: 'stretch',
    flexWrap: 'nowrap',
    minHeight: 'calc(100vh - 180px)',
    padding: 0,
    width: `calc(100vw - ${sidebarOpen ? SIDEBAR_WIDTH : 0}px)`,
    marginLeft: sidebarOpen ? `${SIDEBAR_WIDTH}px` : '0',
    transition: 'all 0.3s ease',
    overflowX: 'auto',
    boxSizing: 'border-box',
  }}
>
    {contributors.map((contributor) => (
      <div
        key={contributor.rollNo}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1,
          minWidth: 0,
          margin: 0,
        }}
      >
        <img
          src={contributor.photo}
          alt={contributor.name}
          style={{
            width: '80%',
            aspectRatio: '1 / 1',
            height: 'auto',
            borderRadius: '50%', 
            objectFit: 'cover',
            boxShadow: '0 4px 24px rgba(0,0,0,0.13)',
            marginBottom: '1.2rem',
            border: '4px solid #e3d9c6',
            background: '#fff',
            display: 'block',
            transition: 'width 0.3s',
            maxWidth: '200px',
            minWidth: 0,
          }}
        />
        <div style={{ fontWeight: 600, fontSize: '1.35rem', color: '#7a5c1c', textAlign: 'center' }}>
          {contributor.name}
        </div>
        <div style={{ fontSize: '1.15rem', color: '#b6894a', textAlign: 'center' }}>
          {contributor.rollNo}
        </div>
      </div>
    ))}
    <style>
      {`
        .contributors-list {
          transition: left 0.3s, width 0.3s;
        }
        @media (max-width: 900px) {
          .contributors-list {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 2rem !important;
            width: 100vw !important;
            left: 0 !important;
            padding: 0 !important;
          }
          .contributors-list > div {
            max-width: 90vw !important;
            min-width: 0 !important;
            margin: 0 auto 2rem auto !important;
          }
        }
      `}
    </style>
  </div>
);

export default ContributorsList;