import express from "express";
import cors from "cors";
import logger from "./utils/logger.js";
import patientsRoutes from "./routes/patients.routes.js";
import doctorsRoutes from "./routes/doctors.routes.js";
import visitsRoutes from "./routes/visits.routes.js";
import configurationRoutes from "./routes/configuration.routes.js";
import patientBillsRoutes from "./routes/patientBills.routes.js";
import clinicReportsRoutes from "./routes/clinicReports.routes.js";

const app = express();

const c = { reset:"\x1b[0m", dim:"\x1b[2m", green:"\x1b[32m", yellow:"\x1b[33m", blue:"\x1b[34m", magenta:"\x1b[35m", cyan:"\x1b[36m", red:"\x1b[31m" };
const methodColor = { GET:c.green, POST:c.cyan, PUT:c.yellow, DELETE:c.magenta };
const statusColor = (s) => (s>=500?c.red:s>=400?c.yellow:s>=300?c.blue:c.green);
const useColor = process.env.NODE_ENV !== "production" && process.stdout.isTTY;

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    let msg = `[${req.method}] ${req.originalUrl} ${status} ${duration}ms`;
    if (useColor) {
      const m = methodColor[req.method] || c.dim;
      const s = statusColor(status);
      msg = `${m}[${req.method}]${c.reset} ${req.originalUrl} ${s}${status}${c.reset} ${c.dim}${duration}ms${c.reset}`;
    }
    logger.info(msg, { method: req.method, url: req.originalUrl, status, durationMs: duration });
  });
  next();
});

const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors({
  origin: corsOrigin === undefined || corsOrigin === "" ? true : corsOrigin.split(",").map(o => o.trim()),
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));
app.use(express.json());

app.get("/health", (_, res) => res.json({ ok: true }));

app.use("/api/patients", patientsRoutes);
app.use("/api/doctors", doctorsRoutes);
app.use("/api/visits", visitsRoutes);
app.use("/api/config", configurationRoutes);
app.use("/api/patient-bills", patientBillsRoutes);
app.use("/api/reports", clinicReportsRoutes);

const port = process.env.PORT || 4000;
const host = process.env.HOST || "0.0.0.0";
app.listen(port, host, () => logger.info(`Clinic server listening on ${host}:${port}`));
