import { pool } from "../db/pool.js";

export async function listBills({ search = "", page = 1, limit = 10 } = {}) {
  const offset = (Number(page) - 1) * Number(limit);
  const s = `%${search}%`;
  const { rows: [{ total }] } = await pool.query(
    `SELECT COUNT(*) as total FROM patient_bill pb
     JOIN visit v ON v.id=pb.visit_id JOIN patient p ON p.id=v.patient_id
     WHERE pb.bill_code ILIKE $1 OR p.patient_name ILIKE $1`, [s]
  );
  const { rows } = await pool.query(
    `SELECT pb.id, pb.bill_code, pb.tax, v.visit_code, v.visit_type, p.patient_name, p.patient_code
     FROM patient_bill pb JOIN visit v ON v.id=pb.visit_id JOIN patient p ON p.id=v.patient_id
     WHERE pb.bill_code ILIKE $1 OR p.patient_name ILIKE $1
     ORDER BY pb.id DESC LIMIT $2 OFFSET $3`,
    [s, Number(limit), offset]
  );
  return { data: rows, total: Number(total), page: Number(page), limit: Number(limit), totalPages: Math.ceil(Number(total)/Number(limit)) };
}

export async function getBillByVisit(visit_code) {
  const vr = await pool.query("SELECT id FROM visit WHERE visit_code=$1", [visit_code]);
  if (!vr.rowCount) return null;
  const visit_id = vr.rows[0].id;
  const br = await pool.query("SELECT id, bill_code, tax FROM patient_bill WHERE visit_id=$1", [visit_id]);
  if (!br.rowCount) return null;
  const bill = br.rows[0];

  const { rows: lines } = await pool.query(
    `SELECT pbl.id, pbl.charge_type,
            tcl.id as tcl_id, tcl.quantity as treatment_qty, t.treatment_name, t.unit_cost as treatment_cost, t.treatment_code,
            pcl.id as pcl_id, pcl.quantity as medicine_qty, me.medicine_name, me.unit_cost as medicine_cost, me.medicine_code,
            f.fee_code, f.fee_name, f.fee_price
     FROM patient_bill_line pbl
     LEFT JOIN treatment_chart_line tcl ON tcl.id=pbl.treatment_chart_line_id
     LEFT JOIN treatment t ON t.id=tcl.treatment_id
     LEFT JOIN prescription_chart_line pcl ON pcl.id=pbl.prescription_chart_line_id
     LEFT JOIN medicine me ON me.id=pcl.medicine_id
     LEFT JOIN fee f ON f.id=pbl.fee_id
     WHERE pbl.bill_header_id=$1 ORDER BY pbl.id`, [bill.id]
  );

  const { rows: transactions } = await pool.query(
    `SELECT th.id, th.transaction_code, th.created_at,
            json_agg(json_build_object('id',tl.id,'amount',tl.amount,'transaction_type',tl.transaction_type,'code',tl.transaction_line_code)
              ORDER BY tl.id) as payments
     FROM transaction_header th JOIN transaction_line tl ON tl.transaction_header_id=th.id
     WHERE th.bill_id=$1 GROUP BY th.id ORDER BY th.created_at`, [bill.id]
  );

  return { ...bill, lines, transactions };
}

export async function getBillByCode(bill_code) {
  const { rows } = await pool.query(
    `SELECT pb.id, pb.bill_code, pb.tax, v.visit_code, p.patient_name FROM patient_bill pb
     JOIN visit v ON v.id=pb.visit_id JOIN patient p ON p.id=v.patient_id WHERE pb.bill_code=$1`, [bill_code]
  );
  if (!rows.length) return null;
  const bill = rows[0];

  const { rows: lines } = await pool.query(
    `SELECT pbl.id, pbl.charge_type,
            tcl.id as tcl_id, tcl.quantity as treatment_qty, t.treatment_name, t.unit_cost as treatment_cost, t.treatment_code,
            pcl.id as pcl_id, pcl.quantity as medicine_qty, me.medicine_name, me.unit_cost as medicine_cost, me.medicine_code,
            f.fee_code, f.fee_name, f.fee_price
     FROM patient_bill_line pbl
     LEFT JOIN treatment_chart_line tcl ON tcl.id=pbl.treatment_chart_line_id
     LEFT JOIN treatment t ON t.id=tcl.treatment_id
     LEFT JOIN prescription_chart_line pcl ON pcl.id=pbl.prescription_chart_line_id
     LEFT JOIN medicine me ON me.id=pcl.medicine_id
     LEFT JOIN fee f ON f.id=pbl.fee_id
     WHERE pbl.bill_header_id=$1 ORDER BY pbl.id`, [bill.id]
  );

  const { rows: transactions } = await pool.query(
    `SELECT th.id, th.transaction_code, th.created_at,
            json_agg(json_build_object('id',tl.id,'amount',tl.amount,'transaction_type',tl.transaction_type,'code',tl.transaction_line_code)
              ORDER BY tl.id) as payments
     FROM transaction_header th JOIN transaction_line tl ON tl.transaction_header_id=th.id
     WHERE th.bill_id=$1 GROUP BY th.id ORDER BY th.created_at`, [bill.id]
  );

  return { ...bill, lines, transactions };
}

export async function createBillForVisit(visit_code) {
  const vr = await pool.query("SELECT id FROM visit WHERE visit_code=$1", [visit_code]);
  if (!vr.rowCount) throw Object.assign(new Error("Visit not found"), { statusCode: 404 });
  const visit_id = vr.rows[0].id;
  const ex = await pool.query("SELECT bill_code FROM patient_bill WHERE visit_id=$1", [visit_id]);
  if (ex.rowCount) return { bill_code: ex.rows[0].bill_code };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: [{ m }] } = await client.query("SELECT MAX(id) as m FROM patient_bill");
    const bill_code = `BLL-${((Number(m)||0)+1).toString().padStart(3,"0")}`;
    const billRes = await client.query(
      "INSERT INTO patient_bill (bill_code, visit_id, tax) VALUES ($1,$2,7) RETURNING id",
      [bill_code, visit_id]
    );
    const bill_id = billRes.rows[0].id;

    // Auto-populate lines from treatment chart (single atomic statement)
    await client.query(
      `INSERT INTO patient_bill_line (bill_header_id, charge_type, treatment_chart_line_id)
       SELECT $1, 'Treatment', tcl.id
       FROM treatment_chart_line tcl
       JOIN treatment_chart tc ON tc.id = tcl.treatment_chart_id
       WHERE tc.visit_id = $2`,
      [bill_id, visit_id]
    );

    // Auto-populate lines from prescription chart (single atomic statement)
    await client.query(
      `INSERT INTO patient_bill_line (bill_header_id, charge_type, prescription_chart_line_id)
       SELECT $1, 'Medicine', pcl.id
       FROM prescription_chart_line pcl
       JOIN prescription_chart pc ON pc.id = pcl.prescription_chart_id
       WHERE pc.visit_id = $2`,
      [bill_id, visit_id]
    );

    await client.query("COMMIT");
    return { bill_code };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function saveBillLines(bill_code, { lines = [] } = {}) {
  const br = await pool.query("SELECT id FROM patient_bill WHERE bill_code=$1", [bill_code]);
  if (!br.rowCount) throw Object.assign(new Error("Bill not found"), { statusCode: 404 });
  const bill_id = br.rows[0].id;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM patient_bill_line WHERE bill_header_id=$1", [bill_id]);
    for (const line of lines) {
      if (line.charge_type === "Treatment" && line.tcl_id) {
        await client.query("INSERT INTO patient_bill_line (bill_header_id, charge_type, treatment_chart_line_id) VALUES ($1,'Treatment',$2)", [bill_id, line.tcl_id]);
      } else if (line.charge_type === "Medicine" && line.pcl_id) {
        await client.query("INSERT INTO patient_bill_line (bill_header_id, charge_type, prescription_chart_line_id) VALUES ($1,'Medicine',$2)", [bill_id, line.pcl_id]);
      } else if (line.charge_type === "Fee" && line.fee_code) {
        const fr = await client.query("SELECT id FROM fee WHERE fee_code=$1", [line.fee_code]);
        // Fail loudly instead of silently dropping the line (the "saved but not saved" bug).
        if (!fr.rowCount) throw Object.assign(new Error(`Fee not found: ${line.fee_code}`), { statusCode: 400 });
        await client.query("INSERT INTO patient_bill_line (bill_header_id, charge_type, fee_id) VALUES ($1,'Fee',$2)", [bill_id, fr.rows[0].id]);
      } else {
        throw Object.assign(new Error(`Invalid bill line (charge_type=${line.charge_type}); missing reference id/code`), { statusCode: 400 });
      }
    }
    await client.query("COMMIT");
    return { ok: true };
  } catch (e) { await client.query("ROLLBACK"); throw e; }
  finally { client.release(); }
}

export async function addTransaction(bill_code, { amount, transaction_type } = {}) {
  const br = await pool.query("SELECT id FROM patient_bill WHERE bill_code=$1", [bill_code]);
  if (!br.rowCount) throw Object.assign(new Error("Bill not found"), { statusCode: 404 });
  const bill_id = br.rows[0].id;
  const { rows: [{ m: hm }] } = await pool.query("SELECT MAX(id) as m FROM transaction_header");
  const transaction_code = `TSC-${((Number(hm)||0)+1).toString().padStart(3,"0")}`;
  const thr = await pool.query("INSERT INTO transaction_header (transaction_code, bill_id) VALUES ($1,$2) RETURNING id", [transaction_code, bill_id]);
  const th_id = thr.rows[0].id;
  const { rows: [{ m: lm }] } = await pool.query("SELECT MAX(id) as m FROM transaction_line");
  const line_code = `TXL-${((Number(lm)||0)+1).toString().padStart(3,"0")}`;
  await pool.query("INSERT INTO transaction_line (transaction_header_id, transaction_line_code, amount, transaction_type) VALUES ($1,$2,$3,$4)",
    [th_id, line_code, amount, transaction_type]);
  return { transaction_code };
}
