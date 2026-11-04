import { createSession, equalSecret, fail, json, normalizedEmail, passwordDigest, rateLimit, readJson, sessionCookie, validateOrigin, validEmail } from "../../_lib/auth.js";

const FAKE_SALT = "MDEyMzQ1Njc4OWFiY2RlZg";

export async function onRequestPost({ request, env }) {
  if (!env.DB) return fail("회원 데이터베이스 설정이 아직 완료되지 않았습니다.", 503);
  try { validateOrigin(request, env); } catch (error) { return fail(error.message); }
  let body;
  try { body = await readJson(request); } catch (error) { return fail(error.message); }
  const email = normalizedEmail(body.email);
  const password = String(body.password || "");
  if (!validEmail(email) || password.length < 1 || password.length > 128) return fail("이메일 또는 비밀번호를 확인해 주세요.", 401);
  if (!(await rateLimit(env.DB, request, "login-ip", 30, 900)) || !(await rateLimit(env.DB, request, "login", 12, 900, email))) return fail("로그인 시도가 많습니다. 15분 뒤 다시 시도해 주세요.", 429);
  const user = await env.DB.prepare("SELECT id, email, display_name, password_salt, password_hash, email_verified_at FROM users WHERE email = ?").bind(email).first();
  const actualHash = user ? await passwordDigest(password, user.password_salt) : await passwordDigest(password, FAKE_SALT);
  const valid = Boolean(user && equalSecret(user.password_hash, actualHash) && user.email_verified_at);
  if (!valid) return fail("로그인 정보를 확인하고 이메일 인증을 완료해 주세요.", 401);
  const rawSession = await createSession(env.DB, user.id);
  return json({ user: { id: user.id, name: user.display_name, email: user.email } }, 200, { "set-cookie": sessionCookie(rawSession) });
}
