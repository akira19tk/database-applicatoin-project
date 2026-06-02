import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getDepartment, createDepartment, updateDepartment } from "../../api/configuration.api.js";

export default function DepartmentPage({ mode }) {
  const { code } = useParams();
  const navigate = useNavigate();
  const isView = mode === "view";

  const [form, setForm] = React.useState({ department_name: "", location_description: "" });
  const [loading, setLoading] = React.useState(mode !== "create");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (mode !== "create") {
      getDepartment(code)
        .then(r => { setForm({ department_name: r.department_name, location_description: r.location_description || "" }); setLoading(false); })
        .catch(() => { toast.error("Department not found"); navigate("/departments"); });
    }
  }, [code, mode]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (mode === "create") {
        const res = await createDepartment(form);
        toast.success("Department created.");
        navigate(`/departments/${res.department_code}`);
      } else {
        await updateDepartment(code, form);
        toast.success("Department updated.");
        navigate(`/departments/${code}`);
      }
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  if (loading) return <div className="card"><p>Loading...</p></div>;

  return (
    <div>
      <div className="page-header">
        <h3 className="page-title">
          {mode === "create" ? "New Department" : isView ? `Department: ${code}` : `Edit Department: ${code}`}
        </h3>
        <div style={{ display: "flex", gap: 8 }}>
          {isView && <Link to={`/departments/${code}/edit`} className="btn btn-primary">Edit</Link>}
          <Link to="/departments" className="btn btn-outline">Back</Link>
        </div>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Department Name *</label>
              <input className="form-control" value={form.department_name}
                onChange={e => set("department_name", e.target.value)} required disabled={isView} />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-control" value={form.location_description}
                onChange={e => set("location_description", e.target.value)} disabled={isView}
                placeholder="e.g. Suite 101, Main Hallway" />
            </div>
          </div>
          {!isView && (
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
              <Link to={mode === "edit" ? `/departments/${code}` : "/departments"} className="btn btn-outline">Cancel</Link>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}