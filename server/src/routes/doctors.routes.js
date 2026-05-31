import { Router } from "express";
import * as c from "../controllers/doctors.controller.js";

const r = Router();
r.get("/", c.listDoctors);
r.post("/", c.createDoctor);
r.get("/:code", c.getDoctor);
r.put("/:code", c.updateDoctor);
r.delete("/:code", c.deleteDoctor);

export default r;
