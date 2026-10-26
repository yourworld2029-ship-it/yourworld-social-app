export type MonetizationEmailCurrency = "INR" | "USD";

export type MonetizationEmailTemplate = {
  subject: string;
  text: string;
  html: string;
};

const activeEarningStreams = [
  {
    name: "Standard Videos (90s+)",
    description: "Automated ad revenue share.",
  },
  {
    name: "Shorts & Reels",
    description: "Direct brand sponsorships, paid promotions, and product deals.",
  },
  {
    name: "Paid Courses",
    description: "Sell masterclasses and skill workshops.",
  },
];

const indiaKycChecklist = [
  "Full Legal Name (as per bank records)",
  "Date of Birth (DOB)",
  "Mobile Number (+91)",
  "Email ID",
  "Bank Account Number and Confirm Bank Account Number",
  "IFSC Code",
  "Bank Passbook (clear JPG, PNG, or PDF of the 1st page)",
  "PAN Card Number and clear JPG, PNG, or PDF upload",
];

const internationalKycChecklist = [
  "Full Legal Name (as per government ID)",
  "Date of Birth (DOB)",
  "Local Tax ID or National ID, if required for your country",
  "Country-supported payout method and matching bank or PayPal details",
  "Clear identity and payout proof documents requested by the in-app form",
];

function renderList(items: string[]) {
  return items.map((item) => `<li style="margin:5px 0">${item}</li>`).join("");
}

function renderStreams() {
  return activeEarningStreams
    .map(
      ({ name, description }) =>
        `<li style="margin:7px 0"><strong>${name}:</strong> ${description}</li>`,
    )
    .join("");
}

function buildHtml(input: {
  title: string;
  introduction: string;
  kycHeading: string;
  kycInstructions: string;
  kycChecklist: string[];
  rules: string[];
  signoff: string;
}) {
  return `
    <div style="margin:0;padding:24px;background:#f4f2f8;font-family:Arial,Helvetica,sans-serif;color:#242033">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e8e2f0;border-radius:16px;overflow:hidden">
        <div style="padding:24px 28px;background:#24113e;color:#ffffff">
          <p style="margin:0 0 8px;color:#f2a6e8;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">YourWorld Creator Program</p>
          <h1 style="margin:0;font-size:24px;line-height:1.3">${input.title}</h1>
        </div>
        <div style="padding:24px 28px;font-size:15px;line-height:1.65">
          <p style="margin:0 0 16px">${input.introduction}</p>
          <div style="margin:20px 0;padding:18px;background:#fbf7ff;border:1px solid #eadcf8;border-radius:12px">
            <h2 style="margin:0 0 10px;font-size:18px;color:#4b1680">Your active earning streams</h2>
            <ul style="margin:0;padding-left:22px">${renderStreams()}</ul>
          </div>
          <div style="margin:20px 0;padding:18px;border:1px solid #e8e2f0;border-radius:12px">
            <h2 style="margin:0 0 8px;font-size:18px;color:#4b1680">${input.kycHeading}</h2>
            <p style="margin:0 0 8px">${input.kycInstructions}</p>
            <p style="margin:0 0 8px"><strong>Go to:</strong> App Profile &gt; Settings &gt; Monetization &amp; Wallet</p>
            <ul style="margin:8px 0 0;padding-left:22px">${renderList(input.kycChecklist)}</ul>
          </div>
          <div style="margin:20px 0;padding:18px;background:#fbf7ff;border:1px solid #eadcf8;border-radius:12px">
            <h2 style="margin:0 0 10px;font-size:18px;color:#4b1680">Payout rules at a glance</h2>
            <ul style="margin:0;padding-left:22px">${renderList(input.rules)}</ul>
          </div>
          <p style="margin:20px 0 0">${input.signoff}</p>
          <p style="margin:6px 0 0">— Team YourWorld Social</p>
        </div>
      </div>
    </div>`;
}

export function buildMonetizationApprovalEmail(
  currency: MonetizationEmailCurrency,
): MonetizationEmailTemplate {
  if (currency === "USD") {
    const rules = [
      "Minimum withdrawal: $70 USD.",
      "Payout review window: the 1st through the 5th of each month.",
      "Payouts remain in USD; international transfers are reviewed and processed manually.",
    ];
    const text = [
      "Your channel has been marked eligible for the YourWorld creator monetization program.",
      "Your active earning streams:",
      ...activeEarningStreams.map(({ name, description }) => `- ${name}: ${description}`),
      "To set up your payout profile, go to App Profile > Settings > Monetization & Wallet.",
      "Complete the country-specific KYC form shown for your saved Country / Region:",
      ...internationalKycChecklist.map((item) => `- ${item}`),
      ...rules,
      "Happy creating! Keep inspiring the community.",
      "— Team YourWorld Social",
    ].join("\n\n");

    return {
      subject: "Your YourWorld monetization eligibility checklist",
      text,
      html: buildHtml({
        title: "Your creator monetization checklist",
        introduction:
          "Your channel has been marked eligible for the YourWorld creator monetization program.",
        kycHeading: "Action required: payout and country-specific KYC",
        kycInstructions:
          "Complete the payout profile using the form for your saved Country / Region. Required tax and bank fields vary by country.",
        kycChecklist: internationalKycChecklist,
        rules,
        signoff: "Happy creating! Keep inspiring the community.",
      }),
    };
  }

  const subject =
    "🎉 Congratulations! Your Monetization is Approved – Welcome to YourWorld Creator Program!";
  const rules = [
    "Minimum withdrawal threshold: ₹5,000 INR.",
    "Payout review window: 1st to 5th of every month.",
    "Automated ad revenue share applies to eligible standard videos of 90 seconds or longer.",
  ];
  const text = [
    "Congratulations, Creator! 🚀",
    "Your channel has officially been approved for the YourWorld Creator Monetization Program.",
    "Your active earning streams:",
    ...activeEarningStreams.map(({ name, description }) => `- ${name}: ${description}`),
    "To receive your monthly earnings smoothly into your bank account, complete your KYC and payout profile in the app.",
    "Go to: App Profile > Settings > Monetization & Wallet",
    "Keep the following details ready:",
    ...indiaKycChecklist.map((item) => `- ${item}`),
    ...rules,
    "Happy creating! Keep inspiring the community.",
    "— Team YourWorld Social",
  ].join("\n\n");

  return {
    subject,
    text,
    html: buildHtml({
      title: "Congratulations, Creator! 🚀",
      introduction:
        "Your channel has officially been approved for the YourWorld Creator Monetization Program.",
      kycHeading: "Action required: payout and KYC setup",
      kycInstructions:
        "To receive your monthly earnings smoothly into your bank account, complete your KYC and payout profile in the app.",
      kycChecklist: indiaKycChecklist,
      rules,
      signoff: "Happy creating! Keep inspiring the community.",
    }),
  };
}
