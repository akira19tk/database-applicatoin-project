import { pool } from "../db/pool.js";

export async function listReceipts({
  search = "",
  page = 1,
  limit = 10,
  sortBy = "receipt_date",
  sortDir = "desc",
} = {}) {
  const offset = (Number(page) - 1) * Number(limit);

  const allowedSort = ["receipt_no", "receipt_date", "customer_code", "customer_name", "payment_method", "total_received"];
  const sortColumn = allowedSort.includes(sortBy) ? sortBy : "receipt_date";
  const sortDirection = sortDir === "asc" ? "ASC" : "DESC";

  const searchParam = `%${search}%`;

  const countResult = await pool.query(
    `SELECT COUNT(*) as total
     FROM receipt r
     JOIN customer c ON c.id = r.customer_id
     WHERE r.receipt_no ILIKE $1 OR c.name ILIKE $1`,
    [searchParam],
  );
  const total = Number(countResult.rows[0].total);

  const { rows } = await pool.query(
    `SELECT r.receipt_no, r.receipt_date, c.code as customer_code, c.name as customer_name,
            r.payment_method, r.total_received
     FROM receipt r
     JOIN customer c ON c.id = r.customer_id
     WHERE r.receipt_no ILIKE $1 OR c.name ILIKE $1
     ORDER BY ${sortColumn} ${sortDirection} NULLS LAST, r.id DESC
     LIMIT $2 OFFSET $3`,
    [searchParam, Number(limit), offset],
  );

  return {
    data: rows,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  };
}

export async function getReceipt(receiptNo) {
  const headerRes = await pool.query(
    `SELECT r.id, r.receipt_no, r.receipt_date, r.payment_method, r.payment_notes, r.total_received,
            c.code as customer_code, c.name as customer_name
     FROM receipt r
     JOIN customer c ON c.id = r.customer_id
     WHERE r.receipt_no = $1`,
    [receiptNo],
  );
  if (headerRes.rowCount === 0) return null;

  const header = headerRes.rows[0];
  const receiptId = header.id;

  // amount_already_received excludes current receipt's own payments
  const linesRes = await pool.query(
    `SELECT rli.id, i.invoice_no, i.amount_due,
            (SELECT COALESCE(SUM(rli2.amount_received), 0)
             FROM receipt_line_item rli2
             WHERE rli2.invoice_id = rli.invoice_id AND rli2.receipt_id != $2) AS amount_already_received,
            rli.amount_received
     FROM receipt_line_item rli
     JOIN invoice i ON i.id = rli.invoice_id
     WHERE rli.receipt_id = $1
     ORDER BY rli.id`,
    [receiptId, receiptId],
  );

  return { header, line_items: linesRes.rows };
}

export async function generateReceiptNo(client) {
  const yy = new Date().getFullYear().toString().slice(-2);
  const res = await client.query("SELECT MAX(id) as m FROM receipt");
  const nextId = (Number(res.rows[0].m) || 0) + 1;
  return `RCT${yy}-${nextId.toString().padStart(5, "0")}`;
}

export async function createReceipt({ receipt_no, receipt_date, customer_code, payment_method, payment_notes, line_items }) {
  const client = await pool.connect();
  try {
    await client.query("begin");

    const custRes = await client.query("SELECT id FROM customer WHERE code = $1", [customer_code]);
    if (custRes.rowCount === 0) throw new Error(`Customer not found: ${customer_code}`);
    const customer_id = custRes.rows[0].id;

    let resolvedReceiptNo = receipt_no;
    if (!resolvedReceiptNo || String(resolvedReceiptNo).trim() === "") {
      resolvedReceiptNo = await generateReceiptNo(client);
    }

    const total_received = line_items.reduce((s, li) => s + Number(li.amount_received), 0);

    const rcptRes = await client.query(
      `INSERT INTO receipt (id, created_at, receipt_no, receipt_date, customer_id, payment_method, payment_notes, total_received)
       VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM receipt), now(), $1, $2, $3, $4, $5, $6)
       RETURNING id, receipt_no`,
      [resolvedReceiptNo, receipt_date, customer_id, payment_method || "cash", payment_notes || null, total_received],
    );

    const receipt_id = rcptRes.rows[0].id;

    for (const li of line_items) {
      const invRes = await client.query("SELECT id FROM invoice WHERE invoice_no = $1", [li.invoice_no]);
      if (invRes.rowCount === 0) throw new Error(`Invoice not found: ${li.invoice_no}`);
      const invoice_id = invRes.rows[0].id;

      await client.query(
        `INSERT INTO receipt_line_item (id, created_at, receipt_id, invoice_id, amount_received)
         VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM receipt_line_item), now(), $1, $2, $3)`,
        [receipt_id, invoice_id, Number(li.amount_received)],
      );
    }

    await client.query("commit");
    return { receipt_no: rcptRes.rows[0].receipt_no };
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

export async function updateReceipt(receiptNo, { receipt_date, customer_code, payment_method, payment_notes, line_items }) {
  const client = await pool.connect();
  try {
    await client.query("begin");

    const existing = await client.query("SELECT id FROM receipt WHERE receipt_no = $1", [receiptNo]);
    if (existing.rowCount === 0) return null;
    const receipt_id = existing.rows[0].id;

    const custRes = await client.query("SELECT id FROM customer WHERE code = $1", [customer_code]);
    if (custRes.rowCount === 0) throw new Error(`Customer not found: ${customer_code}`);
    const customer_id = custRes.rows[0].id;

    const total_received = line_items.reduce((s, li) => s + Number(li.amount_received), 0);

    await client.query(
      `UPDATE receipt SET receipt_date=$1, customer_id=$2, payment_method=$3, payment_notes=$4, total_received=$5
       WHERE id=$6`,
      [receipt_date, customer_id, payment_method || "cash", payment_notes || null, total_received, receipt_id],
    );

    // DELETE old line items then re-INSERT
    await client.query("DELETE FROM receipt_line_item WHERE receipt_id = $1", [receipt_id]);

    for (const li of line_items) {
      const invRes = await client.query("SELECT id FROM invoice WHERE invoice_no = $1", [li.invoice_no]);
      if (invRes.rowCount === 0) throw new Error(`Invoice not found: ${li.invoice_no}`);
      const invoice_id = invRes.rows[0].id;

      await client.query(
        `INSERT INTO receipt_line_item (id, created_at, receipt_id, invoice_id, amount_received)
         VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM receipt_line_item), now(), $1, $2, $3)`,
        [receipt_id, invoice_id, Number(li.amount_received)],
      );
    }

    await client.query("commit");
    return { receipt_no: receiptNo };
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteReceipt(receiptNo) {
  const res = await pool.query("DELETE FROM receipt WHERE receipt_no = $1 RETURNING id", [receiptNo]);
  if (res.rowCount === 0) return null;
  return { ok: true };
}

export async function listUnpaidInvoicesByCustomer(customerCode, excludeReceiptNo = null) {
  const custRes = await pool.query("SELECT id FROM customer WHERE code = $1", [customerCode]);
  if (custRes.rowCount === 0) return [];
  const customer_id = custRes.rows[0].id;

  let excludeReceiptId = null;
  if (excludeReceiptNo) {
    const rcptRes = await pool.query("SELECT id FROM receipt WHERE receipt_no = $1", [excludeReceiptNo]);
    if (rcptRes.rowCount > 0) excludeReceiptId = rcptRes.rows[0].id;
  }

  const { rows } = await pool.query(
    `SELECT i.invoice_no, i.invoice_date, i.amount_due,
            COALESCE(SUM(CASE WHEN ($2::bigint IS NULL OR rli.receipt_id != $2) THEN rli.amount_received ELSE 0 END), 0) AS amount_already_received,
            i.amount_due - COALESCE(SUM(CASE WHEN ($2::bigint IS NULL OR rli.receipt_id != $2) THEN rli.amount_received ELSE 0 END), 0) AS amount_remain
     FROM invoice i
     LEFT JOIN receipt_line_item rli ON rli.invoice_id = i.id
     WHERE i.customer_id = $1
     GROUP BY i.id, i.invoice_no, i.invoice_date, i.amount_due
     HAVING i.amount_due - COALESCE(SUM(CASE WHEN ($2::bigint IS NULL OR rli.receipt_id != $2) THEN rli.amount_received ELSE 0 END), 0) > 0
     ORDER BY i.invoice_date`,
    [customer_id, excludeReceiptId],
  );

  return rows;
}
