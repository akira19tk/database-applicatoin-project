import React from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getBillByCode, saveBillLines, addTransaction } from "../../api/patientBills.api.js";
import { getFees } from "../../api/configuration.api.js";

export default function PatientBillPage() {
  const { code } = useParams();
  const [bill, setBill] = React.useState(null);
  const [fees, setFees] = React.useState([]);
  const [lines, setLines] = React.useState([]);
  const [feeCode, setFeeCode] = React.useState("");
  const [txAmount, setTxAmount] = React.useState("");
  const [txType, setTxType] = React.useState("Cash");
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [editMode, setEditMode] = React.useState(false);

  const loadBill = () => {
    getBillByCode(code).then(b => {
      setBill(b);
      setLines(b ? b.lines.map(l => ({ ...l, _include: true })) : []);
      setLoading(false);
    }).catch(() => { toast.error("Bill not found"); setLoading(false); });
  };

  React.useEffect(() => {
    loadBill();
    getFees().then(setFees).catch(() => {});
  }, [code]);

  const subtotal = lines.filter(l => l._include).reduce((sum, l) => {
    if (l.charge_type === "Treatment") return sum + Number(l.treatment_cost || 0) * Number(l.treatment_qty || 1);
    if (l.charge_type === "Medicine") return sum + Number(l.medicine_cost || 0) * Number(l.medicine_qty || 1);
    if (l.charge_type === "Fee") return sum + Number(l.fee_price || 0);
    return sum;
  }, 0);
  const taxAmt = subtotal * (Number(bill?.tax || 7) / 100);
  const total = subtotal + taxAmt;
  const totalPaid = bill?.transactions?.reduce((s, t) => s + t.payments.reduce((ps, p) => ps + Number(p.amount), 0), 0) ?? 0;
  const balance = total - totalPaid;

  const handleSaveLines = async () => {
    setSaving(true);
    try {
      const included = lines.filter(l => l._include);
      await saveBillLines(bill.bill_code, {
        lines: included.map(l => ({
          charge_type: l.charge_type,
          tcl_id: l.tcl_id ?? null,
          pcl_id: l.pcl_id ?? null,
          fee_code: l.fee_code ?? null,
        }))
      });
      toast.success("Bill lines saved.");
      setEditMode(false);
      loadBill();
    } catch (e) { toast.error(e.message); } finally { setSaving(false); }
  };

  const handleAddFee = async () => {
    if (!feeCode) return;
    const fee = fees.find(f => f.fee_code === feeCode);
    if (!fee) return;
    setLines(ls => [...ls, { charge_type: "Fee", fee_code: fee.fee_code, fee_name: fee.fee_name, fee_price: fee.fee_price, _include: true }]);
    setFeeCode("");
  };

  const handleAddTransaction = async () => {
    if (!txAmount || !txType) return;
    setSaving(true);
    try {
      await addTransaction(bill.bill_code, { amount: Number(txAmount), transaction_type: txType });
      toast.success("Payment recorded.");
      setTxAmount(""); loadBill();
    } catch (e) { toast.error(e.message); } finally { setSaving(false); }
  };

  if (loading) return <div className="card"><p>Loading...</p></div>;
  if (!bill) return (
    <div>
      <div className="page-header"><h3 className="page-title">Bill Not Found</h3><Link to="/visits" className="btn btn-outline">Back to Visits</Link></div>
      <div className="card"><p style={{ color: "#64748b" }}>No bill exists for this code. Go to the visit and click "Generate Bill".</p></div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h3 className="page-title">Bill: {bill.bill_code}</h3>
        <div style={{ display: "flex", gap: 8 }} className="no-print">
          {!editMode && (
            <>
              <button className="btn btn-primary" onClick={() => setEditMode(true)}>Edit</button>
              <button className="btn btn-outline" onClick={() => window.print()}>Print</button>
            </>
          )}
          {editMode && (
            <button className="btn btn-outline" onClick={() => { setEditMode(false); loadBill(); }}>Cancel</button>
          )}
          <Link to={`/visits/${bill.visit_code}`} className="btn btn-outline">Back to Visit</Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <div>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <h4>Charge Lines</h4>
              {editMode && (
                <button className="btn btn-primary" style={{ fontSize: "0.8rem", padding: "6px 12px" }} onClick={handleSaveLines} disabled={saving}>
                  {saving ? "Saving..." : "Save Lines"}
                </button>
              )}
            </div>
            <table className="modern-table">
              <thead>
                <tr>
                  {editMode && <th></th>}
                  <th>Type</th>
                  <th>Description</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lines
                  .filter(l => editMode || l._include)
                  .map((l, i) => {
                    let desc = "", amount = 0;
                    if (l.charge_type === "Treatment") { desc = l.treatment_name; amount = Number(l.treatment_cost||0)*Number(l.treatment_qty||1); }
                    else if (l.charge_type === "Medicine") { desc = l.medicine_name; amount = Number(l.medicine_cost||0)*Number(l.medicine_qty||1); }
                    else { desc = l.fee_name; amount = Number(l.fee_price||0); }
                    const realIdx = lines.indexOf(l);
                    return (
                      <tr key={i}>
                        {editMode && (
                          <td><input type="checkbox" checked={l._include} onChange={e => setLines(ls => ls.map((x,j) => j===realIdx ? {...x, _include: e.target.checked} : x))} /></td>
                        )}
                        <td><span style={{ fontSize: "0.75rem", background: l.charge_type==="Treatment"?"#dbeafe":l.charge_type==="Medicine"?"#dcfce7":"#fef9c3", padding: "2px 8px", borderRadius: 12 }}>{l.charge_type}</span></td>
                        <td>{desc}</td>
                        <td className="text-right">฿{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                {lines.filter(l => editMode || l._include).length === 0 && (
                  <tr><td colSpan={editMode ? 4 : 3} style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}>No charge lines.</td></tr>
                )}
              </tbody>
            </table>

            {editMode && (
              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <select className="form-control" style={{ flex: 1 }} value={feeCode} onChange={e => setFeeCode(e.target.value)}>
                  <option value="">+ Add Fee...</option>
                  {fees.map(f => <option key={f.fee_code} value={f.fee_code}>{f.fee_name} — ฿{Number(f.fee_price).toLocaleString()}</option>)}
                </select>
                <button className="btn btn-outline" onClick={handleAddFee}>Add Fee</button>
              </div>
            )}
          </div>

          <div className="card">
            <h4 style={{ marginBottom: 12 }}>Payment Transactions</h4>
            {bill.transactions?.length === 0 && <p style={{ color: "#94a3b8" }}>No payments yet.</p>}
            {bill.transactions?.map(t => (
              <div key={t.id} style={{ padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 500 }}>{t.transaction_code}</span>
                  <span style={{ color: "#64748b", fontSize: "0.85rem" }}>{new Date(t.created_at).toLocaleDateString()}</span>
                </div>
                {t.payments.map(p => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#64748b", marginTop: 4 }}>
                    <span>{p.transaction_type}</span>
                    <span>฿{Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            ))}
            <div style={{ marginTop: 16, display: "flex", gap: 8, alignItems: "flex-end" }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">Amount (฿)</label>
                <input type="number" className="form-control" value={txAmount} onChange={e => setTxAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">Payment Method</label>
                <select className="form-control" value={txType} onChange={e => setTxType(e.target.value)}>
                  <option>Cash</option><option>Credit Card</option><option>Debit Card</option><option>Digital Wallet</option>
                </select>
              </div>
              <button className="btn btn-primary" onClick={handleAddTransaction} disabled={saving}>Record Payment</button>
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <h4 style={{ marginBottom: 12 }}>Summary</h4>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
              <span style={{ color: "#64748b" }}>Subtotal</span>
              <span>฿{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
              <span style={{ color: "#64748b" }}>Tax ({bill.tax}%)</span>
              <span>฿{taxAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "2px solid #e2e8f0", fontWeight: 700, fontSize: "1.1rem" }}>
              <span>Total</span><span>฿{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", color: "#16a34a" }}>
              <span>Paid</span><span>฿{totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", color: balance > 0 ? "#ef4444" : "#16a34a", fontWeight: 600 }}>
              <span>Balance</span><span>฿{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
