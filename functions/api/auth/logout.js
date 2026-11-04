import { cookieValue, fail, json, sessionCookie, sha256, validateOrigin } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB) return fail("회원 데이터베이스 설정이 아직 완료되지 않았습니다.", 503);
  try { validateOrigin(request, env); } catch (error) { return fail(error.message); }
  const raw = cookieValue(request);
  if (raw) await env.DB.prepare("DELETE FROM auth_sessions WHERE token_hash = ?").bind(await sha256(raw)).run();
  return json({ ok: true }, 200, { "set-cookie": sessionCookie("", 0) });
}
