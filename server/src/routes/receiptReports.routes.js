import { Router } from "express";
import * as c from "../controllers/receiptReports.controller.js";

const r = Router();
r.get("/receipt-list", c.handleReceiptList);
r.get("/invoice-receipt", c.handleInvoiceReceiptReport);

export default r;
