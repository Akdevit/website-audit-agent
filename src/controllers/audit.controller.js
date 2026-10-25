import mongoose from "mongoose";
import {
    deleteAuditById,
  executeAudit,
  getAllAudits,
  getAuditById,
} from "../services/audit.service.js";

export const createAudit = async (req, res, next) => {
  try {
    const {
      url,
      query = "Perform a complete website audit",
      device = "mobile",
    } = req.body ?? {};

    if (typeof url !== "string" || !URL.canParse(url)) {
      return res.status(400).json({
        success: false,
        message: "Valid website URL is required",
      });
    }

    const parsedUrl = new URL(url);

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return res.status(400).json({
        success: false,
        message: "Only HTTP/HTTPS URLs are supported",
      });
    }

    if (!["mobile", "desktop"].includes(device)) {
      return res.status(400).json({
        success: false,
        message: "Invalid device",
      });
    }

    if (typeof query !== "string" || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: "Valid query is required",
      });
    }

    const result = await executeAudit(parsedUrl.href, {
      query: query.trim(),
      device,
    });

    return res.status(201).json({
      success: true,
      message: "Website audit completed successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const listAudits = async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination parameters",
      });
    }

    const data = await getAllAudits(page, limit);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getAudit = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid audit ID",
      });
    }

    const audit = await getAuditById(id);

    if (!audit) {
      return res.status(404).json({
        success: false,
        message: "Audit not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: audit,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAudit = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid audit ID",
      });
    }

    const audit = await deleteAuditById(id);

    if (!audit) {
      return res.status(404).json({
        success: false,
        message: "Audit not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Audit deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
