import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getTreatment, createTreatment, updateTreatment } from "../../api/configuration.api.js";

export default function TreatmentPage({ mode }) {
  const { code } = useParams();
  const navigate = useNavigate();
  const isView = mode === "view";

  const [form, setForm] = React.useState({ treatment_name: "", unit_cost: "" });
  const [loading, setLoading] = React.useState(mode !== "create");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (mode !== "create") {
      getTreatment(code)
        .then(r => { setForm({ treatment_name: r.treatment_name, unit_cost: r.unit_cost }); setLoading(false); })
        .catch(() => { toast.error("Treatment not found"); navigate("/treatments"); });
    }
  }, [code, mode]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (mode === "create") {
        const res = await createTreatment(form);
        toast.success("Treatment created.");
        navigate(`/treatments/${res.treatment_code}`);
      } else {
        await updateTreatment(code, form);
        toast.success("Treatment updated.");
        navigate(`/treatments/${code}`);
      }
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  if (loading) return <div className="card"><p>Loading...</p></div>;

  return (
    <div>
      <div className="page-header">
        <h3 className="page-title">
          {mode === "create" ? "New Treatment" : isView ? `Treatment: ${code}` : `Edit Treatment: ${code}`}
        </h3>
        <div style={{ display: "flex", gap: 8 }}>
          {isView && <Link to={`/treatments/${code}/edit`} className="btn btn-primary">Edit</Link>}
          <Link to="/treatments" className="btn btn-outline">Back</Link>
        </div>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Treatment Name *</label>
              <input className="form-control" value={form.treatment_name}
                onChange={e => set("treatment_name", e.target.value)} required disabled={isView} />
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
              <Link to={mode === "edit" ? `/treatments/${code}` : "/treatments"} className="btn btn-outline">Cancel</Link>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}