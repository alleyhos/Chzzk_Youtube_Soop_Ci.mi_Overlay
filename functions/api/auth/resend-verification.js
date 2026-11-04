import { createEmailToken, fail, json, normalizedEmail, rateLimit, readJson, sendAuthEmail, validateOrigin, validEmail } from "../../_lib/auth.js";

const TOKEN_LIFETIME = 30 * 60;

export async function onRequestPost({ request, env }) {
  if (!env.DB) return fail("회원 데이터베이스 설정이 아직 완료되지 않았습니다.", 503);
  try { validateOrigin(request, env); } catch (error) { return fail(error.message); }
  let body;
  try { body = await readJson(request); } catch (error) { return fail(error.message); }
  const email = normalizedEmail(body.email);
  if (!validEmail(email)) return fail("이메일 주소를 확인해 주세요.");
  if (!(await rateLimit(env.DB, request, "resend", 4, 3600))) return fail("요청이 많습니다. 잠시 뒤 다시 시도해 주세요.", 429);
  if (!env.SITE_URL || !env.RESEND_API_KEY || !env.MAIL_FROM) return fail("인증 메일 설정이 필요합니다.", 503);
  const user = await env.DB.prepare("SELECT id FROM users WHERE email = ? AND email_verified_at IS NULL").bind(email).first();
  if (user) {
    await env.DB.prepare("DELETE FROM auth_tokens WHERE user_id = ? AND purpose = 'verify' AND used_at IS NULL").bind(user.id).run();
    try {
      const raw = await createEmailToken(env.DB, user.id, "verify", TOKEN_LIFETIME);
      const link = new URL("/", env.SITE_URL);
      link.hash = `verify=${raw}`;
      await sendAuthEmail(env, email, "치유숲씨 이메일 인증", "이메일 주소를 확인해 주세요", "회원가입을 마치려면 아래 버튼을 눌러 이메일 주소를 인증해 주세요.", "이메일 인증하기", link.toString());
    } catch {
      return fail("인증 메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.", 503);
    }
  }
  return json({ message: "인증이 필요한 계정이라면 새 메일을 보냈습니다. 받은 편지함과 스팸함을 확인해 주세요." }, 202);
}
