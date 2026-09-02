import type { OrbitMoodId } from "@/lib/orbit-mood";

export type OrbitProfile = {
  id: string;
  name: string;
  handle: string;
  age: number;
  /** Approximate area only — never an exact address or coordinates. */
  area: string;
  /** Private location fields — only the city is ever shown publicly. */
  country: string;
  state: string;
  city: string;
  /** Used only for Women / Men / Everyone filtering. */
  gender: "Women" | "Men";
  /** Who this person is here to meet. */
  lookingFor: "Women" | "Men" | "Everyone";
  hobbies: string[];
  distanceKm: number;
  headline: string;
  about: string;
  interests: string[];
  photo: string;
  hue: number;
  verified?: boolean;
  /** Optional — why this person is on Orbit right now. */
  mood?: OrbitMoodId;
};

/** Distance is always bucketed so an exact position can never be derived. */
export const approxDistance = (km: number) => {
  if (km < 2) return "Under 2 km away";
  if (km < 5) return "~5 km away";
  if (km < 10) return "~10 km away";
  if (km < 25) return "~25 km away";
  return "50 km+ away";
};

/** Real Orbit profiles loaded from the database, keyed by user id. */
const liveRegistry = new Map<string, OrbitProfile>();

export function registerOrbitProfiles(list: OrbitProfile[]) {
  for (const p of list) liveRegistry.set(p.id, p);
}

export const orbitById = (id: string) => liveRegistry.get(id);
