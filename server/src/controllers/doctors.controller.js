import * as svc from "../services/doctors.service.js";
import { sendList, sendOne, sendError } from "../utils/response.js";

export async function listDoctors(req, res) {
  try { sendList(res, await svc.listDoctors(req.query)); }
  catch (e) { sendError(res, e.message, 500); }
}

export async function getDoctor(req, res) {
  try {
    const row = await svc.getDoctorByCode(req.params.code);
    if (!row) return sendError(res, "Doctor not found", 404);
    sendOne(res, row);
  } catch (e) { sendError(res, e.message, 500); }
}
