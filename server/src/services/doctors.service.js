import { pool } from "../db/pool.js";

export async function listDoctors({ search = "", page = 1, limit = 10 } = {}) {
  const offset = (Number(page) - 1) * Number(limit);
  const s = `%${search}%`;
  const { rows: [{ total }] } = await pool.query(
    `SELECT COUNT(*) as total FROM doctor WHERE doctor_code ILIKE $1 OR doctor_name ILIKE $1 OR specialty ILIKE $1`, [s]
  );
  const { rows } = await pool.query(
    `SELECT d.id, d.doctor_code, d.doctor_name, d.gender, d.specialty, d.created_at, dep.department_name
     FROM doctor d LEFT JOIN department dep ON dep.id = d.department_id
     WHERE d.doctor_code ILIKE $1 OR d.doctor_name ILIKE $1 OR d.specialty ILIKE $1
     ORDER BY d.doctor_name ASC LIMIT $2 OFFSET $3`,
    [s, Number(limit), offset]
  );
  return { data: rows, total: Number(total), page: Number(page), limit: Number(limit), totalPages: Math.ceil(Number(total) / Number(limit)) };
}

export async function getDoctorByCode(code) {
  const { rows } = await pool.query(
    `SELECT d.id, d.doctor_code, d.doctor_name, d.gender, d.specialty, d.created_at,
            dep.department_name, dep.department_code
     FROM doctor d LEFT JOIN department dep ON dep.id = d.department_id
     WHERE d.doctor_code = $1`, [code]
  );
  return rows[0] ?? null;
}
