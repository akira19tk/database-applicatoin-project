import React from "react";
import { createPortal } from "react-dom";
import { listUnpaidInvoices } from "../../api/receipts.api.js";
import { formatBaht, formatDate } from "../../utils.js";

export default function InvoicePickerModal({ isOpen, onClose, onSelect, customerCode, excludeReceiptNo }) {
  const [invoices, setInvoices] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!isOpen || !customerCode) {
      setInvoices([]);
      return;
    }
    setLoading(true);
    setError("");
    listUnpaidInvoices(customerCode, excludeReceiptNo)
      .then((data) => setInvoices(data || []))
      .catch((e) => setError(String(e.message || e)))
      .finally(() => setLoading(false));
  }, [isOpen, customerCode, excludeReceiptNo]);

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-lg)",
          maxWidth: 760,
          width: "100%",
          maxHeight: "80vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>Select Invoice</h3>
        </div>
        <div style={{ padding: 24 }}>
          {loading && (
            <div style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>Loading...</div>
          )}
          {error && <div className="alert alert-error">{error}</div>}
          {!loading && !error && (
            <div className="table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Invoice Date</th>
                    <th className="text-right">Amount Due</th>
                    <th className="text-right">Already Received</th>
                    <th className="text-right">Remaining</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>
                        No unpaid invoices found.
                      </td>
                    </tr>
                  )}
                  {invoices.map((inv) => (
                    <tr key={inv.invoice_no}>
                      <td>{inv.invoice_no}</td>
                      <td>{formatDate(inv.invoice_date)}</td>
                      <td className="text-right">{formatBaht(inv.amount_due)}</td>
                      <td className="text-right">{formatBaht(inv.amount_already_received)}</td>
                      <td className="text-right">{formatBaht(inv.amount_remain)}</td>
                      <td>
                        <button
                          className="btn btn-primary"
                          style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                          onClick={() => onSelect(inv)}
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
