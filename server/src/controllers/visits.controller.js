import * as svc from "../services/visits.service.js";
import { sendList, sendOne, sendCreated, sendOk, sendError } from "../utils/response.js";

export async function listVisits(req, res) {
  try { sendList(res, await svc.listVisits(req.query)); }
  catch (e) { sendError(res, e.message, 500); }
}

export async function getVisit(req, res) {
  try {
    const row = await svc.getVisitByCode(req.params.code);
    if (!row) return sendError(res, "Visit not found", 404);
    sendOne(res, row);
  } catch (e) { sendError(res, e.message, 500); }
}

export async function createVisit(req, res) {
  try { sendCreated(res, await svc.createVisit(req.body)); }
  catch (e) { sendError(res, e.message, e.statusCode ?? 400); }
}

export async function updateVisit(req, res) {
  try {
    const result = await svc.updateVisitByCode(req.params.code, req.body);
    if (!result) return sendError(res, "Visit not found", 404);
    sendOk(res, result);
  } catch (e) { sendError(res, e.message, 400); }
}

// Charts
export async function getAppointedDoctor(req, res) {
  try {
    const data = await svc.getAppointedDoctor(req.params.code);
    if (!data) return sendError(res, "Visit not found", 404);
    sendOne(res, data);
  } catch (e) { sendError(res, e.message, 500); }
}

export async function saveAppointedDoctor(req, res) {
  try { sendOk(res, await svc.saveAppointedDoctor(req.params.code, req.body)); }
  catch (e) { sendError(res, e.message, e.statusCode ?? 400); }
}

export async function getPrescriptionChart(req, res) {
  try {
    const data = await svc.getPrescriptionChart(req.params.code);
    if (!data) return sendError(res, "Visit not found", 404);
    sendOne(res, data);
  } catch (e) { sendError(res, e.message, 500); }
}

export async function savePrescriptionChart(req, res) {
  try { sendOk(res, await svc.savePrescriptionChart(req.params.code, req.body)); }
  catch (e) { sendError(res, e.message, e.statusCode ?? 400); }
}

export async function getTreatmentChart(req, res) {
  try {
    const data = await svc.getTreatmentChart(req.params.code);
    if (!data) return sendError(res, "Visit not found", 404);
    sendOne(res, data);
  } catch (e) { sendError(res, e.message, 500); }
}

export async function saveTreatmentChart(req, res) {
  try { sendOk(res, await svc.saveTreatmentChart(req.params.code, req.body)); }
  catch (e) { sendError(res, e.message, e.statusCode ?? 400); }
}

export async function getDiagnosisChart(req, res) {
  try {
    const data = await svc.getDiagnosisChart(req.params.code);
    if (!data) return sendError(res, "Visit not found", 404);
    sendOne(res, data);
  } catch (e) { sendError(res, e.message, 500); }
}

export async function saveDiagnosisChart(req, res) {
  try { sendOk(res, await svc.saveDiagnosisChart(req.params.code, req.body)); }
  catch (e) { sendError(res, e.message, e.statusCode ?? 400); }
}
