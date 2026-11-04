import { fail, fallbackPasswordSalt, json, normalizedEmail, rateLimit, readJson, validateOrigin, validEmail } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB) return fail("회원 데이터베이스 설정이 아직 완료되지 않았습니다.", 503);
  try { validateOrigin(request, env); } catch (error) { return fail(error.message); }
  let body;
  try { body = await readJson(request); } catch (error) { return fail(error.message); }
  const email = normalizedEmail(body.email);
  if (!validEmail(email)) return fail("이메일 주소를 확인해 주세요.");
  if (!(await rateLimit(env.DB, request, "password-params", 30, 900, email))) return fail("요청이 많습니다. 잠시 뒤 다시 시도해 주세요.", 429);
  if (!env.PASSWORD_PEPPER || env.PASSWORD_PEPPER.length < 32) return fail("Cloudflare의 비밀번호 보호 설정이 필요합니다.", 503);
  const user = await env.DB.prepare("SELECT password_salt FROM users WHERE email = ? AND email_verified_at IS NOT NULL").bind(email).first();
  return json({ salt: user?.password_salt || await fallbackPasswordSalt(email, env.PASSWORD_PEPPER) });
}
