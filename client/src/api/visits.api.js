import { http } from "./http.js";

function unwrap(res) {
  if (res && res.success === false && res.error) throw new Error(res.error.message);
  return res;
}

export async function listVisits(params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = unwrap(await http(`/api/visits${q ? `?${q}` : ""}`));
  return { data: res.data, ...(res.meta || {}) };
}

export async function getVisit(code) {
  return unwrap(await http(`/api/visits/${encodeURIComponent(code)}`)).data;
}

export async function createVisit(data) {
  return unwrap(await http("/api/visits", { method: "POST", body: JSON.stringify(data) })).data;
}

export async function updateVisit(code, data) {
  return unwrap(await http(`/api/visits/${encodeURIComponent(code)}`, { method: "PUT", body: JSON.stringify(data) })).data;
}

export async function getAppointedDoctor(code) {
  return unwrap(await http(`/api/visits/${encodeURIComponent(code)}/appointed-doctor`)).data;
}
export async function saveAppointedDoctor(code, data) {
  return unwrap(await http(`/api/visits/${encodeURIComponent(code)}/appointed-doctor`, { method: "POST", body: JSON.stringify(data) })).data;
}

export async function getPrescriptionChart(code) {
  return unwrap(await http(`/api/visits/${encodeURIComponent(code)}/prescription-chart`)).data;
}
export async function savePrescriptionChart(code, data) {
  return unwrap(await http(`/api/visits/${encodeURIComponent(code)}/prescription-chart`, { method: "POST", body: JSON.stringify(data) })).data;
}

export async function getTreatmentChart(code) {
  return unwrap(await http(`/api/visits/${encodeURIComponent(code)}/treatment-chart`)).data;
}
export async function saveTreatmentChart(code, data) {
  return unwrap(await http(`/api/visits/${encodeURIComponent(code)}/treatment-chart`, { method: "POST", body: JSON.stringify(data) })).data;
}

export async function getDiagnosisChart(code) {
  return unwrap(await http(`/api/visits/${encodeURIComponent(code)}/diagnosis-chart`)).data;
}
export async function saveDiagnosisChart(code, data) {
  return unwrap(await http(`/api/visits/${encodeURIComponent(code)}/diagnosis-chart`, { method: "POST", body: JSON.stringify(data) })).data;
}
