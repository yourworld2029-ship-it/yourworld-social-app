/**
 * Use the public callable so TanStack resolves its compiled server handler and
 * runs authentication middleware. Calling __executeServer on an SSR reference
 * bypasses handler resolution and can silently return an undefined result.
 */
export async function executeAdminRead<T>(handler: () => Promise<T>): Promise<{ data: T }> {
  const data = await handler();
  if (data === undefined || data === null) {
    throw new Error("Admin server handler returned an empty response.");
  }
  return { data };
}
