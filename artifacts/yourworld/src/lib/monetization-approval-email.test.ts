import assert from "node:assert/strict";
import test from "node:test";
import { buildMonetizationApprovalEmail } from "./monetization-approval-email";

const activeStreams = [
  "Standard Videos (90s+)",
  "Automated ad revenue share",
  "Shorts & Reels",
  "Direct brand sponsorships, paid promotions, and product deals",
  "Paid Courses",
  "masterclasses and skill workshops",
];

test("INR monetization email matches the India payout form and only lists active earning streams", () => {
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
    "IFSC Code",
    "Bank Passbook (clear JPG, PNG, or PDF of the 1st page)",
    "PAN Card Number and clear JPG, PNG, or PDF upload",
    "₹5,000 INR",
    "1st to 5th of every month",
  ]) {
    assert.ok(email.text.includes(requirement), `missing email requirement: ${requirement}`);
  }
  for (const stream of activeStreams) {
    assert.ok(email.text.includes(stream), `missing active earning stream: ${stream}`);
  }
  assert.ok(email.html.includes("App Profile &gt; Settings &gt; Monetization &amp; Wallet"));
  assert.ok(email.html.includes("Happy creating! Keep inspiring the community."));
  assert.doesNotMatch(email.text, /VIP|live streaming|gifting/i);
  assert.doesNotMatch(email.html, /VIP|live streaming|gifting/i);
});

test("USD monetization email uses country-specific KYC and the same three earning streams", () => {
  const email = buildMonetizationApprovalEmail("USD");

  assert.equal(email.subject, "Your YourWorld monetization eligibility checklist");
  assert.ok(email.text.includes("Minimum withdrawal: $70 USD."));
  assert.ok(email.text.includes("the 1st through the 5th of each month."));
  assert.ok(email.text.includes("country-specific KYC form"));
  for (const stream of activeStreams) {
    assert.ok(email.text.includes(stream), `missing active earning stream: ${stream}`);
  }
  assert.ok(!email.text.includes("₹5,000"));
  assert.doesNotMatch(email.text, /VIP|live streaming|gifting/i);
  assert.doesNotMatch(email.html, /VIP|live streaming|gifting/i);
});
