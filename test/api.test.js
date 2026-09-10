import assert from "node:assert/strict";
import test from "node:test";
import handler from "../api/generate.js";

function mockResponse() {
  return {
    code: 200,
    payload: null,
    status(code) { this.code = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };
}

test("rejects methods other than POST", async () => {
  const response = mockResponse();
  await handler({ method: "GET" }, response);
  assert.equal(response.code, 405);
});

test("reports missing server API configuration", async () => {
  const previous = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  const response = mockResponse();
  await handler({ method: "POST", body: { city: "London", country: "United Kingdom", neighbourhoods: ["Kings Cross"] } }, response);
  assert.equal(response.code, 500);
  assert.match(response.payload.error, /OPENAI_API_KEY/);
  if (previous) process.env.OPENAI_API_KEY = previous;
});
