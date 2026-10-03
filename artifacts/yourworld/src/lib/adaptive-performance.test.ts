import test from "node:test";
import assert from "node:assert/strict";
import { classifyNetworkQuality, classifyDeviceCapability } from "./adaptive-performance";

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

test("low-memory phones are constrained even with eight CPU cores", () => {
  assert.equal(classifyDeviceCapability(2, 8), "constrained");
  assert.equal(classifyDeviceCapability(3, 8), "constrained");
  assert.equal(classifyDeviceCapability(4, 8), "constrained");
  assert.equal(classifyDeviceCapability(NaN, 4), "constrained");
  assert.equal(classifyDeviceCapability(8, 8), "capable");
});