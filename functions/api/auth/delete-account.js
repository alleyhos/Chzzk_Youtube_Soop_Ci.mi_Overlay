import { equalSecret, fail, json, passwordDigest, rateLimit, readJson, sessionData, sessionCookie, validateOrigin } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB) return fail("회원 데이터베이스 설정이 아직 완료되지 않았습니다.", 503);
  try { validateOrigin(request, env); } catch (error) { return fail(error.message); }
  let body;
  try { body = await readJson(request); } catch (error) { return fail(error.message); }
  const session = await sessionData(env.DB, request);
  if (!session) return fail("로그인이 필요합니다.", 401);
  if (!(await rateLimit(env.DB, request, "delete-account", 5, 3600, session.email))) return fail("요청이 많습니다. 잠시 뒤 다시 시도해 주세요.", 429);
  const password = String(body.password || "");
  if (!password || password.length > 128) return fail("현재 비밀번호를 확인해 주세요.", 400);
  const user = await env.DB.prepare("SELECT id, password_salt, password_hash FROM users WHERE id = ?").bind(session.user_id).first();
  const digest = await passwordDigest(password, user.password_salt);
  if (!equalSecret(digest, user.password_hash)) return fail("현재 비밀번호가 맞지 않습니다.", 401);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM auth_sessions WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM auth_tokens WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM users WHERE id = ?").bind(user.id),
  ]);
  return json({ ok: true }, 200, { "set-cookie": sessionCookie("", 0) });
}
