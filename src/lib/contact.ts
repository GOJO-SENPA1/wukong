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

/** What the contact form asks people to pick. Security reports go to /security instead. */
export const CONTACT_TOPICS = [
  { id: "general", label: "A general question" },
  { id: "organisation", label: "An organisation account" },
  { id: "support", label: "Help with a task or payout" },
  { id: "partnership", label: "A partnership or judging service" },
  { id: "press", label: "Press" },
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number]["id"];
export const CONTACT_TOPIC_IDS = CONTACT_TOPICS.map((t) => t.id) as [ContactTopic, ...ContactTopic[]];

export function contactTopicLabel(id: string): string {
  return CONTACT_TOPICS.find((t) => t.id === id)?.label ?? "A general question";
}
