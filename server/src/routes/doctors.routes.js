import { Router } from "express";
import * as c from "../controllers/doctors.controller.js";

const r = Router();
r.get("/", c.listDoctors);
r.get("/:code", c.getDoctor);
export default r;
