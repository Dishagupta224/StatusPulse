const test = require("node:test");
const assert = require("node:assert/strict");

const {
  validateServiceInput,
} = require("../services/serviceValidationService");

test("validateServiceInput accepts a valid https URL", () => {
  const result = validateServiceInput({
    name: "API",
    url: "https://example.com/health",
  });

  assert.equal(result.isValid, true);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.value, {
    name: "API",
    url: "https://example.com/health",
  });
});

test("validateServiceInput rejects unsupported URL protocols", () => {
  const result = validateServiceInput({
    name: "Internal API",
    url: "ftp://example.com/status",
  });

  assert.equal(result.isValid, false);
  assert.deepEqual(result.errors, ["URL protocol must be http or https."]);
});

test("validateServiceInput rejects missing name and invalid URL", () => {
  const result = validateServiceInput({
    name: "   ",
    url: "not-a-url",
  });

  assert.equal(result.isValid, false);
  assert.deepEqual(result.errors, [
    "Name is required.",
    "URL must be a valid absolute http/https URL.",
  ]);
});
