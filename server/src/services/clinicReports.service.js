import { pool } from "../db/pool.js";

// All clinical events hang off a visit, and several line tables have no own
// timestamp (prescription_chart_line, patient_bill, appointed_doctor), so every
// date-range filter below is anchored on visit.created_at — the clinical event date.
// Filters use the ($n::type IS NULL OR col = $n) guard pattern so absent filters
// (passed as null) simply match everything. No dynamic SQL string building.

const normLimit = (limit) => (Number(limit) > 0 ? Math.floor(Number(limit)) : 10);
const orNull = (v) => (v === undefined || v === "" ? null : v);

// Shared SQL expression for a bill line's monetary amount.
const LINE_AMOUNT = `
  CASE pbl.charge_type
    WHEN 'Treatment' THEN t.unit_cost * tcl.quantity
    WHEN 'Medicine'  THEN me.unit_cost * pcl.quantity
    WHEN 'Fee'       THEN f.fee_price
  END`;

// 1. List all patients. Filter by gender or blood type.
export async function listPatientsReport({ gender, bloodType } = {}) {
  const { rows } = await pool.query(
    `SELECT p.patient_code, p.patient_name, p.gender, p.date_of_birth, bt.blood_type_full
     FROM patient p LEFT JOIN blood_type bt ON bt.id = p.blood_type_id
     WHERE ($1::text IS NULL OR p.gender = $1)
       AND ($2::text IS NULL OR bt.blood_type_full = $2)
     ORDER BY p.patient_code`,
    [orNull(gender), orNull(bloodType)]
  );
  return rows;
}

// 1b. List all patients visiting from date to date. Filter by OPD/IPD type.
// One row per visit (a patient with several visits appears once per visit).
export async function listPatientsVisiting({ from, to, type } = {}) {
  const { rows } = await pool.query(
    `SELECT p.patient_code, p.patient_name, p.gender,
            v.visit_code, v.visit_type, v.created_at
     FROM visit v
     JOIN patient p ON p.id = v.patient_id
     WHERE ($1::date IS NULL OR v.created_at::date >= $1)
       AND ($2::date IS NULL OR v.created_at::date <= $2)
       AND ($3::text IS NULL OR v.visit_type = $3)
     ORDER BY v.created_at DESC, p.patient_code`,
    [orNull(from), orNull(to), orNull(type)]
  );
  return rows;
}

// 2. List all medical problems per patient from date to date. Filter by patient ID.
export async function listMedicalProblems({ from, to, patientCode } = {}) {
  const { rows } = await pool.query(
    `SELECT p.patient_code, p.patient_name, mc.condition_code, mc.condition_name, mc.description,
            v.visit_code, v.created_at
     FROM diagnosis_chart_line dcl
     JOIN diagnosis_chart dc ON dc.id = dcl.diagnosis_chart_id
     JOIN visit v ON v.id = dc.visit_id
     JOIN patient p ON p.id = v.patient_id
     JOIN medical_condition mc ON mc.id = dcl.medical_condition_id
     WHERE ($1::date IS NULL OR v.created_at::date >= $1)
       AND ($2::date IS NULL OR v.created_at::date <= $2)
       AND ($3::text IS NULL OR p.patient_code = $3)
     ORDER BY v.created_at DESC, p.patient_code`,
    [orNull(from), orNull(to), orNull(patientCode)]
  );
  return rows;
}

// 3. Analysis: Top N most common medical problems from date to date.
export async function topConditions({ from, to, limit } = {}) {
  const { rows } = await pool.query(
    `SELECT mc.condition_code, mc.condition_name, COUNT(*)::int AS occurrences
     FROM diagnosis_chart_line dcl
     JOIN diagnosis_chart dc ON dc.id = dcl.diagnosis_chart_id
     JOIN visit v ON v.id = dc.visit_id
     JOIN medical_condition mc ON mc.id = dcl.medical_condition_id
     WHERE ($1::date IS NULL OR v.created_at::date >= $1)
       AND ($2::date IS NULL OR v.created_at::date <= $2)
     GROUP BY mc.id, mc.condition_code, mc.condition_name
     ORDER BY occurrences DESC, mc.condition_name
     LIMIT $3`,
    [orNull(from), orNull(to), normLimit(limit)]
  );
  return rows;
}

// 4. List all medicines. Filter by medicine type.
export async function listMedicinesReport({ type } = {}) {
  const { rows } = await pool.query(
    `SELECT medicine_code, medicine_name, generic_name, medicine_type, unit_cost
     FROM medicine
     WHERE ($1::text IS NULL OR medicine_type = $1)
     ORDER BY medicine_name`,
    [orNull(type)]
  );
  return rows;
}

// 5. List medications prescribed per patient from date to date. Filter by patient ID.
export async function listPrescriptions({ from, to, patientCode } = {}) {
  const { rows } = await pool.query(
    `SELECT p.patient_code, p.patient_name, m.medicine_code, m.medicine_name, m.medicine_type,
            pcl.quantity, pcl.dosage_notes, v.visit_code, v.created_at
     FROM prescription_chart_line pcl
     JOIN prescription_chart pc ON pc.id = pcl.prescription_chart_id
     JOIN visit v ON v.id = pc.visit_id
     JOIN patient p ON p.id = v.patient_id
     JOIN medicine m ON m.id = pcl.medicine_id
     WHERE ($1::date IS NULL OR v.created_at::date >= $1)
       AND ($2::date IS NULL OR v.created_at::date <= $2)
       AND ($3::text IS NULL OR p.patient_code = $3)
     ORDER BY v.created_at DESC, p.patient_code`,
    [orNull(from), orNull(to), orNull(patientCode)]
  );
  return rows;
}

// 6. Analysis: Top N most frequently prescribed medicines from date to date.
export async function topMedicines({ from, to, limit } = {}) {
  const { rows } = await pool.query(
    `SELECT m.medicine_code, m.medicine_name, m.medicine_type,
            COUNT(*)::int AS times_prescribed, SUM(pcl.quantity)::numeric AS total_quantity
     FROM prescription_chart_line pcl
     JOIN prescription_chart pc ON pc.id = pcl.prescription_chart_id
     JOIN visit v ON v.id = pc.visit_id
     JOIN medicine m ON m.id = pcl.medicine_id
     WHERE ($1::date IS NULL OR v.created_at::date >= $1)
       AND ($2::date IS NULL OR v.created_at::date <= $2)
     GROUP BY m.id, m.medicine_code, m.medicine_name, m.medicine_type
     ORDER BY times_prescribed DESC, m.medicine_name
     LIMIT $3`,
    [orNull(from), orNull(to), normLimit(limit)]
  );
  return rows;
}

// 7 & 8. List all diagnosis records from date to date. Filter by medical condition / patient.
export async function listDiagnoses({ from, to, conditionCode, patientCode } = {}) {
  const { rows } = await pool.query(
    `SELECT dc.diagnosis_chart_code, p.patient_code, p.patient_name,
            mc.condition_code, mc.condition_name, v.visit_code, v.created_at
     FROM diagnosis_chart_line dcl
     JOIN diagnosis_chart dc ON dc.id = dcl.diagnosis_chart_id
     JOIN visit v ON v.id = dc.visit_id
     JOIN patient p ON p.id = v.patient_id
     JOIN medical_condition mc ON mc.id = dcl.medical_condition_id
     WHERE ($1::date IS NULL OR v.created_at::date >= $1)
       AND ($2::date IS NULL OR v.created_at::date <= $2)
       AND ($3::text IS NULL OR mc.condition_code = $3)
       AND ($4::text IS NULL OR p.patient_code = $4)
     ORDER BY v.created_at DESC, dc.diagnosis_chart_code`,
    [orNull(from), orNull(to), orNull(conditionCode), orNull(patientCode)]
  );
  return rows;
}

// 9. List all diagnosis records from date to date. Filter by diagnosis chart.
export async function listDiagnosesByChart({ from, to, diagnosisChartCode } = {}) {
  const { rows } = await pool.query(
    `SELECT dc.diagnosis_chart_code, p.patient_code, p.patient_name,
            mc.condition_code, mc.condition_name, v.visit_code, v.created_at
     FROM diagnosis_chart_line dcl
     JOIN diagnosis_chart dc ON dc.id = dcl.diagnosis_chart_id
     JOIN visit v ON v.id = dc.visit_id
     JOIN patient p ON p.id = v.patient_id
     JOIN medical_condition mc ON mc.id = dcl.medical_condition_id
     WHERE ($1::date IS NULL OR v.created_at::date >= $1)
       AND ($2::date IS NULL OR v.created_at::date <= $2)
       AND ($3::text IS NULL OR dc.diagnosis_chart_code = $3)
     ORDER BY dc.diagnosis_chart_code, mc.condition_code`,
    [orNull(from), orNull(to), orNull(diagnosisChartCode)]
  );
  return rows;
}

// 10. List all doctors. Filter by gender or department.
export async function listDoctorsReport({ gender, departmentId } = {}) {
  const { rows } = await pool.query(
    `SELECT d.doctor_code, d.doctor_name, d.gender, d.specialty, dep.department_name
     FROM doctor d LEFT JOIN department dep ON dep.id = d.department_id
     WHERE ($1::text IS NULL OR d.gender = $1)
       AND ($2::bigint IS NULL OR d.department_id = $2)
     ORDER BY d.doctor_name`,
    [orNull(gender), orNull(departmentId)]
  );
  return rows;
}

// 11. List all patients treated by a doctor by code.
export async function patientsByDoctor({ doctorCode, from, to } = {}) {
  const { rows } = await pool.query(
    `SELECT DISTINCT p.patient_code, p.patient_name, p.gender,
            v.visit_code, v.visit_type, v.created_at
     FROM appointed_doctor_line adl
     JOIN appointed_doctor ad ON ad.id = adl.appointed_doctor_id
     JOIN visit v ON v.id = ad.visit_id
     JOIN patient p ON p.id = v.patient_id
     JOIN doctor d ON d.id = adl.doctor_id
     WHERE d.doctor_code = $1
       AND ($2::date IS NULL OR v.created_at::date >= $2)
       AND ($3::date IS NULL OR v.created_at::date <= $3)
     ORDER BY v.created_at DESC, p.patient_code`,
    [orNull(doctorCode), orNull(from), orNull(to)]
  );
  return rows;
}

// 12. Analysis: Most appointed doctors from date to date.
export async function mostAppointedDoctors({ from, to, limit } = {}) {
  const { rows } = await pool.query(
    `SELECT d.doctor_code, d.doctor_name, d.specialty,
            COUNT(adl.id)::int AS appointment_count
     FROM appointed_doctor_line adl
     JOIN appointed_doctor ad ON ad.id = adl.appointed_doctor_id
     JOIN visit v ON v.id = ad.visit_id
     JOIN doctor d ON d.id = adl.doctor_id
     WHERE ($1::date IS NULL OR v.created_at::date >= $1)
       AND ($2::date IS NULL OR v.created_at::date <= $2)
     GROUP BY d.id, d.doctor_code, d.doctor_name, d.specialty
     ORDER BY appointment_count DESC, d.doctor_name
     LIMIT $3`,
    [orNull(from), orNull(to), normLimit(limit)]
  );
  return rows;
}

// 14. List all bills from date to date. Filter by patient code.
export async function listBillsReport({ from, to, patientCode } = {}) {
  const { rows } = await pool.query(
    `SELECT pb.bill_code, p.patient_code, p.patient_name, v.visit_code, v.visit_type,
            v.created_at, pb.tax,
            COALESCE(sub.subtotal, 0) AS subtotal,
            ROUND(COALESCE(sub.subtotal, 0) * (1 + pb.tax / 100), 2) AS total
     FROM patient_bill pb
     JOIN visit v ON v.id = pb.visit_id
     JOIN patient p ON p.id = v.patient_id
     LEFT JOIN LATERAL (
       SELECT SUM(${LINE_AMOUNT}) AS subtotal
       FROM patient_bill_line pbl
       LEFT JOIN treatment_chart_line tcl ON tcl.id = pbl.treatment_chart_line_id
       LEFT JOIN treatment t ON t.id = tcl.treatment_id
       LEFT JOIN prescription_chart_line pcl ON pcl.id = pbl.prescription_chart_line_id
       LEFT JOIN medicine me ON me.id = pcl.medicine_id
       LEFT JOIN fee f ON f.id = pbl.fee_id
       WHERE pbl.bill_header_id = pb.id
     ) sub ON true
     WHERE ($1::date IS NULL OR v.created_at::date >= $1)
       AND ($2::date IS NULL OR v.created_at::date <= $2)
       AND ($3::text IS NULL OR p.patient_code = $3)
     ORDER BY v.created_at DESC, pb.bill_code`,
    [orNull(from), orNull(to), orNull(patientCode)]
  );
  return rows;
}

// 15. Analysis: Total revenue grouped by charge type from date to date.
export async function revenueByChargeType({ from, to } = {}) {
  const { rows } = await pool.query(
    `SELECT pbl.charge_type,
            COUNT(*)::int AS line_count,
            COALESCE(SUM(${LINE_AMOUNT}), 0) AS revenue
     FROM patient_bill_line pbl
     JOIN patient_bill pb ON pb.id = pbl.bill_header_id
     JOIN visit v ON v.id = pb.visit_id
     LEFT JOIN treatment_chart_line tcl ON tcl.id = pbl.treatment_chart_line_id
     LEFT JOIN treatment t ON t.id = tcl.treatment_id
     LEFT JOIN prescription_chart_line pcl ON pcl.id = pbl.prescription_chart_line_id
     LEFT JOIN medicine me ON me.id = pcl.medicine_id
     LEFT JOIN fee f ON f.id = pbl.fee_id
     WHERE ($1::date IS NULL OR v.created_at::date >= $1)
       AND ($2::date IS NULL OR v.created_at::date <= $2)
     GROUP BY pbl.charge_type
     ORDER BY revenue DESC`,
    [orNull(from), orNull(to)]
  );
  return rows;
}

// 16 & 17. List all visits from date to date. Filter by OPD/IPD type and/or doctor.
export async function listVisitsReport({ from, to, type, doctorCode } = {}) {
  const { rows } = await pool.query(
    `SELECT DISTINCT v.visit_code, v.visit_type, v.created_at,
            p.patient_code, p.patient_name
     FROM visit v
     JOIN patient p ON p.id = v.patient_id
     LEFT JOIN appointed_doctor ad ON ad.visit_id = v.id
     LEFT JOIN appointed_doctor_line adl ON adl.appointed_doctor_id = ad.id
     LEFT JOIN doctor d ON d.id = adl.doctor_id
     WHERE ($1::date IS NULL OR v.created_at::date >= $1)
       AND ($2::date IS NULL OR v.created_at::date <= $2)
       AND ($3::text IS NULL OR v.visit_type = $3)
       AND ($4::text IS NULL OR d.doctor_code = $4)
     ORDER BY v.created_at DESC, v.visit_code`,
    [orNull(from), orNull(to), orNull(type), orNull(doctorCode)]
  );
  return rows;
}

// 18. Analysis: Number of OPD vs IPD visits grouped by month from date to date.
export async function visitsMonthly({ from, to } = {}) {
  const { rows } = await pool.query(
    `SELECT to_char(date_trunc('month', v.created_at), 'YYYY-MM') AS month,
            COUNT(*) FILTER (WHERE v.visit_type = 'OPD')::int AS opd,
            COUNT(*) FILTER (WHERE v.visit_type = 'IPD')::int AS ipd,
            COUNT(*)::int AS total
     FROM visit v
     WHERE ($1::date IS NULL OR v.created_at::date >= $1)
       AND ($2::date IS NULL OR v.created_at::date <= $2)
     GROUP BY date_trunc('month', v.created_at)
     ORDER BY date_trunc('month', v.created_at)`,
    [orNull(from), orNull(to)]
  );
  return rows;
}
