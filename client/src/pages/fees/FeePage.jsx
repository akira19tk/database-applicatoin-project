import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getFee, createFee, updateFee } from "../../api/configuration.api.js";

export default function FeePage({ mode }) {
  const { code } = useParams();
  const navigate = useNavigate();
  const isView = mode === "view";

  const [form, setForm] = React.useState({ fee_name: "", fee_price: "" });
  const [loading, setLoading] = React.useState(mode !== "create");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (mode !== "create") {
      getFee(code)
        .then(r => { setForm({ fee_name: r.fee_name, fee_price: r.fee_price }); setLoading(false); })
        .catch(() => { toast.error("Fee not found"); navigate("/fees"); });
    }
  }, [code, mode]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (mode === "create") {
        const res = await createFee(form);
        toast.success("Fee created.");
        navigate(`/fees/${res.fee_code}`);
      } else {
        await updateFee(code, form);
        toast.success("Fee updated.");
        navigate(`/fees/${code}`);
      }
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  if (loading) return <div className="card"><p>Loading...</p></div>;

  return (
    <div>
      <div className="page-header">
        <h3 className="page-title">
          {mode === "create" ? "New Fee" : isView ? `Fee: ${code}` : `Edit Fee: ${code}`}
        </h3>
        <div style={{ display: "flex", gap: 8 }}>
          {isView && <Link to={`/fees/${code}/edit`} className="btn btn-primary">Edit</Link>}
          <Link to="/fees" className="btn btn-outline">Back</Link>
        </div>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Fee Name *</label>
              <input className="form-control" value={form.fee_name}
                onChange={e => set("fee_name", e.target.value)} required disabled={isView} />
            </div>
            <div className="form-group">
              <label className="form-label">Price (฿) *</label>
              <input type="number" min="0" step="0.01" className="form-control" value={form.fee_price}
                onChange={e => set("fee_price", e.target.value)} required disabled={isView} />
            </div>
          </div>
          {!isView && (
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
              <Link to={mode === "edit" ? `/fees/${code}` : "/fees"} className="btn btn-outline">Cancel</Link>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}