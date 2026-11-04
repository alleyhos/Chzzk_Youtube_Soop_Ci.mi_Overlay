import { createEmailToken, fail, json, normalizeName, normalizedEmail, passwordVerifier, rateLimit, readJson, sendAuthEmail, sha256, validEmail, validPasswordProof, validPasswordSalt, validateOrigin } from "../../_lib/auth.js";

const PRIVACY_VERSION = "2026-11-04";
const TOKEN_LIFETIME = 30 * 60;

export async function onRequestPost({ request, env }) {
  if (!env.DB) return fail("회원 데이터베이스 설정이 아직 완료되지 않았습니다.", 503);
  let body;
  try {
    validateOrigin(request, env);
    body = await readJson(request);
  } catch (error) {
    return fail(error.message);
  }

  const name = normalizeName(body.name);
  const email = normalizedEmail(body.email);
  const passwordSalt = String(body.passwordSalt || "");
  const passwordProof = String(body.passwordProof || "");
  if ([...name].length < 2 || [...name].length > 40) return fail("이름은 2자 이상 40자 이하로 입력해 주세요.");
  if (!validEmail(email)) return fail("이메일 주소를 확인해 주세요.");
  if (!validPasswordSalt(passwordSalt) || !validPasswordProof(passwordProof)) return fail("비밀번호 확인 정보를 다시 입력해 주세요.");
  if (body.consent !== true) return fail("계정 데이터 안내에 동의해 주세요.");
  if (!(await rateLimit(env.DB, request, "register", 5, 3600))) return fail("가입 요청이 많습니다. 한 시간 뒤 다시 시도해 주세요.", 429);
  if (!env.PASSWORD_PEPPER || env.PASSWORD_PEPPER.length < 32) return fail("Cloudflare의 비밀번호 보호 설정이 필요합니다.", 503);
  if (!env.SITE_URL || !env.RESEND_API_KEY || !env.MAIL_FROM) return fail("Cloudflare의 사이트 주소와 인증 메일 설정이 필요합니다.", 503);

  const existing = await env.DB.prepare("SELECT id, email_verified_at FROM users WHERE email = ?").bind(email).first();
  if (existing) {
    if (!existing.email_verified_at) {
      try {
        await env.DB.prepare("DELETE FROM auth_tokens WHERE user_id = ? AND purpose = 'verify' AND used_at IS NULL").bind(existing.id).run();
        const raw = await createEmailToken(env.DB, existing.id, "verify", TOKEN_LIFETIME);
        const link = new URL("/", env.SITE_URL);
        link.hash = `verify=${raw}`;
        await sendAuthEmail(env, email, "치유숲씨 이메일 인증", "이메일 주소를 확인해 주세요", "회원가입을 마치려면 아래 버튼을 눌러 이메일 주소를 인증해 주세요.", "이메일 인증하기", link.toString());
      } catch {
        // Keep the response generic so account existence is not disclosed.
      }
    }
    return json({ message: "이메일 주소로 가입할 수 있는 계정이면 인증 안내를 보냈습니다. 받은 편지함을 확인해 주세요." }, 202);
  }

  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const passwordHash = await passwordVerifier(passwordProof, env.PASSWORD_PEPPER);
  if (!passwordHash) return fail("비밀번호 확인 정보를 다시 입력해 주세요.");
  try {
    await env.DB.prepare(`INSERT INTO users (id, email, display_name, password_salt, password_hash, privacy_version, privacy_accepted_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, email, name, passwordSalt, passwordHash, PRIVACY_VERSION, now, now).run();
  } catch {
    return json({ message: "이메일 주소로 가입할 수 있는 계정이면 인증 안내를 보냈습니다. 받은 편지함을 확인해 주세요." }, 202);
  }

  let rawToken;
  try {
    rawToken = await createEmailToken(env.DB, id, "verify", TOKEN_LIFETIME);
    const link = new URL("/", env.SITE_URL);
    link.hash = `verify=${rawToken}`;
    await sendAuthEmail(env, email, "치유숲씨 이메일 인증", "이메일 주소를 확인해 주세요", "회원가입을 마치려면 아래 버튼을 눌러 이메일 주소를 인증해 주세요.", "이메일 인증하기", link.toString());
  } catch {
    await env.DB.prepare("DELETE FROM auth_tokens WHERE user_id = ? AND purpose = 'verify'").bind(id).run();
    await env.DB.prepare("DELETE FROM users WHERE id = ? AND email_verified_at IS NULL").bind(id).run();
    return fail("인증 메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.", 503);
  }
  return json({ message: "인증 메일을 보냈습니다. 30분 안에 이메일의 링크를 눌러 가입을 완료해 주세요." }, 202);
}
