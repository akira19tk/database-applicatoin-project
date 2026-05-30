import { pool } from "../db/pool.js";

export const listDepartments = async () =>
  (await pool.query("SELECT id, department_code, department_name, location_description FROM department ORDER BY department_name")).rows;

export const listMedicines = async () =>
  (await pool.query("SELECT id, medicine_code, medicine_name, generic_name, medicine_type, unit_cost FROM medicine ORDER BY medicine_name")).rows;

export const listTreatments = async () =>
  (await pool.query("SELECT id, treatment_code, treatment_name, unit_cost FROM treatment ORDER BY treatment_name")).rows;

export const listFees = async () =>
  (await pool.query("SELECT id, fee_code, fee_name, fee_price FROM fee ORDER BY fee_name")).rows;

export const listMedicalConditions = async () =>
  (await pool.query("SELECT id, condition_code, condition_name, description FROM medical_condition ORDER BY condition_name")).rows;

export const listBloodTypes = async () =>
  (await pool.query("SELECT id, blood_type_full, blood_type, rh_factor FROM blood_type ORDER BY blood_type_full")).rows;

export const listAllDoctors = async () =>
  (await pool.query(
    `SELECT d.id, d.doctor_code, d.doctor_name, d.specialty, dep.department_name
     FROM doctor d LEFT JOIN department dep ON dep.id = d.department_id ORDER BY d.doctor_name`
  )).rows;
