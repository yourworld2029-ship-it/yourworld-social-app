---
name: Chat message bubble sizing
description: Project-specific layout rule for incoming and outgoing chat message text.
---

Conversation message rows must use the available width, align outgoing messages to the end and incoming messages to the start, and let text bubbles fit their content up to 75% of the row. Preserve whitespace and allow long words to wrap; do not constrain text bubbles to narrow fixed widths.

**Why:** The user has repeatedly reported narrow chat bubbles causing otherwise short messages to stack vertically.

**How to apply:** When changing the active conversation message renderer or its styles, check the rendered message row and its text bubble directly; do not mistake widths on menus or unrelated chat elements for the bubble constraint.

The protected canvas renderer must size chat text from the available message row, not from the bubble's current width. Measuring the bubble itself can create a min-content feedback loop that keeps long messages narrow even when CSS allows 75%.

**Why:** The canvas width was derived from an already-collapsed auto-sized bubble, so the text never received a chance to expand the bubble.

**How to apply:** For chat text, derive the canvas wrap width from the full message row and the bubble's max-width ratio; keep that override opt-in so other protected-canvas text keeps its existing sizing.
