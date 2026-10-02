// Historical metrics are preserved privately; the reporting API is retired.
export default function handler(_req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.status(410).json({ ok: false, error: "Reporting is retired." });
}
