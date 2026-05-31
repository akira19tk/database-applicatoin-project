import { pool } from "../db/pool.js";

export async function listDoctors({ search = "", page = 1, limit = 10, sortBy = "doctor_name", sortDir = "asc" } = {}) {
  const allowed = ["doctor_code", "doctor_name", "gender", "specialty"];
  const col = allowed.includes(sortBy) ? sortBy : "doctor_name";
  const dir = sortDir === "desc" ? "DESC" : "ASC";
  const offset = (Number(page) - 1) * Number(limit);
  const s = `%${search}%`;
  const { rows: [{ total }] } = await pool.query(
    `SELECT COUNT(*) as total FROM doctor WHERE doctor_code ILIKE $1 OR doctor_name ILIKE $1 OR specialty ILIKE $1`, [s]
  );
  const { rows } = await pool.query(
    `SELECT d.id, d.doctor_code, d.doctor_name, d.gender, d.specialty, d.created_at, dep.department_name
     FROM doctor d LEFT JOIN department dep ON dep.id = d.department_id
     WHERE d.doctor_code ILIKE $1 OR d.doctor_name ILIKE $1 OR d.specialty ILIKE $1
     ORDER BY d.${col} ${dir} NULLS LAST LIMIT $2 OFFSET $3`,
    [s, Number(limit), offset]
  );
  return { data: rows, total: Number(total), page: Number(page), limit: Number(limit), totalPages: Math.ceil(Number(total) / Number(limit)) };
}

export async function getDoctorByCode(code) {
  const { rows } = await pool.query(
    `SELECT d.id, d.doctor_code, d.doctor_name, d.gender, d.specialty, d.created_at,
            d.department_id, dep.department_name, dep.department_code
     FROM doctor d LEFT JOIN department dep ON dep.id = d.department_id
     WHERE d.doctor_code = $1`, [code]
  );
  return rows[0] ?? null;
}

export async function createDoctor({ doctor_name, gender, specialty, department_id } = {}) {
  const { rows: [{ m }] } = await pool.query("SELECT MAX(id) as m FROM doctor");
  const next = (Number(m) || 0) + 1;
  const doctor_code = `DOC-${next.toString().padStart(3, "0")}`;
  await pool.query(
    "INSERT INTO doctor (id, doctor_code, doctor_name, gender, specialty, department_id) VALUES ($1,$2,$3,$4,$5,$6)",
    [next, doctor_code, doctor_name, gender, specialty || null, department_id || null]
  );
  return { doctor_code };
}

export async function updateDoctorByCode(code, { doctor_name, gender, specialty, department_id } = {}) {
  const existing = await getDoctorByCode(code);
  if (!existing) return null;
  await pool.query(
    "UPDATE doctor SET doctor_name=$1, gender=$2, specialty=$3, department_id=$4 WHERE doctor_code=$5",
    [doctor_name, gender, specialty || null, department_id || null, code]
  );
  return { ok: true };
}

export async function deleteDoctorByCode(code) {
  const existing = await getDoctorByCode(code);
  if (!existing) return null;
  try {
    await pool.query("DELETE FROM doctor WHERE doctor_code=$1", [code]);
    return { ok: true };
  } catch (err) {
    if (err?.code === "23503") {
      const e = new Error("Cannot delete doctor because they have existing records.");
      e.statusCode = 400; throw e;
    }
    throw err;
  }
}