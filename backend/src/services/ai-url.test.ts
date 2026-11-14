import { test } from "node:test";
import assert from "node:assert/strict";

import { getAIServiceBaseUrl } from "./ai-url";

test("AI service base URL strips prediction endpoint suffixes", () => {
  assert.equal(getAIServiceBaseUrl("http://localhost:7860"), "http://localhost:7860");
  assert.equal(getAIServiceBaseUrl("http://localhost:7860/analyze"), "http://localhost:7860");
  assert.equal(getAIServiceBaseUrl("http://localhost:7860/predict/"), "http://localhost:7860");
});