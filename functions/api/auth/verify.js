import { fail, json, readJson, sha256, validateOrigin } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB) return fail("회원 데이터베이스 설정이 아직 완료되지 않았습니다.", 503);
  try { validateOrigin(request, env); } catch (error) { return fail(error.message); }
  let body;
  try { body = await readJson(request); } catch (error) { return fail(error.message); }
  const rawToken = String(body.token || "");
  if (rawToken.length < 40 || rawToken.length > 100) return fail("인증 링크를 다시 확인해 주세요.");
  const tokenHash = await sha256(rawToken);
  const now = Math.floor(Date.now() / 1000);
  const token = await env.DB.prepare(`SELECT user_id FROM auth_tokens
    WHERE token_hash = ? AND purpose = 'verify' AND used_at IS NULL AND expires_at > ?`).bind(tokenHash, now).first();
  if (!token) return fail("인증 링크가 만료되었거나 이미 사용되었습니다.", 400);
  const usedAt = Date.now();
  const result = await env.DB.prepare(`UPDATE auth_tokens SET used_at = ?
    WHERE token_hash = ? AND purpose = 'verify' AND used_at IS NULL AND expires_at > ?`).bind(usedAt, tokenHash, now).run();
  if (!result.meta?.changes) return fail("인증 링크가 만료되었거나 이미 사용되었습니다.", 400);
  await env.DB.prepare("UPDATE users SET email_verified_at = ? WHERE id = ? AND email_verified_at IS NULL").bind(now, token.user_id).run();
  return json({ message: "이메일 인증이 완료되었습니다. 로그인해 주세요." });
}
