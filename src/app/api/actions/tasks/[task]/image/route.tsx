// Live card for the Blink: title, escrowed reward, entries, time left.
import { ImageResponse } from "next/og";
import { categoryById } from "@/lib/categories";
import { fmtUsdc, timeLeft } from "@/lib/format";
import { fetchTask } from "@/lib/wukong";
import { parseKey } from "@/lib/server/blinks";
import { program } from "@/lib/server/env";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ task: string }> }) {
  const { task: key } = await ctx.params;
  const pk = parseKey(key);
  const task = pk ? await fetchTask(program(), pk).catch(() => null) : null;
  const title = task?.title ?? "Task not found";
  const status =
    !task ? "" : task.status === "open" ? timeLeft(task.deadline) : task.status === "settled" ? "paid out" : task.status;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "radial-gradient(circle at 85% 10%, #3a2a0e 0%, #0f0d0a 60%)",
          color: "#f6f1e7",
          fontFamily: "Geist",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, letterSpacing: 4 }}>
          <span>WU</span>
          <span style={{ color: "#f5b83d" }}>KONG</span>
          <span style={{ marginLeft: "auto", fontSize: 30, color: "#b8ae9c" }}>
            {task ? categoryById(task.category).label : ""}
          </span>
        </div>
        <div style={{ display: "flex", fontSize: 76, lineHeight: 1.1 }}>{title}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", fontSize: 120, color: "#f5b83d" }}>
            {task ? `${fmtUsdc(task.reward)} USDC` : ""}
          </div>
          <div style={{ display: "flex", fontSize: 34, color: "#b8ae9c" }}>
            {task ? `locked in escrow · ${task.submissionCount} entries · ${status}` : ""}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 1200 },
  );
}
