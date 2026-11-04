import { createSession, equalSecret, fail, json, normalizedEmail, passwordVerifier, rateLimit, readJson, sessionCookie, validEmail, validPasswordProof, validateOrigin } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB) return fail("회원 데이터베이스 설정이 아직 완료되지 않았습니다.", 503);
  try { validateOrigin(request, env); } catch (error) { return fail(error.message); }
  let body;
  try { body = await readJson(request); } catch (error) { return fail(error.message); }
  const email = normalizedEmail(body.email);
  const passwordProof = String(body.passwordProof || "");
  if (!validEmail(email) || !validPasswordProof(passwordProof)) return fail("이메일 또는 비밀번호를 확인해 주세요.", 401);
  if (!(await rateLimit(env.DB, request, "login-ip", 30, 900)) || !(await rateLimit(env.DB, request, "login", 12, 900, email))) return fail("로그인 시도가 많습니다. 15분 뒤 다시 시도해 주세요.", 429);
  if (!env.PASSWORD_PEPPER || env.PASSWORD_PEPPER.length < 32) return fail("Cloudflare의 비밀번호 보호 설정이 필요합니다.", 503);
  const user = await env.DB.prepare("SELECT id, email, display_name, password_salt, password_hash, email_verified_at FROM users WHERE email = ?").bind(email).first();
  const actualHash = await passwordVerifier(passwordProof, env.PASSWORD_PEPPER);
  const valid = Boolean(user && equalSecret(user.password_hash, actualHash) && user.email_verified_at);
  if (!valid) return fail("로그인 정보를 확인하고 이메일 인증을 완료해 주세요.", 401);
  const rawSession = await createSession(env.DB, user.id);
  return json({ user: { id: user.id, name: user.display_name, email: user.email } }, 200, { "set-cookie": sessionCookie(rawSession) });
}
