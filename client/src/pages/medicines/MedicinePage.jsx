import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getMedicine, createMedicine, updateMedicine } from "../../api/configuration.api.js";

const MEDICINE_TYPES = ["Analgesics", "Antibiotics", "Antifungals", "Antihistamines", "Other"];

export default function MedicinePage({ mode }) {
  const { code } = useParams();
  const navigate = useNavigate();
  const isView = mode === "view";

  const [form, setForm] = React.useState({ medicine_name: "", generic_name: "", medicine_type: "", unit_cost: "" });
  const [loading, setLoading] = React.useState(mode !== "create");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (mode !== "create") {
      getMedicine(code)
        .then(r => { setForm({ medicine_name: r.medicine_name, generic_name: r.generic_name || "", medicine_type: r.medicine_type || "", unit_cost: r.unit_cost }); setLoading(false); })
        .catch(() => { toast.error("Medicine not found"); navigate("/medicines"); });
    }
  }, [code, mode]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (mode === "create") {
        const res = await createMedicine(form);
        toast.success("Medicine created.");
        navigate(`/medicines/${res.medicine_code}`);
      } else {
        await updateMedicine(code, form);
        toast.success("Medicine updated.");
        navigate(`/medicines/${code}`);
      }
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  if (loading) return <div className="card"><p>Loading...</p></div>;

  return (
    <div>
      <div className="page-header">
        <h3 className="page-title">
          {mode === "create" ? "New Medicine" : isView ? `Medicine: ${code}` : `Edit Medicine: ${code}`}
        </h3>
        <div style={{ display: "flex", gap: 8 }}>
          {isView && <Link to={`/medicines/${code}/edit`} className="btn btn-primary">Edit</Link>}
          <Link to="/medicines" className="btn btn-outline">Back</Link>
        </div>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Medicine Name *</label>
              <input className="form-control" value={form.medicine_name}
                onChange={e => set("medicine_name", e.target.value)} required disabled={isView} />
            </div>
            <div className="form-group">
              <label className="form-label">Generic Name</label>
              <input className="form-control" value={form.generic_name}
                onChange={e => set("generic_name", e.target.value)} disabled={isView} />
            </div>
            <div className="form-group">
              <label className="form-label">Medicine Type</label>
              <select className="form-control" value={form.medicine_type}
                onChange={e => set("medicine_type", e.target.value)} disabled={isView}>
                <option value="">— Select Type —</option>
                {MEDICINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Unit Cost (฿) *</label>
              <input type="number" min="0" step="0.01" className="form-control" value={form.unit_cost}
                onChange={e => set("unit_cost", e.target.value)} required disabled={isView} />
            </div>
          </div>
          {!isView && (
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
              <Link to={mode === "edit" ? `/medicines/${code}` : "/medicines"} className="btn btn-outline">Cancel</Link>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}