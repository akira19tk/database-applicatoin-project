import * as svc from "../services/configuration.service.js";
import { sendList, sendOne, sendData, sendCreated, sendOk, sendError } from "../utils/response.js";

// ─── handler factories (mirrors the original pattern) ────────────────────────

// For paginated list endpoints — passes req.query so search/page/limit work
const listHandler = (fn) => async (req, res) => {
  try { sendList(res, await fn(req.query)); }
  catch (e) { sendError(res, e.message, 500); }
};

// For GET /:code
const getHandler = (fn, label) => async (req, res) => {
  try {
    const row = await fn(req.params.code);
    if (!row) return sendError(res, `${label} not found`, 404);
    sendOne(res, row);
  } catch (e) { sendError(res, e.message, 500); }
};

// For POST /
const createHandler = (fn) => async (req, res) => {
  try { sendCreated(res, await fn(req.body)); }
  catch (e) { sendError(res, e.message, 400); }
};

// For PUT /:code
const updateHandler = (fn, label) => async (req, res) => {
  try {
    const result = await fn(req.params.code, req.body);
    if (!result) return sendError(res, `${label} not found`, 404);
    sendOk(res, result);
  } catch (e) { sendError(res, e.message, 400); }
};

// For DELETE /:code
const deleteHandler = (fn, label) => async (req, res) => {
  try {
    const result = await fn(req.params.code);
    if (!result) return sendError(res, `${label} not found`, 404);
    sendOk(res, result);
  } catch (e) { sendError(res, e.message, e.statusCode ?? 500); }
};

// Read-only lookup (no pagination, no code param) — same as original handler()
const handler = (fn) => async (_req, res) => {
  try { sendData(res, await fn()); }
  catch (e) { sendError(res, e.message, 500); }
};

// ─── Departments ─────────────────────────────────────────────────────────────
export const listDepartments  = listHandler  (svc.listDepartments,           );
export const getDepartment    = getHandler   (svc.getDepartmentByCode,    "Department");
export const createDepartment = createHandler(svc.createDepartment            );
export const updateDepartment = updateHandler(svc.updateDepartment,       "Department");
export const deleteDepartment = deleteHandler(svc.deleteDepartment,       "Department");

// ─── Medicines ───────────────────────────────────────────────────────────────
export const listMedicines    = listHandler  (svc.listMedicines               );
export const getMedicine      = getHandler   (svc.getMedicineByCode,      "Medicine");
export const createMedicine   = createHandler(svc.createMedicine              );
export const updateMedicine   = updateHandler(svc.updateMedicine,         "Medicine");
export const deleteMedicine   = deleteHandler(svc.deleteMedicine,         "Medicine");

// ─── Treatments ──────────────────────────────────────────────────────────────
export const listTreatments   = listHandler  (svc.listTreatments              );
export const getTreatment     = getHandler   (svc.getTreatmentByCode,     "Treatment");
export const createTreatment  = createHandler(svc.createTreatment             );
export const updateTreatment  = updateHandler(svc.updateTreatment,        "Treatment");
export const deleteTreatment  = deleteHandler(svc.deleteTreatment,        "Treatment");

// ─── Fees ─────────────────────────────────────────────────────────────────────
export const listFees         = listHandler  (svc.listFees                    );
export const getFee           = getHandler   (svc.getFeeByCode,           "Fee");
export const createFee        = createHandler(svc.createFee                   );
export const updateFee        = updateHandler(svc.updateFee,              "Fee");
export const deleteFee        = deleteHandler(svc.deleteFee,              "Fee");

// ─── Medical Conditions ───────────────────────────────────────────────────────
export const listMedicalConditions  = listHandler  (svc.listMedicalConditions              );
export const getMedicalCondition    = getHandler   (svc.getMedicalConditionByCode, "Medical condition");
export const createMedicalCondition = createHandler(svc.createMedicalCondition             );
export const updateMedicalCondition = updateHandler(svc.updateMedicalCondition,    "Medical condition");
export const deleteMedicalCondition = deleteHandler(svc.deleteMedicalCondition,    "Medical condition");

// ─── Read-only lookups (original handler pattern, no pagination or code) ─────
export const listBloodTypes = handler(svc.listBloodTypes);
export const listAllDoctors = handler(svc.listAllDoctors);