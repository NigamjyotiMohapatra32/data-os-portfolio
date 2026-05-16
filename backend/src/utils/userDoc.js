export function userDocId(req) {
  return String(req.user?.userId || 'admin').replace(/\//g, '_');
}
