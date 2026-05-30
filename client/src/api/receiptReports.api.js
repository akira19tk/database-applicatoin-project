import { http } from "./http.js";

function unwrap(res) {
  if (res && res.success === false && res.error) throw new Error(res.error.message);
  return res;
}

function buildQuery(params) {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== ""),
  );
  return new URLSearchParams(filtered).toString();
}

export async function fetchReceiptList(params = {}) {
  const query = buildQuery(params);
  const res = unwrap(await http(`/api/receipt-reports/receipt-list${query ? `?${query}` : ""}`));
  return { data: res.data, ...(res.meta || {}) };
}

export async function fetchInvoiceReceiptReport(params = {}) {
  const query = buildQuery(params);
  const res = unwrap(await http(`/api/receipt-reports/invoice-receipt${query ? `?${query}` : ""}`));
  return { data: res.data, ...(res.meta || {}) };
}
