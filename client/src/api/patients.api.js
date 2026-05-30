import { http } from "./http.js";

function unwrap(res) {
  if (res && res.success === false && res.error) throw new Error(res.error.message);
  return res;
}

export async function listPatients(params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = unwrap(await http(`/api/patients${q ? `?${q}` : ""}`));
  return { data: res.data, ...(res.meta || {}) };
}

export async function getPatient(code) {
  return unwrap(await http(`/api/patients/${encodeURIComponent(code)}`)).data;
}

export async function createPatient(data) {
  return unwrap(await http("/api/patients", { method: "POST", body: JSON.stringify(data) })).data;
}

export async function updatePatient(code, data) {
  return unwrap(await http(`/api/patients/${encodeURIComponent(code)}`, { method: "PUT", body: JSON.stringify(data) })).data;
}

export async function deletePatient(code) {
  return unwrap(await http(`/api/patients/${encodeURIComponent(code)}`, { method: "DELETE" })).data;
}
