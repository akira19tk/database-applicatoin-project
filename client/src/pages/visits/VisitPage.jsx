import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getVisit, createVisit, updateVisit, getAppointedDoctor, saveAppointedDoctor,
  getPrescriptionChart, savePrescriptionChart, getTreatmentChart, saveTreatmentChart,
  getDiagnosisChart, saveDiagnosisChart } from "../../api/visits.api.js";
import { listPatients } from "../../api/patients.api.js";
import { getAllDoctors, getMedicines, getTreatments, getConditions } from "../../api/configuration.api.js";
import { createBillForVisit, getBillByVisit } from "../../api/patientBills.api.js";

const TABS = ["Info", "Doctors", "Prescription", "Treatment", "Diagnosis", "Bill"];

export default function VisitPage({ mode }) {
  const { code } = useParams();
  const navigate = useNavigate();
  const isCreate = mode === "create";
  const isView = mode === "view";
  const [tab, setTab] = React.useState(0);
  const [visit, setVisit] = React.useState(null);
  const [form, setForm] = React.useState({ patient_code: "", visit_type: "OPD", reported_symptoms: "", blood_pressure: "", height: "", weight: "", temperature: "" });
  const [patients, setPatients] = React.useState([]);
  const [allDoctors, setAllDoctors] = React.useState([]);
  const [medicines, setMedicines] = React.useState([]);
  const [treatments, setTreatments] = React.useState([]);
  const [conditions, setConditions] = React.useState([]);
  const [appointedLines, setAppointedLines] = React.useState([]);
  const [rxLines, setRxLines] = React.useState([]);
  const [txLines, setTxLines] = React.useState([]);
  const [dxLines, setDxLines] = React.useState([]);
  const [loading, setLoading] = React.useState(!isCreate);
  const [saving, setSaving] = React.useState(false);
  const [existingBillCode, setExistingBillCode] = React.useState(null);

  React.useEffect(() => {
    if (!isCreate) {
      getVisit(code).then(v => {
        setVisit(v);
        setForm({ patient_code: v.patient_code, visit_type: v.visit_type, reported_symptoms: v.reported_symptoms||"",
          blood_pressure: v.blood_pressure||"", height: v.height||"", weight: v.weight||"", temperature: v.temperature||"" });
        setLoading(false);
      }).catch(() => { toast.error("Visit not found"); navigate("/visits"); });
      getAppointedDoctor(code).then(d => setAppointedLines(d?.lines || [])).catch(() => {});
      getPrescriptionChart(code).then(d => setRxLines(d?.lines || [])).catch(() => {});
      getTreatmentChart(code).then(d => setTxLines(d?.lines || [])).catch(() => {});
      getDiagnosisChart(code).then(d => setDxLines(d?.lines || [])).catch(() => {});
      getBillByVisit(code).then(b => setExistingBillCode(b?.bill_code || null)).catch(() => {});
    }
    listPatients({ limit: 100 }).then(r => setPatients(r.data || [])).catch(() => {});
    getAllDoctors().then(setAllDoctors).catch(() => {});
    getMedicines().then(setMedicines).catch(() => {});
    getTreatments().then(setTreatments).catch(() => {});
    getConditions().then(setConditions).catch(() => {});
  }, [code, isCreate]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSaveVisit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (isCreate) {
        const res = await createVisit(form);
        toast.success("Visit created."); navigate(`/visits/${res.visit_code}`);
      } else {
        await updateVisit(code, form);
        toast.success("Visit updated.");
        navigate(`/visits/${code}`);
      }
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  // After every save we re-fetch from the server so the table shows exactly what
  // was persisted (a "saved" toast should never disagree with the database).
  const handleSaveAppointedDoctors = async () => {
    setSaving(true);
    try {
      await saveAppointedDoctor(code, { doctor_codes: appointedLines.map(l => l.doctor_code), notes_map: {} });
      const d = await getAppointedDoctor(code);
      setAppointedLines(d?.lines || []);
      toast.success("Appointed doctors saved.");
      navigate(`/visits/${code}`);
    } catch (e) { toast.error(e.message); } finally { setSaving(false); }
  };

  const handleSavePrescription = async () => {
    setSaving(true);
    try {
      await savePrescriptionChart(code, { lines: rxLines });
      const d = await getPrescriptionChart(code);
      setRxLines(d?.lines || []);
      toast.success("Prescription saved.");
      navigate(`/visits/${code}`);
    } catch (e) { toast.error(e.message); } finally { setSaving(false); }
  };

  const handleSaveTreatment = async () => {
    setSaving(true);
    try {
      await saveTreatmentChart(code, { lines: txLines });
      const d = await getTreatmentChart(code);
      setTxLines(d?.lines || []);
      toast.success("Treatment chart saved.");
    } catch (e) { toast.error(e.message); } finally { setSaving(false); }
  };

  const handleSaveDiagnosis = async () => {
    setSaving(true);
    try {
      await saveDiagnosisChart(code, { lines: dxLines });
      const d = await getDiagnosisChart(code);
      setDxLines(d?.lines || []);
      toast.success("Diagnosis chart saved.");
      navigate(`/visits/${code}`);
    } catch (e) { toast.error(e.message); } finally { setSaving(false); }
  };

  const handleGenerateBill = async () => {
    try {
      const res = await createBillForVisit(code);
      setExistingBillCode(res.bill_code);
      toast.success("Bill generated.");
      navigate(`/patient-bills/${res.bill_code}`);
      navigate(`/visits/${code}`);
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return <div className="card"><p>Loading...</p></div>;

  return (
    <div>
      <div className="page-header">
        <h3 className="page-title">{isCreate ? "New Visit" : isView ? `Visit: ${code}` : `Edit Visit: ${code}`}</h3>
        <div style={{ display: "flex", gap: 8 }}>
          {isView && !isCreate && <Link to={`/visits/${code}/edit`} className="btn btn-primary">Edit</Link>}
          {!isCreate && !isView && <Link to={`/visits/${code}`} className="btn btn-outline">Cancel</Link>}
          <Link to="/visits" className="btn btn-outline">Back</Link>
        </div>
      </div>

      {!isCreate && (
        <div style={{ display: "flex", gap: 4, marginBottom: 0, borderBottom: "1px solid #e2e8f0" }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{
              padding: "8px 16px", border: "none", background: "none", cursor: "pointer",
              borderBottom: tab === i ? "2px solid #6366f1" : "2px solid transparent",
              color: tab === i ? "#6366f1" : "#64748b", fontWeight: tab === i ? 600 : 400
            }}>{t}</button>
          ))}
        </div>
      )}

      <div className="card" style={{ marginTop: 0 }}>
        {/* Tab 0: Visit Info */}
        {(isCreate || tab === 0) && (
          <form onSubmit={handleSaveVisit}>
            {visit && (
              <div style={{ marginBottom: 16, padding: "12px 16px", background: "#f8fafc", borderRadius: 6 }}>
                <strong>{visit.patient_name}</strong> <span style={{ color: "#64748b" }}>({visit.patient_code}) · {visit.gender}</span>
              </div>
            )}
            {isCreate && (
              <div className="form-group">
                <label className="form-label">Patient *</label>
                <select className="form-control" value={form.patient_code} onChange={e => set("patient_code", e.target.value)} required>
                  <option value="">— Select Patient —</option>
                  {patients.map(p => <option key={p.patient_code} value={p.patient_code}>{p.patient_name} ({p.patient_code})</option>)}
                </select>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Visit Type *</label>
                <select className="form-control" value={form.visit_type} onChange={e => set("visit_type", e.target.value)} required disabled={isView}>
                  <option value="OPD">OPD (Out-Patient)</option>
                  <option value="IPD">IPD (In-Patient)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Blood Pressure</label>
                <input className="form-control" placeholder="120/80" value={form.blood_pressure} onChange={e => set("blood_pressure", e.target.value)} disabled={isView} />
              </div>
              <div className="form-group">
                <label className="form-label">Height (cm)</label>
                <input type="number" step="0.1" className="form-control" value={form.height} onChange={e => set("height", e.target.value)} disabled={isView} />
              </div>
              <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input type="number" step="0.1" className="form-control" value={form.weight} onChange={e => set("weight", e.target.value)} disabled={isView} />
              </div>
              <div className="form-group">
                <label className="form-label">Temperature (°C)</label>
                <input type="number" step="0.1" className="form-control" value={form.temperature} onChange={e => set("temperature", e.target.value)} disabled={isView} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Reported Symptoms</label>
              <textarea className="form-control" rows={3} value={form.reported_symptoms} onChange={e => set("reported_symptoms", e.target.value)} disabled={isView} />
            </div>
            {!isView && (
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : isCreate ? "Create Visit" : "Save Changes"}
              </button>
            )}
          </form>
        )}

        {/* Tab 1: Appointed Doctors */}
        {!isCreate && tab === 1 && (
          <ChartEditor title="Appointed Doctors" lines={appointedLines} isView={isView}
            renderLine={(line, i) => (
              <tr key={i}>
                <td>{line.doctor_name} ({line.doctor_code})</td>
                <td>{line.specialty || "-"}</td>
                {!isView && (
                  <td><button className="btn btn-outline" style={{ fontSize: "0.7rem", padding: "2px 8px", color: "#ef4444", borderColor: "#ef4444" }}
                    onClick={() => setAppointedLines(ls => ls.filter((_, j) => j !== i))}>Remove</button></td>
                )}
              </tr>
            )}
            headers={isView ? ["Doctor", "Specialty"] : ["Doctor", "Specialty", ""]}
            addForm={!isView && <AddDoctorForm doctors={allDoctors} selected={appointedLines.map(l => l.doctor_code)}
              onAdd={d => setAppointedLines(ls => [...ls, d])} />}
            onSave={handleSaveAppointedDoctors} saving={saving} />
        )}

        {/* Tab 2: Prescription Chart */}
        {!isCreate && tab === 2 && (
          <ChartEditor title="Prescription Chart" lines={rxLines} isView={isView}
            renderLine={(line, i) => (
              <tr key={i}>
                <td>{line.medicine_name} ({line.medicine_code})</td>
                <td>{line.medicine_type}</td>
                <td>{line.quantity}</td>
                <td style={{ fontSize: "0.85rem", color: "#64748b" }}>{line.dosage_notes || "-"}</td>
                {!isView && (
                  <td><button className="btn btn-outline" style={{ fontSize: "0.7rem", padding: "2px 8px", color: "#ef4444", borderColor: "#ef4444" }}
                    onClick={() => setRxLines(ls => ls.filter((_, j) => j !== i))}>Remove</button></td>
                )}
              </tr>
            )}
            headers={isView ? ["Medicine", "Type", "Qty", "Dosage Notes"] : ["Medicine", "Type", "Qty", "Dosage Notes", ""]}
            addForm={!isView && <AddMedicineForm medicines={medicines} onAdd={m => setRxLines(ls => [...ls, m])} />}
            onSave={handleSavePrescription} saving={saving} />
        )}

        {/* Tab 3: Treatment Chart */}
        {!isCreate && tab === 3 && (
          <ChartEditor title="Treatment Chart" lines={txLines} isView={isView}
            renderLine={(line, i) => (
              <tr key={i}>
                <td>{line.treatment_name} ({line.treatment_code})</td>
                <td>฿{Number(line.unit_cost).toLocaleString()}</td>
                <td>{line.quantity}</td>
                <td style={{ fontSize: "0.85rem", color: "#64748b" }}>{line.notes || "-"}</td>
                {!isView && (
                  <td><button className="btn btn-outline" style={{ fontSize: "0.7rem", padding: "2px 8px", color: "#ef4444", borderColor: "#ef4444" }}
                    onClick={() => setTxLines(ls => ls.filter((_, j) => j !== i))}>Remove</button></td>
                )}
              </tr>
            )}
            headers={isView ? ["Treatment", "Unit Cost", "Qty", "Notes"] : ["Treatment", "Unit Cost", "Qty", "Notes", ""]}
            addForm={!isView && <AddTreatmentForm treatments={treatments} onAdd={t => setTxLines(ls => [...ls, t])} />}
            onSave={handleSaveTreatment} saving={saving} />
        )}

        {/* Tab 4: Diagnosis Chart */}
        {!isCreate && tab === 4 && (
          <ChartEditor title="Diagnosis Chart" lines={dxLines} isView={isView}
            renderLine={(line, i) => (
              <tr key={i}>
                <td>{line.condition_name} ({line.condition_code})</td>
                <td style={{ fontSize: "0.85rem", color: "#64748b", maxWidth: 300 }}>{line.description || "-"}</td>
                {!isView && (
                  <td><button className="btn btn-outline" style={{ fontSize: "0.7rem", padding: "2px 8px", color: "#ef4444", borderColor: "#ef4444" }}
                    onClick={() => setDxLines(ls => ls.filter((_, j) => j !== i))}>Remove</button></td>
                )}
              </tr>
            )}
            headers={isView ? ["Condition", "Description"] : ["Condition", "Description", ""]}
            addForm={!isView && <AddConditionForm conditions={conditions} selected={dxLines.map(l => l.condition_code)}
              onAdd={c => setDxLines(ls => [...ls, c])} />}
            onSave={handleSaveDiagnosis} saving={saving} />
        )}

        {/* Tab 5: Bill */}
        {!isCreate && tab === 5 && (
          <div>
            <h4 style={{ marginBottom: 16 }}>Patient Bill</h4>
            {existingBillCode ? (
              <div>
                <p style={{ color: "#64748b", marginBottom: 16 }}>
                  Bill <strong>{existingBillCode}</strong> has been created for this visit.
                </p>
                <Link to={`/patient-bills/${existingBillCode}`} className="btn btn-primary">View Bill</Link>
              </div>
            ) : (
              <div>
                <p style={{ color: "#64748b", marginBottom: 16 }}>
                  No bill exists yet. Generating a bill will automatically include all treatments and prescriptions recorded for this visit.
                </p>
                <button className="btn btn-primary" onClick={handleGenerateBill}>Generate Bill</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ChartEditor({ title, lines, renderLine, headers, addForm, onSave, saving, isView }) {
  return (
    <div>
      <h4 style={{ marginBottom: 12 }}>{title}</h4>
      <div className="table-container" style={{ marginBottom: 16 }}>
        <table className="modern-table">
          <thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {lines.length === 0 ? (
              <tr><td colSpan={headers.length} style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}>No items yet.</td></tr>
            ) : lines.map((l, i) => renderLine(l, i))}
          </tbody>
        </table>
      </div>
      {!isView && addForm}
      {!isView && (
        <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={onSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      )}
    </div>
  );
}

function AddDoctorForm({ doctors, selected, onAdd }) {
  const [code, setCode] = React.useState("");
  const available = doctors.filter(d => !selected.includes(d.doctor_code));
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
      <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
        <label className="form-label">Add Doctor</label>
        <select className="form-control" value={code} onChange={e => setCode(e.target.value)}>
          <option value="">— Select —</option>
          {available.map(d => <option key={d.doctor_code} value={d.doctor_code}>{d.doctor_name} — {d.specialty}</option>)}
        </select>
      </div>
      <button type="button" className="btn btn-outline" onClick={() => {
        const d = doctors.find(x => x.doctor_code === code); if (d) { onAdd(d); setCode(""); }
      }}>Add</button>
    </div>
  );
}

function AddMedicineForm({ medicines, onAdd }) {
  const [code, setCode] = React.useState("");
  const [qty, setQty] = React.useState("1");
  const [notes, setNotes] = React.useState("");
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
      <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
        <label className="form-label">Medicine</label>
        <select className="form-control" value={code} onChange={e => setCode(e.target.value)}>
          <option value="">— Select —</option>
          {medicines.map(m => <option key={m.medicine_code} value={m.medicine_code}>{m.medicine_name} ({m.medicine_type})</option>)}
        </select>
      </div>
      <div className="form-group" style={{ width: 80, marginBottom: 0 }}>
        <label className="form-label">Qty</label>
        <input type="number" className="form-control" value={qty} onChange={e => setQty(e.target.value)} min="1" />
      </div>
      <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
        <label className="form-label">Dosage Notes</label>
        <input className="form-control" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Take twice daily" />
      </div>
      <button type="button" className="btn btn-outline" onClick={() => {
        const m = medicines.find(x => x.medicine_code === code);
        if (m) { onAdd({ ...m, quantity: qty, dosage_notes: notes }); setCode(""); setQty("1"); setNotes(""); }
      }}>Add</button>
    </div>
  );
}

function AddTreatmentForm({ treatments, onAdd }) {
  const [code, setCode] = React.useState("");
  const [qty, setQty] = React.useState("1");
  const [notes, setNotes] = React.useState("");
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
      <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
        <label className="form-label">Treatment</label>
        <select className="form-control" value={code} onChange={e => setCode(e.target.value)}>
          <option value="">— Select —</option>
          {treatments.map(t => <option key={t.treatment_code} value={t.treatment_code}>{t.treatment_name} — ฿{Number(t.unit_cost).toLocaleString()}</option>)}
        </select>
      </div>
      <div className="form-group" style={{ width: 80, marginBottom: 0 }}>
        <label className="form-label">Qty</label>
        <input type="number" className="form-control" value={qty} onChange={e => setQty(e.target.value)} min="1" />
      </div>
      <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
        <label className="form-label">Notes</label>
        <input className="form-control" value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
      <button type="button" className="btn btn-outline" onClick={() => {
        const t = treatments.find(x => x.treatment_code === code);
        if (t) { onAdd({ ...t, quantity: qty, notes }); setCode(""); setQty("1"); setNotes(""); }
      }}>Add</button>
    </div>
  );
}

function AddConditionForm({ conditions, selected, onAdd }) {
  const [code, setCode] = React.useState("");
  const available = conditions.filter(c => !selected.includes(c.condition_code));
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
      <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
        <label className="form-label">Add Diagnosis</label>
        <select className="form-control" value={code} onChange={e => setCode(e.target.value)}>
          <option value="">— Select —</option>
          {available.map(c => <option key={c.condition_code} value={c.condition_code}>{c.condition_name}</option>)}
        </select>
      </div>
      <button type="button" className="btn btn-outline" onClick={() => {
        const c = conditions.find(x => x.condition_code === code); if (c) { onAdd(c); setCode(""); }
      }}>Add</button>
    </div>
  );
}