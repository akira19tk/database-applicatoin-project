import * as svc from "../services/configuration.service.js";
import { sendData, sendError } from "../utils/response.js";

const handler = (fn) => async (_req, res) => {
  try { sendData(res, await fn()); }
  catch (e) { sendError(res, e.message, 500); }
};

export const listDepartments = handler(svc.listDepartments);
export const listMedicines = handler(svc.listMedicines);
export const listTreatments = handler(svc.listTreatments);
export const listFees = handler(svc.listFees);
export const listMedicalConditions = handler(svc.listMedicalConditions);
export const listBloodTypes = handler(svc.listBloodTypes);
export const listAllDoctors = handler(svc.listAllDoctors);
