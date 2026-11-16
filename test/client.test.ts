// SPDX-License-Identifier: MIT
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PepkioClient } from "../src/client.js";
import { DEFAULT_API_BASE_URL, TOOL_ID, isLocalUrl, resolveApiKey, resolveBaseUrl } from "../src/config.js";
import { PepkioAPIError } from "../src/types.js";

const mockManifest = {
  schema_version: "1.0",
  tool_id: TOOL_ID,
  title: "Ladder Lens",
  description: "Gel electrophoresis band size estimator",
  examples: [
    {
      name: "neb_1kb_single_ladder",
      input: {
        unit: "bp",
        fit_model: "semi_log_linear",
        ladder_mode: "single",
        ladder_name: "NEB 1 kb DNA Ladder",
        y_well: 40,
        y_front: 400,
        ladder_bands: [
          { label: "L1", known_size: 10000, migration_y: 95 },
          { label: "L2", known_size: 3000, migration_y: 145 },
          { label: "L3", known_size: 1000, migration_y: 210 },
          { label: "L4", known_size: 500, migration_y: 255 },
          { label: "L5", known_size: 200, migration_y: 310 },
          { label: "L6", known_size: 100, migration_y: 345 },
        ],
        sample_bands: [
          { label: "S1", migration_y: 228 },
          { label: "S2", migration_y: 292 },
        ],
      },
      output: { sample_count: 2 },
    },
  ],
};

const mockRunResponse = {
  run_id: "test-run-123",
  status: "completed",
  result: {
    fit: {
      model: "semi_log_linear",
      effective_model: "semi_log_linear",
      r_squared: 0.995,
      r_squared_grade: "green",
      params: { slope: -2.78, intercept: 4.35 },
      ladder_rf_range: [0.15, 0.85],
    },
    ladder_points: [
      { label: "L1", rf: 0.15, log10_mw: 4, known_size: 10000 },
    ],
    samples: [
      { label: "S1", estimated_size: 799, estimated_size_display: "799 bp", rf: 0.52, status: "ok" },
    ],
    warnings: [],
    methods_text: "Band sizes were estimated by semi-log linear regression.",
  },
  error: null,
  result_url: "https://tools.pepkio.com/api/tools/v1/runs/test-run-123",
  permalink: "https://tools.pepkio.com/r/test-run-123",
};

describe("config helpers", () => {
  it("resolves default baseUrl when none provided", () => {
    delete process.env.PEPKIO_API_BASE_URL;
    expect(resolveBaseUrl()).toBe(DEFAULT_API_BASE_URL);
  });

  it("resolves custom baseUrl override", () => {
    expect(resolveBaseUrl("https://custom.pepkio.com/")).toBe("https://custom.pepkio.com");
  });

  it("resolves baseUrl from PEPKIO_API_BASE_URL env var", () => {
    process.env.PEPKIO_API_BASE_URL = "https://env.pepkio.com/";
    expect(resolveBaseUrl()).toBe("https://env.pepkio.com");
    delete process.env.PEPKIO_API_BASE_URL;
  });

  it("identifies local test URLs", () => {
    expect(isLocalUrl("https://tools.localtest.me")).toBe(true);
    expect(isLocalUrl("http://localhost:8000")).toBe(true);
    expect(isLocalUrl("http://127.0.0.1:3000")).toBe(true);
    expect(isLocalUrl("https://tools.pepkio.com")).toBe(false);
  });

  it("resolves API key preferring LOCAL_PEPKIO_API_KEY on local hosts", () => {
    process.env.LOCAL_PEPKIO_API_KEY = "local-key";
    process.env.PEPKIO_API_KEY = "prod-key";

    expect(resolveApiKey("https://tools.localtest.me")).toBe("local-key");
    expect(resolveApiKey("https://tools.pepkio.com")).toBe("prod-key");

    delete process.env.LOCAL_PEPKIO_API_KEY;
    delete process.env.PEPKIO_API_KEY;
  });
});

describe("PepkioClient", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("fetches manifest and caches it", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockManifest),
    });
    globalThis.fetch = fetchMock;

    const client = new PepkioClient();
    const manifest = await client.getManifest();

    expect(manifest.tool_id).toBe(TOOL_ID);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(
      `${DEFAULT_API_BASE_URL}/api/tools/v1/tools/${TOOL_ID}/manifest`,
    );

    // Second call should use cache
    const cached = await client.getManifest();
    expect(cached.tool_id).toBe(TOOL_ID);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Refresh option should bypass cache
    await client.getManifest({ refresh: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("lists examples and retrieves example input", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockManifest),
    });

    const client = new PepkioClient();
    const examples = await client.getExamples();
    expect(examples).toHaveLength(1);
    expect(examples[0].name).toBe("neb_1kb_single_ladder");

    const input = await client.getExampleInput("neb_1kb_single_ladder");
    expect(input.unit).toBe("bp");
    expect(input.fit_model).toBe("semi_log_linear");
    expect(input.ladder_bands).toHaveLength(6);

    await expect(client.getExampleInput("non_existent")).rejects.toThrow(
      /Example "non_existent" not found/,
    );
  });

  it("requires API key for run()", async () => {
    const client = new PepkioClient({ apiKey: "" });
    const input = mockManifest.examples[0].input as any;

    await expect(client.run(input)).rejects.toThrow(PepkioAPIError);
    await expect(client.run(input)).rejects.toMatchObject({
      status: 401,
      message: expect.stringContaining("API key required"),
    });
  });

  it("executes tool run successfully", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockRunResponse),
    });
    globalThis.fetch = fetchMock;

    const client = new PepkioClient({ apiKey: "test-token" });
    const input = mockManifest.examples[0].input as any;
    const res = await client.run(input, { label: "test-run" });

    expect(res.status).toBe("completed");
    expect(res.run_id).toBe("test-run-123");
    expect(res.result?.samples?.[0].estimated_size).toBe(799);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, req] = fetchMock.mock.calls[0];
    expect(url).toBe(`${DEFAULT_API_BASE_URL}/api/tools/v1/tools/${TOOL_ID}/run`);
    expect(req.headers.Authorization).toBe("Bearer test-token");
    expect(JSON.parse(req.body)).toEqual({
      input,
      options: { label: "test-run" },
    });
  });

  it("validates input and throws on invalid schema", async () => {
    const client = new PepkioClient({ apiKey: "test-token" });
    const invalidInput: any = {
      unit: "invalid_unit",
      fit_model: "semi_log_linear",
    };

    await expect(client.run(invalidInput)).rejects.toThrow();
  });

  it("throws PepkioAPIError on HTTP error response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: async () =>
        JSON.stringify({
          error: { message: "Invalid parameters", code: "VALIDATION_FAILED" },
        }),
    });

    const client = new PepkioClient({ apiKey: "test-token" });
    const input = mockManifest.examples[0].input as any;

    await expect(client.run(input)).rejects.toMatchObject({
      name: "PepkioAPIError",
      status: 400,
      message: "Invalid parameters",
      code: "VALIDATION_FAILED",
    });
  });

  it("throws PepkioAPIError when run result contains error field", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          run_id: "err-run",
          status: "failed",
          error: { message: "Calculation failed" },
        }),
    });

    const client = new PepkioClient({ apiKey: "test-token" });
    const input = mockManifest.examples[0].input as any;

    await expect(client.run(input)).rejects.toMatchObject({
      name: "PepkioAPIError",
      message: "Calculation failed",
      runId: "err-run",
    });
  });

  it("retrieves run via getRun()", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockRunResponse),
    });
    globalThis.fetch = fetchMock;

    const client = new PepkioClient({ apiKey: "test-token" });
    const res = await client.getRun("test-run-123");

    expect(res.run_id).toBe("test-run-123");
    expect(fetchMock.mock.calls[0][0]).toBe(
      `${DEFAULT_API_BASE_URL}/api/tools/v1/runs/test-run-123`,
    );
  });

  it("polls run until completion via waitForRun()", async () => {
    const queuedResponse = {
      run_id: "test-async-123",
      status: "running",
    };
    const completedResponse = {
      run_id: "test-async-123",
      status: "completed",
      result: mockRunResponse.result,
    };

    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      const payload = callCount === 1 ? queuedResponse : completedResponse;
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify(payload),
      };
    });

    const client = new PepkioClient({ apiKey: "test-token" });
    const res = await client.waitForRun("test-async-123", {
      intervalMs: 10,
      timeoutMs: 1000,
    });

    expect(res.status).toBe("completed");
    expect(callCount).toBe(2);
  });

  it("waitForRun() throws timeout error if exceeded", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ run_id: "stuck", status: "running" }),
    });

    const client = new PepkioClient({ apiKey: "test-token" });
    await expect(
      client.waitForRun("stuck", { intervalMs: 10, timeoutMs: 50 }),
    ).rejects.toMatchObject({
      status: 408,
      message: expect.stringContaining("Timed out"),
    });
  });
});
