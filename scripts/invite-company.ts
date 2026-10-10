// Approve an organisation: whoever signs in with this email (an email login or
// its Google account) can then set up the organisation and post tasks.
//   npm run company:invite -- ops@acme.com "Acme Ltd"     approve (or rename)
//   npm run company:invite -- --list                      everyone approved
//   npm run company:invite -- --revoke ops@acme.com       withdraw an unused approval
// Needs DATABASE_URL (the same database the app uses).
import { db } from "../src/lib/server/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function main() {
  const [first, ...rest] = process.argv.slice(2);
  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL to the accounts database first");
  const prisma = db();

  if (first === "--list") {
    const rows = await prisma.companyInvite.findMany({ orderBy: { createdAt: "asc" } });
    if (!rows.length) return console.log("No organisations approved yet.");
    for (const r of rows) console.log(`${r.email.padEnd(36)} ${r.company.padEnd(30)} ${r.claimedAt ? `set up ${r.claimedAt.toISOString().slice(0, 10)}` : "not set up yet"}`);
    return;
  }

  if (first === "--revoke") {
    const email = (rest[0] ?? "").trim().toLowerCase();
    const row = await prisma.companyInvite.findUnique({ where: { email } });
    if (!row) throw new Error(`No approval for ${email}`);
    if (row.claimedBy) throw new Error(`${email} already set up "${row.company}"; its account stays an organisation`);
    await prisma.companyInvite.delete({ where: { email } });
    return console.log(`Withdrew the approval for ${email}.`);
  }

  const email = (first ?? "").trim().toLowerCase();
  const company = rest.join(" ").trim();
  if (!EMAIL_RE.test(email) || !company || company.length > 60) {
    throw new Error('Usage: npm run company:invite -- <email> "<Organisation name, up to 60 characters>"');
  }
  const row = await prisma.companyInvite.upsert({ where: { email }, create: { email, company }, update: { company } });
  if (row.claimedBy) {
    // Already set up: rename the organisation's profile too.
    await prisma.profile.updateMany({ where: { userId: row.claimedBy, role: "company" }, data: { company } });
    return console.log(`Renamed ${email}'s organisation to "${company}".`);
  }
  console.log(`Approved ${email} as "${company}". They can now sign in at /business and post tasks.`);
}

main()
  .catch((err) => {
    console.error(`✗ ${err.message ?? err}`);
    process.exitCode = 1;
  })
  .finally(() => db().$disconnect());
