import { pool } from "../db/pool.js";

export async function listVisits({ search = "", page = 1, limit = 10 } = {}) {
  const offset = (Number(page) - 1) * Number(limit);
  const s = `%${search}%`;
  const { rows: [{ total }] } = await pool.query(
    `SELECT COUNT(*) as total FROM visit v JOIN patient p ON p.id=v.patient_id
     WHERE v.visit_code ILIKE $1 OR p.patient_name ILIKE $1 OR v.visit_type ILIKE $1`, [s]
  );
  const { rows } = await pool.query(
    `SELECT v.id, v.visit_code, v.visit_type, v.created_at, v.reported_symptoms, v.read_only,
            p.patient_code, p.patient_name
     FROM visit v JOIN patient p ON p.id=v.patient_id
     WHERE v.visit_code ILIKE $1 OR p.patient_name ILIKE $1 OR v.visit_type ILIKE $1
     ORDER BY v.created_at DESC LIMIT $2 OFFSET $3`,
    [s, Number(limit), offset]
  );
  return { data: rows, total: Number(total), page: Number(page), limit: Number(limit), totalPages: Math.ceil(Number(total) / Number(limit)) };
}

export async function getVisitByCode(code) {
  const { rows } = await pool.query(
    `SELECT v.id, v.visit_code, v.visit_type, v.created_at, v.reported_symptoms,
            v.blood_pressure, v.height, v.weight, v.temperature, v.read_only,
            p.patient_code, p.patient_name, p.gender
     FROM visit v JOIN patient p ON p.id=v.patient_id
     WHERE v.visit_code = $1`, [code]
  );
  return rows[0] ?? null;
}

export async function createVisit({ patient_code, visit_type, reported_symptoms, blood_pressure, height, weight, temperature } = {}) {
  const patRes = await pool.query("SELECT id FROM patient WHERE patient_code=$1", [patient_code]);
  if (patRes.rowCount === 0) throw Object.assign(new Error("Patient not found"), { statusCode: 404 });
  const patient_id = patRes.rows[0].id;
  const { rows: [{ m }] } = await pool.query("SELECT MAX(id) as m FROM visit");
  const visit_code = `VST-${((Number(m) || 0) + 1).toString().padStart(3, "0")}`;
  await pool.query(
    `INSERT INTO visit (visit_code, patient_id, visit_type, reported_symptoms, blood_pressure, height, weight, temperature)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [visit_code, patient_id, visit_type, reported_symptoms||null, blood_pressure||null, height||null, weight||null, temperature||null]
  );
  return { visit_code };
}

export async function updateVisitByCode(code, { visit_type, reported_symptoms, blood_pressure, height, weight, temperature } = {}) {
  const existing = await getVisitByCode(code);
  if (!existing) return null;
  await pool.query(
    `UPDATE visit SET visit_type=$1, reported_symptoms=$2, blood_pressure=$3, height=$4, weight=$5, temperature=$6 WHERE visit_code=$7`,
    [visit_type, reported_symptoms||null, blood_pressure||null, height||null, weight||null, temperature||null, code]
  );
  return { ok: true };
}

// --- Appointed Doctors ---
export async function getAppointedDoctor(visit_code) {
  const vr = await pool.query("SELECT id FROM visit WHERE visit_code=$1", [visit_code]);
  if (!vr.rowCount) return null;
  const visit_id = vr.rows[0].id;
  const hr = await pool.query("SELECT id, appointed_doctor_code FROM appointed_doctor WHERE visit_id=$1", [visit_id]);
  if (!hr.rowCount) return { lines: [] };
  const { rows } = await pool.query(
    `SELECT adl.id, d.doctor_code, d.doctor_name, d.specialty, adl.notes
     FROM appointed_doctor_line adl JOIN doctor d ON d.id=adl.doctor_id
     WHERE adl.appointed_doctor_id=$1 ORDER BY adl.id`, [hr.rows[0].id]
  );
  return { appointed_doctor_code: hr.rows[0].appointed_doctor_code, lines: rows };
}

export async function saveAppointedDoctor(visit_code, { doctor_codes = [], notes_map = {} } = {}) {
  const vr = await pool.query("SELECT id FROM visit WHERE visit_code=$1", [visit_code]);
  if (!vr.rowCount) throw Object.assign(new Error("Visit not found"), { statusCode: 404 });
  const visit_id = vr.rows[0].id;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const ex = await client.query("SELECT id FROM appointed_doctor WHERE visit_id=$1", [visit_id]);
    if (ex.rowCount) {
      await client.query("DELETE FROM appointed_doctor_line WHERE appointed_doctor_id=$1", [ex.rows[0].id]);
      await client.query("DELETE FROM appointed_doctor WHERE id=$1", [ex.rows[0].id]);
    }
    const { rows: [{ m }] } = await client.query("SELECT MAX(id) as m FROM appointed_doctor");
    const code = `ADH-${((Number(m)||0)+1).toString().padStart(3,"0")}`;
    const ar = await client.query("INSERT INTO appointed_doctor (visit_id, appointed_doctor_code) VALUES ($1,$2) RETURNING id", [visit_id, code]);
    const ad_id = ar.rows[0].id;
    for (const dc of doctor_codes) {
      const dr = await client.query("SELECT id FROM doctor WHERE doctor_code=$1", [dc]);
      if (!dr.rowCount) continue;
      await client.query("INSERT INTO appointed_doctor_line (appointed_doctor_id, doctor_id, notes) VALUES ($1,$2,$3)",
        [ad_id, dr.rows[0].id, notes_map[dc]||null]);
    }
    await client.query("COMMIT");
    return { ok: true };
  } catch (e) { await client.query("ROLLBACK"); throw e; }
  finally { client.release(); }
}

// --- Prescription Chart ---
export async function getPrescriptionChart(visit_code) {
  const vr = await pool.query("SELECT id FROM visit WHERE visit_code=$1", [visit_code]);
  if (!vr.rowCount) return null;
  const visit_id = vr.rows[0].id;
  const hr = await pool.query("SELECT id, prescription_chart_code FROM prescription_chart WHERE visit_id=$1", [visit_id]);
  if (!hr.rowCount) return { lines: [] };
  const { rows } = await pool.query(
    `SELECT pcl.id, m.medicine_code, m.medicine_name, m.generic_name, m.medicine_type, m.unit_cost, pcl.quantity, pcl.dosage_notes
     FROM prescription_chart_line pcl JOIN medicine m ON m.id=pcl.medicine_id
     WHERE pcl.prescription_chart_id=$1 ORDER BY pcl.id`, [hr.rows[0].id]
  );
  return { prescription_chart_code: hr.rows[0].prescription_chart_code, lines: rows };
}

export async function savePrescriptionChart(visit_code, { lines = [] } = {}) {
  const vr = await pool.query("SELECT id FROM visit WHERE visit_code=$1", [visit_code]);
  if (!vr.rowCount) throw Object.assign(new Error("Visit not found"), { statusCode: 404 });
  const visit_id = vr.rows[0].id;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const ex = await client.query("SELECT id FROM prescription_chart WHERE visit_id=$1", [visit_id]);
    if (ex.rowCount) {
      await client.query("DELETE FROM prescription_chart_line WHERE prescription_chart_id=$1", [ex.rows[0].id]);
      await client.query("DELETE FROM prescription_chart WHERE id=$1", [ex.rows[0].id]);
    }
    const { rows: [{ m }] } = await client.query("SELECT MAX(id) as m FROM prescription_chart");
    const code = `DPC-${((Number(m)||0)+1).toString().padStart(3,"0")}`;
    const pr = await client.query("INSERT INTO prescription_chart (visit_id, prescription_chart_code) VALUES ($1,$2) RETURNING id", [visit_id, code]);
    const pc_id = pr.rows[0].id;
    for (const line of lines) {
      const mr = await client.query("SELECT id FROM medicine WHERE medicine_code=$1", [line.medicine_code]);
      if (!mr.rowCount) continue;
      await client.query("INSERT INTO prescription_chart_line (prescription_chart_id, medicine_id, quantity, dosage_notes) VALUES ($1,$2,$3,$4)",
        [pc_id, mr.rows[0].id, line.quantity, line.dosage_notes||null]);
    }
    await client.query("COMMIT");
    return { ok: true };
  } catch (e) { await client.query("ROLLBACK"); throw e; }
  finally { client.release(); }
}

// --- Treatment Chart ---
export async function getTreatmentChart(visit_code) {
  const vr = await pool.query("SELECT id FROM visit WHERE visit_code=$1", [visit_code]);
  if (!vr.rowCount) return null;
  const visit_id = vr.rows[0].id;
  const hr = await pool.query("SELECT id, treatment_chart_code FROM treatment_chart WHERE visit_id=$1", [visit_id]);
  if (!hr.rowCount) return { lines: [] };
  const { rows } = await pool.query(
    `SELECT tcl.id, t.treatment_code, t.treatment_name, t.unit_cost, tcl.quantity, tcl.notes
     FROM treatment_chart_line tcl JOIN treatment t ON t.id=tcl.treatment_id
     WHERE tcl.treatment_chart_id=$1 ORDER BY tcl.id`, [hr.rows[0].id]
  );
  return { treatment_chart_code: hr.rows[0].treatment_chart_code, lines: rows };
}

export async function saveTreatmentChart(visit_code, { lines = [] } = {}) {
  const vr = await pool.query("SELECT id FROM visit WHERE visit_code=$1", [visit_code]);
  if (!vr.rowCount) throw Object.assign(new Error("Visit not found"), { statusCode: 404 });
  const visit_id = vr.rows[0].id;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const ex = await client.query("SELECT id FROM treatment_chart WHERE visit_id=$1", [visit_id]);
    if (ex.rowCount) {
      await client.query("DELETE FROM treatment_chart_line WHERE treatment_chart_id=$1", [ex.rows[0].id]);
      await client.query("DELETE FROM treatment_chart WHERE id=$1", [ex.rows[0].id]);
    }
    const { rows: [{ m }] } = await client.query("SELECT MAX(id) as m FROM treatment_chart");
    const code = `TTC-${((Number(m)||0)+1).toString().padStart(3,"0")}`;
    const tr = await client.query("INSERT INTO treatment_chart (visit_id, treatment_chart_code) VALUES ($1,$2) RETURNING id", [visit_id, code]);
    const tc_id = tr.rows[0].id;
    for (const line of lines) {
      const lr = await client.query("SELECT id FROM treatment WHERE treatment_code=$1", [line.treatment_code]);
      if (!lr.rowCount) continue;
      await client.query("INSERT INTO treatment_chart_line (treatment_chart_id, treatment_id, quantity, notes) VALUES ($1,$2,$3,$4)",
        [tc_id, lr.rows[0].id, line.quantity||1, line.notes||null]);
    }
    await client.query("COMMIT");
    return { ok: true };
  } catch (e) { await client.query("ROLLBACK"); throw e; }
  finally { client.release(); }
}

// --- Diagnosis Chart ---
export async function getDiagnosisChart(visit_code) {
  const vr = await pool.query("SELECT id FROM visit WHERE visit_code=$1", [visit_code]);
  if (!vr.rowCount) return null;
  const visit_id = vr.rows[0].id;
  const hr = await pool.query("SELECT id, diagnosis_chart_code FROM diagnosis_chart WHERE visit_id=$1", [visit_id]);
  if (!hr.rowCount) return { lines: [] };
  const { rows } = await pool.query(
    `SELECT dcl.id, mc.condition_code, mc.condition_name, mc.description
     FROM diagnosis_chart_line dcl JOIN medical_condition mc ON mc.id=dcl.medical_condition_id
     WHERE dcl.diagnosis_chart_id=$1 ORDER BY dcl.id`, [hr.rows[0].id]
  );
  return { diagnosis_chart_code: hr.rows[0].diagnosis_chart_code, lines: rows };
}

export async function saveDiagnosisChart(visit_code, { lines = [] } = {}) {
  const vr = await pool.query("SELECT id FROM visit WHERE visit_code=$1", [visit_code]);
  if (!vr.rowCount) throw Object.assign(new Error("Visit not found"), { statusCode: 404 });
  const visit_id = vr.rows[0].id;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const ex = await client.query("SELECT id FROM diagnosis_chart WHERE visit_id=$1", [visit_id]);
    if (ex.rowCount) {
      await client.query("DELETE FROM diagnosis_chart_line WHERE diagnosis_chart_id=$1", [ex.rows[0].id]);
      await client.query("DELETE FROM diagnosis_chart WHERE id=$1", [ex.rows[0].id]);
    }
    const { rows: [{ m }] } = await client.query("SELECT MAX(id) as m FROM diagnosis_chart");
    const code = `DGC-${((Number(m)||0)+1).toString().padStart(3,"0")}`;
    const dr = await client.query("INSERT INTO diagnosis_chart (visit_id, diagnosis_chart_code) VALUES ($1,$2) RETURNING id", [visit_id, code]);
    const diag_id = dr.rows[0].id;
    for (const line of lines) {
      const cr = await client.query("SELECT id FROM medical_condition WHERE condition_code=$1", [line.condition_code]);
      if (!cr.rowCount) continue;
      await client.query("INSERT INTO diagnosis_chart_line (diagnosis_chart_id, medical_condition_id) VALUES ($1,$2)",
        [diag_id, cr.rows[0].id]);
    }
    await client.query("COMMIT");
    return { ok: true };
  } catch (e) { await client.query("ROLLBACK"); throw e; }
  finally { client.release(); }
}
