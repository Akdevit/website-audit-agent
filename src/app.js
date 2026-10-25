import express from "express";
import cors from "cors";

import { errorMiddleware } from "./middlewares/error.middleware.js";
import auditRoutes from "./routes/audit.route.js";

const app = express();

app.disable("x-powered-by");

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/v1/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Website Audit Agent API is running",
  });
});

app.use("/api/v1/audits", auditRoutes);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorMiddleware);

export default app;
