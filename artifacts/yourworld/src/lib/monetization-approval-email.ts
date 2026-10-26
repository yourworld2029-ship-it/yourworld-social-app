export type MonetizationEmailCurrency = "INR" | "USD";

export type MonetizationEmailTemplate = {
  subject: string;
  text: string;
  html: string;
};

const usdChecklist = [
  "Your account has been marked eligible for the YourWorld creator monetization program.",
  "Minimum withdrawal: $70 USD.",
  "Payouts are reviewed in the monthly window from the 1st through the 5th.",
  "Complete and keep your payout KYC details current before requesting a transfer.",
  "Revenue sharing applies to eligible standard videos of at least 90 seconds; Reels are not part of this ad-share calculation.",
];

export function buildMonetizationApprovalEmail(
  currency: MonetizationEmailCurrency,
): MonetizationEmailTemplate {
  if (currency === "USD") {
    return {
      subject: "Your YourWorld monetization eligibility checklist",
      text: usdChecklist.join("\n\n"),
      html: `<h2>Your monetization checklist</h2>${usdChecklist
        .map((line) => `<p>${line}</p>`)
        .join("")}<p>— YourWorld Creator Admin</p>`,
    };
  }

  const subject =
    "🎉 Congratulations! Your Monetization is Approved – Welcome to YourWorld Creator Program!";
  const text = [
    "Congratulations, Creator! 🚀",
    "Your channel has officially been approved for the YourWorld Creator Monetization Program. You can now start earning from your eligible standard videos (90+ seconds).",
    "To receive your monthly earnings smoothly into your bank account, please complete your KYC and payout profile in the app:",
    "Go to: App Profile > Settings > Monetization & Wallet",
    "Keep the following details ready:",
    "- Full Legal Name (as per bank records)",
    "- Date of Birth (DOB)",
    "- Mobile Number (+91)",
    "- Email ID",
    "- Bank Account Number and Confirm Bank Account Number",
    "- Bank Passbook (clear JPG, PNG, or PDF of the 1st page)",
    "- IFSC Code",
    "- PAN Card Number and clear JPG, PNG, or PDF upload",
    "Minimum withdrawal threshold: ₹5,000 INR",
    "Payout review window: 1st to 5th of every month",
    "Platform Ad-share applies to original standard videos of 90+ seconds. Reels are excluded.",
    "Happy creating! Keep inspiring the community.",
    "— Team YourWorld Social",
  ].join("\n\n");

  const list = [
    "Full Legal Name (as per bank records)",
    "Date of Birth (DOB)",
    "Mobile Number (+91)",
    "Email ID",
    "Bank Account Number and Confirm Bank Account Number",
    "Bank Passbook (clear JPG, PNG, or PDF of the 1st page)",
    "IFSC Code",
    "PAN Card Number and clear JPG, PNG, or PDF upload",
  ];

  const html = `
    <div style="margin:0;padding:24px;background:#f4f2f8;font-family:Arial,Helvetica,sans-serif;color:#242033">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e8e2f0;border-radius:16px;overflow:hidden">
        <div style="padding:24px 28px;background:#24113e;color:#ffffff">
          <p style="margin:0 0 8px;color:#f2a6e8;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">YourWorld Creator Program</p>
          <h1 style="margin:0;font-size:24px;line-height:1.3">Congratulations, Creator! 🚀</h1>
        </div>
        <div style="padding:24px 28px;font-size:15px;line-height:1.65">
          <p style="margin:0 0 16px">Your channel has officially been approved for the YourWorld Creator Monetization Program. You can now start earning from your eligible standard videos (90+ seconds).</p>
          <div style="margin:20px 0;padding:18px;background:#fbf7ff;border:1px solid #eadcf8;border-radius:12px">
            <h2 style="margin:0 0 8px;font-size:18px;color:#4b1680">Action Required: Payout &amp; KYC Setup</h2>
            <p style="margin:0 0 12px">To receive your monthly earnings smoothly into your bank account, please complete your KYC and payout profile in the app.</p>
            <p style="margin:0 0 8px"><strong>Go to:</strong> App Profile &gt; Settings &gt; Monetization &amp; Wallet</p>
            <p style="margin:0"><strong>Keep the following details ready:</strong></p>
            <ul style="margin:8px 0 0;padding-left:22px">
              ${list.map((item) => `<li style="margin:5px 0">${item}</li>`).join("")}
            </ul>
          </div>
          <div style="margin:20px 0;padding:18px;border:1px solid #e8e2f0;border-radius:12px">
            <h2 style="margin:0 0 10px;font-size:18px;color:#4b1680">Payout Rules at a Glance</h2>
            <ul style="margin:0;padding-left:22px">
              <li style="margin:5px 0"><strong>Minimum withdrawal:</strong> ₹5,000 INR</li>
              <li style="margin:5px 0"><strong>Payout review window:</strong> 1st to 5th of every month</li>
              <li style="margin:5px 0">Platform Ad-share applies to original standard videos of 90+ seconds; Reels are excluded.</li>
            </ul>
          </div>
          <p style="margin:20px 0 0">Happy creating! Keep inspiring the community.</p>
          <p style="margin:6px 0 0">— Team YourWorld Social</p>
        </div>
      </div>
    </div>`;

  return { subject, text, html };
}
