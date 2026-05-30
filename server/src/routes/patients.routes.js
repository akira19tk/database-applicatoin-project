import { Router } from "express";
import * as c from "../controllers/patients.controller.js";

const r = Router();
r.get("/", c.listPatients);
r.post("/", c.createPatient);
r.get("/:code", c.getPatient);
r.put("/:code", c.updatePatient);
r.delete("/:code", c.deletePatient);
export default r;
