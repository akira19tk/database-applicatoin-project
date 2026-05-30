import { pool } from "../db/pool.js";

export async function listSalesPersons({ search, page, limit }) {
  const offset = (Number(page) - 1) * Number(limit);
  const searchParam = `%${search}%`;

  const countResult = await pool.query(
    `SELECT COUNT(*) as total FROM sales_person
     WHERE code ILIKE $1 OR name ILIKE $1`,
    [searchParam],
  );

  const { rows } = await pool.query(
    `SELECT id, code, name, start_work_date
     FROM sales_person
     WHERE code ILIKE $1 OR name ILIKE $1
     ORDER BY code ASC
     LIMIT $2 OFFSET $3`,
    [searchParam, Number(limit), offset],
  );

  const total = Number(countResult.rows[0].total);
  return {
    data: rows,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  };
}

export async function getSalesPerson(code) {
  const { rows } = await pool.query(
    "SELECT id, code, name, start_work_date FROM sales_person WHERE code = $1",
    [code],
  );
  return rows[0] || null;
}

export async function createSalesPerson({ code, name, start_work_date }) {
  let resolvedCode = code;
  if (!resolvedCode || String(resolvedCode).trim() === "") {
    const maxRes = await pool.query("SELECT MAX(id) as m FROM sales_person");
    const nextId = (Number(maxRes.rows[0].m) || 0) + 1;
    resolvedCode = `SP${nextId.toString().padStart(3, "0")}`;
  }
  const { rows } = await pool.query(
    `INSERT INTO sales_person (id, created_at, code, name, start_work_date)
     VALUES ((SELECT coalesce(max(id),0)+1 FROM sales_person), now(), $1, $2, $3)
     RETURNING id, code, name, start_work_date`,
    [resolvedCode, name, start_work_date || null],
  );
  return rows[0];
}

export async function updateSalesPerson(code, { name, start_work_date }) {
  const { rows } = await pool.query(
    `UPDATE sales_person SET name=$1, start_work_date=$2 WHERE code=$3
     RETURNING id, code, name, start_work_date`,
    [name, start_work_date || null, code],
  );
  return rows[0] || null;
}

export async function deleteSalesPerson(code) {
  await pool.query("DELETE FROM sales_person WHERE code=$1", [code]);
  return { ok: true };
}
