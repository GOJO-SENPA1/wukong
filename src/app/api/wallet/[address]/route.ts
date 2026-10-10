import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { rateLimit } from "@/lib/server/guard";
import { getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { fetchTasks } from "@/lib/wukong";
import { connection, mint, program } from "@/lib/server/env";
import { fail, ok } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Public balances for a wallet: SOL, USDC, and USDC it has locked in open tasks. */
export async function GET(req: Request, ctx: { params: Promise<{ address: string }> }) {
  try {
    await rateLimit(req, "wallet", 30, 60_000);
  } catch (err) {
    return fail(err);
  }
  let owner: PublicKey;
  try {
    owner = new PublicKey((await ctx.params).address);
  } catch {
    return fail("Invalid address");
  }
  try {
    const conn = connection();
    const ata = getAssociatedTokenAddressSync(mint(), owner, true);
    const [lamports, usdc, tasks] = await Promise.all([
      conn.getBalance(owner),
      getAccount(conn, ata)
        .then((a) => Number(a.amount))
        .catch(() => 0),
      fetchTasks(program()),
    ]);
    const mine = tasks.filter((t) => t.creator === owner.toBase58() && (t.status === "open" || t.status === "judging"));
    return ok({
      address: owner.toBase58(),
      usdcAccount: ata.toBase58(),
      sol: lamports / LAMPORTS_PER_SOL,
      usdc,
      escrowed: mine.reduce((a, t) => a + t.reward, 0),
      openTasks: mine.length,
    });
  } catch (err) {
    return fail(err, 502);
  }
}
