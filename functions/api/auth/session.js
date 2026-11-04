import { json, sessionData, userShape } from "../../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ user: null });
  const session = await sessionData(env.DB, request);
  return json({ user: userShape(session) });
}
