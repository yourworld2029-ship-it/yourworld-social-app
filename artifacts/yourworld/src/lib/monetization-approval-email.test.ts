import assert from "node:assert/strict";
import test from "node:test";
import { buildMonetizationApprovalEmail } from "./monetization-approval-email";

test("INR monetization email matches the approval copy and India payout form", () => {
  const email = buildMonetizationApprovalEmail("INR");

  assert.equal(
    email.subject,
    "🎉 Congratulations! Your Monetization is Approved – Welcome to YourWorld Creator Program!",
  );
  for (const requirement of [
    "Full Legal Name (as per bank records)",
    "Date of Birth (DOB)",
    "Mobile Number (+91)",
    "Email ID",
    "Bank Account Number and Confirm Bank Account Number",
    "Bank Passbook (clear JPG, PNG, or PDF of the 1st page)",
    "IFSC Code",
    "PAN Card Number and clear JPG, PNG, or PDF upload",
    "₹5,000 INR",
    "1st to 5th of every month",
    "90+ seconds",
  ]) {
    assert.ok(email.text.includes(requirement), `missing email requirement: ${requirement}`);
  }
  assert.ok(email.html.includes("App Profile &gt; Settings &gt; Monetization &amp; Wallet"));
  assert.ok(email.html.includes("Happy creating! Keep inspiring the community."));
});

test("USD monetization checklist keeps its existing currency and copy", () => {
  const email = buildMonetizationApprovalEmail("USD");

  assert.equal(email.subject, "Your YourWorld monetization eligibility checklist");
  assert.ok(email.text.includes("Minimum withdrawal: $70 USD."));
  assert.ok(email.text.includes("monthly window from the 1st through the 5th."));
  assert.ok(email.text.includes("Reels are not part of this ad-share calculation."));
  assert.ok(!email.text.includes("₹5,000"));
});
