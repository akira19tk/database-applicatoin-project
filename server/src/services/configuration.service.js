import { pool } from "../db/pool.js";

// ─── READ (list + get by code) ────────────────────────────────────────────────

export const listDepartments = async ({ search = "", page = 1, limit = 10,  sortBy = "department_code",sortDir = "asc"  } = {}) => {
  const s = `%${search}%`;
  const offset = (Number(page) - 1) * Number(limit);
  const { rows: [{ total }] } = await pool.query(
    `SELECT COUNT(*) as total FROM department WHERE department_code ILIKE $1 OR department_name ILIKE $1`, [s]
  );
  const { rows } = await pool.query(
    `SELECT id, department_code, department_name, location_description FROM department
     WHERE department_code ILIKE $1 OR department_name ILIKE $1
     ORDER BY ${sortBy} ${sortDir}
     LIMIT $2 OFFSET $3`, [s, Number(limit), offset]
  );
  return { data: rows, total: Number(total), page: Number(page), limit: Number(limit), totalPages: Math.ceil(Number(total) / Number(limit)) };
};

export const getDepartmentByCode = async (code) => {
  const { rows } = await pool.query(
    `SELECT id, department_code, department_name, location_description FROM department WHERE department_code=$1`, [code]
  );
  return rows[0] ?? null;
};

export const listMedicines = async ({ search = "", page = 1, limit = 10,  sortBy = "medicine_code",sortDir = "asc"  } = {}) => {
  const allowedSorts = {
    medicine_code: "medicine_code",
    medicine_name: "medicine_name",
    generic_name: "generic_name",
    medicine_type: "medicine_type",
    unit_cost: "unit_cost",
  };

  const orderBy = allowedSorts[sortBy] || "medicine_name";
  const direction = sortDir === "desc" ? "DESC" : "ASC";
  const s = `%${search}%`;
  const offset = (Number(page) - 1) * Number(limit);
  const { rows: [{ total }] } = await pool.query(
    `SELECT COUNT(*) as total FROM medicine WHERE medicine_code ILIKE $1 OR medicine_name ILIKE $1 OR generic_name ILIKE $1 OR medicine_type ILIKE $1`, [s]
  );
  const { rows } = await pool.query(
    `SELECT id, medicine_code, medicine_name, generic_name, medicine_type, unit_cost FROM medicine
     WHERE medicine_code ILIKE $1 OR medicine_name ILIKE $1 OR generic_name ILIKE $1 OR medicine_type ILIKE $1
     ORDER BY ${orderBy} ${direction}
     LIMIT $2 OFFSET $3`, [s, Number(limit), offset]
  );
  return { data: rows, total: Number(total), page: Number(page), limit: Number(limit), totalPages: Math.ceil(Number(total) / Number(limit)) };
};

export const getMedicineByCode = async (code) => {
  const { rows } = await pool.query(
    `SELECT id, medicine_code, medicine_name, generic_name, medicine_type, unit_cost FROM medicine WHERE medicine_code=$1`, [code]
  );
  return rows[0] ?? null;
};

export const listTreatments = async ({ search = "", page = 1, limit = 10,  sortBy = "treatment_code",sortDir = "asc" } = {}) => {
    const allowedSorts = {
    treatment_code: "treatment_code",
    treatment_name: "treatment_name",
    unit_cost: "unit_cost",
  };
  const orderBy = allowedSorts[sortBy] || "treatment_name";
  const direction = sortDir === "desc" ? "DESC" : "ASC";const s = `%${search}%`;
  const offset = (Number(page) - 1) * Number(limit);
  const { rows: [{ total }] } = await pool.query(
    `SELECT COUNT(*) as total FROM treatment WHERE treatment_code ILIKE $1 OR treatment_name ILIKE $1`, [s]
  );
  const { rows } = await pool.query(
    `SELECT id, treatment_code, treatment_name, unit_cost
    FROM treatment
    WHERE treatment_code ILIKE $1 OR treatment_name ILIKE $1
    ORDER BY ${orderBy} ${direction}
    LIMIT $2 OFFSET $3`,
  [s, Number(limit), offset]
);
  return { data: rows, total: Number(total), page: Number(page), limit: Number(limit), totalPages: Math.ceil(Number(total) / Number(limit)) };
};

export const getTreatmentByCode = async (code) => {
  const { rows } = await pool.query(
    `SELECT id, treatment_code, treatment_name, unit_cost FROM treatment WHERE treatment_code=$1`, [code]
  );
  return rows[0] ?? null;
};

export const listFees = async ({ search = "", page = 1, limit = 10,  sortBy = "fee_code",sortDir = "asc"  } = {}) => {
  const allowedSorts = {
    fee_code: "fee_code",
    fee_name: "fee_name",
    fee_price: "fee_price",
  };

  const orderBy = allowedSorts[sortBy] || "fee_name";
  const direction = sortDir === "desc" ? "DESC" : "ASC";
  const s = `%${search}%`;
  const offset = (Number(page) - 1) * Number(limit);
  const { rows: [{ total }] } = await pool.query(
    `SELECT COUNT(*) as total FROM fee WHERE fee_code ILIKE $1 OR fee_name ILIKE $1`, [s]
  );
  const { rows } = await pool.query(
    `SELECT id, fee_code, fee_name, fee_price FROM fee
     WHERE fee_code ILIKE $1 OR fee_name ILIKE $1
     ORDER BY ${orderBy} ${direction}
     LIMIT $2 OFFSET $3`, [s, Number(limit), offset]
  );
  return { data: rows, total: Number(total), page: Number(page), limit: Number(limit), totalPages: Math.ceil(Number(total) / Number(limit)) };
};

export const getFeeByCode = async (code) => {
  const { rows } = await pool.query(
    `SELECT id, fee_code, fee_name, fee_price FROM fee WHERE fee_code=$1`, [code]
  );
  return rows[0] ?? null;
};

export const listMedicalConditions = async ({ search = "", page = 1, limit = 10,  sortBy = "condition_code",sortDir = "asc"  } = {}) => {
  const allowedSorts = {
    condition_code: "condition_code",
    condition_name: "condition_name",
    description: "description",
  };

  const orderBy = allowedSorts[sortBy] || "condition_name";
  const direction = sortDir === "desc" ? "DESC" : "ASC";
  const s = `%${search}%`;
  const offset = (Number(page) - 1) * Number(limit);
  const { rows: [{ total }] } = await pool.query(
    `SELECT COUNT(*) as total FROM medical_condition WHERE condition_code ILIKE $1 OR condition_name ILIKE $1`, [s]
  );
  const { rows } = await pool.query(
    `SELECT id, condition_code, condition_name, description FROM medical_condition
     WHERE condition_code ILIKE $1 OR condition_name ILIKE $1
     ORDER BY ${orderBy} ${direction}
     LIMIT $2 OFFSET $3`, [s, Number(limit), offset]
  );
  return { data: rows, total: Number(total), page: Number(page), limit: Number(limit), totalPages: Math.ceil(Number(total) / Number(limit)) };
};

export const getMedicalConditionByCode = async (code) => {
  const { rows } = await pool.query(
    `SELECT id, condition_code, condition_name, description FROM medical_condition WHERE condition_code=$1`, [code]
  );
  return rows[0] ?? null;
};

// ─── BLOOD TYPES (read-only, no CRUD needed) ─────────────────────────────────

export const listBloodTypes = async () =>
  (await pool.query(`SELECT id, blood_type_full, blood_type, rh_factor FROM blood_type ORDER BY blood_type_full`)).rows;

export const listAllDoctors = async () =>
  (await pool.query(
    `SELECT d.id, d.doctor_code, d.doctor_name, d.specialty, dep.department_name
     FROM doctor d LEFT JOIN department dep ON dep.id = d.department_id ORDER BY d.doctor_name`
  )).rows;

// ─── CREATE ───────────────────────────────────────────────────────────────────

export const createDepartment = async ({ department_name, location_description } = {}) => {
  const { rows: [{ id: next }] } = await pool.query(`SELECT nextval(pg_get_serial_sequence('department','id')) AS id`);
  const department_code = `DPT-${String(next).padStart(3, "0")}`;
  await pool.query(
    `INSERT INTO department (id, department_code, department_name, location_description) VALUES ($1,$2,$3,$4)`,
    [next, department_code, department_name, location_description || null]
  );
  return { department_code };
};

export const createMedicine = async ({ medicine_name, generic_name, medicine_type, unit_cost } = {}) => {
  const { rows: [{ id: next }] } = await pool.query(`SELECT nextval(pg_get_serial_sequence('medicine','id')) AS id`);
  const medicine_code = `MED-${String(next).padStart(3, "0")}`;
  await pool.query(
    `INSERT INTO medicine (id, medicine_code, medicine_name, generic_name, medicine_type, unit_cost) VALUES ($1,$2,$3,$4,$5,$6)`,
    [next, medicine_code, medicine_name, generic_name || null, medicine_type || null, unit_cost]
  );
  return { medicine_code };
};

export const createTreatment = async ({ treatment_name, unit_cost } = {}) => {
  const { rows: [{ id: next }] } = await pool.query(`SELECT nextval(pg_get_serial_sequence('treatment','id')) AS id`);
  const treatment_code = `TRM-${String(next).padStart(3, "0")}`;
  await pool.query(
    `INSERT INTO treatment (id, treatment_code, treatment_name, unit_cost) VALUES ($1,$2,$3,$4)`,
    [next, treatment_code, treatment_name, unit_cost]
  );
  return { treatment_code };
};

export const createFee = async ({ fee_name, fee_price } = {}) => {
  const { rows: [{ id: next }] } = await pool.query(`SELECT nextval(pg_get_serial_sequence('fee','id')) AS id`);
  const fee_code = `FEE-${String(next).padStart(3, "0")}`;
  await pool.query(
    `INSERT INTO fee (id, fee_code, fee_name, fee_price) VALUES ($1,$2,$3,$4)`,
    [next, fee_code, fee_name, fee_price]
  );
  return { fee_code };
};

export const createMedicalCondition = async ({ condition_name, description } = {}) => {
  const { rows: [{ id: next }] } = await pool.query(`SELECT nextval(pg_get_serial_sequence('medical_condition','id')) AS id`);
  const condition_code = `CON-${String(next).padStart(3, "0")}`;
  await pool.query(
    `INSERT INTO medical_condition (id, condition_code, condition_name, description) VALUES ($1,$2,$3,$4)`,
    [next, condition_code, condition_name, description || null]
  );
  return { condition_code };
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export const updateDepartment = async (code, { department_name, location_description } = {}) => {
  const existing = await getDepartmentByCode(code);
  if (!existing) return null;
  await pool.query(
    `UPDATE department SET department_name=$1, location_description=$2 WHERE department_code=$3`,
    [department_name, location_description || null, code]
  );
  return { ok: true };
};

export const updateMedicine = async (code, { medicine_name, generic_name, medicine_type, unit_cost } = {}) => {
  const existing = await getMedicineByCode(code);
  if (!existing) return null;
  await pool.query(
    `UPDATE medicine SET medicine_name=$1, generic_name=$2, medicine_type=$3, unit_cost=$4 WHERE medicine_code=$5`,
    [medicine_name, generic_name || null, medicine_type || null, unit_cost, code]
  );
  return { ok: true };
};

export const updateTreatment = async (code, { treatment_name, unit_cost } = {}) => {
  const existing = await getTreatmentByCode(code);
  if (!existing) return null;
  await pool.query(
    `UPDATE treatment SET treatment_name=$1, unit_cost=$2 WHERE treatment_code=$3`,
    [treatment_name, unit_cost, code]
  );
  return { ok: true };
};

export const updateFee = async (code, { fee_name, fee_price } = {}) => {
  const existing = await getFeeByCode(code);
  if (!existing) return null;
  await pool.query(
    `UPDATE fee SET fee_name=$1, fee_price=$2 WHERE fee_code=$3`,
    [fee_name, fee_price, code]
  );
  return { ok: true };
};

export const updateMedicalCondition = async (code, { condition_name, description } = {}) => {
  const existing = await getMedicalConditionByCode(code);
  if (!existing) return null;
  await pool.query(
    `UPDATE medical_condition SET condition_name=$1, description=$2 WHERE condition_code=$3`,
    [condition_name, description || null, code]
  );
  return { ok: true };
};

// ─── DELETE ───────────────────────────────────────────────────────────────────

const safeDelete = async (table, codeCol, code) => {
  const { rowCount } = await pool.query(`SELECT id FROM ${table} WHERE ${codeCol}=$1`, [code]);
  if (!rowCount) return null;
  try {
    await pool.query(`DELETE FROM ${table} WHERE ${codeCol}=$1`, [code]);
    return { ok: true };
  } catch (err) {
    if (err?.code === "23503") {
      const e = new Error(`Cannot delete because it is referenced by existing records.`);
      e.statusCode = 400; throw e;
    }
    throw err;
  }
};

export const deleteDepartment       = (code) => safeDelete("department",       "department_code", code);
export const deleteMedicine         = (code) => safeDelete("medicine",         "medicine_code",   code);
export const deleteTreatment        = (code) => safeDelete("treatment",        "treatment_code",  code);
export const deleteFee              = (code) => safeDelete("fee",              "fee_code",        code);
export const deleteMedicalCondition = (code) => safeDelete("medical_condition","condition_code",  code);
