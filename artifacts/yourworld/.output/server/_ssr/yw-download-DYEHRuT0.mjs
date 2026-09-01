//#region node_modules/.nitro/vite/services/ssr/assets/yw-download-DYEHRuT0.js
/**
* Downloads media at original resolution with a small semi-transparent YW
* logo and the creator's @username watermark burned in.
*/
async function downloadWithWatermark(src, username, fileName) {
	const img = new Image();
	img.crossOrigin = "anonymous";
	img.src = src;
	await img.decode();
	const canvas = document.createElement("canvas");
	canvas.width = img.naturalWidth;
	canvas.height = img.naturalHeight;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas unavailable");
	ctx.drawImage(img, 0, 0);
	const unit = Math.max(canvas.width, canvas.height) * .032;
	const pad = unit * .9;
	const x = pad;
	const y = canvas.height - pad;
	ctx.save();
	ctx.globalAlpha = .55;
	ctx.shadowColor = "rgba(0,0,0,0.6)";
	ctx.shadowBlur = unit * .5;
	ctx.font = `700 ${unit}px Sora, system-ui, sans-serif`;
	ctx.textBaseline = "alphabetic";
	ctx.fillStyle = "#ffffff";
	ctx.fillText("YW", x, y);
	const markWidth = ctx.measureText("YW").width;
	ctx.globalAlpha = .45;
	ctx.font = `600 ${unit * .62}px Manrope, system-ui, sans-serif`;
	ctx.fillText(`@${username}`, x + markWidth + unit * .4, y);
	ctx.restore();
	const blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", .98));
	if (!blob) throw new Error("Export failed");
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = fileName;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}
/** Generic saver for any media (video/audio/photo) — keeps original bytes. */
async function downloadMedia(src, fileName) {
	const blob = await (await fetch(src)).blob();
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = fileName;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}
/** Photo → watermarked jpg, anything else → raw file. */
async function downloadMomentMedia(src, kind, username, id) {
	if (kind === "photo") try {
		await downloadWithWatermark(src, username, `yw-moment-${id}.jpg`);
		return;
	} catch {}
	await downloadMedia(src, `yw-moment-${id}.${kind === "video" ? "mp4" : "jpg"}`);
}
//#endregion
export { downloadWithWatermark as n, downloadMomentMedia as t };
