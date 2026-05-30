import React from "react";
import { fetchReceiptList, fetchInvoiceReceiptReport } from "../../api/receiptReports.api.js";
import { formatBaht, formatDate } from "../../utils.js";

const TABS = [
  { key: "receipt-list", label: "Receipt List" },
  { key: "invoice-receipt", label: "Invoice & Receipt" },
];

export default function ReceiptReports({ tab: initialTab = "receipt-list" }) {
  const [activeTab, setActiveTab] = React.useState(initialTab);
  const [filters, setFilters] = React.useState({ date_from: "", date_to: "", customer_code: "" });
  const [hasRun, setHasRun] = React.useState(false);
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    setActiveTab(initialTab);
    setHasRun(false);
    setData([]);
    setError("");
  }, [initialTab]);

  function handleFilterChange(e) {
    setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function runReport() {
    setLoading(true);
    setError("");
    setHasRun(true);
    try {
      let result;
      if (activeTab === "receipt-list") {
        result = await fetchReceiptList({ ...filters, limit: 1000 });
      } else {
        result = await fetchInvoiceReceiptReport({ ...filters, limit: 1000 });
      }
      setData(result.data || []);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  function resetReport() {
    setFilters({ date_from: "", date_to: "", customer_code: "" });
    setHasRun(false);
    setData([]);
    setError("");
  }

  const grandTotalReceived = activeTab === "receipt-list"
    ? data.reduce((s, r) => s + Number(r.total_received || 0), 0)
    : 0;

  return (
    <div>
      <div className="page-header">
        <h3 className="page-title">Receipt Reports</h3>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: "1rem", borderBottom: "2px solid var(--border)" }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => { setActiveTab(tab.key); setHasRun(false); setData([]); setError(""); }}
            style={{
              padding: "10px 24px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontWeight: activeTab === tab.key ? 700 : 400,
              color: activeTab === tab.key ? "var(--primary)" : "var(--text-muted)",
              borderBottom: activeTab === tab.key ? "2px solid var(--primary)" : "2px solid transparent",
              marginBottom: -2,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Date From</label>
            <input
              type="date"
              className="form-control"
              name="date_from"
              value={filters.date_from}
              onChange={handleFilterChange}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Date To</label>
            <input
              type="date"
              className="form-control"
              name="date_to"
              value={filters.date_to}
              onChange={handleFilterChange}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Customer Code</label>
            <input
              type="text"
              className="form-control"
              name="customer_code"
              value={filters.customer_code}
              onChange={handleFilterChange}
              placeholder="e.g. C001"
            />
          </div>
          <button type="button" className="btn btn-primary" onClick={runReport}>
            Run Report
          </button>
          <button type="button" className="btn btn-outline" onClick={resetReport}>
            Reset
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading && (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>
          Running report...
        </div>
      )}

      {hasRun && !loading && (
        <div className="card">
          {activeTab === "receipt-list" && (
            <div className="table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Receipt No</th>
                    <th>Date</th>
                    <th>Customer Code</th>
                    <th>Customer Name</th>
                    <th>Payment Method</th>
                    <th>Notes</th>
                    <th className="text-right">Total Received</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>
                        No data found.
                      </td>
                    </tr>
                  )}
                  {data.map((r) => (
                    <tr key={r.receipt_no}>
                      <td>{r.receipt_no}</td>
                      <td>{formatDate(r.receipt_date)}</td>
                      <td>{r.customer_code}</td>
                      <td>{r.customer_name}</td>
                      <td>{r.payment_method}</td>
                      <td>{r.payment_notes || "—"}</td>
                      <td className="text-right">{formatBaht(r.total_received)}</td>
                    </tr>
                  ))}
                  {data.length > 0 && (
                    <tr style={{ fontWeight: 700, background: "var(--bg-body, #f8fafc)" }}>
                      <td colSpan={6} style={{ textAlign: "right" }}>Grand Total:</td>
                      <td className="text-right">{formatBaht(grandTotalReceived)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "invoice-receipt" && (
            <div className="table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Invoice Date</th>
                    <th>Customer Code</th>
                    <th>Customer Name</th>
                    <th className="text-right">Amount Due</th>
                    <th className="text-right">Total Received</th>
                    <th className="text-right">Remaining</th>
                    <th>Receipt No</th>
                    <th>Receipt Date</th>
                    <th className="text-right">Receipt Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 && (
                    <tr>
                      <td colSpan={10} style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>
                        No data found.
                      </td>
                    </tr>
                  )}
                  {data.map((r, idx) => (
                    <tr key={idx}>
                      <td>{r.invoice_no}</td>
                      <td>{formatDate(r.invoice_date)}</td>
                      <td>{r.customer_code}</td>
                      <td>{r.customer_name}</td>
                      <td className="text-right">{formatBaht(r.amount_due)}</td>
                      <td className="text-right">{formatBaht(r.total_received)}</td>
                      <td
                        className="text-right"
                        style={{ color: Number(r.amount_remain) > 0 ? "#ef4444" : "#22c55e" }}
                      >
                        {formatBaht(r.amount_remain)}
                      </td>
                      <td>{r.receipt_no || "—"}</td>
                      <td>{r.receipt_date ? formatDate(r.receipt_date) : "—"}</td>
                      <td className="text-right">
                        {r.receipt_amount != null ? formatBaht(r.receipt_amount) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
