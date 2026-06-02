import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getBloodTypes, getDepartments } from "../../api/configuration.api.js";
import * as api from "../../api/clinicReports.api.js";

const GENDER_OPTS = [{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }, { value: "Other", label: "Other" }];
const VISIT_TYPE_OPTS = [{ value: "OPD", label: "OPD (Out-Patient)" }, { value: "IPD", label: "IPD (In-Patient)" }];
const MEDICINE_TYPE_OPTS = ["Antifungals", "Antihistamines", "Antibiotics", "Analgesics"].map(t => ({ value: t, label: t }));

// Filter helpers
const f = {
  from: { name: "from", label: "From Date", type: "date" },
  to: { name: "to", label: "To Date", type: "date" },
  limit: { name: "limit", label: "Top N", type: "number" },
  patientCode: { name: "patientCode", label: "Patient Code", type: "text", placeholder: "e.g. PAT-001" },
  doctorCode: { name: "doctorCode", label: "Doctor Code", type: "text", placeholder: "e.g. DOC-001" },
  conditionCode: { name: "conditionCode", label: "Condition Code", type: "text", placeholder: "e.g. MC-001" },
  diagnosisChartCode: { name: "diagnosisChartCode", label: "Diagnosis Chart Code", type: "text", placeholder: "e.g. DDC-001" },
  gender: { name: "gender", label: "Gender", type: "select", options: GENDER_OPTS },
  bloodType: { name: "bloodType", label: "Blood Type", type: "select", lookup: "bloodTypes" },
  department: { name: "departmentId", label: "Department", type: "select", lookup: "departments" },
  medicineType: { name: "type", label: "Medicine Type", type: "select", options: MEDICINE_TYPE_OPTS },
  visitType: { name: "type", label: "Visit Type", type: "select", options: VISIT_TYPE_OPTS },
};

const col = (key, label, fmt) => ({ key, label, fmt });

// Report catalog — each entry maps 1:1 to a required function.
const REPORTS = [
  // Patients
  {
    key: "patients", group: "Patients", label: "List of All Patients",
    filters: [f.gender, f.bloodType], run: api.reportPatients,
    columns: [col("patient_code", "Code"), col("patient_name", "Name"), col("gender", "Gender"),
      col("date_of_birth", "DOB", "date"), col("blood_type_full", "Blood Type")],
  },
  {
    key: "most-frequent-patients", group: "Patients", label: "Most Frequently Visiting Patients", //analysis: true,
    filters: [f.from, f.to, f.limit], run: api.reportMostFrequentPatients,
    columns: [col("patient_code", "Patient"), col("patient_name", "Name"), col("gender", "Gender"),
      col("visit_count", "Visits", "number")],
  },
  // Diagnoses / Conditions
  {
    key: "medical-problems", group: "Diagnoses", label: "List of Medical Problems per Patient",
    filters: [f.from, f.to, f.patientCode], run: api.reportMedicalProblems,
    columns: [col("patient_code", "Patient"), col("patient_name", "Name"), col("condition_code", "Cond. Code"),
      col("condition_name", "Condition"), col("visit_code", "Visit"), col("created_at", "Date", "date")],
  },
  {
    key: "top-conditions", group: "Diagnoses", label: "Most Commonly Medical Problems", //analysis: true,
    filters: [f.from, f.to, f.limit], run: api.reportTopConditions,
    columns: [col("condition_code", "Code"), col("condition_name", "Condition"), col("occurrences", "Occurrences", "number")],
  },
  {
    key: "diagnoses", group: "Diagnoses", label: "Diagnosis Records",
    filters: [f.from, f.to, f.conditionCode, f.patientCode], run: api.reportDiagnoses,
    columns: [col("diagnosis_chart_code", "Chart"), col("patient_code", "Patient"), col("patient_name", "Name"),
      col("condition_code", "Cond. Code"), col("condition_name", "Condition"), col("visit_code", "Visit"), col("created_at", "Date", "date")],
  },
  {
    key: "diagnoses-by-chart", group: "Diagnoses", label: "List of All Diagnosis by Chart",
    filters: [f.from, f.to, f.diagnosisChartCode], run: api.reportDiagnosesByChart,
    columns: [col("diagnosis_chart_code", "Chart"), col("patient_code", "Patient"), col("patient_name", "Name"),
      col("condition_code", "Cond. Code"), col("condition_name", "Condition"), col("visit_code", "Visit"), col("created_at", "Date", "date")],
  },
  // Medicines
  {
    key: "medicines", group: "Medicines", label: "List of All Medicines",
    filters: [f.medicineType], run: api.reportMedicines,
    columns: [col("medicine_code", "Code"), col("medicine_name", "Name"), col("generic_name", "Generic"),
      col("medicine_type", "Type"), col("unit_cost", "Unit Cost", "currency")],
  },
  {
    key: "prescriptions", group: "Medicines", label: "List of Prescriptions per Patient",
    filters: [f.from, f.to, f.patientCode], run: api.reportPrescriptions,
    columns: [col("patient_code", "Patient"), col("patient_name", "Name"), col("medicine_code", "Med. Code"),
      col("medicine_name", "Medicine"), col("medicine_type", "Type"), col("quantity", "Qty", "number"),
      col("dosage_notes", "Dosage"), col("visit_code", "Visit"), col("created_at", "Date", "date")],
  },
  {
    key: "top-medicines", group: "Medicines", label: "Most Commonly Prescribed Medicines", //analysis: true,
    filters: [f.from, f.to, f.limit], run: api.reportTopMedicines,
    columns: [col("medicine_code", "Code"), col("medicine_name", "Medicine"), col("medicine_type", "Type"),
      col("times_prescribed", "Times Prescribed", "number"), col("total_quantity", "Total Qty", "number")],
  },
  // Doctors
  {
    key: "doctors", group: "Doctors", label: "List of All Doctors",
    filters: [f.gender, f.department], run: api.reportDoctors,
    columns: [col("doctor_code", "Code"), col("doctor_name", "Name"), col("gender", "Gender"),
      col("specialty", "Specialty"), col("department_name", "Department")],
  },
  {
    key: "patients-by-doctor", group: "Doctors", label: "List of Patients Treated by a Doctor",
    filters: [f.doctorCode, f.from, f.to], requires: ["doctorCode"], run: api.reportPatientsByDoctor,
    columns: [col("patient_code", "Patient"), col("patient_name", "Name"), col("gender", "Gender"),
      col("visit_code", "Visit"), col("visit_type", "Type"), col("created_at", "Date", "date")],
  },
  {
    key: "most-appointed-doctors", group: "Doctors", label: "Most Commonly Appointed Doctors",// analysis: true,
    filters: [f.from, f.to, f.limit], run: api.reportMostAppointedDoctors,
    columns: [col("doctor_code", "Code"), col("doctor_name", "Doctor"), col("specialty", "Specialty"),
      col("appointment_count", "Appointments", "number")],
  },
  // Visits
  {
    key: "visits", group: "Visits", label: "List of All Visits",
    filters: [f.from, f.to, f.visitType, f.doctorCode], run: api.reportVisits,
    columns: [col("visit_code", "Visit"), col("visit_type", "Type"), col("created_at", "Date", "date"),
      col("patient_code", "Patient"), col("patient_name", "Name")],
  },
  {
    key: "patients-visiting", group: "Visits", label: "List of All Visited Patients",
    filters: [f.from, f.to, f.visitType], run: api.reportPatientsVisiting,
    columns: [col("patient_code", "Patient"), col("patient_name", "Name"), col("gender", "Gender"),
      col("visit_code", "Visit"), col("visit_type", "Type"), col("created_at", "Date", "date")],
  },
  {
    key: "visits-monthly", group: "Visits", label: "Amount of Each Visits Types", //analysis: true,
    filters: [f.from, f.to], run: api.reportVisitsMonthly,
    columns: [col("month", "Month"), col("opd", "OPD", "number"), col("ipd", "IPD", "number"), col("total", "Total", "number")],
  },
  // Billing
  {
    key: "print-bill", group: "Billing", label: "Print Patient Bill", type: "bill",
    filters: [{ name: "billCode", label: "Bill Code", type: "text", placeholder: "e.g. BLL-001" }], requires: ["billCode"],
  },
  {
    key: "bills", group: "Billing", label: "List of all Bills",
    filters: [f.from, f.to, f.patientCode], run: api.reportBills,
    columns: [col("bill_code", "Bill"), col("patient_code", "Patient"), col("patient_name", "Name"),
      col("visit_code", "Visit"), col("visit_type", "Type"), col("created_at", "Date", "date"),
      col("subtotal", "Subtotal", "currency"), col("tax", "Tax %"), col("total", "Total", "currency")],
  },
  {
    key: "revenue-by-charge-type", group: "Billing", label: "Revenue by each Charge Type", //analysis: true,
    filters: [f.from, f.to], run: api.reportRevenueByChargeType,
    columns: [col("charge_type", "Charge Type"), col("line_count", "Lines", "number"), col("revenue", "Revenue", "currency")],
  },
];

const GROUPS = ["Patients", "Diagnoses", "Medicines", "Doctors", "Visits", "Billing"];

function fmtCell(val, fmt) {
  if (val === null || val === undefined || val === "") return "-";
  if (fmt === "currency") return "฿" + Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (fmt === "date") return new Date(val).toLocaleDateString();
  if (fmt === "number") return Number(val).toLocaleString();
  return String(val);
}

export default function ClinicReports() {
  const navigate = useNavigate();
  const [selectedKey, setSelectedKey] = React.useState(REPORTS[0].key);
  const [values, setValues] = React.useState({});
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [hasRun, setHasRun] = React.useState(false);
  const [lookups, setLookups] = React.useState({ bloodTypes: [], departments: [] });

  const def = REPORTS.find(r => r.key === selectedKey);

  React.useEffect(() => {
    getBloodTypes().then(d => setLookups(l => ({ ...l, bloodTypes: (d || []).map(b => ({ value: b.blood_type_full, label: b.blood_type_full })) }))).catch(() => {});
    getDepartments().then(d => setLookups(l => ({ ...l, departments: (d || []).map(dep => ({ value: dep.id, label: dep.department_name })) }))).catch(() => {});
  }, []);

  const runReport = React.useCallback(async (rDef, vals) => {
    if (!rDef.run) return;
    setLoading(true); setError("");
    try {
      const data = await rDef.run(vals);
      setRows(data || []);
      setHasRun(true);
    } catch (e) {
      setError(e.message); setRows([]); setHasRun(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // When the selected report changes, reset filters to defaults and auto-run if possible.
  React.useEffect(() => {
    const defaults = {};
    (def.filters || []).forEach(flt => { defaults[flt.name] = flt.name === "limit" ? "10" : ""; });
    setValues(defaults);
    setRows([]); setError(""); setHasRun(false);
    const missingRequired = (def.requires || []).some(req => !defaults[req]);
    if (def.type !== "bill" && !missingRequired) runReport(def, defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey]);

  const setVal = (name, v) => setValues(prev => ({ ...prev, [name]: v }));
  const missingRequired = (def.requires || []).filter(req => !values[req]);

  const handleRun = () => {
    if (def.type === "bill") {
      const code = (values.billCode || "").trim();
      if (!code) { toast.error("Enter a bill code."); return; }
      navigate(`/patient-bills/${encodeURIComponent(code)}`);
      return;
    }
    if (missingRequired.length) { toast.error(`Required: ${missingRequired.join(", ")}`); return; }
    runReport(def, values);
  };

  const renderFilter = (flt) => {
    const val = values[flt.name] ?? "";
    if (flt.type === "select") {
      const opts = flt.lookup ? (lookups[flt.lookup] || []) : (flt.options || []);
      return (
        <select className="form-control" value={val} onChange={e => setVal(flt.name, e.target.value)}>
          <option value="">All</option>
          {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    }
    return (
      <input
        type={flt.type === "number" ? "number" : flt.type === "date" ? "date" : "text"}
        className="form-control"
        value={val}
        min={flt.type === "number" ? 1 : undefined}
        placeholder={flt.placeholder || ""}
        onChange={e => setVal(flt.name, e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") handleRun(); }}
      />
    );
  };

  return (
    <div>
      <div className="page-header">
        <h3 className="page-title">Reports</h3>
        {def.type !== "bill" && rows.length > 0 && (
          <button className="btn btn-outline no-print" onClick={() => window.print()}>Print</button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16, alignItems: "start" }}>
        {/* Report menu */}
        <div className="card no-print" style={{ padding: 12 }}>
          {GROUPS.map(g => (
            <div key={g} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5, color: "#94a3b8", fontWeight: 700, padding: "4px 8px" }}>{g}</div>
              {REPORTS.filter(r => r.group === g).map(r => (
                <button
                  key={r.key}
                  onClick={() => setSelectedKey(r.key)}
                  style={{
                    display: "block", width: "100%", textAlign: "left", border: "none", cursor: "pointer",
                    padding: "8px 10px", borderRadius: 6, fontSize: "0.85rem", marginBottom: 2,
                    background: selectedKey === r.key ? "#eef2ff" : "transparent",
                    color: selectedKey === r.key ? "#4f46e5" : "#334155",
                    fontWeight: selectedKey === r.key ? 600 : 400,
                  }}
                >
                  {r.analysis && <span style={{ fontSize: "0.65rem", background: "#fce7f3", color: "#be185d", padding: "1px 5px", borderRadius: 8, marginRight: 6 }}>Analysis</span>}
                  {r.label}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Filters + results */}
        <div>
          <div className="card">
            <h4 style={{ marginBottom: 12 }}>{def.label}</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }} className="no-print">
              {(def.filters || []).map(flt => (
                <div className="form-group" key={flt.name} style={{ marginBottom: 0, minWidth: flt.type === "date" ? 150 : 170 }}>
                  <label className="form-label">
                    {flt.label}{(def.requires || []).includes(flt.name) && <span style={{ color: "#ef4444" }}> *</span>}
                  </label>
                  {renderFilter(flt)}
                </div>
              ))}
              <button className="btn btn-primary" onClick={handleRun} disabled={loading}>
                {def.type === "bill" ? "Open Bill" : loading ? "Running..." : "Run Report"}
              </button>
            </div>
          </div>

          {def.type !== "bill" && (
            <div className="card">
              {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h4>Results</h4>
                <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
                  {loading ? "Loading..." : hasRun ? `${rows.length} row${rows.length === 1 ? "" : "s"}` : ""}
                </span>
              </div>
              <div className="table-container">
                <table className="modern-table">
                  <thead>
                    <tr>{def.columns.map(c => <th key={c.key} className={["currency", "number"].includes(c.fmt) ? "text-right" : ""}>{c.label}</th>)}</tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={def.columns.length} style={{ textAlign: "center", padding: 24, color: "#94a3b8" }}>Loading...</td></tr>
                    ) : rows.length === 0 ? (
                      <tr><td colSpan={def.columns.length} style={{ textAlign: "center", padding: 24, color: "#94a3b8" }}>
                        {hasRun ? "No results for the selected filters." : "Run the report to see results."}
                      </td></tr>
                    ) : rows.map((row, i) => (
                      <tr key={i}>
                        {def.columns.map(c => (
                          <td key={c.key} className={["currency", "number"].includes(c.fmt) ? "text-right" : ""}>
                            {fmtCell(row[c.key], c.fmt)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {def.type === "bill" && (
            <div className="card">
              <p style={{ color: "#64748b" }}>Enter a bill code and click <strong>Open Bill</strong> to view and print it.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
