import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/channel/create")({
  beforeLoad: () => {
    throw redirect({ to: "/channel/analytics" });
  },
  component: () => null,
});