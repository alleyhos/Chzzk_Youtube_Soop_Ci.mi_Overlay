import { escapeHtml, fail, formRedirect, json, rateLimit, readMessage, validateOrigin } from "../_lib/contact.js";

const TOPICS = new Set(["사용 문의", "오류 제보", "기능 제안", "기타"]);

function complete(request, env, isForm, message) {
  if (isForm) return formRedirect(request, env, "sent");
  return json({ message }, 202);
}

function reportError(request, env, isForm, message, status) {
  if (isForm) return formRedirect(request, env, "error");
  return fail(message, status);
}

export async function onRequestPost({ request, env }) {
  let parsed;
  try {
    validateOrigin(request, env);
    parsed = await readMessage(request);
  } catch (error) {
    return fail(error.message);
  }

  const { fields, isForm } = parsed;
  if (String(fields.website || "").trim()) return complete(request, env, isForm, "문의가 전달됐습니다. 남겨 주신 이메일로 답변드릴게요.");
  if (!env.DB || !env.CONTACT_EMAIL || !env.RESEND_API_KEY || !env.MAIL_FROM || !env.SITE_URL || !env.CONTACT_RATE_LIMIT_SECRET) {
    return reportError(request, env, isForm, "문의 기능 설정이 아직 완료되지 않았습니다.", 503);
  }

  const name = String(fields.name || "").normalize("NFKC").trim().replace(/\s+/gu, " ");
  const email = String(fields.email || "").trim().toLowerCase();
  const topic = String(fields.topic || "");
  const message = String(fields.message || "").trim();
  const consent = fields.consent === true || fields.consent === "on";
  if ([...name].length < 2 || [...name].length > 60) return reportError(request, env, isForm, "이름 또는 닉네임을 확인해 주세요.", 400);
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) return reportError(request, env, isForm, "답변 받을 이메일 주소를 확인해 주세요.", 400);
  if (!TOPICS.has(topic)) return reportError(request, env, isForm, "문의 종류를 선택해 주세요.", 400);
  if ([...message].length < 10 || [...message].length > 4000) return reportError(request, env, isForm, "문의 내용은 10자 이상 4,000자 이하로 입력해 주세요.", 400);
  if (!consent) return reportError(request, env, isForm, "문의 데이터 안내를 확인하고 동의해 주세요.", 400);

  try {
    if (!(await rateLimit(env.DB, request, env.CONTACT_RATE_LIMIT_SECRET, 5))) return reportError(request, env, isForm, "문의가 많습니다. 잠시 뒤 다시 보내 주세요.", 429);
  } catch {
    return reportError(request, env, isForm, "문의 제한 기능을 사용할 수 없습니다. 잠시 뒤 다시 시도해 주세요.", 503);
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\r?\n/gu, "<br>");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: [env.CONTACT_EMAIL],
      reply_to: email,
      subject: `[치유숲씨 ${topic}] ${name}`,
      text: `문의 종류: ${topic}\n이름: ${name}\n답변 받을 이메일: ${email}\n\n${message}`,
      html: `<main style="max-width:640px;margin:24px auto;padding:24px;border:1px solid #dce3da;border-radius:10px;font:14px/1.8 Arial,'Malgun Gothic',sans-serif;color:#202a26"><p style="margin:0 0 20px;color:#47745a;font-weight:bold">치유숲씨 사이트 문의 · ${escapeHtml(topic)}</p><h1 style="font-size:20px">${safeName}</h1><p><a href="mailto:${safeEmail}">${safeEmail}</a></p><hr style="border:0;border-top:1px solid #dce3da"><p>${safeMessage}</p></main>`,
    }),
  });
  if (!response.ok) return reportError(request, env, isForm, "문의 메일을 보내지 못했습니다. 잠시 뒤 다시 시도해 주세요.", 502);
  return complete(request, env, isForm, "문의가 전달됐습니다. 남겨 주신 이메일로 답변드릴게요.");
}
