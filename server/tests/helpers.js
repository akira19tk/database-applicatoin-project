// Shared helpers for the API integration tests.
//
// These tests run against a RUNNING server + database (the same one used in dev).
// Start them first:
//   1) npm run docker:db:start      (from repo root — Postgres on :15432)
//   2) cd server && npm run dev      (API on :4000)
// then in another terminal:  cd server && npm test
//
// Every record the tests create is tagged with TEST_MARKER in its human-readable
// name/symptoms field, so cleanupTestData() can find and delete it (in foreign-key
// order) before and after the run. Real seed data is never touched.

import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

export const API_BASE = process.env.TEST_API_BASE || "http://localhost:4000";

// Anything containing this marker is test-owned and safe to delete.
export const TEST_MARKER = "__APITEST__";

const connectionString =
  process.env.DATABASE_URL || "postgresql://root:root@localhost:15432/clinic_db";

// A dedicated pool just for test setup/teardown (separate from the server's pool).
export const pool = new pg.Pool({ connectionString });

/**
 * Call the API. Returns { status, body } where body is parsed JSON when possible.
 * Never throws on non-2xx — tests assert on status explicitly.
 */
export async function api(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  return { status: res.status, body: parsed };
}

/** Fail fast with a helpful message if the server isn't reachable. */
export async function assertServerUp() {
  try {
    const { status, body } = await api("GET", "/health");
    if (status !== 200 || !body?.ok) {
      throw new Error(`unexpected /health response: ${status} ${JSON.stringify(body)}`);
    }
  } catch (err) {
    throw new Error(
      `Cannot reach the API at ${API_BASE}.\n` +
        `Start the database and server first:\n` +
        `  npm run docker:db:start   (repo root)\n` +
        `  cd server && npm run dev\n` +
        `Original error: ${err.message}`
    );
  }
}

/** Fetch one valid reference code/id of each kind so tests use real foreign keys. */
export async function loadReferenceData() {
  const pick = async (path, field) => {
    const { body } = await api("GET", path);
    const rows = body?.data ?? [];
    if (!rows.length) throw new Error(`no reference rows from ${path}`);
    return rows[0][field];
  };
  return {
    bloodTypeId: await pick("/api/config/blood-types", "id"),
    departmentId: await pick("/api/config/departments", "id"),
    medicineCode: await pick("/api/config/medicines", "medicine_code"),
    treatmentCode: await pick("/api/config/treatments", "treatment_code"),
    conditionCode: await pick("/api/config/conditions", "condition_code"),
    feeCode: await pick("/api/config/fees", "fee_code"),
  };
}

/**
 * Delete every test-owned row in foreign-key-safe order.
 * Test patients/doctors are identified by TEST_MARKER in their name; all of a
 * test patient's visits and the records hanging off them are removed too.
 */
export async function cleanupTestData() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Visit ids that belong to test patients.
    const { rows: visitRows } = await client.query(
      `SELECT v.id FROM visit v JOIN patient p ON p.id = v.patient_id
       WHERE p.patient_name LIKE $1`,
      [`${TEST_MARKER}%`]
    );
    const visitIds = visitRows.map((r) => r.id);

    if (visitIds.length) {
      // Bills + transactions for those visits.
      const { rows: billRows } = await client.query(
        "SELECT id FROM patient_bill WHERE visit_id = ANY($1)",
        [visitIds]
      );
      const billIds = billRows.map((r) => r.id);
      if (billIds.length) {
        await client.query(
          "DELETE FROM transaction_line WHERE transaction_header_id IN (SELECT id FROM transaction_header WHERE bill_id = ANY($1))",
          [billIds]
        );
        await client.query("DELETE FROM transaction_header WHERE bill_id = ANY($1)", [billIds]);
        await client.query("DELETE FROM patient_bill_line WHERE bill_header_id = ANY($1)", [billIds]);
        await client.query("DELETE FROM patient_bill WHERE id = ANY($1)", [billIds]);
      }
      // Charts (lines first, then headers) for those visits.
      const charts = [
        ["appointed_doctor_line", "appointed_doctor", "appointed_doctor_id"],
        ["prescription_chart_line", "prescription_chart", "prescription_chart_id"],
        ["treatment_chart_line", "treatment_chart", "treatment_chart_id"],
        ["diagnosis_chart_line", "diagnosis_chart", "diagnosis_chart_id"],
      ];
      for (const [lineTable, headerTable, fk] of charts) {
        await client.query(
          `DELETE FROM ${lineTable} WHERE ${fk} IN (SELECT id FROM ${headerTable} WHERE visit_id = ANY($1))`,
          [visitIds]
        );
        await client.query(`DELETE FROM ${headerTable} WHERE visit_id = ANY($1)`, [visitIds]);
      }
      await client.query("DELETE FROM visit WHERE id = ANY($1)", [visitIds]);
    }

    await client.query("DELETE FROM patient WHERE patient_name LIKE $1", [`${TEST_MARKER}%`]);
    await client.query("DELETE FROM doctor WHERE doctor_name LIKE $1", [`${TEST_MARKER}%`]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/** Convenience creators that return the generated code, tagging data for cleanup. */
export async function createTestPatient(over = {}) {
  const { body } = await api("POST", "/api/patients", {
    patient_name: `${TEST_MARKER} Patient`,
    gender: "Male",
    date_of_birth: "1990-01-01",
    ...over,
  });
  return body?.data?.patient_code;
}

export async function createTestDoctor(over = {}) {
  const { body } = await api("POST", "/api/doctors", {
    doctor_name: `${TEST_MARKER} Doctor`,
    gender: "Female",
    specialty: "QA",
    ...over,
  });
  return body?.data?.doctor_code;
}

export async function createTestVisit(patientCode, over = {}) {
  const { body } = await api("POST", "/api/visits", {
    patient_code: patientCode,
    visit_type: "OPD",
    reported_symptoms: `${TEST_MARKER} symptom`,
    ...over,
  });
  return body?.data?.visit_code;
}
