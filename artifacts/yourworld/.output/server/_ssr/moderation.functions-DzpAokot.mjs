import { r as createServerFn } from "./server-CObOwgUO.mjs";
import { t as createServerRpc } from "./createServerRpc-B2u_6Rir.mjs";
import { i as stringType, n as booleanType, r as objectType, t as arrayType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/moderation.functions-DzpAokot.js
var schema = objectType({
	title: stringType().trim().max(300).default(""),
	description: stringType().trim().max(4e3).default(""),
	tags: arrayType(stringType().max(60)).max(30).default([]),
	paidPromotion: booleanType().default(false),
	/** Up to 3 base64 JPEG frames sampled from the video (no data: prefix). */
	frames: arrayType(stringType().max(4e6)).max(3).default([])
});
var MODEL = "gemini-2.5-flash";
var ENDPOINT = (key) => `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`;
var SYSTEM = `You are the automated content-safety and brand-detection reviewer for a social video platform.
Analyse the supplied video frames and metadata and reply with JSON only:
{"decision":"safe|review|block","brands":["..."],"sponsorship":true|false,"reason":"short neutral sentence"}
Rules:
- "block": sexual content, nudity, graphic violence/gore, self-harm, hate, illegal drugs/weapons sales, child endangerment.
- "review": visible third-party brands/logos/trademarks, undeclared paid promotion, gambling, medical/financial claims, unclear but risky content.
- "safe": everything else.
- brands: list only clearly identifiable brand or trademark names.
- Never include markdown fences or prose outside the JSON object.`;
function parseVerdict(text) {
	const match = text.match(/\{[\s\S]*\}/);
	if (!match) return null;
	try {
		const raw = JSON.parse(match[0]);
		return {
			decision: raw.decision === "block" || raw.decision === "review" ? raw.decision : "safe",
			brands: Array.isArray(raw.brands) ? raw.brands.filter((b) => typeof b === "string").slice(0, 12) : [],
			sponsorship: !!raw.sponsorship,
			reason: typeof raw.reason === "string" ? raw.reason.slice(0, 300) : ""
		};
	} catch {
		return null;
	}
}
/** Scans a video's sampled frames + metadata with Gemini before it is published. */
var scanVideoContent_createServerFn_handler = createServerRpc({
	id: "b7569d16e2c715517e1807b35b3080d925733e31ad9f310c9701eeb3c4597e99",
	name: "scanVideoContent",
	filename: "src/lib/moderation.functions.ts"
}, (opts) => scanVideoContent.__executeServer(opts));
var scanVideoContent = createServerFn({ method: "POST" }).inputValidator((data) => schema.parse(data)).handler(scanVideoContent_createServerFn_handler, async ({ data }) => {
	const key = process.env["GEMINI_API_KEY"];
	if (!key) return {
		decision: "safe",
		brands: [],
		sponsorship: false,
		reason: "",
		skipped: true
	};
	const parts = [{ text: `${SYSTEM}\n\nMetadata:\ntitle: ${data.title}\ndescription: ${data.description}\ntags: ${data.tags.join(", ")}\ndeclared paid promotion: ${data.paidPromotion ? "yes" : "no"}` }];
	for (const frame of data.frames) parts.push({ inlineData: {
		mimeType: "image/jpeg",
		data: frame
	} });
	try {
		const res = await fetch(ENDPOINT(key), {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				contents: [{
					role: "user",
					parts
				}],
				generationConfig: {
					temperature: 0,
					responseMimeType: "application/json"
				}
			})
		});
		if (!res.ok) {
			console.error(`Gemini moderation failed [${res.status}]: ${await res.text()}`);
			return {
				decision: "review",
				brands: [],
				sponsorship: false,
				reason: "Automated scan unavailable.",
				skipped: true
			};
		}
		const verdict = parseVerdict((await res.json()).candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "");
		if (!verdict) return {
			decision: "review",
			brands: [],
			sponsorship: false,
			reason: "Automated scan inconclusive.",
			skipped: true
		};
		return verdict;
	} catch (err) {
		console.error("Gemini moderation error", err);
		return {
			decision: "review",
			brands: [],
			sponsorship: false,
			reason: "Automated scan unavailable.",
			skipped: true
		};
	}
});
//#endregion
export { scanVideoContent_createServerFn_handler };
