import * as svc from "../services/clinicReports.service.js";
import { sendOne, sendError } from "../utils/response.js";

// Each report controller wraps its service call and returns the rows array.
const handler = (fn) => async (req, res) => {
  try { sendOne(res, await fn(req.query)); }
  catch (e) { sendError(res, e.message, 500); }
};

export const patients = handler(svc.listPatientsReport);
export const patientsVisiting = handler(svc.listPatientsVisiting);
export const medicalProblems = handler(svc.listMedicalProblems);
export const topConditions = handler(svc.topConditions);
export const medicines = handler(svc.listMedicinesReport);
export const prescriptions = handler(svc.listPrescriptions);
export const topMedicines = handler(svc.topMedicines);
export const diagnoses = handler(svc.listDiagnoses);
export const diagnosesByChart = handler(svc.listDiagnosesByChart);
export const doctors = handler(svc.listDoctorsReport);
export const patientsByDoctor = handler(svc.patientsByDoctor);
export const mostAppointedDoctors = handler(svc.mostAppointedDoctors);
export const bills = handler(svc.listBillsReport);
export const revenueByChargeType = handler(svc.revenueByChargeType);
export const visits = handler(svc.listVisitsReport);
export const visitsMonthly = handler(svc.visitsMonthly);
