import { http } from "./http.js";

export async function listSalesPersons(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await http(`/api/sales-persons${query ? `?${query}` : ""}`);
  return { data: res.data, ...(res.meta || {}) };
}

export async function getSalesPerson(code) {
  const res = await http(`/api/sales-persons/${encodeURIComponent(code)}`);
  return res.data;
}

export async function createSalesPerson(body) {
  const res = await http("/api/sales-persons", { method: "POST", body: JSON.stringify(body) });
  return res.data;
}

export async function updateSalesPerson(code, body) {
  const res = await http(`/api/sales-persons/${encodeURIComponent(code)}`, { method: "PUT", body: JSON.stringify(body) });
  return res.data;
}

export async function deleteSalesPerson(code) {
  const res = await http(`/api/sales-persons/${encodeURIComponent(code)}`, { method: "DELETE" });
  return res.data;
}
