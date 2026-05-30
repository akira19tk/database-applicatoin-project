import * as receiptsService from "../services/receipts.service.js";
import { sendList, sendOne, sendCreated, sendOk, sendData, sendError } from "../utils/response.js";
import logger from "../utils/logger.js";

export async function handleList(req, res) {
  try {
    const result = await receiptsService.listReceipts(req.query);
    sendList(res, result);
  } catch (err) {
    logger.error("listReceipts failed", { error: err?.message ?? String(err) });
    sendError(res, err?.message ?? String(err), 500);
  }
}

export async function handleGet(req, res) {
  try {
    const receiptNo = decodeURIComponent(req.params.receiptNo || "");
    const result = await receiptsService.getReceipt(receiptNo);
    if (!result) return sendError(res, "Receipt not found", 404);
    sendOne(res, result);
  } catch (err) {
    logger.error("getReceipt failed", { receiptNo: req.params.receiptNo, error: err?.message ?? String(err) });
    sendError(res, err?.message ?? String(err), 500);
  }
}

export async function handleCreate(req, res) {
  try {
    const result = await receiptsService.createReceipt(req.body);
    sendCreated(res, result);
  } catch (err) {
    logger.error("createReceipt failed", { error: err?.message ?? String(err) });
    sendError(res, err?.message ?? String(err), 500);
  }
}

export async function handleUpdate(req, res) {
  try {
    const receiptNo = decodeURIComponent(req.params.receiptNo || "");
    const result = await receiptsService.updateReceipt(receiptNo, req.body);
    if (!result) return sendError(res, "Receipt not found", 404);
    sendOk(res, result);
  } catch (err) {
    logger.error("updateReceipt failed", { receiptNo: req.params.receiptNo, error: err?.message ?? String(err) });
    sendError(res, err?.message ?? String(err), 500);
  }
}

export async function handleDelete(req, res) {
  try {
    const receiptNo = decodeURIComponent(req.params.receiptNo || "");
    const result = await receiptsService.deleteReceipt(receiptNo);
    if (!result) return sendError(res, "Receipt not found", 404);
    sendOk(res, result);
  } catch (err) {
    logger.error("deleteReceipt failed", { receiptNo: req.params.receiptNo, error: err?.message ?? String(err) });
    sendError(res, err?.message ?? String(err), 500);
  }
}

export async function handleListUnpaidInvoices(req, res) {
  try {
    const { customer_code, receipt_no } = req.query;
    if (!customer_code) return sendError(res, "customer_code is required", 400);
    const result = await receiptsService.listUnpaidInvoicesByCustomer(customer_code, receipt_no || null);
    sendData(res, result);
  } catch (err) {
    logger.error("listUnpaidInvoices failed", { error: err?.message ?? String(err) });
    sendError(res, err?.message ?? String(err), 500);
  }
}
