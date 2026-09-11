import test from "node:test";
import assert from "node:assert/strict";
import { classifyNetworkQuality } from "./adaptive-performance";

test("adaptive network quality follows fast, normal, weak, and offline transitions", () => {
  assert.equal(
    classifyNetworkQuality({ online: true, effectiveType: "5g", downlink: 25, rtt: 40 }),
    "fast",
  );
  assert.equal(
    classifyNetworkQuality({ online: true, effectiveType: "4g", downlink: 5, rtt: 180 }),
    "normal",
  );
  assert.equal(
    classifyNetworkQuality({ online: true, effectiveType: "4g", downlink: 0.8, rtt: 700 }),
    "weak",
  );
  assert.equal(classifyNetworkQuality({ online: false }), "offline");
});