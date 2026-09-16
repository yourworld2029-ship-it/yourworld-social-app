import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/copyright-reports")({
  head: () => ({
    meta: [
      { title: "Copyright Reports Admin — YourWorld" },
      {
        name: "description",
        content: "Owner-only YourWorld copyright and DMCA moderation review.",
      },
    ],
  }),
  component: () => <Navigate to="/admin" />,
});