import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function envValue(name) {
  if (process.env[name]) return process.env[name];
  const file = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of file.split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const [key, ...rest] = line.split("=");
    if (key === name) return rest.join("=").trim().replace(/^["']|["']$/g, "");
  }
  return "";
}

const url = envValue("NEXT_PUBLIC_SUPABASE_URL");
const key = envValue("SUPABASE_SERVICE_ROLE_KEY");
const email = process.env.STAFF_EMAIL;
const password = process.env.STAFF_PASSWORD;
const name = process.env.STAFF_NAME || "Crowne Staff";

if (!url || !key || !email || !password) {
  console.error("Set STAFF_EMAIL and STAFF_PASSWORD. Supabase URL and service role come from .env.local.");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

let userId = null;
for (let page = 1; page <= 20 && !userId; page += 1) {
  const listed = await admin.auth.admin.listUsers({ page, perPage: 200 });
  if (listed.error) throw listed.error;
  userId = listed.data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
  if (listed.data.users.length < 200) break;
}

if (userId) {
  const updated = await admin.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (updated.error) throw updated.error;
} else {
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (created.error || !created.data.user) throw created.error ?? new Error("Staff user was not created.");
  userId = created.data.user.id;
}

const profile = await admin.from("crowne_profiles").upsert({
  id: userId,
  full_name: name,
  email,
  role: "staff",
  staff_role: "admin",
});
if (profile.error) throw profile.error;

console.log(`Staff profile ready for ${email}`);
