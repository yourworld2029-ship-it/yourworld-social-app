const PIN_HASH_PREFIX = "pbkdf2-sha256";
const PIN_HASH_ITERATIONS = 310_000;
const MIN_ACCEPTED_ITERATIONS = 100_000;
const MAX_ACCEPTED_ITERATIONS = 1_000_000;
const encoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function derivePinHash(salt: string, pin: string, iterations: number) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: encoder.encode(salt),
      iterations,
    },
    key,
    256,
  );
  return bytesToHex(new Uint8Array(bits));
}

export function randomPinSalt() {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
}

/** New PINs use a versioned, deliberately slow hash for safer server storage. */
export async function hashPin(salt: string, pin: string) {
  if (!salt || !/^\d{4,8}$/.test(pin)) throw new Error("Invalid PIN input");
  const digest = await derivePinHash(salt, pin, PIN_HASH_ITERATIONS);
  return `${PIN_HASH_PREFIX}$${PIN_HASH_ITERATIONS}$${digest}`;
}

/**
 * Accept the previous salted SHA-256 format so existing users can still unlock.
 * New PIN writes always use the PBKDF2 format above.
 */
export async function verifyPin(salt: string, pin: string, storedHash: string) {
  if (!salt || !/^\d{4,8}$/.test(pin)) return false;

  const versioned = new RegExp(`^${PIN_HASH_PREFIX}\\$(\\d+)\\$([a-f\\d]{64})$`).exec(storedHash);
  if (versioned) {
    const iterations = Number(versioned[1]);
    if (
      !Number.isSafeInteger(iterations) ||
      iterations < MIN_ACCEPTED_ITERATIONS ||
      iterations > MAX_ACCEPTED_ITERATIONS
    ) {
      return false;
    }
    const candidate = await derivePinHash(salt, pin, iterations);
    return constantTimeEqual(candidate, versioned[2]);
  }

  if (!/^[a-f\d]{64}$/i.test(storedHash)) return false;
  const legacyInput = encoder.encode(`${salt}:${pin}`);
  const legacyDigest = await crypto.subtle.digest("SHA-256", legacyInput);
  return constantTimeEqual(bytesToHex(new Uint8Array(legacyDigest)), storedHash.toLowerCase());
}