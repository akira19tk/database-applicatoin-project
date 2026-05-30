import { Router } from "express";
import * as c from "../controllers/visits.controller.js";

const r = Router();
r.get("/", c.listVisits);
r.post("/", c.createVisit);
r.get("/:code", c.getVisit);
r.put("/:code", c.updateVisit);
r.get("/:code/appointed-doctor", c.getAppointedDoctor);
r.post("/:code/appointed-doctor", c.saveAppointedDoctor);
r.get("/:code/prescription-chart", c.getPrescriptionChart);
r.post("/:code/prescription-chart", c.savePrescriptionChart);
r.get("/:code/treatment-chart", c.getTreatmentChart);
r.post("/:code/treatment-chart", c.saveTreatmentChart);
r.get("/:code/diagnosis-chart", c.getDiagnosisChart);
r.post("/:code/diagnosis-chart", c.saveDiagnosisChart);
export default r;
