import { Router } from "express";
import {
  createAudit,
  deleteAudit,
  getAudit,
  listAudits,
} from "../controllers/audit.controller.js";

const router = Router();

router.post("/", createAudit);
router.get("/", listAudits);
router.get("/:id", getAudit);
router.delete("/:id", deleteAudit);

export default router;
