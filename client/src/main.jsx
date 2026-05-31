import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PatientList from "./pages/patients/PatientList.jsx";
import PatientPage from "./pages/patients/PatientPage.jsx";
import DoctorList from "./pages/doctors/DoctorList.jsx";
import DoctorPage from "./pages/doctors/DoctorPage.jsx";
import VisitList from "./pages/visits/VisitList.jsx";
import VisitPage from "./pages/visits/VisitPage.jsx";
import PatientBillPage from "./pages/patientBills/PatientBillPage.jsx";
import ClinicReports from "./pages/reports/ClinicReports.jsx";
import "./index.css";

function Sidebar() {
  const cls = ({ isActive }) => isActive ? "nav-item active" : "nav-item";
  return (
    <aside className="sidebar no-print">
      <div className="sidebar-header">
        <div className="brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
          </svg>
          ClinicDoc v1
        </div>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/patients" className={cls}>
          <svg style={{ marginRight: 10 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle>
          </svg>
          Patients
        </NavLink>
        <NavLink to="/doctors" className={cls}>
          <svg style={{ marginRight: 10 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4"></circle><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"></path>
          </svg>
          Doctors
        </NavLink>
        <NavLink to="/visits" className={cls}>
          <svg style={{ marginRight: 10 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          Visits
        </NavLink>
        <NavLink to="/reports" className={cls}>
          <svg style={{ marginRight: 10 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18"></path><rect x="7" y="10" width="3" height="7"></rect><rect x="12" y="6" width="3" height="11"></rect><rect x="17" y="13" width="3" height="4"></rect>
          </svg>
          Reports
        </NavLink>
      </nav>
    </aside>
  );
}

function Layout({ children }) {
  return (
    <div className="layout-container">
      <ToastContainer position="bottom-right" autoClose={4000} hideProgressBar={false} theme="light" />
      <div className="top-banner no-print">
        Clinic Management System — CPE241 Database Systems Project
      </div>
      <div className="app-layout">
        <Sidebar />
        <main className="main-wrapper">{children}</main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/patients" replace />} />
        <Route path="/patients" element={<Layout><PatientList /></Layout>} />
        <Route path="/patients/new" element={<Layout><PatientPage mode="create" /></Layout>} />
        <Route path="/patients/:code" element={<Layout><PatientPage mode="view" /></Layout>} />
        <Route path="/patients/:code/edit" element={<Layout><PatientPage mode="edit" /></Layout>} />
        <Route path="/doctors" element={<Layout><DoctorList /></Layout>} />
        <Route path="/doctors/new" element={<Layout><DoctorPage mode="create" /></Layout>} />
        <Route path="/doctors/:code" element={<Layout><DoctorPage mode="view" /></Layout>} />
        <Route path="/doctors/:code/edit" element={<Layout><DoctorPage mode="edit" /></Layout>} />
        <Route path="/visits" element={<Layout><VisitList /></Layout>} />
        <Route path="/visits/new" element={<Layout><VisitPage mode="create" /></Layout>} />
        <Route path="/visits/:code" element={<Layout><VisitPage mode="view" /></Layout>} />
        <Route path="/visits/:code/edit" element={<Layout><VisitPage mode="edit" /></Layout>} />
        <Route path="/patient-bills/:code" element={<Layout><PatientBillPage /></Layout>} />
        <Route path="/reports" element={<Layout><ClinicReports /></Layout>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
