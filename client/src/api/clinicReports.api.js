import { http } from "./http.js";

function unwrap(res) {
  if (res && res.success === false && res.error) throw new Error(res.error.message);
  return res;
}

// Build a query string, dropping empty/undefined/null filter values.
function qs(params = {}) {
  const clean = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") clean[k] = v;
  }
  const s = new URLSearchParams(clean).toString();
  return s ? `?${s}` : "";
}

const get = async (path, params) => unwrap(await http(`/api/reports/${path}${qs(params)}`)).data ?? [];

export const reportPatients = (p) => get("patients", p);                       // 1
export const reportPatientsVisiting = (p) => get("patients-visiting", p);      // 1b
export const reportMedicalProblems = (p) => get("medical-problems", p);        // 2
export const reportTopConditions = (p) => get("top-conditions", p);            // 3
export const reportMedicines = (p) => get("medicines", p);                     // 4
export const reportPrescriptions = (p) => get("prescriptions", p);             // 5
export const reportTopMedicines = (p) => get("top-medicines", p);             // 6
export const reportDiagnoses = (p) => get("diagnoses", p);                     // 7 & 8
export const reportDoctors = (p) => get("doctors", p);                         // 10
export const reportPatientsByDoctor = (p) => get("patients-by-doctor", p);     // 11
export const reportMostAppointedDoctors = (p) => get("most-appointed-doctors", p); // 12
export const reportBills = (p) => get("bills", p);                             // 14
export const reportRevenueByChargeType = (p) => get("revenue-by-charge-type", p); // 15
export const reportVisits = (p) => get("visits", p);                           // 16 & 17
export const reportVisitsMonthly = (p) => get("visits-monthly", p);            // 18
