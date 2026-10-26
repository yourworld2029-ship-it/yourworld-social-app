import { createFileRoute } from "@tanstack/react-router";
import {
  listAdminConsole,
  listAdminInternationalPayoutKyc,
  listAdminPayoutRequests,
} from "@/lib/admin-console.functions";
import { listSportsVerificationApplications } from "@/lib/sports-verification.functions";
import type { AdminConsoleReadOperation } from "@/lib/admin-console-api";
import { executeAdminRead } from "@/lib/admin-console-read";

const readOperations = {
  console: listAdminConsole,
  payoutRequests: listAdminPayoutRequests,
  internationalPayoutKyc: listAdminInternationalPayoutKyc,
  sportsVerification: listSportsVerificationApplications,
} satisfies Record<AdminConsoleReadOperation, unknown>;

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : "Admin data could not be loaded.";
}

function statusFromError(message: string): number {
  if (/unauthorized|session expired/i.test(message)) return 401;
  if (/forbidden|admin|mfa|assurance/i.test(message)) return 403;
  return 500;
}

export const Route = createFileRoute("/admin-console-data")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { operation?: unknown };
        try {
          body = (await request.json()) as { operation?: unknown };
        } catch {
          return Response.json({ error: "Invalid Admin Console request." }, { status: 400 });
        }

        const operation = body.operation;
        if (
          typeof operation !== "string" ||
          !Object.hasOwn(readOperations, operation)
        ) {
          return Response.json({ error: "Unknown Admin Console operation." }, { status: 400 });
        }

        try {
          const envelope = await executeAdminRead<unknown>(
            readOperations[operation as AdminConsoleReadOperation],
          );

          return Response.json(
            envelope,
            { headers: { "Cache-Control": "no-store" } },
          );
        } catch (error) {
          const message = messageFromError(error);
          return Response.json(
            { error: message },
            { status: statusFromError(message), headers: { "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});
