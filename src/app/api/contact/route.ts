import { z } from "zod";
import { CONTACT_TOPIC_IDS, HELP_EMAIL, contactTopicLabel } from "@/lib/contact";
import { emailEnabled, sendContactMessage } from "@/lib/server/email";
import { HttpError, rateLimit, readJson } from "@/lib/server/guard";
import { fail, ok } from "@/lib/server/http";

export const dynamic = "force-dynamic";

const Body = z.object({
  name: z.string().trim().min(2, "Add your name").max(80),
  email: z.string().trim().max(200).pipe(z.email("Use an email address we can reply to")),
  topic: z.enum(CONTACT_TOPIC_IDS),
  message: z.string().trim().min(20, "Write at least 20 characters").max(4000, "Keep it under 4,000 characters"),
  // Bot traps: a field people never see, and how long the form was open before sending.
  website: z.string().max(200).optional(),
  openedMs: z.number().nonnegative().optional(),
});

export async function POST(req: Request) {
  try {
    await rateLimit(req, "contact-burst", 2, 60_000);
    await rateLimit(req, "contact", 6, 3_600_000);
    const b = Body.parse(await readJson(req, 16 * 1024));
    // Looks like a bot: answer as if it worked, send nothing.
    if (b.website || (b.openedMs !== undefined && b.openedMs < 2500)) return ok({ sent: true });
    if (!emailEnabled()) throw new HttpError(503, `The contact form isn't set up on this server yet. Email ${HELP_EMAIL} instead.`);
    const sent = await sendContactMessage(
      { name: b.name, email: b.email, topic: contactTopicLabel(b.topic), message: b.message },
      process.env.CONTACT_TO?.trim() || HELP_EMAIL,
    );
    if (!sent) throw new HttpError(502, `We couldn't send your message just now. Try again in a minute, or email ${HELP_EMAIL}.`);
    return ok({ sent: true });
  } catch (err) {
    return fail(err);
  }
}
