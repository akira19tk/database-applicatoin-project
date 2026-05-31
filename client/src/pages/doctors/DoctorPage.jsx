import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getDoctor, createDoctor, updateDoctor } from "../../api/doctors.api.js";
import { getDepartments } from "../../api/configuration.api.js";

export default function DoctorPage({ mode }) {
  const { code } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = React.useState({ doctor_name: "", gender: "Male", specialty: "", department_id: "" });
  const [departments, setDepartments] = React.useState([]);
  const [loading, setLoading] = React.useState(mode !== "create");
  const [saving, setSaving] = React.useState(false);
  const isView = mode === "view";

  React.useEffect(() => {
    getDepartments().then(setDepartments).catch(() => {});
    if (mode !== "create") {
      getDoctor(code).then(d => {
        setForm({
          doctor_name: d.doctor_name || "",
          gender: d.gender || "Male",
          specialty: d.specialty || "",
          department_id: d.department_id || "",
        });
        setLoading(false);
      }).catch(() => { toast.error("Doctor not found"); navigate("/doctors"); });
    }
  }, [code, mode]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (mode === "create") {
        const res = await createDoctor(form);
        toast.success("Doctor created.");
        navigate(`/doctors/${res.doctor_code}`);
      } else {
        await updateDoctor(code, form);
        toast.success("Doctor updated.");
        navigate(`/doctors/${code}`);
      }
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="card"><p>Loading...</p></div>;

  return (
    <div>
      <div className="page-header">
        <h3 className="page-title">
          {mode === "create" ? "New Doctor" : isView ? `Doctor: ${code}` : `Edit Doctor: ${code}`}
        </h3>
        <div style={{ display: "flex", gap: 8 }}>
          {isView && <Link to={`/doctors/${code}/edit`} className="btn btn-primary">Edit</Link>}
          <Link to="/doctors" className="btn btn-outline">Back</Link>
        </div>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-control" value={form.doctor_name}
              onChange={e => set("doctor_name", e.target.value)} required disabled={isView} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-control" value={form.gender}
                onChange={e => set("gender", e.target.value)} disabled={isView}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Specialty</label>
              <input className="form-control" value={form.specialty}
                onChange={e => set("specialty", e.target.value)} disabled={isView} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Department</label>
            <select className="form-control" value={form.department_id}
              onChange={e => set("department_id", e.target.value)} disabled={isView}>
              <option value="">— Select —</option>
              {departments.map(dep => (
                <option key={dep.id} value={dep.id}>{dep.department_name}</option>
              ))}
            </select>
          </div>
          {!isView && (
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
              <Link to={mode === "edit" ? `/doctors/${code}` : "/doctors"} className="btn btn-outline">
                Cancel
              </Link>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}