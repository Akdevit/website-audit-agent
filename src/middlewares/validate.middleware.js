import { z } from "zod";

export const auditSchema = z.object({
  url: z.url({
    protocol: /^https?$/,
  }),
});

export const validateAudit = (req, res, next) => {
  const result = auditSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid request data",
      errors: z.flattenError(result.error).fieldErrors,
    });
  }

  req.body = result.data;

  next();
};