import { Router } from "express";
import * as c from "../controllers/patientBills.controller.js";

const r = Router();
r.get("/", c.listBills);
r.get("/by-visit/:visitCode", c.getBillByVisit);
r.post("/by-visit/:visitCode", c.createBillForVisit);
r.get("/:code", c.getBillByCode);
r.post("/:code/lines", c.saveBillLines);
r.post("/:code/transactions", c.addTransaction);
export default r;
