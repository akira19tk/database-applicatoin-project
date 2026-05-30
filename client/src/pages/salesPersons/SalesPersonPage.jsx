import React from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getSalesPerson, createSalesPerson, updateSalesPerson } from "../../api/salesPersons.api.js";
import Loading from "../../components/Loading.jsx";

export default function SalesPersonPage({ mode: propMode }) {
    const { id } = useParams();
    const mode = propMode || (id ? "view" : "create");
    const nav = useNavigate();

    const [code, setCode] = React.useState("");
    const [name, setName] = React.useState("");
    const [startWorkDate, setStartWorkDate] = React.useState("");
    const [autoCode, setAutoCode] = React.useState(true);
    const [err, setErr] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);
    const [loading, setLoading] = React.useState(mode !== "create");

    React.useEffect(() => {
        if (mode !== "create") {
            getSalesPerson(id)
                .then((sp) => {
                    if (!sp) { setErr("Sales person not found"); setLoading(false); return; }
                    setCode(sp.code || "");
                    setName(sp.name || "");
                    setStartWorkDate(sp.start_work_date ? String(sp.start_work_date).slice(0, 10) : "");
                    setLoading(false);
                })
                .catch((e) => {
                    setErr(String(e.message || e));
                    setLoading(false);
                });
        }
    }, [id, mode]);

    async function handleSubmit(e) {
        e.preventDefault();
        setErr("");
        setSubmitting(true);
        try {
            const payload = { name, start_work_date: startWorkDate || null };
            if (mode === "create") {
                if (!autoCode) payload.code = code;
                await createSalesPerson(payload);
                toast.success("Sales person created.");
            } else {
                await updateSalesPerson(id, payload);
                toast.success("Sales person updated.");
            }
            nav("/sales-persons");
        } catch (e) {
            const msg = String(e.message || e);
            setErr(msg);
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <Loading size="large" />;

    const isView = mode === "view";
    const isCreate = mode === "create";
    const titles = { create: "Create Sales Person", view: "Sales Person Details", edit: "Edit Sales Person" };
    const title = titles[mode];

    if (isView) {
        return (
            <div>
                <div className="page-header">
                    <h3 className="page-title">{title}</h3>
                    <div className="flex gap-4">
                        <Link to="/sales-persons" className="btn btn-outline">← Back</Link>
                        <Link to={`/sales-persons/${id}/edit`} className="btn btn-primary">Edit</Link>
                    </div>
                </div>
                <div className="card">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                        <div>
                            <h4 style={{ marginBottom: "1.5rem", color: "var(--primary)" }}>Basic Information</h4>
                            <div style={{ marginBottom: "1rem" }}>
                                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Code</div>
                                <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>{code}</div>
                            </div>
                            <div style={{ marginBottom: "1rem" }}>
                                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Name</div>
                                <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>{name}</div>
                            </div>
                            <div style={{ marginBottom: "1rem" }}>
                                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Start Date</div>
                                <div>{startWorkDate || "-"}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h3 className="page-title">{title}</h3>
                <Link to="/sales-persons" className="btn btn-outline">
                    <svg style={{ marginRight: 8 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    Back
                </Link>
            </div>
            {err && <div className="alert alert-error">{err}</div>}
            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem", marginBottom: "1rem" }}>
                        <div className="form-group">
                            <label className="form-label">{isCreate && autoCode ? "Code" : <>Code <span className="required-marker">*</span></>}</label>
                            {isCreate ? (
                                <div className="flex gap-2">
                                    <input
                                        className="form-control"
                                        disabled={autoCode}
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="SP001"
                                    />
                                    <div className="form-inline-option">
                                        <input type="checkbox" checked={autoCode} onChange={(e) => setAutoCode(e.target.checked)} id="sp_auto" />
                                        <label htmlFor="sp_auto">Auto</label>
                                    </div>
                                </div>
                            ) : (
                                <input className="form-control" value={code} disabled readOnly placeholder="SP001" />
                            )}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Name <span className="required-marker">*</span></label>
                            <input className="form-control" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Sales Person Name" />
                        </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem", marginBottom: "1.5rem" }}>
                        <div className="form-group">
                            <label className="form-label">Start Date</label>
                            <input type="date" className="form-control" value={startWorkDate} onChange={(e) => setStartWorkDate(e.target.value)} />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? (isCreate ? "Creating..." : "Saving...") : (isCreate ? "Create Sales Person" : "Save Changes")}
                    </button>
                </form>
            </div>
        </div>
    );
}
