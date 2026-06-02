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
import MedicineList from "./pages/medicines/MedicineList.jsx";
import MedicinePage from "./pages/medicines/MedicinePage.jsx";
import MedicalConditionList from "./pages/medicalConditions/MedicalConditionList.jsx";
import MedicalConditionPage from "./pages/medicalConditions/MedicalConditionPage.jsx";
import TreatmentList from "./pages/treatments/TreatmentList.jsx";
import TreatmentPage from "./pages/treatments/TreatmentPage.jsx";
import FeeList from "./pages/fees/FeeList.jsx";
import FeePage from "./pages/fees/FeePage.jsx";
import DepartmentList from "./pages/departments/DepartmentList.jsx";
import DepartmentPage from "./pages/departments/DepartmentPage.jsx";
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

        {/* ── Clinical ── */}
        <div style={{ padding: "8px 16px 4px", fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Clinical</div>

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

        {/* ── Database ── */}
        <div style={{ padding: "12px 16px 4px", fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Database</div>

        <NavLink to="/medicines" className={cls}>
          <svg style={{ marginRight: 10 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"></path>
          </svg>
          Medicines
        </NavLink>

        <NavLink to="/treatments" className={cls}>
          <svg style={{ marginRight: 10 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14"></path>
          </svg>
          Treatments
        </NavLink>

        <NavLink to="/medical-conditions" className={cls}>
          <svg style={{ marginRight: 10 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          Medical Conditions
        </NavLink>

        <NavLink to="/fees" className={cls}>
          <svg style={{ marginRight: 10 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          Fees
        </NavLink>

        <NavLink to="/departments" className={cls}>
          <svg style={{ marginRight: 10 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          Departments
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

        {/* ── Patients ── */}
        <Route path="/patients"           element={<Layout><PatientList /></Layout>} />
        <Route path="/patients/new"       element={<Layout><PatientPage mode="create" /></Layout>} />
        <Route path="/patients/:code"     element={<Layout><PatientPage mode="view" /></Layout>} />
        <Route path="/patients/:code/edit" element={<Layout><PatientPage mode="edit" /></Layout>} />

        {/* ── Doctors ── */}
        <Route path="/doctors"            element={<Layout><DoctorList /></Layout>} />
        <Route path="/doctors/new"        element={<Layout><DoctorPage mode="create" /></Layout>} />
        <Route path="/doctors/:code"      element={<Layout><DoctorPage mode="view" /></Layout>} />
        <Route path="/doctors/:code/edit" element={<Layout><DoctorPage mode="edit" /></Layout>} />

        {/* ── Visits ── */}
        <Route path="/visits"             element={<Layout><VisitList /></Layout>} />
        <Route path="/visits/new"         element={<Layout><VisitPage mode="create" /></Layout>} />
        <Route path="/visits/:code"       element={<Layout><VisitPage mode="view" /></Layout>} />
        <Route path="/visits/:code/edit"  element={<Layout><VisitPage mode="edit" /></Layout>} />

        {/* ── Bills & Reports ── */}
        <Route path="/patient-bills/:code" element={<Layout><PatientBillPage /></Layout>} />
        <Route path="/reports"            element={<Layout><ClinicReports /></Layout>} />

        {/* ── Medicines ── */}
        <Route path="/medicines"              element={<Layout><MedicineList /></Layout>} />
        <Route path="/medicines/new"          element={<Layout><MedicinePage mode="create" /></Layout>} />
        <Route path="/medicines/:code"        element={<Layout><MedicinePage mode="view" /></Layout>} />
        <Route path="/medicines/:code/edit"   element={<Layout><MedicinePage mode="edit" /></Layout>} />

        {/* ── Treatments ── */}
        <Route path="/treatments"             element={<Layout><TreatmentList /></Layout>} />
        <Route path="/treatments/new"         element={<Layout><TreatmentPage mode="create" /></Layout>} />
        <Route path="/treatments/:code"       element={<Layout><TreatmentPage mode="view" /></Layout>} />
        <Route path="/treatments/:code/edit"  element={<Layout><TreatmentPage mode="edit" /></Layout>} />

        {/* ── Medical Conditions ── */}
        <Route path="/medical-conditions"             element={<Layout><MedicalConditionList /></Layout>} />
        <Route path="/medical-conditions/new"         element={<Layout><MedicalConditionPage mode="create" /></Layout>} />
        <Route path="/medical-conditions/:code"       element={<Layout><MedicalConditionPage mode="view" /></Layout>} />
        <Route path="/medical-conditions/:code/edit"  element={<Layout><MedicalConditionPage mode="edit" /></Layout>} />

        {/* ── Fees ── */}
        <Route path="/fees"               element={<Layout><FeeList /></Layout>} />
        <Route path="/fees/new"           element={<Layout><FeePage mode="create" /></Layout>} />
        <Route path="/fees/:code"         element={<Layout><FeePage mode="view" /></Layout>} />
        <Route path="/fees/:code/edit"    element={<Layout><FeePage mode="edit" /></Layout>} />

        {/* ── Departments ── */}
        <Route path="/departments"              element={<Layout><DepartmentList /></Layout>} />
        <Route path="/departments/new"          element={<Layout><DepartmentPage mode="create" /></Layout>} />
        <Route path="/departments/:code"        element={<Layout><DepartmentPage mode="view" /></Layout>} />
        <Route path="/departments/:code/edit"   element={<Layout><DepartmentPage mode="edit" /></Layout>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);