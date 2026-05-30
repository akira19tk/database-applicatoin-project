import * as svc from "../services/patients.service.js";
import { sendList, sendOne, sendCreated, sendOk, sendError } from "../utils/response.js";
import logger from "../utils/logger.js";

export async function listPatients(req, res) {
  try { sendList(res, await svc.listPatients(req.query)); }
  catch (e) { logger.error("listPatients", { error: e.message }); sendError(res, e.message, 500); }
}

export async function getPatient(req, res) {
  try {
    const row = await svc.getPatientByCode(req.params.code);
    if (!row) return sendError(res, "Patient not found", 404);
    sendOne(res, row);
  } catch (e) { sendError(res, e.message, 500); }
}

export async function createPatient(req, res) {
  try { sendCreated(res, await svc.createPatient(req.body)); }
  catch (e) { sendError(res, e.message, 400); }
}

export async function updatePatient(req, res) {
  try {
    const result = await svc.updatePatientByCode(req.params.code, req.body);
    if (!result) return sendError(res, "Patient not found", 404);
    sendOk(res, result);
  } catch (e) { sendError(res, e.message, 400); }
}

export async function deletePatient(req, res) {
  try {
    const result = await svc.deletePatientByCode(req.params.code);
    if (!result) return sendError(res, "Patient not found", 404);
    sendOk(res, result);
  } catch (e) { sendError(res, e.message, e.statusCode ?? 500); }
}
