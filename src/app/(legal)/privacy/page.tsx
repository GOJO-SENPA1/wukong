import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { A, Doc, List, Mail } from "@/components/legal/Doc";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description: "What Wukong collects, what is public on-chain, who processes it, how cookies and analytics work, and the choices you have.",
  path: "/privacy",
  type: "article",
});

const sections = [
  {
    id: "summary",
    title: "The short version",
    body: (
      <List>
        <li>We collect what we need to run Wukong: your sign-in email, your profile, your wallet address, the tasks you post and the entries you submit.</li>
        <li>
          Much of Wukong is public by design. Briefs, entries (once submissions close), scores, judge reports and your on-chain reputation can be seen by anyone, and
          what is on the blockchain can&apos;t be deleted.
        </li>
        <li>AI models read briefs and entries to judge them. We don&apos;t use your entries to train AI models unless you opt in.</li>
        <li>
          We don&apos;t sell your data and don&apos;t use advertising trackers. Only if you allow it, we count anonymous visits and actions as daily totals, with no
          cookies and nothing that identifies you.
        </li>
      </List>
    ),
  },
  {
    id: "who",
    title: "Who is responsible",
    body: (
      <p>
        {LEGAL.entity ? `${LEGAL.entity}` : "Wukong, currently operated by its founding team ahead of registering its company,"} is responsible for the personal data
        described here. Contact us about privacy at <Mail />.
      </p>
    ),
  },
  {
    id: "collect",
    title: "What we collect",
    body: (
      <List>
        <li>
          <b>Account:</b> your email address and sign-in identifier from Privy (and your Google account&apos;s email if you sign in with Google).
        </li>
        <li>
          <b>Profile:</b> handle, display name, role, and anything you choose to add, such as organisation, city, bio, picture, skills and languages. Your email
          preference for results and payouts.
        </li>
        <li>
          <b>Wallet:</b> your Solana wallet address, which links your account to your on-chain activity.
        </li>
        <li>
          <b>Work:</b> the tasks you post (title, brief, reward and settings), the entries you submit, and the judge&apos;s scores and written reports.
        </li>
        <li>
          <b>Notifications:</b> records of the result, payout and shortlist notices we send you.
        </li>
        <li>
          <b>Organisation invitations:</b> the email and organisation name we approve for an organisation account.
        </li>
        <li>
          <b>Messages:</b> if you use the <A href="/contact">contact form</A>, your name, email address, topic and message, delivered to our inbox so we can reply.
        </li>
        <li>
          <b>Anonymous analytics, only with your consent:</b> which kind of page was viewed and which steps were completed (such as posting a task or sending an
          entry), counted as daily totals. Task and profile ids are removed from page addresses, and nothing is linked to you, your account, your wallet or your IP
          address.
        </li>
        <li>
          <b>Technical data:</b> IP address and request details, used for security and rate limiting and kept in short-lived server logs.
        </li>
      </List>
    ),
  },
  {
    id: "public",
    title: "What is public",
    body: (
      <>
        <List>
          <li>Your public profile: handle, display name, role and the details you add to it.</li>
          <li>Task titles, briefs, rewards and results.</li>
          <li>Entries, once submissions close. Before that, only a hash of each entry is public.</li>
          <li>Scores, the judge&apos;s written reports and any flags, such as a suspected copy.</li>
          <li>On-chain records: your wallet address, entries&apos; hashes, scores, payouts, stakes and your reputation account.</li>
        </List>
        <p>
          Records on the Solana blockchain are permanent and public, and anyone can copy them. We can&apos;t change or delete them, even if you close your account. Please
          don&apos;t put personal information in briefs or entries.
        </p>
      </>
    ),
  },
  {
    id: "use",
    title: "How we use it",
    body: (
      <List>
        <li>To run Wukong: sign-in, profiles, posting tasks, entering them, judging, payouts and reputation.</li>
        <li>To judge entries: we send briefs and entries to AI model providers, which score them and write reports.</li>
        <li>To send you notices about your tasks and results. You can turn these emails off in your settings.</li>
        <li>To keep Wukong safe: preventing fraud, spam, sanctions breaches and abuse, and enforcing our Terms.</li>
        <li>To meet legal obligations, such as tax or sanctions rules.</li>
      </List>
    ),
  },
  {
    id: "legal-basis",
    title: "Legal bases",
    body: (
      <p>
        Where data-protection law such as the GDPR applies, we rely on: performing our contract with you (running your account, tasks and payouts); our legitimate
        interests (keeping Wukong secure, preventing abuse, answering your messages and improving the service); your consent where we ask for it (such as anonymous
        analytics and optional AI-training use); and legal obligations.
      </p>
    ),
  },
  {
    id: "automated",
    title: "Automated judging",
    body: (
      <p>
        Scores, and therefore payouts and forfeited stakes, are decided by an AI judge following the published rubric and the <A href="/rules">Task and judging rules</A>.
        Each score comes with a written report quoting the entry. You can ask for a person to review a score, give your view and get an explanation by emailing <Mail />{" "}
        within {LEGAL.reviewDays} days of the result.
      </p>
    ),
  },
  {
    id: "processors",
    title: "Who processes it",
    body: (
      <>
        <p>We use service providers who process data for us under their own security and privacy commitments:</p>
        <List>
          <li>Privy: sign-in and embedded wallets.</li>
          <li>Our database and hosting providers: accounts, profiles, briefs, entries and reports.</li>
          <li>AI model providers: judging briefs and entries.</li>
          <li>Resend: email delivery, including messages sent through the contact form.</li>
          <li>Solana RPC providers: reading and sending blockchain transactions.</li>
        </List>
        <p>
          Some of these providers are in other countries, including the United States. Where the law requires it, we rely on safeguards such as standard contractual
          clauses. We may also disclose data if the law requires it, or to protect people or Wukong.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <List>
        <li>Account and profile data: while your account is open, and for a short period after, unless the law requires longer.</li>
        <li>Briefs, entries and reports: while Wukong runs, because they back published results that the on-chain hashes point to.</li>
        <li>Contact messages: as long as the conversation needs, then deleted within a year.</li>
        <li>Anonymous analytics totals: up to 400 days.</li>
        <li>Server logs: kept briefly for security.</li>
        <li>On-chain records: permanent, and outside our control.</li>
      </List>
    ),
  },
  {
    id: "rights",
    title: "Your choices and rights",
    body: (
      <>
        <p>
          You can edit your profile and email settings in the app. Depending on where you live, you may also have the right to access, correct, delete or export your
          data, to object to or restrict some processing, and to withdraw consent. Email <Mail /> and we will respond within 30 days.
        </p>
        <p>
          When we delete your account, we remove your off-chain profile and stop showing your details in the app. We can&apos;t remove on-chain records, and we may keep
          briefs, entries and reports that back published results, without your profile attached. You can also complain to your data-protection authority.
        </p>
      </>
    ),
  },
  {
    id: "storage",
    title: "Cookies and browser storage",
    body: (
      <>
        <p>
          <b>Essential:</b> Privy&apos;s sign-in storage, and local browser storage for things like your entries&apos; drafts, the account you last used and whether
          you&apos;ve seen the welcome screen. Wukong needs these to work, so they don&apos;t need consent. We also keep one small cookie, <code>wk_consent</code>, for
          180 days to remember your cookie choice.
        </p>
        <p>
          <b>Optional analytics:</b> off until you allow it. When on, your browser sends anonymous events (described above) to our own server. They use no cookies and
          go to no third party. If your browser sends a Global Privacy Control or Do Not Track signal, we treat it as a no.
        </p>
        <p>
          We don&apos;t use advertising cookies. You can change your choice at any time with <b>Cookie preferences</b> in the footer of every page.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: <p>Wukong is for people aged 18 and over. We don&apos;t knowingly collect data from children. If you think a child has an account, email us and we will remove it.</p>,
  },
  {
    id: "security",
    title: "Security",
    body: (
      <p>
        We protect data with access controls, encryption in transit and security reviews of our code. No system is perfectly secure. If you find a vulnerability, please
        follow our <A href="/security">security policy</A>.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes",
    body: <p>We will update this policy as Wukong changes, and tell you in the app or by email about material changes.</p>,
  },
];

export default function PrivacyPage() {
  return (
    <Doc
      updated="17 October 2026"
      kicker="Legal"
      title={
        <>
          Privacy <em>Policy</em>
        </>
      }
      lede="What Wukong collects, what is public on-chain and can't be erased, who processes it, and the choices you have."
      current="/privacy"
      sections={sections}
    />
  );
}
