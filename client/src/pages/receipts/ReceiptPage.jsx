import React from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getReceipt, createReceipt, updateReceipt } from "../../api/receipts.api.js";
import { getCustomer } from "../../api/customers.api.js";
import { formatBaht, formatDate } from "../../utils.js";
import InvoicePickerModal from "./InvoicePickerModal.jsx";
import CustomerPickerModal from "../../components/CustomerPickerModal.jsx";
import { AlertModal } from "../../components/Modal.jsx";
import Loading from "../../components/Loading.jsx";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function ReceiptPage({ mode: propMode }) {
  const { receiptNo } = useParams();
  const mode = propMode || (receiptNo ? "view" : "create");
  const nav = useNavigate();

  const [receiptData, setReceiptData] = React.useState(null);
  const [loading, setLoading] = React.useState(mode !== "create");
  const [err, setErr] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [alertModal, setAlertModal] = React.useState({ isOpen: false, message: "" });
  const [invoicePickerOpen, setInvoicePickerOpen] = React.useState(false);
  const [customerPickerOpen, setCustomerPickerOpen] = React.useState(false);

  // Form state
  const [receiptNoVal, setReceiptNoVal] = React.useState("");
  const [receiptNoAuto, setReceiptNoAuto] = React.useState(true);
  const [receiptDate, setReceiptDate] = React.useState(today());
  const [customerCode, setCustomerCode] = React.useState("");
  const [customerName, setCustomerName] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("cash");
  const [paymentNotes, setPaymentNotes] = React.useState("");
  const [lineItems, setLineItems] = React.useState([]);

  React.useEffect(() => {
    if (mode === "create") return;
    getReceipt(receiptNo)
      .then((data) => {
        setReceiptData(data);
        if (mode === "edit") {
          const h = data.header;
          setReceiptNoVal(h.receipt_no);
          setReceiptNoAuto(false);
          setReceiptDate(h.receipt_date ? h.receipt_date.slice(0, 10) : today());
          setCustomerCode(h.customer_code);
          setCustomerName(h.customer_name);
          setPaymentMethod(h.payment_method || "cash");
          setPaymentNotes(h.payment_notes || "");
          setLineItems(
            data.line_items.map((li) => ({
              invoice_no: li.invoice_no,
              amount_due: Number(li.amount_due),
              amount_already_received: Number(li.amount_already_received),
              amount_remain: Number(li.amount_due) - Number(li.amount_already_received),
              amount_received: Number(li.amount_received),
            })),
          );
        }
        setLoading(false);
      })
      .catch((e) => {
        setErr(String(e.message || e));
        setLoading(false);
      });
  }, [receiptNo, mode]);

  function handleCustomerCodeChange(newCode) {
    setCustomerCode(newCode);
    setCustomerName("");
    setLineItems([]);
  }

  async function handleCustomerBlur() {
    if (!customerCode) return;
    try {
      const cust = await getCustomer(customerCode);
      setCustomerName(cust.name || "");
    } catch {
      setCustomerName("");
    }
  }

  function handleCustomerSelected(code, label) {
    const name = label.startsWith(code + " - ") ? label.slice(code.length + 3) : label;
    setCustomerCode(code);
    setCustomerName(name);
    setLineItems([]);
  }

  function handleInvoiceSelected(inv) {
    if (lineItems.some((li) => li.invoice_no === inv.invoice_no)) {
      setInvoicePickerOpen(false);
      return;
    }
    setLineItems((prev) => [
      ...prev,
      {
        invoice_no: inv.invoice_no,
        amount_due: Number(inv.amount_due),
        amount_already_received: Number(inv.amount_already_received),
        amount_remain: Number(inv.amount_remain),
        amount_received: Number(inv.amount_remain),
      },
    ]);
    setInvoicePickerOpen(false);
  }

  function handleAmountChange(idx, val) {
    setLineItems((prev) =>
      prev.map((li, i) => (i === idx ? { ...li, amount_received: Number(val) || 0 } : li)),
    );
  }

  function handleRemoveLine(idx) {
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    const errors = [];
    if (!receiptDate) errors.push("Receipt date is required.");
    if (!customerCode) errors.push("Customer is required.");
    if (lineItems.length === 0) errors.push("At least one invoice line is required.");
    lineItems.forEach((li, i) => {
      if (!li.invoice_no) errors.push(`Line ${i + 1}: Invoice No is required.`);
      if (!(li.amount_received > 0)) errors.push(`Line ${i + 1}: Amount received must be > 0.`);
    });
    const invoiceNos = lineItems.map((li) => li.invoice_no);
    if (new Set(invoiceNos).size !== invoiceNos.length) errors.push("Duplicate invoices in line items.");

    if (errors.length > 0) {
      setAlertModal({
        isOpen: true,
        message: <ul style={{ margin: 0, paddingLeft: 16 }}>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>,
      });
      return;
    }

    setSubmitting(true);
    setErr("");
    try {
      const payload = {
        receipt_no: receiptNoAuto ? "" : receiptNoVal,
        receipt_date: receiptDate,
        customer_code: customerCode,
        payment_method: paymentMethod,
        payment_notes: paymentNotes,
        line_items: lineItems.map((li) => ({ invoice_no: li.invoice_no, amount_received: li.amount_received })),
      };
      if (mode === "create") {
        const res = await createReceipt(payload);
        toast.success("Receipt created.");
        nav(`/receipts/${encodeURIComponent(res.receipt_no)}`);
      } else {
        await updateReceipt(receiptNo, payload);
        toast.success("Receipt updated.");
        nav(`/receipts/${encodeURIComponent(receiptNo)}`);
      }
    } catch (e) {
      const msg = String(e.message || e);
      setErr(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Loading size="large" />;

  // View mode
  if (mode === "view" && receiptData) {
    const h = receiptData.header;
    const lines = receiptData.line_items || [];
    return (
      <div className="invoice-preview">
        <div className="page-header no-print">
          <h3 className="page-title">Receipt {h.receipt_no}</h3>
          <div className="flex gap-4">
            <Link to="/receipts" className="btn btn-outline">← Back</Link>
            <Link to={`/receipts/${encodeURIComponent(receiptNo)}/edit`} className="btn btn-outline">Edit</Link>
            <button onClick={() => window.print()} className="btn btn-primary">
              <svg style={{ marginRight: 8 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9V2h12v7"></path>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              Print PDF
            </button>
          </div>
        </div>
        <div className="card">
          <div className="flex justify-between mb-4">
            <div>
              <div className="brand mb-4">InvoiceDoc v2</div>
              <div className="font-bold">Customer</div>
              <div>{h.customer_name}</div>
              <div className="text-muted">{h.customer_code}</div>
            </div>
            <div className="text-right">
              <h2 className="mb-4">RECEIPT</h2>
              <div><span className="font-bold">Date:</span> {formatDate(h.receipt_date)}</div>
              <div><span className="font-bold">Receipt No:</span> {h.receipt_no}</div>
              <div><span className="font-bold">Payment Method:</span> {h.payment_method}</div>
              {h.payment_notes && <div><span className="font-bold">Notes:</span> {h.payment_notes}</div>}
            </div>
          </div>
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th className="text-right">Amount Due</th>
                  <th className="text-right">Already Received</th>
                  <th className="text-right">Balance Before</th>
                  <th className="text-right">Amount Received Here</th>
                  <th className="text-right">Balance After</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((li) => {
                  const balanceBefore = Number(li.amount_due) - Number(li.amount_already_received);
                  const balanceAfter = balanceBefore - Number(li.amount_received);
                  return (
                    <tr key={li.id}>
                      <td>{li.invoice_no}</td>
                      <td className="text-right">{formatBaht(li.amount_due)}</td>
                      <td className="text-right">{formatBaht(li.amount_already_received)}</td>
                      <td className="text-right">{formatBaht(balanceBefore)}</td>
                      <td className="text-right">{formatBaht(li.amount_received)}</td>
                      <td className="text-right">{formatBaht(balanceAfter)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <div style={{ minWidth: 240 }}>
              <div className="flex justify-between mt-4 p-2 bg-body font-bold" style={{ fontSize: "1.1rem" }}>
                <span>Total Received:</span>
                <span>{formatBaht(h.total_received)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create/Edit mode
  const totalReceived = lineItems.reduce((s, li) => s + Number(li.amount_received || 0), 0);
  const title = mode === "create" ? "Create Receipt" : `Edit Receipt ${receiptNo}`;

  return (
    <div className="invoice-page">
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ isOpen: false, message: "" })}
        title="Validation Error"
        message={alertModal.message}
      />
      <CustomerPickerModal
        isOpen={customerPickerOpen}
        onClose={() => setCustomerPickerOpen(false)}
        onSelect={handleCustomerSelected}
      />
      <InvoicePickerModal
        isOpen={invoicePickerOpen}
        onClose={() => setInvoicePickerOpen(false)}
        onSelect={handleInvoiceSelected}
        customerCode={customerCode}
        excludeReceiptNo={mode === "edit" ? receiptNo : null}
      />

      <div className="page-header">
        <h3 className="page-title">{title}</h3>
        <Link to="/receipts" className="btn btn-outline">
          <svg style={{ marginRight: 8 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back
        </Link>
      </div>

      {err && <div className="alert alert-error">{err}</div>}

      <div className="card">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {/* Receipt No */}
          <div className="form-group">
            <label className="form-label">Receipt No</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="text"
                className="form-control"
                value={receiptNoAuto ? "(Auto)" : receiptNoVal}
                onChange={(e) => setReceiptNoVal(e.target.value)}
                disabled={receiptNoAuto || mode === "edit"}
                placeholder="Auto-generated"
              />
              {mode === "create" && (
                <label style={{ display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                  <input
                    type="checkbox"
                    checked={receiptNoAuto}
                    onChange={(e) => setReceiptNoAuto(e.target.checked)}
                  />
                  Auto
                </label>
              )}
            </div>
          </div>

          {/* Receipt Date */}
          <div className="form-group">
            <label className="form-label">Receipt Date *</label>
            <input
              type="date"
              className="form-control"
              value={receiptDate}
              onChange={(e) => setReceiptDate(e.target.value)}
            />
          </div>

          {/* Customer Code */}
          <div className="form-group">
            <label className="form-label">Customer Code *</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                className="form-control"
                value={customerCode}
                onChange={(e) => handleCustomerCodeChange(e.target.value)}
                onBlur={handleCustomerBlur}
                placeholder="e.g. C001"
              />
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setCustomerPickerOpen(true)}
                title="Select customer"
              >
                LoV
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => handleCustomerCodeChange("")}
                title="Clear customer"
              >
                ×
              </button>
            </div>
          </div>

          {/* Customer Name */}
          <div className="form-group">
            <label className="form-label">Customer Name</label>
            <input type="text" className="form-control" value={customerName} readOnly />
          </div>

          {/* Payment Method */}
          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <select
              className="form-control"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="cash">Cash</option>
              <option value="bank transfer">Bank Transfer</option>
              <option value="check">Check</option>
            </select>
          </div>

          {/* Payment Notes */}
          <div className="form-group">
            <label className="form-label">Payment Notes</label>
            <textarea
              className="form-control"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="card" style={{ marginTop: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h4 style={{ margin: 0 }}>Invoice Lines</h4>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              if (!customerCode) {
                setAlertModal({ isOpen: true, message: "Please enter a customer code first." });
                return;
              }
              setInvoicePickerOpen(true);
            }}
          >
            + Add Invoice
          </button>
        </div>
        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th className="text-right">Full Amount Due</th>
                <th className="text-right">Already Received</th>
                <th className="text-right">Amount Remaining</th>
                <th className="text-right">Amount Received Here</th>
                <th className="text-right">Still Remaining</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>
                    No invoice lines added. Click &ldquo;Add Invoice&rdquo; to begin.
                  </td>
                </tr>
              )}
              {lineItems.map((li, idx) => {
                const stillRemaining = li.amount_remain - li.amount_received;
                return (
                  <tr key={li.invoice_no}>
                    <td>{li.invoice_no}</td>
                    <td className="text-right">{formatBaht(li.amount_due)}</td>
                    <td className="text-right">{formatBaht(li.amount_already_received)}</td>
                    <td className="text-right">{formatBaht(li.amount_remain)}</td>
                    <td className="text-right">
                      <input
                        type="number"
                        className="form-control"
                        style={{ textAlign: "right", width: 130 }}
                        value={li.amount_received}
                        min={0}
                        step={0.01}
                        onChange={(e) => handleAmountChange(idx, e.target.value)}
                      />
                    </td>
                    <td className="text-right">{formatBaht(stillRemaining)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ fontSize: "0.7rem", padding: "4px 8px", color: "#ef4444", borderColor: "#ef4444" }}
                        onClick={() => handleRemoveLine(idx)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
          <div style={{ minWidth: 260 }}>
            <div
              className="flex justify-between mt-2 p-2 font-bold"
              style={{ fontSize: "1.1rem", background: "var(--bg-body, #f8fafc)", borderRadius: "var(--radius)" }}
            >
              <span>Total Received:</span>
              <span>{formatBaht(totalReceived)}</span>
            </div>
            <div style={{ marginTop: "1rem", textAlign: "right" }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Saving..." : mode === "create" ? "Create Receipt" : "Update Receipt"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
