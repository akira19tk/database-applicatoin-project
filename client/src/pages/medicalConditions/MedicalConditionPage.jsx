import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getMedicalCondition, createMedicalCondition, updateMedicalCondition } from "../../api/configuration.api.js";

export default function MedicalConditionPage({ mode }) {
  const { code } = useParams();
  const navigate = useNavigate();
  const isView = mode === "view";

  const [form, setForm] = React.useState({ condition_name: "", description: "" });
  const [loading, setLoading] = React.useState(mode !== "create");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (mode !== "create") {
      getMedicalCondition(code)
        .then(r => { setForm({ condition_name: r.condition_name, description: r.description || "" }); setLoading(false); })
        .catch(() => { toast.error("Medical condition not found"); navigate("/medical-conditions"); });
    }
  }, [code, mode]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (mode === "create") {
        const res = await createMedicalCondition(form);
        toast.success("Medical condition created.");
        navigate(`/medical-conditions/${res.condition_code}`);
      } else {
        await updateMedicalCondition(code, form);
        toast.success("Medical condition updated.");
        navigate(`/medical-conditions/${code}`);
      }
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  if (loading) return <div className="card"><p>Loading...</p></div>;

  return (
    <div>
      <div className="page-header">
        <h3 className="page-title">
          {mode === "create" ? "New Medical Condition" : isView ? `Condition: ${code}` : `Edit Condition: ${code}`}
        </h3>
        <div style={{ display: "flex", gap: 8 }}>
          {isView && <Link to={`/medical-conditions/${code}/edit`} className="btn btn-primary">Edit</Link>}
          <Link to="/medical-conditions" className="btn btn-outline">Back</Link>
        </div>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Condition Name *</label>
            <input className="form-control" value={form.condition_name}
              onChange={e => set("condition_name", e.target.value)} required disabled={isView} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-control" rows={4} value={form.description}
              onChange={e => set("description", e.target.value)} disabled={isView}
              placeholder="Describe the condition, symptoms, etc." />
          </div>
          {!isView && (
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
              <Link to={mode === "edit" ? `/medical-conditions/${code}` : "/medical-conditions"} className="btn btn-outline">Cancel</Link>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}