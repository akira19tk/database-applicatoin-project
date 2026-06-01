import { pool } from "../db/pool.js";

export async function listPatients({ search = "", page = 1, limit = 10, sortBy = "patient_name", sortDir = "asc" } = {}) {
  const offset = (Number(page) - 1) * Number(limit);
  const allowed = ["patient_code", "patient_name", "gender", "date_of_birth"];
  const col = allowed.includes(sortBy) ? sortBy : "patient_name";
  const dir = sortDir === "desc" ? "DESC" : "ASC";
  const s = `%${search}%`;

  const { rows: [{ total }] } = await pool.query(
    `SELECT COUNT(*) as total FROM patient WHERE patient_code ILIKE $1 OR patient_name ILIKE $1`, [s]
  );

  const { rows } = await pool.query(
    `SELECT p.id, p.patient_code, p.patient_name, p.gender, p.date_of_birth, p.created_at, bt.blood_type_full
     FROM patient p LEFT JOIN blood_type bt ON bt.id = p.blood_type_id
     WHERE p.patient_code ILIKE $1 OR p.patient_name ILIKE $1
     ORDER BY p.${col} ${dir} NULLS LAST LIMIT $2 OFFSET $3`,
    [s, Number(limit), offset]
  );
  return { data: rows, total: Number(total), page: Number(page), limit: Number(limit), totalPages: Math.ceil(Number(total) / Number(limit)) };
}

export async function getPatientByCode(code) {
  const { rows } = await pool.query(
    `SELECT p.id, p.patient_code, p.patient_name, p.gender, p.date_of_birth, p.created_at, p.blood_type_id, bt.blood_type_full
     FROM patient p LEFT JOIN blood_type bt ON bt.id = p.blood_type_id
     WHERE p.patient_code = $1`, [code]
  );
  return rows[0] ?? null;
}

export async function createPatient({ patient_name, gender, date_of_birth, blood_type_id } = {}) {
  // Use the identity sequence for the id (atomic / race-safe) and derive the code
  // from it, keeping the sequence in sync — see doctors.service for the rationale.
  const { rows: [{ id: next }] } = await pool.query("SELECT nextval(pg_get_serial_sequence('patient','id')) AS id");
  const patient_code = `PAT-${String(next).padStart(3, "0")}`;
  await pool.query(
    "INSERT INTO patient (patient_code, patient_name, gender, date_of_birth, blood_type_id, id) VALUES ($1,$2,$3,$4,$5,$6)",
    [patient_code, patient_name, gender, date_of_birth, blood_type_id || null, next]
  );
  return { patient_code };
}

export async function updatePatientByCode(code, { patient_name, gender, date_of_birth, blood_type_id } = {}) {
  const existing = await getPatientByCode(code);
  if (!existing) return null;
  await pool.query(
    "UPDATE patient SET patient_name=$1, gender=$2, date_of_birth=$3, blood_type_id=$4 WHERE patient_code=$5",
    [patient_name, gender, date_of_birth, blood_type_id || null, code]
  );
  return { ok: true };
}

export async function deletePatientByCode(code) {
  const existing = await getPatientByCode(code);
  if (!existing) return null;
  try {
    await pool.query("DELETE FROM patient WHERE patient_code=$1", [code]);
    return { ok: true };
  } catch (err) {
    if (err?.code === "23503") {
      const e = new Error("Cannot delete patient because they have existing visits.");
      e.statusCode = 400; throw e;
    }
    throw err;
  }
}
