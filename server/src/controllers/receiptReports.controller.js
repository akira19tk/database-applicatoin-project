import * as receiptReportsService from "../services/receiptReports.service.js";
import { sendList, sendError } from "../utils/response.js";
import logger from "../utils/logger.js";

export async function handleReceiptList(req, res) {
  try {
    const result = await receiptReportsService.getReceiptList(req.query);
    sendList(res, result);
  } catch (err) {
    logger.error("getReceiptList failed", { error: err?.message ?? String(err) });
    sendError(res, err?.message ?? String(err), 500);
  }
}

export async function handleInvoiceReceiptReport(req, res) {
  try {
    const result = await receiptReportsService.getInvoiceReceiptReport(req.query);
    sendList(res, result);
  } catch (err) {
    logger.error("getInvoiceReceiptReport failed", { error: err?.message ?? String(err) });
    sendError(res, err?.message ?? String(err), 500);
  }
}
