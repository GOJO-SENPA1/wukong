/** Where organisations ask for an account (they join by invitation) and anyone asks for help. */
export const HELP_EMAIL = "help@wukonghq.xyz";

/** A ready-to-send registration email for an organisation. */
export function orgRegistrationMailto(signInEmail?: string | null): string {
  const subject = "Organisation account on Wukong";
  const body = [
    "Hi Wukong team,",
    "",
    "We'd like to post tasks on Wukong.",
    "",
    "Organisation name:",
    "Website:",
    "Your name and role:",
    `Email we'll sign in with: ${signInEmail ?? ""}`,
    "What kind of tasks we plan to post:",
    "",
    "Thanks!",
  ].join("\n");
  return `mailto:${HELP_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
