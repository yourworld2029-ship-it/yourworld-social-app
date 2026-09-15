import { r as createServerFn } from "./server-Jy7HpQQz.mjs";
import { i as stringType, r as objectType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-D334f2YP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/places.functions-Bc9HpS2p.js
var schema = objectType({
	query: stringType().trim().min(1).max(120),
	region: stringType().trim().max(120).optional()
});
var GOOGLE_PLACES_URL = "https://places.googleapis.com/v1/places:searchText";
var OSM_URL = "https://nominatim.openstreetmap.org/search";
/** Free, keyless real place search (OpenStreetMap) used when Google Maps isn't connected. */
async function searchOsm(textQuery) {
	const url = `${OSM_URL}?q=${encodeURIComponent(textQuery)}&format=jsonv2&addressdetails=1&limit=12`;
	const res = await fetch(url, { headers: {
		"User-Agent": "YourWorld-App/1.0 (orbit place search)",
		Accept: "application/json"
	} });
	if (!res.ok) {
		console.error(`OSM place search failed [${res.status}]: ${await res.text()}`);
		return [];
	}
	return (await res.json()).filter((p) => (p.name ?? "").trim().length > 0).map((p) => ({
		id: String(p.place_id),
		name: p.name.trim(),
		address: (p.display_name ?? "").split(", ").slice(1, 4).join(", "),
		mapsUrl: `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}`
	}));
}
var searchPlaces_createServerFn_handler = createServerRpc({
	id: "86a553360b1d2d5d6c994785348fb63757e6915e3db78e09d21670073a7e667b",
	name: "searchPlaces",
	filename: "src/lib/places.functions.ts"
}, (opts) => searchPlaces.__executeServer(opts));
var searchPlaces = createServerFn({ method: "POST" }).validator((data) => schema.parse(data)).handler(searchPlaces_createServerFn_handler, async ({ data }) => {
	const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];
	const textQuery = [data.query, data.region].filter(Boolean).join(" in ");
	if (!mapsKey) return {
		places: await searchOsm(textQuery),
		source: "osm"
	};
	const res = await fetch(GOOGLE_PLACES_URL, {
		method: "POST",
		headers: {
			"X-Goog-Api-Key": mapsKey,
			"Content-Type": "application/json",
			"X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.currentOpeningHours.openNow,places.googleMapsUri"
		},
		body: JSON.stringify({
			textQuery,
			maxResultCount: 12
		})
	});
	if (!res.ok) {
		const body = await res.text();
		console.error(`Places search failed [${res.status}]: ${body}`);
		throw new Error(`Place search failed [${res.status}]: ${body}`);
	}
	return {
		source: "google",
		places: ((await res.json()).places ?? []).map((p) => ({
			id: p.id,
			name: p.displayName?.text ?? "Unnamed place",
			address: p.formattedAddress ?? "",
			rating: p.rating,
			open: p.currentOpeningHours?.openNow,
			mapsUrl: p.googleMapsUri
		}))
	};
});
//#endregion
export { searchPlaces_createServerFn_handler };
