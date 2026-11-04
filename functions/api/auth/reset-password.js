import { fail, json, passwordVerifier, rateLimit, readJson, sha256, validPasswordProof, validPasswordSalt, validateOrigin } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB) return fail("회원 데이터베이스 설정이 아직 완료되지 않았습니다.", 503);
  try { validateOrigin(request, env); } catch (error) { return fail(error.message); }
  let body;
  try { body = await readJson(request); } catch (error) { return fail(error.message); }
  const rawToken = String(body.token || "");
  const passwordSalt = String(body.passwordSalt || "");
  const passwordProof = String(body.passwordProof || "");
  if (rawToken.length < 40 || rawToken.length > 100) return fail("재설정 링크를 다시 확인해 주세요.");
  if (!validPasswordSalt(passwordSalt) || !validPasswordProof(passwordProof)) return fail("새 비밀번호 확인 정보를 다시 입력해 주세요.");
  if (!(await rateLimit(env.DB, request, "reset", 8, 3600))) return fail("요청이 많습니다. 잠시 뒤 다시 시도해 주세요.", 429);
  if (!env.PASSWORD_PEPPER || env.PASSWORD_PEPPER.length < 32) return fail("Cloudflare의 비밀번호 보호 설정이 필요합니다.", 503);
  const tokenHash = await sha256(rawToken);
  const now = Math.floor(Date.now() / 1000);
  const token = await env.DB.prepare(`SELECT user_id FROM auth_tokens
    WHERE token_hash = ? AND purpose = 'reset' AND used_at IS NULL AND expires_at > ?`).bind(tokenHash, now).first();
  if (!token) return fail("재설정 링크가 만료되었거나 이미 사용되었습니다.", 400);
  const passwordHash = await passwordVerifier(passwordProof, env.PASSWORD_PEPPER);
  if (!passwordHash) return fail("새 비밀번호 확인 정보를 다시 입력해 주세요.");
  const usedAt = Date.now();
  const results = await env.DB.batch([
    env.DB.prepare(`UPDATE auth_tokens SET used_at = ?
      WHERE token_hash = ? AND purpose = 'reset' AND used_at IS NULL AND expires_at > ?`).bind(usedAt, tokenHash, now),
    env.DB.prepare(`UPDATE users SET password_salt = ?, password_hash = ?
      WHERE id = ? AND EXISTS (SELECT 1 FROM auth_tokens WHERE token_hash = ? AND used_at = ?)`).bind(passwordSalt, passwordHash, token.user_id, tokenHash, usedAt),
  ]);
  if (!results[0]?.meta?.changes || !results[1]?.meta?.changes) return fail("재설정 링크가 만료되었거나 이미 사용되었습니다.", 400);
  await env.DB.prepare("DELETE FROM auth_sessions WHERE user_id = ?").bind(token.user_id).run();
  return json({ message: "비밀번호가 변경되었습니다. 다시 로그인해 주세요." });
}
