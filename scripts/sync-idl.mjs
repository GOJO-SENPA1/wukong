// Copies the Anchor build output (IDL + TS types) into the app so the web
// client, API routes and scripts all share one source of truth.
import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("src/lib/idl", { recursive: true });
copyFileSync("target/idl/wukong.json", "src/lib/idl/wukong.json");
copyFileSync("target/types/wukong.ts", "src/lib/idl/wukong.ts");
// Prebuilt binary so the local demo runs without the Rust/Anchor toolchain.
mkdirSync("artifacts", { recursive: true });
copyFileSync("target/deploy/wukong.so", "artifacts/wukong.so");
console.log("IDL synced -> src/lib/idl/, binary -> artifacts/wukong.so");
