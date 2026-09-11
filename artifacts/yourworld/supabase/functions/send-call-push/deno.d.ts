declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

type SupabaseQuery<T> = Promise<{ data: T[] | null; error: unknown }> & {
  maybeSingle(): Promise<{ data: T | null; error: unknown }>;
};

declare module "https://esm.sh/@supabase/supabase-js@2.111.0" {
  export function createClient(url: string, key: string, options?: {
    global?: { headers?: Record<string, string> };
  }): {
    auth: {
      getUser(token: string): Promise<{
        data: { user: { id: string } | null };
        error: unknown;
      }>;
    };
    from(table: string): {
      select(columns: string): {
        eq(column: string, value: string): SupabaseQuery<{
          id: string;
          caller_id: string;
          receiver_id: string;
          call_type: string;
          status: string;
          subscription: unknown;
        }>;
      };
      delete(): {
        eq(column: string, value: string): Promise<{ error: unknown }>;
      };
    };
  };
}

declare module "npm:web-push" {
  const webpush: {
    setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
    sendNotification(
      subscription: unknown,
      payload: string,
      options?: { TTL?: number; urgency?: string },
    ): Promise<unknown>;
  };
  export default webpush;
}