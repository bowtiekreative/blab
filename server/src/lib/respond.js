// Standard response envelopes (api/README.md → Response Format).

export function ok(data, meta) {
  return meta ? { data, meta } : { data };
}

export function fail(reply, status, code, message, details) {
  return reply.code(status).send({ error: { code, message, ...(details ? { details } : {}) } });
}
