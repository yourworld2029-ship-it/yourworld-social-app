import { createContext, useContext } from "react";
import type { Store } from "@/lib/moment-store";

export const MomentContext = createContext<Store | null>(null);

export function useMoments() {
  const ctx = useContext(MomentContext);
  if (!ctx) throw new Error("useMoments must be used inside MomentProvider");
  return ctx;
}