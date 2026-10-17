import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { A, Doc, List, Mail } from "@/components/legal/Doc";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Service",
  description: "The agreement for posting tasks, entering them, judging and payouts on Wukong, the competitive work marketplace on Solana.",
  path: "/terms",
  type: "article",
});

const L = LEGAL;

const sections = [
  {
    id: "who",
    title: "Who we are",
    body: (
      <>
        <p>
          Wukong (&ldquo;Wukong&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) runs wukonghq.xyz, its API (including the x402 endpoints and Solana Actions) and the
          Wukong program on Solana. These Terms are an agreement between you and Wukong. By using any of them you accept these Terms, and our{" "}
          <A href="/privacy">Privacy Policy</A> and <A href="/rules">Task and judging rules</A>, which form part of them.
        </p>
        <p>
          {L.entity
            ? `Wukong is operated by ${L.entity}.`
            : "Wukong is in beta and is operated by its founding team. We have not yet registered our operating company. When we do, we will name it here, and it will be your counterparty under these Terms."}{" "}
          You can reach us at <Mail />.
        </p>
        <p>If you use Wukong for an organisation, you accept these Terms on its behalf and confirm you are allowed to.</p>
      </>
    ),
  },
  {
    id: "what",
    title: "What Wukong is",
    body: (
      <>
        <p>
          Wukong is a marketplace for competitive work. An organisation (a &ldquo;poster&rdquo;) posts a task and locks a reward in on-chain escrow. People (&ldquo;workers&rdquo;)
          submit entries. An AI judge scores every entry, and the program pays the winners from escrow.
        </p>
        <List>
          <li>We provide the platform. We are not your employer, agent or bank, and we are not a party to the work agreed between posters and workers.</li>
          <li>We don&apos;t guarantee that a task will get entries, or that any entry will meet a poster&apos;s needs.</li>
          <li>
            Wukong is in beta. Features change, and parts of Wukong may run on Solana test networks such as devnet, where tokens are for testing and have no monetary
            value.
          </li>
        </List>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "Who can use Wukong",
    body: (
      <List>
        <li>You must be at least 18 and able to form a binding contract.</li>
        <li>
          You must not be located in, or ordinarily resident in, a country or region subject to comprehensive sanctions (including Cuba, Iran, North Korea, Syria, and the
          Crimea, Donetsk and Luhansk regions), and you must not be on a sanctions list.
        </li>
        <li>
          You may not use Wukong where the law that applies to you prohibits holding, sending or receiving digital assets such as USDC, or taking part in paid
          competitions. You are responsible for checking the rules where you live. We may limit features or block access by location.
        </li>
        <li>Organisation accounts are invitation-only. We verify each organisation before it can post tasks.</li>
      </List>
    ),
  },
  {
    id: "accounts",
    title: "Accounts and wallets",
    body: (
      <>
        <p>
          You sign in with email or Google through Privy, our sign-in provider, which sets up a self-custodial Solana wallet for you. You can also connect a wallet you
          already have.
        </p>
        <List>
          <li>We never hold your private keys and can&apos;t recover a wallet you lose access to. Blockchain transactions can&apos;t be reversed.</li>
          <li>One person per account, and one account per person. Keep your sign-in secure and your details accurate.</li>
          <li>Your handle must not impersonate anyone or infringe anyone&apos;s rights. We may change or reclaim handles that do.</li>
        </List>
      </>
    ),
  },
  {
    id: "posting",
    title: "Posting tasks",
    body: (
      <>
        <List>
          <li>
            When you post a task, the full reward (at least {L.minRewardUsdc} USDC) moves into an escrow account controlled by the Wukong program. You choose the payout
            mode, judging mode, deadline (up to {L.maxOpenDays} days), entry limit (up to {L.maxEntries}), any entry stake and any minimum rating.
          </li>
          <li>You can cancel a task and get the reward back only before the first entry arrives.</li>
          <li>
            After that, escrow is released only by the program&apos;s rules: to the winners; back to you if no entry scores {L.qualityBar} or more; or back to you if
            judging hasn&apos;t finished {L.judgeTimeoutDays} days after submissions close.
          </li>
          <li>In &ldquo;AI shortlists, I pick&rdquo; mode you choose the winner. If you don&apos;t pick within your pick window, the AI&apos;s top entry is paid.</li>
          <li>Your task&apos;s title, brief, reward and results are public.</li>
          <li>Your brief must be lawful and must not ask for anything in the prohibited-use list below. Don&apos;t put confidential or personal information in a brief.</li>
        </List>
      </>
    ),
  },
  {
    id: "entering",
    title: "Entering tasks",
    body: (
      <List>
        <li>One entry per wallet per task. Your entry is committed on-chain as a hash and stays hidden until submissions close.</li>
        <li>After submissions close, entries, scores and the judge&apos;s written reports are public.</li>
        <li>Your entry must be your own work, or work you have the right to submit. Don&apos;t copy other entrants or other sources, and don&apos;t try to manipulate the judge.</li>
        <li>
          Some tasks ask for a refundable entry stake. It comes back after judging if your entry scores {L.spamBar} or more. If it scores under {L.spamBar}, the stake is
          forfeited and goes to the Wukong treasury. The stake is a deposit against spam: prizes are paid only from the poster&apos;s reward. Stakes may be unavailable
          where local rules restrict them.
        </li>
      </List>
    ),
  },
  {
    id: "judging",
    title: "Judging and reviews",
    body: (
      <>
        <p>
          An AI judge scores each entry from 0 to 100 against the task&apos;s published rubric, after automated checks for broken requirements, wrong language, copies,
          spam and attempts to manipulate the judge. Each score and a hash of its written report are published on-chain and can&apos;t be changed. The full rules are in
          our <A href="/rules">Task and judging rules</A>.
        </p>
        <p>
          Payouts follow the published scores automatically, and the AI judge can make mistakes. If you think your entry was scored wrongly, email <Mail /> within{" "}
          {L.reviewDays} days of the result. A person will review it and explain the outcome. Payouts that have settled on-chain can&apos;t be reversed, but if we find an
          error we will tell you what we found and decide in good faith how to put it right.
        </p>
      </>
    ),
  },
  {
    id: "payments",
    title: "Payments and fees",
    body: (
      <List>
        <li>Rewards, payouts and stakes are in USDC on Solana. Solana network fees may apply.</li>
        <li>
          Wukong takes {L.feePercent}% of each task&apos;s reward when it pays out, and the rest goes to the winners. The fee is fixed when a task is posted, and the program
          caps it at {L.maxFeePercent}%. We will announce fee changes before they apply to new tasks.
        </li>
        <li>No fee is taken when a reward is refunded to the poster.</li>
        <li>You are responsible for your own taxes. We may ask for tax or identity information before paying out where the law requires it.</li>
        <li>An AI agent paying over x402 sends its payment to our gateway, which locks it in escrow for the task. Whoever runs the agent is responsible for it.</li>
      </List>
    ),
  },
  {
    id: "content",
    title: "Your content and intellectual property",
    body: (
      <List>
        <li>You keep ownership of what you submit, unless and until it is paid as a winning entry.</li>
        <li>
          When an entry is paid, the worker assigns to the poster all copyright and similar rights in that entry, worldwide, and waives moral rights where the law
          allows. The worker may still show the entry in a personal portfolio.
        </li>
        <li>Entries that are not paid stay with their workers. The poster gets no right to use them unless the worker agrees separately.</li>
        <li>
          You give Wukong a worldwide, non-exclusive, royalty-free licence to host, copy, process (including by AI models, to judge), display and publish your briefs,
          entries and reports, to run and promote Wukong. We don&apos;t use your entries to train AI models unless you opt in separately.
        </li>
        <li>If you think something on Wukong infringes your rights, email <Mail /> and we will look into it.</li>
      </List>
    ),
  },
  {
    id: "reputation",
    title: "Reputation",
    body: (
      <p>
        Your submissions, scores, wins, earnings and rating are recorded on-chain against your wallet. That record is public and permanent. We can&apos;t edit or delete
        on-chain records, though we can stop showing information in our app.
      </p>
    ),
  },
  {
    id: "prohibited",
    title: "What you must not do",
    body: (
      <>
        <List>
          <li>Copy other entrants&apos; work, or submit work you don&apos;t have the right to submit.</li>
          <li>Try to manipulate the judge, for example with hidden instructions or prompt injection.</li>
          <li>Run multiple accounts, use bots to enter tasks, or coordinate entries to game results.</li>
          <li>Post or submit anything illegal, hateful, harassing, sexually explicit involving minors, deceptive or infringing, or any malware.</li>
          <li>Ask for or share other people&apos;s personal data, fake reviews, academic work to be passed off as someone else&apos;s, or content meant to mislead the public.</li>
          <li>Use Wukong to launder money, evade sanctions or break any other law.</li>
          <li>Exploit bugs in the app or the program. Report them instead (see <A href="/security">Security</A>).</li>
          <li>Disrupt Wukong, overload it, or scrape it beyond normal use.</li>
        </List>
        <p>
          If you do, we may hide your content, exclude your entries from the app, suspend your account, block your wallet from our app and report illegal activity. A
          flagged entry may also score low and lose its stake under the judging rules.
        </p>
      </>
    ),
  },
  {
    id: "risks",
    title: "Blockchain risks",
    body: (
      <List>
        <li>The Wukong program has not yet had an external security audit. Smart contracts can have bugs, and funds in escrow could be lost.</li>
        <li>Blockchain transactions are final. Networks can be congested or unavailable.</li>
        <li>USDC is issued by Circle. Its issuer can freeze it, and its value is not guaranteed by Wukong.</li>
        <li>Laws about digital assets change and may affect your ability to use Wukong.</li>
      </List>
    ),
  },
  {
    id: "third-parties",
    title: "Other services",
    body: (
      <p>
        Wukong relies on services we don&apos;t control, including Privy for sign-in and wallets, the Solana network and RPC providers, Circle for USDC, your wallet
        software, email delivery and AI model providers. Their own terms apply to your use of them, and we aren&apos;t responsible for their failures.
      </p>
    ),
  },
  {
    id: "disclaimers",
    title: "Disclaimers and liability",
    body: (
      <>
        <p>
          Wukong is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. To the extent the law allows, we make no warranties, including that Wukong will be
          uninterrupted, error-free or fit for a particular purpose, or that the judge&apos;s scores are correct.
        </p>
        <p>
          To the extent the law allows, we are not liable for indirect or consequential losses, lost profits or lost data. Our total liability to you for any claim is
          limited to the greater of the fees you paid us in the 12 months before the claim and 100 US dollars.
        </p>
        <p>Nothing in these Terms limits liability that can&apos;t be limited by law, or rights you have under consumer law where you live.</p>
      </>
    ),
  },
  {
    id: "indemnity",
    title: "Your responsibility to us",
    body: (
      <p>
        If someone makes a claim against us because of your content, your use of Wukong or your breach of these Terms, you agree to cover our reasonable losses and costs,
        to the extent the law allows.
      </p>
    ),
  },
  {
    id: "termination",
    title: "Ending your use",
    body: (
      <p>
        You can stop using Wukong at any time. We may suspend or end your access if you break these Terms, if the law requires it, or to protect Wukong or its users.
        Rewards and stakes already in escrow are still released by the program&apos;s rules.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these Terms",
    body: (
      <p>
        We may update these Terms. For material changes we will give notice in the app or by email before they take effect. If you keep using Wukong after that, the new
        Terms apply. Tasks already posted keep the fee they were posted with.
      </p>
    ),
  },
  {
    id: "law",
    title: "Governing law and disputes",
    body: L.governingLaw ? (
      <p>{L.governingLaw}</p>
    ) : (
      <p>
        These Terms will name a governing law and venue once our operating company is registered. Until then, if you have a dispute with us, email <Mail /> first and we
        will try to resolve it with you within 30 days. Nothing here takes away rights you have under the law of the country where you live.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <Doc
      kicker="Legal"
      title={
        <>
          Terms of <em>Service</em>
        </>
      }
      lede="The agreement for posting tasks, entering them, judging and payouts on Wukong. We've kept it plain: where the program enforces a rule on-chain, these Terms say exactly what it does."
      current="/terms"
      sections={sections}
    />
  );
}
