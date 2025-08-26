function parsePagination(query, defLimit = 10) {
  const page = Math.max(1, parseInt(query.page || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || String(defLimit), 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function buildMeta(total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  return { total, page, limit, totalPages, hasNext: page < totalPages, hasPrev: page > 1 };
}

module.exports = { parsePagination, buildMeta };
