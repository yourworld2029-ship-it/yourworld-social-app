//#region node_modules/.nitro/vite/services/ssr/assets/orbit-mood--S38GIFY.js
var ORBIT_MOODS = [
	{
		id: "friends",
		emoji: "",
		label: "Make Friends",
		related: [
			"Coffee",
			"Food",
			"Books",
			"Markets"
		]
	},
	{
		id: "relationship",
		emoji: "",
		label: "Relationship",
		related: [
			"Travel",
			"Food",
			"Film",
			"Music"
		]
	},
	{
		id: "coffee",
		emoji: "",
		label: "Coffee Chat",
		related: [
			"Coffee",
			"Books",
			"Tea",
			"Markets"
		]
	},
	{
		id: "workout",
		emoji: "",
		label: "Workout Partner",
		related: [
			"Fitness",
			"Running",
			"Hiking",
			"Sneakers"
		]
	},
	{
		id: "travel",
		emoji: "",
		label: "Travel Buddy",
		related: [
			"Travel",
			"Ocean",
			"Hiking",
			"Photography"
		]
	},
	{
		id: "study",
		emoji: "",
		label: "Study Partner",
		related: [
			"Books",
			"Art",
			"Tea",
			"Ceramics"
		]
	},
	{
		id: "gaming",
		emoji: "",
		label: "Gaming Partner",
		related: [
			"Gaming",
			"Music",
			"Film",
			"Synths"
		]
	},
	{
		id: "music",
		emoji: "",
		label: "Music Buddy",
		related: [
			"Music",
			"Synths",
			"Vinyl",
			"Dance"
		]
	},
	{
		id: "photography",
		emoji: "",
		label: "Photography Partner",
		related: [
			"Photography",
			"Film",
			"Night walks",
			"Art"
		]
	},
	{
		id: "sports",
		emoji: "",
		label: "Sports Partner",
		related: [
			"Fitness",
			"Surf",
			"Running",
			"Hiking"
		]
	}
];
var moodById = (id) => id ? ORBIT_MOODS.find((m) => m.id === id) ?? null : null;
/**
* Local relevance score used to prioritise people with the same mood and
* similar interests. Runs fully on-device on public profile fields only.
*/
function moodMatchScore(profile, mood, myInterests = []) {
	if (!mood) return 0;
	let score = 0;
	if (profile.mood === mood) score += 100;
	const m = moodById(mood);
	if (m) {
		const related = new Set(m.related.map((r) => r.toLowerCase()));
		score += profile.interests.filter((i) => related.has(i.toLowerCase())).length * 12;
	}
	const mine = new Set(myInterests.map((i) => i.toLowerCase()));
	score += profile.interests.filter((i) => mine.has(i.toLowerCase())).length * 8;
	return score;
}
//#endregion
export { moodMatchScore as n, moodById as t };
