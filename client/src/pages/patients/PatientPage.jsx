import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getPatient, createPatient, updatePatient } from "../../api/patients.api.js";
import { getBloodTypes } from "../../api/configuration.api.js";

export default function PatientPage({ mode }) {
  const { code } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = React.useState({ patient_name: "", gender: "Male", date_of_birth: "", blood_type_id: "" });
  const [bloodTypes, setBloodTypes] = React.useState([]);
  const [loading, setLoading] = React.useState(mode !== "create");
  const [saving, setSaving] = React.useState(false);
  const isView = mode === "view";

  React.useEffect(() => {
    getBloodTypes().then(setBloodTypes).catch(() => {});
    if (mode !== "create") {
      getPatient(code).then(p => {
        setForm({
          patient_name: p.patient_name || "",
          gender: p.gender || "Male",
          date_of_birth: p.date_of_birth ? p.date_of_birth.split("T")[0] : "",
          blood_type_id: p.blood_type_id || "",
        });
        setLoading(false);
      }).catch(() => { toast.error("Patient not found"); navigate("/patients"); });
    }
  }, [code, mode]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (mode === "create") {
        const res = await createPatient(form);
        toast.success("Patient created.");
        navigate(`/patients/${res.patient_code}`);
      } else {
        await updatePatient(code, form);
        toast.success("Patient updated.");
        navigate(`/patients/${code}`);
      }
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="card"><p>Loading...</p></div>;

  return (
    <div>
      <div className="page-header">
        <h3 className="page-title">{mode === "create" ? "New Patient" : isView ? `Patient: ${code}` : `Edit Patient: ${code}`}</h3>
        <div style={{ display: "flex", gap: 8 }}>
          {isView && <Link to={`/patients/${code}/edit`} className="btn btn-primary">Edit</Link>}
          <Link to="/patients" className="btn btn-outline">Back</Link>
        </div>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-control" value={form.patient_name} onChange={e => set("patient_name", e.target.value)}
              required disabled={isView} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-control" value={form.gender} onChange={e => set("gender", e.target.value)} disabled={isView}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth *</label>
              <input type="date" className="form-control" value={form.date_of_birth}
                onChange={e => set("date_of_birth", e.target.value)} required disabled={isView} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Blood Type</label>
            <select className="form-control" value={form.blood_type_id} onChange={e => set("blood_type_id", e.target.value)} disabled={isView}>
              <option value="">— Select —</option>
              {bloodTypes.map(bt => <option key={bt.id} value={bt.id}>{bt.blood_type_full}</option>)}
            </select>
          </div>
          {!isView && (
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
              <Link to={mode === "edit" ? `/patients/${code}` : "/patients"} className="btn btn-outline">Cancel</Link>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
