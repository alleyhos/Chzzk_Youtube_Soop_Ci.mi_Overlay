export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export function fail(message, status = 400) {
  return json({ error: message }, status);
}

export function validateOrigin(request, env) {
  const origin = request.headers.get("origin");
  const expected = env.SITE_URL ? new URL(env.SITE_URL).origin : new URL(request.url).origin;
  if (!origin || origin !== expected || new URL(request.url).origin !== expected) {
    throw new Error("요청 출처를 확인할 수 없습니다. 사이트 주소를 확인해 주세요.");
  }
}

export async function readMessage(request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 16384) throw new Error("문의 내용이 너무 큽니다.");
  const type = request.headers.get("content-type")?.toLowerCase() || "";
  if (type.includes("application/json")) {
    try { return { fields: await request.json(), isForm: false }; }
    catch { throw new Error("문의 내용을 읽을 수 없습니다."); }
  }
  if (type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data")) {
    try { return { fields: Object.fromEntries(await request.formData()), isForm: true }; }
    catch { throw new Error("문의 내용을 읽을 수 없습니다."); }
  }
  throw new Error("요청 형식이 올바르지 않습니다.");
}

export async function rateLimit(db, request, secret, maxPerHour = 5) {
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const hmacKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const keyDigest = new Uint8Array(await crypto.subtle.sign("HMAC", hmacKey, new TextEncoder().encode(`contact|${ip}`)));
  const key = [...keyDigest].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  const now = Math.floor(Date.now() / 1000);
  const bucket = Math.floor(now / 3600);
  await db.prepare(`INSERT INTO contact_rate_limits (key_hash, bucket, attempts, last_seen_at)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(key_hash) DO UPDATE SET
      attempts = CASE WHEN bucket = excluded.bucket THEN attempts + 1 ELSE 1 END,
      bucket = excluded.bucket,
      last_seen_at = excluded.last_seen_at`).bind(key, bucket, now).run();
  await db.prepare("DELETE FROM contact_rate_limits WHERE last_seen_at < ?").bind(now - 86400).run();
  const row = await db.prepare("SELECT attempts FROM contact_rate_limits WHERE key_hash = ?").bind(key).first();
  return Number(row?.attempts || 0) <= maxPerHour;
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/gu, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

export function formRedirect(request, env, status) {
  const target = new URL("/", env.SITE_URL || request.url);
  target.searchParams.set("contact", status);
  target.hash = "contact";
  return Response.redirect(target.toString(), 303);
}
