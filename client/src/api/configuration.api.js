import { http } from "./http.js";

function unwrap(res) {
  if (res && res.success === false && res.error) throw new Error(res.error.message);
  return res;
}

// ─── Departments ─────────────────────────────────────────────────────────────
export async function listDepartments(params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = unwrap(await http(`/api/config/departments${q ? `?${q}` : ""}`));
  return { data: res.data, ...(res.meta || {}) };
}
export async function getDepartments() {
  return unwrap(await http("/api/config/departments")).data;
}
export async function getDepartment(code) {
  return unwrap(await http(`/api/config/departments/${encodeURIComponent(code)}`)).data;
}
export async function createDepartment(data) {
  return unwrap(await http("/api/config/departments", { method: "POST", body: JSON.stringify(data) })).data;
}
export async function updateDepartment(code, data) {
  return unwrap(await http(`/api/config/departments/${encodeURIComponent(code)}`, { method: "PUT", body: JSON.stringify(data) })).data;
}
export async function deleteDepartment(code) {
  return unwrap(await http(`/api/config/departments/${encodeURIComponent(code)}`, { method: "DELETE" })).data;
}

// ─── Medicines ───────────────────────────────────────────────────────────────
export async function listMedicines(params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = unwrap(await http(`/api/config/medicines${q ? `?${q}` : ""}`));
  return { data: res.data, ...(res.meta || {}) };
}
export async function getMedicines() {
  return unwrap(await http("/api/config/medicines")).data;
}
export async function getMedicine(code) {
  return unwrap(await http(`/api/config/medicines/${encodeURIComponent(code)}`)).data;
}
export async function createMedicine(data) {
  return unwrap(await http("/api/config/medicines", { method: "POST", body: JSON.stringify(data) })).data;
}
export async function updateMedicine(code, data) {
  return unwrap(await http(`/api/config/medicines/${encodeURIComponent(code)}`, { method: "PUT", body: JSON.stringify(data) })).data;
}
export async function deleteMedicine(code) {
  return unwrap(await http(`/api/config/medicines/${encodeURIComponent(code)}`, { method: "DELETE" })).data;
}

// ─── Treatments ──────────────────────────────────────────────────────────────
export async function listTreatments(params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = unwrap(await http(`/api/config/treatments${q ? `?${q}` : ""}`));
  return { data: res.data, ...(res.meta || {}) };
}
export async function getTreatments() {
  return unwrap(await http("/api/config/treatments")).data;
}
export async function getTreatment(code) {
  return unwrap(await http(`/api/config/treatments/${encodeURIComponent(code)}`)).data;
}
export async function createTreatment(data) {
  return unwrap(await http("/api/config/treatments", { method: "POST", body: JSON.stringify(data) })).data;
}
export async function updateTreatment(code, data) {
  return unwrap(await http(`/api/config/treatments/${encodeURIComponent(code)}`, { method: "PUT", body: JSON.stringify(data) })).data;
}
export async function deleteTreatment(code) {
  return unwrap(await http(`/api/config/treatments/${encodeURIComponent(code)}`, { method: "DELETE" })).data;
}

// ─── Fees ─────────────────────────────────────────────────────────────────────
export async function listFees(params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = unwrap(await http(`/api/config/fees${q ? `?${q}` : ""}`));
  return { data: res.data, ...(res.meta || {}) };
}
export async function getFees() {
  return unwrap(await http("/api/config/fees")).data;
}
export async function getFee(code) {
  return unwrap(await http(`/api/config/fees/${encodeURIComponent(code)}`)).data;
}
export async function createFee(data) {
  return unwrap(await http("/api/config/fees", { method: "POST", body: JSON.stringify(data) })).data;
}
export async function updateFee(code, data) {
  return unwrap(await http(`/api/config/fees/${encodeURIComponent(code)}`, { method: "PUT", body: JSON.stringify(data) })).data;
}
export async function deleteFee(code) {
  return unwrap(await http(`/api/config/fees/${encodeURIComponent(code)}`, { method: "DELETE" })).data;
}

// ─── Medical Conditions ───────────────────────────────────────────────────────
export async function listMedicalConditions(params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = unwrap(await http(`/api/config/conditions${q ? `?${q}` : ""}`));
  return { data: res.data, ...(res.meta || {}) };
}
export async function getConditions() {
  return unwrap(await http("/api/config/conditions")).data;
}
export async function getMedicalCondition(code) {
  return unwrap(await http(`/api/config/conditions/${encodeURIComponent(code)}`)).data;
}
export async function createMedicalCondition(data) {
  return unwrap(await http("/api/config/conditions", { method: "POST", body: JSON.stringify(data) })).data;
}
export async function updateMedicalCondition(code, data) {
  return unwrap(await http(`/api/config/conditions/${encodeURIComponent(code)}`, { method: "PUT", body: JSON.stringify(data) })).data;
}
export async function deleteMedicalCondition(code) {
  return unwrap(await http(`/api/config/conditions/${encodeURIComponent(code)}`, { method: "DELETE" })).data;
}

// ─── Read-only lookups (used by dropdowns across the app) ────────────────────
export async function getBloodTypes() {
  return unwrap(await http("/api/config/blood-types")).data;
}
export async function getAllDoctors() {
  return unwrap(await http("/api/config/doctors")).data;
}