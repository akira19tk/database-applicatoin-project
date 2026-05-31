import * as svc from "../services/doctors.service.js";
import { sendList, sendOne, sendCreated, sendOk, sendError } from "../utils/response.js";
import logger from "../utils/logger.js";

export async function listDoctors(req, res) {
  try { sendList(res, await svc.listDoctors(req.query)); }
  catch (e) { logger.error("listDoctors", { error: e.message }); sendError(res, e.message, 500); }
}

export async function getDoctor(req, res) {
  try {
    const row = await svc.getDoctorByCode(req.params.code);
    if (!row) return sendError(res, "Doctor not found", 404);
    sendOne(res, row);
  } catch (e) { logger.error("getDoctor", { error: e.message }); sendError(res, e.message, 500); }
}

export async function createDoctor(req, res) {
  try { sendCreated(res, await svc.createDoctor(req.body)); }
  catch (e) { logger.error("createDoctor", { error: e.message }); sendError(res, e.message, 400); }
}

export async function updateDoctor(req, res) {
  try {
    const result = await svc.updateDoctorByCode(req.params.code, req.body);
    if (!result) return sendError(res, "Doctor not found", 404);
    sendOk(res, result);
  } catch (e) { logger.error("updateDoctor", { error: e.message }); sendError(res, e.message, 400); }
}

export async function deleteDoctor(req, res) {
  try {
    const result = await svc.deleteDoctorByCode(req.params.code);
    if (!result) return sendError(res, "Doctor not found", 404);
    sendOk(res, result);
  } catch (e) { logger.error("deleteDoctor", { error: e.message }); sendError(res, e.message, e.statusCode ?? 500); }
}