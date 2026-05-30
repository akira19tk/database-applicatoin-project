import { Router } from "express";
import * as c from "../controllers/receipts.controller.js";

const r = Router();
r.get("/", c.handleList);
r.get("/unpaid-invoices", c.handleListUnpaidInvoices);
r.get("/:receiptNo", c.handleGet);
r.post("/", c.handleCreate);
r.put("/:receiptNo", c.handleUpdate);
r.delete("/:receiptNo", c.handleDelete);

export default r;
