import { http } from "./http.js";

function unwrap(res) {
  if (res && res.success === false && res.error) throw new Error(res.error.message);
  return res;
}

export async function listBills(params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = unwrap(await http(`/api/patient-bills${q ? `?${q}` : ""}`));
  return { data: res.data, ...(res.meta || {}) };
}

export async function getBillByVisit(visitCode) {
  return unwrap(await http(`/api/patient-bills/by-visit/${encodeURIComponent(visitCode)}`)).data;
}

export async function createBillForVisit(visitCode) {
  return unwrap(await http(`/api/patient-bills/by-visit/${encodeURIComponent(visitCode)}`, { method: "POST" })).data;
}

export async function getBillByCode(code) {
  return unwrap(await http(`/api/patient-bills/${encodeURIComponent(code)}`)).data;
}

export async function saveBillLines(code, data) {
  return unwrap(await http(`/api/patient-bills/${encodeURIComponent(code)}/lines`, { method: "POST", body: JSON.stringify(data) })).data;
}

export async function addTransaction(code, data) {
  return unwrap(await http(`/api/patient-bills/${encodeURIComponent(code)}/transactions`, { method: "POST", body: JSON.stringify(data) })).data;
}
