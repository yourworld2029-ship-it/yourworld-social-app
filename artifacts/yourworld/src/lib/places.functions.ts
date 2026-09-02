import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type PlaceResult = {
  id: string;
  name: string;
  address: string;
  rating?: number;
  open?: boolean;
  mapsUrl?: string;
};

const schema = z.object({
  query: z.string().trim().min(1).max(120),
  region: z.string().trim().max(120).optional(),
});

const GOOGLE_PLACES_URL = "https://places.googleapis.com/v1/places:searchText";
const OSM_URL = "https://nominatim.openstreetmap.org/search";

/** Free, keyless real place search (OpenStreetMap) used when Google Maps isn't connected. */
async function searchOsm(textQuery: string): Promise<PlaceResult[]> {
  const url = `${OSM_URL}?q=${encodeURIComponent(textQuery)}&format=jsonv2&addressdetails=1&limit=12`;
  const res = await fetch(url, {
    headers: { "User-Agent": "YourWorld-App/1.0 (orbit place search)", Accept: "application/json" },
  });
  if (!res.ok) {
    console.error(`OSM place search failed [${res.status}]: ${await res.text()}`);
    return [];
  }
  const json = (await res.json()) as Array<{
    place_id: number;
    name?: string;
    display_name?: string;
    lat: string;
    lon: string;
  }>;
  return json
    .filter((p) => (p.name ?? "").trim().length > 0)
    .map((p) => ({
      id: String(p.place_id),
      name: p.name!.trim(),
      address: (p.display_name ?? "").split(", ").slice(1, 4).join(", "),
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}`,
    }));
}

export const searchPlaces = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }): Promise<{ places: PlaceResult[]; source: "google" | "osm" | "none" }> => {
    const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];
    const textQuery = [data.query, data.region].filter(Boolean).join(" in ");

    if (!mapsKey) {
      return { places: await searchOsm(textQuery), source: "osm" };
    }

    const res = await fetch(GOOGLE_PLACES_URL, {
      method: "POST",
      headers: {
        "X-Goog-Api-Key": mapsKey,
        "Content-Type": "application/json",
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.rating,places.currentOpeningHours.openNow,places.googleMapsUri",
      },
      body: JSON.stringify({ textQuery, maxResultCount: 12 }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`Places search failed [${res.status}]: ${body}`);
      throw new Error(`Place search failed [${res.status}]: ${body}`);
    }

    const json = (await res.json()) as {
      places?: Array<{
        id: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        rating?: number;
        currentOpeningHours?: { openNow?: boolean };
        googleMapsUri?: string;
      }>;
    };

    return {
      source: "google",
      places: (json.places ?? []).map((p) => ({
        id: p.id,
        name: p.displayName?.text ?? "Unnamed place",
        address: p.formattedAddress ?? "",
        rating: p.rating,
        open: p.currentOpeningHours?.openNow,
        mapsUrl: p.googleMapsUri,
      })),
    };
  });
