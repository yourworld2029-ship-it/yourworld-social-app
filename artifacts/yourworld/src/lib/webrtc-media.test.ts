import test from "node:test";
import assert from "node:assert/strict";
import {
  callVideoScaleTo240p,
  classifyCallNetwork,
  collectCallPacketLoss,
  prioritizeCallAudioSender,
  setCallVideoTransmissionPaused,
  tuneCallVideoSender,
} from "./webrtc-media";

function fakeSender(kind: "audio" | "video", width = 1280, height = 720) {
  let parameters = {
    encodings: [{}],
    codecs: [],
    headerExtensions: [],
    rtcp: {},
    transactionId: "test",
  } as RTCRtpSendParameters;
  const sender = {
    track: { kind, getSettings: () => ({ width, height }) },
    getParameters: () => structuredClone(parameters),
    setParameters: async (next: RTCRtpSendParameters) => {
      parameters = structuredClone(next);
    },
  } as unknown as RTCRtpSender;
  return { sender, parameters: () => parameters };
}

test("call loss thresholds preserve a recovery hysteresis band", () => {
  assert.equal(classifyCallNetwork(null, null), "unknown");
  assert.equal(classifyCallNetwork(0.01, 0.02), "healthy");
  assert.equal(classifyCallNetwork(0.01, 0.05), "unknown");
  assert.equal(classifyCallNetwork(0.08, 0), "degraded");
  assert.equal(classifyCallNetwork(0, 0.25), "critical");
  assert.equal(classifyCallNetwork(Number.NaN, null), "unknown");
});

test("incoming packet loss uses interval deltas rather than lifetime totals", () => {
  const counters = new Map<string, { received: number; lost: number }>();
  const first = [{ id: "v", type: "inbound-rtp", kind: "video", packetsReceived: 900, packetsLost: 100 }];
  assert.deepEqual(collectCallPacketLoss(first, counters), { audio: null, video: null });
  const next = [{ ...first[0], packetsReceived: 990, packetsLost: 110 }];
  assert.equal(collectCallPacketLoss(next, counters).video, 0.1);
  assert.equal(collectCallPacketLoss(next, counters).video, null);
  assert.equal(collectCallPacketLoss([{ ...first[0], packetsReceived: 1090, packetsLost: 110 }], counters).video, 0);
});

test("counter resets and negative loss corrections do not manufacture packet loss", () => {
  const counters = new Map([["v", { received: 1000, lost: 10 }]]);
  const reports = [{ id: "v", type: "inbound-rtp", kind: "video", packetsReceived: 5, packetsLost: -1 }];
  assert.equal(collectCallPacketLoss(reports, counters).video, null);
});

test("remote reports distinguish audio and video and ignore stale RTCP samples", () => {
  const counters = new Map<string, { received: number; lost: number; timestamp?: number }>();
  const reports = [
    { id: "a", type: "remote-inbound-rtp", mediaType: "audio", fractionLost: 0.1, timestamp: 1 },
    { id: "v", type: "remote-inbound-rtp", kind: "video", fractionLost: 0.3, timestamp: 1 },
  ];
  assert.deepEqual(collectCallPacketLoss(reports, counters), { audio: 0.1, video: 0.3 });
  assert.deepEqual(collectCallPacketLoss(reports, counters), { audio: null, video: null });
});

test("240p scaling supports both landscape and portrait without upscaling", () => {
  assert.equal(callVideoScaleTo240p(fakeSender("video").sender.track), 1280 / 426);
  assert.equal(callVideoScaleTo240p(fakeSender("video", 1080, 1920).sender.track), 1920 / 426);
  assert.equal(callVideoScaleTo240p(fakeSender("video", 160, 120).sender.track), 1);
  assert.equal(callVideoScaleTo240p(null), 3);
});

test("weak-network video is capped at 150kbps and 15fps with lower transport priority", async () => {
  const fake = fakeSender("video");
  await tuneCallVideoSender(fake.sender, true);
  const encoding = fake.parameters().encodings[0];
  assert.equal(encoding.maxBitrate, 150_000);
  assert.equal(encoding.maxFramerate, 15);
  assert.equal(encoding.priority, "low");
  assert.ok((encoding.scaleResolutionDownBy ?? 0) >= 3);
});

test("audio remains high priority at 10kbps and returns to uncapped adaptive bitrate", async () => {
  const fake = fakeSender("audio");
  await prioritizeCallAudioSender(fake.sender, true);
  assert.equal(fake.parameters().encodings[0].maxBitrate, 10_000);
  assert.equal(fake.parameters().encodings[0].priority, "high");
  await prioritizeCallAudioSender(fake.sender, false);
  assert.equal(fake.parameters().encodings[0].maxBitrate, undefined);
});

test("critical fallback suspends only video transmission and can resume it", async () => {
  const video = fakeSender("video");
  const audio = fakeSender("audio");
  await setCallVideoTransmissionPaused(video.sender, true);
  await setCallVideoTransmissionPaused(audio.sender, true);
  assert.equal(video.parameters().encodings[0].active, false);
  assert.equal(audio.parameters().encodings[0].active, undefined);
  await tuneCallVideoSender(video.sender, true);
  assert.equal(video.parameters().encodings[0].active, false);
  await setCallVideoTransmissionPaused(video.sender, false);
  assert.equal(video.parameters().encodings[0].active, true);
});
