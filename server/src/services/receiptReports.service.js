import { pool } from "../db/pool.js";

export async function getReceiptList({ date_from, date_to, customer_code, page = 1, limit = 10 } = {}) {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (date_from) { conditions.push(`r.receipt_date >= $${idx++}`); params.push(date_from); }
  if (date_to) { conditions.push(`r.receipt_date <= $${idx++}`); params.push(date_to); }
  if (customer_code) { conditions.push(`c.code = $${idx++}`); params.push(customer_code); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const offset = (Number(page) - 1) * Number(limit);

  const countRes = await pool.query(
    `SELECT COUNT(*) as total
     FROM receipt r
     JOIN customer c ON c.id = r.customer_id
     ${where}`,
    params,
  );
  const total = Number(countRes.rows[0].total);

  const { rows } = await pool.query(
    `SELECT r.receipt_no, r.receipt_date, c.code as customer_code, c.name as customer_name,
            r.payment_method, r.payment_notes, r.total_received
     FROM receipt r
     JOIN customer c ON c.id = r.customer_id
     ${where}
     ORDER BY r.receipt_date DESC, r.id DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, Number(limit), offset],
  );

  return {
    data: rows,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  };
}

export async function getInvoiceReceiptReport({ date_from, date_to, customer_code, page = 1, limit = 10 } = {}) {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (date_from) { conditions.push(`i.invoice_date >= $${idx++}`); params.push(date_from); }
  if (date_to) { conditions.push(`i.invoice_date <= $${idx++}`); params.push(date_to); }
  if (customer_code) { conditions.push(`c.code = $${idx++}`); params.push(customer_code); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const offset = (Number(page) - 1) * Number(limit);

  const countRes = await pool.query(
    `WITH total_received_cte AS (
       SELECT invoice_id, COALESCE(SUM(amount_received), 0) AS total_received
       FROM receipt_line_item
       GROUP BY invoice_id
     )
     SELECT COUNT(*) as total
     FROM invoice i
     JOIN customer c ON c.id = i.customer_id
     LEFT JOIN receipt_line_item rli ON rli.invoice_id = i.id
     LEFT JOIN receipt r ON r.id = rli.receipt_id
     LEFT JOIN total_received_cte trc ON trc.invoice_id = i.id
     ${where}`,
    params,
  );
  const total = Number(countRes.rows[0].total);

  const { rows } = await pool.query(
    `WITH total_received_cte AS (
       SELECT invoice_id, COALESCE(SUM(amount_received), 0) AS total_received
       FROM receipt_line_item
       GROUP BY invoice_id
     )
     SELECT i.invoice_no, i.invoice_date, c.code as customer_code, c.name as customer_name,
            i.amount_due,
            COALESCE(trc.total_received, 0) AS total_received,
            i.amount_due - COALESCE(trc.total_received, 0) AS amount_remain,
            r.receipt_no, r.receipt_date AS receipt_date, rli.amount_received AS receipt_amount
     FROM invoice i
     JOIN customer c ON c.id = i.customer_id
     LEFT JOIN receipt_line_item rli ON rli.invoice_id = i.id
     LEFT JOIN receipt r ON r.id = rli.receipt_id
     LEFT JOIN total_received_cte trc ON trc.invoice_id = i.id
     ${where}
     ORDER BY i.invoice_date DESC, i.id DESC, r.receipt_date
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, Number(limit), offset],
  );

  return {
    data: rows,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  };
}
