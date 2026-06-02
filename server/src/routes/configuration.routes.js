import { Router } from "express";
import * as c from "../controllers/configuration.controller.js";

const r = Router();

// ─── Departments ─────────────────────────────────────────────────────────────
r.get    ("/departments",           c.listDepartments);
r.post   ("/departments",           c.createDepartment);
r.get    ("/departments/:code",     c.getDepartment);
r.put    ("/departments/:code",     c.updateDepartment);
r.delete ("/departments/:code",     c.deleteDepartment);

// ─── Medicines ───────────────────────────────────────────────────────────────
r.get    ("/medicines",             c.listMedicines);
r.post   ("/medicines",             c.createMedicine);
r.get    ("/medicines/:code",       c.getMedicine);
r.put    ("/medicines/:code",       c.updateMedicine);
r.delete ("/medicines/:code",       c.deleteMedicine);

// ─── Treatments ──────────────────────────────────────────────────────────────
r.get    ("/treatments",            c.listTreatments);
r.post   ("/treatments",            c.createTreatment);
r.get    ("/treatments/:code",      c.getTreatment);
r.put    ("/treatments/:code",      c.updateTreatment);
r.delete ("/treatments/:code",      c.deleteTreatment);

// ─── Fees ─────────────────────────────────────────────────────────────────────
r.get    ("/fees",                  c.listFees);
r.post   ("/fees",                  c.createFee);
r.get    ("/fees/:code",            c.getFee);
r.put    ("/fees/:code",            c.updateFee);
r.delete ("/fees/:code",            c.deleteFee);

// ─── Medical Conditions ───────────────────────────────────────────────────────
r.get    ("/conditions",            c.listMedicalConditions);
r.post   ("/conditions",            c.createMedicalCondition);
r.get    ("/conditions/:code",      c.getMedicalCondition);
r.put    ("/conditions/:code",      c.updateMedicalCondition);
r.delete ("/conditions/:code",      c.deleteMedicalCondition);

// ─── Read-only lookups (dropdowns) ───────────────────────────────────────────
r.get    ("/blood-types",           c.listBloodTypes);
r.get    ("/doctors",               c.listAllDoctors);

export default r;
