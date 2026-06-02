import { Router } from "express";
import * as c from "../controllers/clinicReports.controller.js";

const r = Router();
r.get("/patients", c.patients);                          // 1
r.get("/patients-visiting", c.patientsVisiting);         // 1b
r.get("/medical-problems", c.medicalProblems);           // 2
r.get("/top-conditions", c.topConditions);               // 3
r.get("/medicines", c.medicines);                        // 4
r.get("/prescriptions", c.prescriptions);                // 5
r.get("/top-medicines", c.topMedicines);                 // 6
r.get("/diagnoses", c.diagnoses);                        // 7 & 8
r.get("/diagnoses-by-chart", c.diagnosesByChart);        // 9
r.get("/doctors", c.doctors);                            // 10
r.get("/patients-by-doctor", c.patientsByDoctor);        // 11
r.get("/most-appointed-doctors", c.mostAppointedDoctors); // 12
r.get("/bills", c.bills);                                // 14
r.get("/revenue-by-charge-type", c.revenueByChargeType); // 15
r.get("/visits", c.visits);                              // 16 & 17
r.get("/visits-monthly", c.visitsMonthly);               // 18
export default r;
