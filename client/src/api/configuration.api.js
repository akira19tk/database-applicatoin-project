import { http } from "./http.js";

function unwrap(res) {
  if (res && res.success === false && res.error) throw new Error(res.error.message);
  return res.data ?? [];
}

export const getDepartments = () => http("/api/config/departments").then(unwrap);
export const getMedicines = () => http("/api/config/medicines").then(unwrap);
export const getTreatments = () => http("/api/config/treatments").then(unwrap);
export const getFees = () => http("/api/config/fees").then(unwrap);
export const getConditions = () => http("/api/config/conditions").then(unwrap);
export const getBloodTypes = () => http("/api/config/blood-types").then(unwrap);
export const getAllDoctors = () => http("/api/config/doctors").then(unwrap);
