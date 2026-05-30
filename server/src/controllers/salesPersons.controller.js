import { listSalesPersons, getSalesPerson, createSalesPerson, updateSalesPerson, deleteSalesPerson } from "../services/salesPersons.service.js";

export async function handleList(req, res) {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;
    const result = await listSalesPersons({ search, page, limit });
    res.json({
      success: true,
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
}

export async function handleGet(req, res) {
  try {
    const { code } = req.params;
    const result = await getSalesPerson(code);
    if (!result) return res.status(404).json({ success: false, error: { message: `Sales person not found: ${code}` } });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
}

export async function handleCreate(req, res) {
  try {
    const { code, name, start_work_date } = req.body;
    const result = await createSalesPerson({ code, name, start_work_date });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
}

export async function handleUpdate(req, res) {
  try {
    const { code } = req.params;
    const { name, start_work_date } = req.body;
    const result = await updateSalesPerson(code, { name, start_work_date });
    if (!result) return res.status(404).json({ success: false, error: { message: `Sales person not found: ${code}` } });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
}

export async function handleDelete(req, res) {
  try {
    const { code } = req.params;
    await deleteSalesPerson(code);
    res.json({ success: true, data: { ok: true } });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
}
