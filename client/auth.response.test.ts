import assert from "node:assert/strict";
import test from "node:test";

import { normalizeAuthResponse } from "./src/services/auth.response";

test("normalizes the backend login response into access token and user", () => {
  const response = {
    data: {
      accessToken: "access-token",
      user: {
        id: "user-id",
        firstName: "Retry",
        lastName: "User",
        email: "retry@example.com",
        role: "user",
      },
    },
  };

  assert.deepEqual(normalizeAuthResponse(response), {
    accessToken: "access-token",
    user: {
      id: "user-id",
      firstName: "Retry",
      lastName: "User",
      email: "retry@example.com",
      role: "user",
    },
  });
});

test("normalizes registration's nested user payload", () => {
  const response = {
    data: {
      accessToken: "access-token",
      data: {
        id: "user-id",
        firstName: "Retry",
        lastName: "User",
        email: "retry@example.com",
        role: "user",
      },
    },
  };

  assert.deepEqual(normalizeAuthResponse(response), {
    accessToken: "access-token",
    user: {
      id: "user-id",
      firstName: "Retry",
      lastName: "User",
      email: "retry@example.com",
      role: "user",
    },
  });
});
