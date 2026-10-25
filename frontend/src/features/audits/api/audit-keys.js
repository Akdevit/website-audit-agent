export const auditKeys = {
  all: ["audits"],
  lists: () => ["audits", "list"],
  list: (page, limit) => ["audits", "list", { page, limit }],
  detail: (id) => ["audits", "detail", id],
  create: () => ["audits", "create"],
};
