---
name: Chat message bubble sizing
description: Project-specific layout rule for incoming and outgoing chat message text.
---

Conversation message rows must use the available width, align outgoing messages to the end and incoming messages to the start, and let text bubbles fit their content up to 75% of the row. Preserve whitespace and allow long words to wrap; do not constrain text bubbles to narrow fixed widths.

**Why:** The user has repeatedly reported narrow chat bubbles causing otherwise short messages to stack vertically.

**How to apply:** When changing the active conversation message renderer or its styles, check the rendered message row and its text bubble directly; do not mistake widths on menus or unrelated chat elements for the bubble constraint.

The protected canvas renderer must size chat text from the chat viewport, not from the bubble or message row. Measuring a constrained row can still cap long lines too early, even when CSS allows 75vw.

**Why:** A screenshot showed long messages still occupying only about one-third of the viewport after row-based sizing; the canvas must use the same viewport basis as the 75vw bubble cap.

**How to apply:** For chat text, measure from the visible chat viewport and subtract bubble padding; keep that override opt-in so other protected-canvas text keeps its existing sizing.
