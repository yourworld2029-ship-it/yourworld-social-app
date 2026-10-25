import { createFileRoute } from "@tanstack/react-router";
import {
  listAdminConsole,
  listAdminInternationalPayoutKyc,
  listAdminPayoutRequests,
} from "@/lib/admin-console.functions";
import type { AdminConsoleReadOperation } from "@/lib/admin-console-api";

type ServerFunctionExecutor = {
  __executeServer?: (options: {
    context: Record<string, never>;
    data?: unknown;
    method: "POST";
  }) => Promise<{
    result?: unknown;
    error?: unknown;
  }>;
};

const readOperations = {
  console: listAdminConsole,
  payoutRequests: listAdminPayoutRequests,
  internationalPayoutKyc: listAdminInternationalPayoutKyc,
} satisfies Record<AdminConsoleReadOperation, unknown>;

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : "Admin data could not be loaded.";
}

function statusFromError(message: string): number {
  if (/unauthorized|session expired/i.test(message)) return 401;
  if (/forbidden|admin|mfa|assurance/i.test(message)) return 403;
  return 500;
}

async function executeServerFunction(
  operation: AdminConsoleReadOperation,
): Promise<{ result?: unknown; error?: unknown }> {
  const serverFunction = readOperations[operation] as ServerFunctionExecutor;
  if (typeof serverFunction.__executeServer !== "function") {
    throw new Error("Admin server handler is unavailable.");
  }

  return serverFunction.__executeServer({
    context: {},
    method: "POST",
  });
}

export const Route = createFileRoute("/api/admin-console")({
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
          const execution = await executeServerFunction(
            operation as AdminConsoleReadOperation,
          );
          if (execution.error) {
            const message = messageFromError(execution.error);
            return Response.json(
              { error: message },
              { status: statusFromError(message), headers: { "Cache-Control": "no-store" } },
            );
          }

          return Response.json(
            { data: execution.result },
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
