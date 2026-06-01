// Full integration test suite for the Clinic API.
// Covers every active endpoint plus edge cases (404s, foreign-key delete guards)
// and a regression test for the duplicate-key / out-of-sync sequence bug.
//
// Run with:  cd server && npm test   (server + DB must be running — see helpers.js)

import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import {
  api,
  pool,
  assertServerUp,
  loadReferenceData,
  cleanupTestData,
  createTestPatient,
  createTestDoctor,
  createTestVisit,
  TEST_MARKER,
} from "./helpers.js";

let ref; // valid reference codes/ids loaded from the seeded DB

before(async () => {
  await assertServerUp();
  await cleanupTestData(); // start from a clean slate even if a prior run was interrupted
  ref = await loadReferenceData();
});

after(async () => {
  await cleanupTestData();
  await pool.end();
});

// A 2xx response must always carry { success: true }.
function expectOk({ status, body }, expectedStatus = 200) {
  assert.equal(status, expectedStatus, `expected ${expectedStatus}, got ${status}: ${JSON.stringify(body)}`);
  assert.equal(body.success, true, `expected success:true, got ${JSON.stringify(body)}`);
  return body;
}

// ─────────────────────────────────────────────────────────────────────────────
describe("health & configuration", () => {
  test("GET /health returns ok", async () => {
    const { status, body } = await api("GET", "/health");
    assert.equal(status, 200);
    assert.equal(body.ok, true);
  });

  for (const ep of ["departments", "medicines", "treatments", "fees", "conditions", "blood-types", "doctors"]) {
    test(`GET /api/config/${ep} returns a non-empty list`, async () => {
      const body = expectOk(await api("GET", `/api/config/${ep}`));
      assert.ok(Array.isArray(body.data), "data should be an array");
      assert.ok(body.data.length > 0, "config list should not be empty");
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
describe("patients CRUD", () => {
  test("list returns pagination meta", async () => {
    const body = expectOk(await api("GET", "/api/patients?limit=5"));
    assert.ok(Array.isArray(body.data));
    assert.ok(body.meta && typeof body.meta.total === "number");
    assert.ok(body.data.length <= 5);
  });

  test("create → get → update → reflects changes", async () => {
    const code = await createTestPatient({ blood_type_id: ref.bloodTypeId });
    assert.match(code, /^PAT-\d+$/, "should generate a PAT- code");

    const got = expectOk(await api("GET", `/api/patients/${code}`));
    assert.equal(got.data.patient_code, code);
    assert.ok(got.data.patient_name.startsWith(TEST_MARKER));

    expectOk(await api("PUT", `/api/patients/${code}`, {
      patient_name: `${TEST_MARKER} Patient Renamed`,
      gender: "Female",
      date_of_birth: "1992-02-02",
      blood_type_id: ref.bloodTypeId,
    }));
    const after = expectOk(await api("GET", `/api/patients/${code}`));
    assert.equal(after.data.patient_name, `${TEST_MARKER} Patient Renamed`);
    assert.equal(after.data.gender, "Female");
  });

  test("search finds a created patient by name", async () => {
    await createTestPatient({ patient_name: `${TEST_MARKER} Searchable Zenith` });
    const body = expectOk(await api("GET", `/api/patients?search=Zenith`));
    assert.ok(body.data.some((p) => p.patient_name.includes("Zenith")));
  });

  test("GET unknown patient → 404 NOT_FOUND", async () => {
    const { status, body } = await api("GET", "/api/patients/PAT-DOES-NOT-EXIST");
    assert.equal(status, 404);
    assert.equal(body.success, false);
    assert.equal(body.error.code, "NOT_FOUND");
  });

  test("DELETE a patient with visits is blocked (FK guard) then allowed once visits gone", async () => {
    const code = await createTestPatient();
    const visitCode = await createTestVisit(code);
    assert.match(visitCode, /^VST-\d+$/);

    // Has a visit → delete must be refused with a clear 400.
    const blocked = await api("DELETE", `/api/patients/${code}`);
    assert.equal(blocked.status, 400);
    assert.equal(blocked.body.success, false);

    // Remove the visit directly, then the patient delete should succeed.
    await pool.query("DELETE FROM visit WHERE visit_code = $1", [visitCode]);
    expectOk(await api("DELETE", `/api/patients/${code}`));
    const gone = await api("GET", `/api/patients/${code}`);
    assert.equal(gone.status, 404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("doctors CRUD", () => {
  test("create → get → update → delete", async () => {
    const code = await createTestDoctor({ department_id: ref.departmentId });
    assert.match(code, /^DOC-\d+$/);

    const got = expectOk(await api("GET", `/api/doctors/${code}`));
    assert.equal(got.data.doctor_code, code);

    expectOk(await api("PUT", `/api/doctors/${code}`, {
      doctor_name: `${TEST_MARKER} Doctor Updated`,
      gender: "Male",
      specialty: "Cardiology",
      department_id: ref.departmentId,
    }));
    const upd = expectOk(await api("GET", `/api/doctors/${code}`));
    assert.equal(upd.data.specialty, "Cardiology");

    expectOk(await api("DELETE", `/api/doctors/${code}`));
    assert.equal((await api("GET", `/api/doctors/${code}`)).status, 404);
  });

  test("deleting an appointed doctor is blocked by FK guard", async () => {
    const docCode = await createTestDoctor();
    const patCode = await createTestPatient();
    const visitCode = await createTestVisit(patCode);
    expectOk(await api("POST", `/api/visits/${visitCode}/appointed-doctor`, {
      doctor_codes: [docCode],
      notes_map: { [docCode]: "primary" },
    }));

    const blocked = await api("DELETE", `/api/doctors/${docCode}`);
    assert.equal(blocked.status, 400, JSON.stringify(blocked.body));
    assert.equal(blocked.body.success, false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("visits CRUD", () => {
  test("create → get → update", async () => {
    const patCode = await createTestPatient();
    const visitCode = await createTestVisit(patCode, {
      visit_type: "OPD",
      blood_pressure: "120/80",
      height: 170,
      weight: 65,
      temperature: 36.6,
    });
    assert.match(visitCode, /^VST-\d+$/);

    const got = expectOk(await api("GET", `/api/visits/${visitCode}`));
    assert.equal(got.data.visit_code, visitCode);
    assert.equal(got.data.patient_code, patCode);

    expectOk(await api("PUT", `/api/visits/${visitCode}`, {
      visit_type: "IPD",
      reported_symptoms: `${TEST_MARKER} updated`,
      blood_pressure: "110/70",
      height: 171,
      weight: 66,
      temperature: 37,
    }));
    const upd = expectOk(await api("GET", `/api/visits/${visitCode}`));
    assert.equal(upd.data.visit_type, "IPD");
  });

  test("creating a visit for an unknown patient → 404", async () => {
    const { status, body } = await api("POST", "/api/visits", {
      patient_code: "PAT-NOPE",
      visit_type: "OPD",
    });
    assert.equal(status, 404);
    assert.equal(body.success, false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("clinical charts (the originally-failing create flows)", () => {
  let visitCode, doctorCode;

  before(async () => {
    const patCode = await createTestPatient();
    visitCode = await createTestVisit(patCode);
    doctorCode = await createTestDoctor();
  });

  test("appointed-doctor: save then read back", async () => {
    expectOk(await api("POST", `/api/visits/${visitCode}/appointed-doctor`, {
      doctor_codes: [doctorCode],
      notes_map: { [doctorCode]: "lead" },
    }));
    const got = expectOk(await api("GET", `/api/visits/${visitCode}/appointed-doctor`));
    assert.equal(got.data.lines.length, 1);
    assert.equal(got.data.lines[0].doctor_code, doctorCode);
  });

  test("prescription-chart: save then read back", async () => {
    expectOk(await api("POST", `/api/visits/${visitCode}/prescription-chart`, {
      lines: [{ medicine_code: ref.medicineCode, quantity: 2, dosage_notes: "2x daily" }],
    }));
    const got = expectOk(await api("GET", `/api/visits/${visitCode}/prescription-chart`));
    assert.equal(got.data.lines.length, 1);
    assert.equal(Number(got.data.lines[0].quantity), 2);
  });

  test("treatment-chart: save then read back", async () => {
    expectOk(await api("POST", `/api/visits/${visitCode}/treatment-chart`, {
      lines: [{ treatment_code: ref.treatmentCode, quantity: 1, notes: "n" }],
    }));
    const got = expectOk(await api("GET", `/api/visits/${visitCode}/treatment-chart`));
    assert.equal(got.data.lines.length, 1);
    assert.equal(got.data.lines[0].treatment_code, ref.treatmentCode);
  });

  test("diagnosis-chart: save then read back", async () => {
    expectOk(await api("POST", `/api/visits/${visitCode}/diagnosis-chart`, {
      lines: [{ condition_code: ref.conditionCode }],
    }));
    const got = expectOk(await api("GET", `/api/visits/${visitCode}/diagnosis-chart`));
    assert.equal(got.data.lines.length, 1);
    assert.equal(got.data.lines[0].condition_code, ref.conditionCode);
  });

  test("re-saving a chart replaces (does not duplicate) lines", async () => {
    await api("POST", `/api/visits/${visitCode}/prescription-chart`, {
      lines: [{ medicine_code: ref.medicineCode, quantity: 5 }],
    });
    const got = expectOk(await api("GET", `/api/visits/${visitCode}/prescription-chart`));
    assert.equal(got.data.lines.length, 1, "re-save should overwrite, not append");
    assert.equal(Number(got.data.lines[0].quantity), 5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Regression for the "popup says saved but value wasn't saved" bug: a save that
// references a non-existent code must FAIL (and persist nothing), not silently
// skip the line and return success.
describe("save validation — unknown codes are rejected, not silently dropped", () => {
  let visitCode;
  before(async () => {
    const patCode = await createTestPatient();
    visitCode = await createTestVisit(patCode);
  });

  test("prescription with an unknown medicine code → 400, nothing saved", async () => {
    const res = await api("POST", `/api/visits/${visitCode}/prescription-chart`, {
      lines: [{ medicine_code: "NOPE-999", quantity: 1 }],
    });
    assert.equal(res.status, 400, "should reject, not pretend success");
    assert.equal(res.body.success, false);
    // and nothing should have been persisted
    const got = expectOk(await api("GET", `/api/visits/${visitCode}/prescription-chart`));
    assert.equal(got.data.lines.length, 0, "no line should be saved when the code is invalid");
  });

  test("treatment with an unknown code → 400", async () => {
    const res = await api("POST", `/api/visits/${visitCode}/treatment-chart`, {
      lines: [{ treatment_code: "NOPE-999", quantity: 1 }],
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  test("diagnosis with an unknown condition code → 400", async () => {
    const res = await api("POST", `/api/visits/${visitCode}/diagnosis-chart`, {
      lines: [{ condition_code: "NOPE-999" }],
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  test("appointed-doctor with an unknown doctor code → 400", async () => {
    const res = await api("POST", `/api/visits/${visitCode}/appointed-doctor`, {
      doctor_codes: ["NOPE-999"],
      notes_map: {},
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  test("a valid save still succeeds and persists", async () => {
    expectOk(await api("POST", `/api/visits/${visitCode}/prescription-chart`, {
      lines: [{ medicine_code: ref.medicineCode, quantity: 2 }],
    }));
    const got = expectOk(await api("GET", `/api/visits/${visitCode}/prescription-chart`));
    assert.equal(got.data.lines.length, 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("billing & transactions", () => {
  let visitCode, billCode;

  before(async () => {
    const patCode = await createTestPatient();
    visitCode = await createTestVisit(patCode);
    // Give the visit billable items so the auto-populated bill has lines.
    await api("POST", `/api/visits/${visitCode}/treatment-chart`, {
      lines: [{ treatment_code: ref.treatmentCode, quantity: 2 }],
    });
    await api("POST", `/api/visits/${visitCode}/prescription-chart`, {
      lines: [{ medicine_code: ref.medicineCode, quantity: 3 }],
    });
  });

  test("create bill for visit auto-populates lines from charts", async () => {
    const created = expectOk(await api("POST", `/api/patient-bills/by-visit/${visitCode}`), 201);
    billCode = created.data.bill_code;
    assert.match(billCode, /^BLL-\d+$/);

    const got = expectOk(await api("GET", `/api/patient-bills/${billCode}`));
    assert.ok(got.data.lines.length >= 2, "should have treatment + medicine lines");
    const types = got.data.lines.map((l) => l.charge_type);
    assert.ok(types.includes("Treatment") && types.includes("Medicine"));
  });

  test("creating a bill twice returns the same bill (idempotent)", async () => {
    const again = expectOk(await api("POST", `/api/patient-bills/by-visit/${visitCode}`), 201);
    assert.equal(again.data.bill_code, billCode);
  });

  test("get bill by visit code", async () => {
    const got = expectOk(await api("GET", `/api/patient-bills/by-visit/${visitCode}`));
    assert.equal(got.data.bill_code, billCode);
  });

  test("save bill lines (replace with a Fee line)", async () => {
    expectOk(await api("POST", `/api/patient-bills/${billCode}/lines`, {
      lines: [{ charge_type: "Fee", fee_code: ref.feeCode }],
    }));
    const got = expectOk(await api("GET", `/api/patient-bills/${billCode}`));
    assert.equal(got.data.lines.length, 1);
    assert.equal(got.data.lines[0].charge_type, "Fee");
    assert.equal(got.data.lines[0].fee_code, ref.feeCode);
  });

  test("add a payment transaction", async () => {
    const created = expectOk(await api("POST", `/api/patient-bills/${billCode}/transactions`, {
      amount: 500,
      transaction_type: "Cash",
    }), 201);
    assert.match(created.data.transaction_code, /^TSC-\d+$/);

    const got = expectOk(await api("GET", `/api/patient-bills/${billCode}`));
    assert.ok(got.data.transactions.length >= 1);
  });

  test("bill appears in the bills list", async () => {
    const body = expectOk(await api("GET", `/api/patient-bills?limit=100`));
    assert.ok(body.data.some((b) => b.bill_code === billCode));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("reports (all endpoints return data without error)", () => {
  const reports = [
    "patients",
    "patients-visiting",
    "medical-problems",
    "top-conditions",
    "medicines",
    "prescriptions",
    "top-medicines",
    "diagnoses",
    "doctors",
    "patients-by-doctor",
    "most-appointed-doctors",
    "bills",
    "revenue-by-charge-type",
    "visits",
    "visits-monthly",
  ];
  for (const r of reports) {
    test(`GET /api/reports/${r}`, async () => {
      const body = expectOk(await api("GET", `/api/reports/${r}?limit=5`));
      assert.ok(Array.isArray(body.data));
    });
  }

  test("report date filters are accepted", async () => {
    const body = expectOk(await api("GET", "/api/reports/visits?from=2020-01-01&to=2030-12-31&type=OPD"));
    assert.ok(Array.isArray(body.data));
  });

  test("patients-visiting: OPD/IPD type filter only returns matching visits", async () => {
    const opd = expectOk(await api("GET", "/api/reports/patients-visiting?type=OPD"));
    assert.ok(opd.data.every((r) => r.visit_type === "OPD"), "every row should be OPD");
    const ipd = expectOk(await api("GET", "/api/reports/patients-visiting?type=IPD"));
    assert.ok(ipd.data.every((r) => r.visit_type === "IPD"), "every row should be IPD");
  });

  test("the removed 'top-doctors-by-patients' report is gone (404)", async () => {
    const { status } = await api("GET", "/api/reports/top-doctors-by-patients");
    assert.equal(status, 404, "deleted report endpoint should no longer exist");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("data integrity — regression test for the duplicate-key bug", () => {
  test("creating many records in a row yields unique, sequential codes (no _pkey collision)", async () => {
    const codes = [];
    for (let i = 0; i < 5; i++) {
      const code = await createTestDoctor({ doctor_name: `${TEST_MARKER} Seq ${i}` });
      assert.match(code, /^DOC-\d+$/, `create #${i} should succeed and return a code`);
      codes.push(code);
    }
    const unique = new Set(codes);
    assert.equal(unique.size, codes.length, `all doctor codes must be unique, got ${codes.join(", ")}`);
  });

  test("the identity sequence stays in sync with MAX(id) after a create", async () => {
    await createTestPatient();
    const { rows } = await pool.query(
      `SELECT (SELECT MAX(id) FROM patient) AS max_id,
              (SELECT last_value FROM pg_sequences
               WHERE schemaname || '.' || sequencename = pg_get_serial_sequence('patient','id')) AS seq_last`
    );
    const { max_id, seq_last } = rows[0];
    assert.equal(String(seq_last), String(max_id), "sequence must equal MAX(id) — otherwise the next insert collides");
  });
});
