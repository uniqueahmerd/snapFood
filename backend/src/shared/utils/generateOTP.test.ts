import assert from "node:assert/strict";
import test from "node:test";
import generateOTP from "./generateOTP";

test("generateOTP returns a six-digit numeric code", () => {
  const otp = generateOTP();

  assert.match(otp, /^\d{6}$/);
});