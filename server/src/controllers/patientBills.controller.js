import * as svc from "../services/patientBills.service.js";
import { sendList, sendOne, sendCreated, sendOk, sendError } from "../utils/response.js";

export async function listBills(req, res) {
  try { sendList(res, await svc.listBills(req.query)); }
  catch (e) { sendError(res, e.message, 500); }
}

export async function getBillByCode(req, res) {
  try {
    const row = await svc.getBillByCode(req.params.code);
    if (!row) return sendError(res, "Bill not found", 404);
    sendOne(res, row);
  } catch (e) { sendError(res, e.message, 500); }
}

export async function getBillByVisit(req, res) {
  try {
    const data = await svc.getBillByVisit(req.params.visitCode);
    sendOne(res, data);
  } catch (e) { sendError(res, e.message, 500); }
}

export async function createBillForVisit(req, res) {
  try { sendCreated(res, await svc.createBillForVisit(req.params.visitCode)); }
  catch (e) { sendError(res, e.message, e.statusCode ?? 400); }
}

export async function saveBillLines(req, res) {
  try { sendOk(res, await svc.saveBillLines(req.params.code, req.body)); }
  catch (e) { sendError(res, e.message, e.statusCode ?? 400); }
}

export async function addTransaction(req, res) {
  try { sendCreated(res, await svc.addTransaction(req.params.code, req.body)); }
  catch (e) { sendError(res, e.message, e.statusCode ?? 400); }
}
