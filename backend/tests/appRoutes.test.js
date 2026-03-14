const test = require("node:test");
const assert = require("node:assert/strict");

const { createApp } = require("../app");
const pool = require("../config/database");
const { startTestServer, stopTestServer } = require("./helpers/testServer");

test("GET /health returns ok when the database is reachable", async () => {
  const originalQuery = pool.query;
  pool.query = async () => ({ rows: [{ ok: 1 }] });

  const { server, baseUrl } = await startTestServer(createApp());

  try {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, { status: "ok" });
  } finally {
    await stopTestServer(server);
    pool.query = originalQuery;
  }
});

test("POST /api/services rejects invalid service input", async () => {
  const { server, baseUrl } = await startTestServer(createApp());

  try {
    const response = await fetch(`${baseUrl}/api/services`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "",
        url: "bad-url",
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error, "Name is required.");
    assert.deepEqual(body.errors, [
      "Name is required.",
      "URL must be a valid absolute http/https URL.",
    ]);
  } finally {
    await stopTestServer(server);
  }
});

test("PUT /api/services/:id rejects an invalid service id", async () => {
  const { server, baseUrl } = await startTestServer(createApp());

  try {
    const response = await fetch(`${baseUrl}/api/services/not-a-number`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Updated API",
        url: "https://example.com/status",
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(body, { error: "Invalid service id" });
  } finally {
    await stopTestServer(server);
  }
});

test("POST /api/services creates a service with normalized input", async () => {
  const originalQuery = pool.query;
  let capturedValues = null;

  pool.query = async (_queryText, values) => {
    capturedValues = values;
    return {
      rowCount: 1,
      rows: [
        {
          id: 1,
          name: values[0],
          url: values[1],
          is_active: true,
        },
      ],
    };
  };

  const { server, baseUrl } = await startTestServer(createApp());

  try {
    const response = await fetch(`${baseUrl}/api/services`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: " Example API ",
        url: " https://example.com/health ",
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.deepEqual(capturedValues, ["Example API", "https://example.com/health"]);
    assert.deepEqual(body.data, {
      id: 1,
      name: "Example API",
      url: "https://example.com/health",
      is_active: true,
    });
  } finally {
    await stopTestServer(server);
    pool.query = originalQuery;
  }
});
