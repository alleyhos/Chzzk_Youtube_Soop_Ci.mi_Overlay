const SESSION_COOKIE = "chiyusup_session";
const SESSION_SECONDS = 60 * 60 * 24 * 30;
const PASSWORD_ITERATIONS = 310000;

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}

export function fail(message, status = 400) {
  return json({ error: message }, status);
}

export async function readJson(request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 8192) throw new Error("요청이 너무 큽니다.");
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    throw new Error("요청 형식이 올바르지 않습니다.");
  }
  try {
    return await request.json();
  } catch {
    throw new Error("요청 내용을 읽을 수 없습니다.");
  }
}

export function validateOrigin(request, env) {
  const origin = request.headers.get("origin");
  const expected = env.SITE_URL ? new URL(env.SITE_URL).origin : new URL(request.url).origin;
  if (!origin || origin !== expected || new URL(request.url).origin !== expected) {
    throw new Error("요청 출처를 확인할 수 없습니다. 사이트 주소를 확인해 주세요.");
  }
}

export function cookieValue(request) {
  const cookies = request.headers.get("cookie") || "";
  for (const part of cookies.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === SESSION_COOKIE) return rest.join("=");
  }
  return "";
}

export function sessionCookie(token, maxAge = SESSION_SECONDS) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function randomToken(byteCount = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteCount));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

export async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return toBase64Url(new Uint8Array(digest));
}

function toBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

export async function passwordDigest(password, saltText) {
  let encodedSalt = saltText.replaceAll("-", "+").replaceAll("_", "/");
  encodedSalt += "=".repeat((4 - encodedSalt.length % 4) % 4);
  const salt = Uint8Array.from(atob(encodedSalt), (c) => c.charCodeAt(0));
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: PASSWORD_ITERATIONS }, material, 256);
  return toBase64Url(new Uint8Array(bits));
}

export function equalSecret(left, right) {
  const a = new TextEncoder().encode(String(left));
  const b = new TextEncoder().encode(String(right));
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) difference |= (a[index] || 0) ^ (b[index] || 0);
  return difference === 0;
}

export async function makePassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltText = toBase64Url(salt);
  return { salt: saltText, digest: await passwordDigest(password, saltText) };
}

export function validEmail(email) {
  return typeof email === "string" && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email);
}

export function normalizedEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function normalizeName(name) {
  return String(name || "").normalize("NFKC").trim().replace(/\s+/gu, " ");
}

export async function rateLimit(db, request, action, limit, windowSeconds, email = "") {
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const key = await sha256(`${action}|${ip}|${email}`);
  const now = Math.floor(Date.now() / 1000);
  const bucket = Math.floor(now / windowSeconds);
  await db.prepare(`INSERT INTO auth_rate_limits (key_hash, bucket, attempts, last_seen_at)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(key_hash) DO UPDATE SET
      attempts = CASE WHEN bucket = excluded.bucket THEN attempts + 1 ELSE 1 END,
      bucket = excluded.bucket,
      last_seen_at = excluded.last_seen_at`).bind(key, bucket, now).run();
  await db.prepare("DELETE FROM auth_rate_limits WHERE last_seen_at < ?").bind(now - 86400).run();
  await db.prepare("DELETE FROM auth_tokens WHERE expires_at < ? OR used_at < ?").bind(now - 86400, Date.now() - 7 * 86400 * 1000).run();
  await db.prepare("DELETE FROM auth_sessions WHERE expires_at < ?").bind(now).run();
  const row = await db.prepare("SELECT attempts FROM auth_rate_limits WHERE key_hash = ?").bind(key).first();
  return Number(row?.attempts || 0) <= limit;
}

export async function createEmailToken(db, userId, purpose, expiresInSeconds) {
  const raw = randomToken(32);
  const tokenHash = await sha256(raw);
  const now = Math.floor(Date.now() / 1000);
  await db.prepare("INSERT INTO auth_tokens (token_hash, user_id, purpose, expires_at, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(tokenHash, userId, purpose, now + expiresInSeconds, now).run();
  return raw;
}

export async function sendAuthEmail(env, recipient, subject, title, message, linkLabel, link) {
  if (!env.RESEND_API_KEY || !env.MAIL_FROM || !env.SITE_URL) throw new Error("메일 발송 설정이 완료되지 않았습니다.");
  const safeLink = escapeHtml(link);
  const text = `${title}\n\n${message}\n\n${linkLabel}: ${link}\n\n요청한 적이 없다면 이 메일을 무시해 주세요. 링크는 30분 동안 유효합니다.`;
  const html = `<!doctype html><html lang="ko"><body style="margin:0;background:#f4f6f2;padding:32px 12px;font-family:Arial,'Malgun Gothic',sans-serif;color:#202a26"><table role="presentation" style="width:100%;max-width:520px;margin:auto;background:#fff;border:1px solid #dce3da;border-radius:10px"><tr><td style="padding:30px"><p style="margin:0 0 22px;color:#47745a;font-size:12px;font-weight:bold">치유숲씨 계정</p><h1 style="margin:0 0 12px;font-size:22px">${escapeHtml(title)}</h1><p style="margin:0 0 23px;color:#68756c;font-size:14px;line-height:1.7">${escapeHtml(message)}</p><a href="${safeLink}" style="display:inline-block;padding:12px 18px;border-radius:5px;background:#1d3730;color:#fff;text-decoration:none;font-size:13px;font-weight:bold">${escapeHtml(linkLabel)}</a><p style="margin:25px 0 0;color:#879188;font-size:11px;line-height:1.65">요청한 적이 없다면 이 메일을 무시해 주세요. 링크는 30분 동안 유효합니다.</p></td></tr></table></body></html>`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: env.MAIL_FROM, to: [recipient], subject, html, text }),
  });
  if (!response.ok) throw new Error("인증 메일을 보내지 못했습니다.");
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/gu, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

export async function createSession(db, userId) {
  const raw = randomToken(32);
  const tokenHash = await sha256(raw);
  const now = Math.floor(Date.now() / 1000);
  await db.prepare("INSERT INTO auth_sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .bind(tokenHash, userId, now + SESSION_SECONDS, now).run();
  return raw;
}

export async function sessionData(db, request) {
  const raw = cookieValue(request);
  if (!raw) return null;
  const tokenHash = await sha256(raw);
  const now = Math.floor(Date.now() / 1000);
  const row = await db.prepare(`SELECT s.token_hash, s.user_id, s.expires_at, u.email, u.display_name
    FROM auth_sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ? AND u.email_verified_at IS NOT NULL`).bind(tokenHash, now).first();
  if (!row) await db.prepare("DELETE FROM auth_sessions WHERE token_hash = ?").bind(tokenHash).run();
  return row || null;
}

export function userShape(row) {
  return row ? { id: row.id || row.user_id, name: row.display_name, email: row.email } : null;
}
