// Maps the human arena URLs to their Action endpoints, so a plain
// https://<app>/tasks/<id> link unfurls as a Blink.
import { actionHeaders, preflight } from "@/lib/server/blinks";

export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(
    JSON.stringify({
      rules: [
        { pathPattern: "/tasks/*", apiPath: "/api/actions/tasks/*" },
        { pathPattern: "/api/actions/**", apiPath: "/api/actions/**" },
      ],
    }),
    { headers: await actionHeaders() },
  );
}

export const OPTIONS = preflight;
