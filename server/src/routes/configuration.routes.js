import { Router } from "express";
import * as c from "../controllers/configuration.controller.js";

const r = Router();
r.get("/departments", c.listDepartments);
r.get("/medicines", c.listMedicines);
r.get("/treatments", c.listTreatments);
r.get("/fees", c.listFees);
r.get("/conditions", c.listMedicalConditions);
r.get("/blood-types", c.listBloodTypes);
r.get("/doctors", c.listAllDoctors);
export default r;
