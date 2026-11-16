// SPDX-License-Identifier: MIT
import type {
  FitModel,
  LadderBand,
  LadderLensInput,
  LadderMode,
  LadderSide,
  SampleBand,
  Unit,
} from "./schemas.js";

export type {
  FitModel,
  LadderBand,
  LadderLensInput,
  LadderMode,
  LadderSide,
  SampleBand,
  Unit,
};

export type RunStatus = "queued" | "running" | "completed" | "failed" | (string & {});

export interface RunOptions {
  idempotency_key?: string;
  label?: string;
  [key: string]: unknown;
}

export interface RunResult<T = LadderLensResult> {
  run_id: string;
  status: RunStatus;
  result?: T;
  error?: string | { message?: string; code?: string; details?: unknown } | null;
  result_url?: string;
  permalink?: string;
  duration_ms?: number;
}

export interface ManifestExample {
  name: string;
  description?: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export interface ToolManifest {
  schema_version: string;
  tool_id: string;
  title: string;
  description?: string;
  tags?: string[];
  category?: string;
  execution_mode?: string;
  estimated_runtime_sec?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  agent_notes?: string;
  example_prompts?: string[];
  examples?: ManifestExample[];
  limits?: Record<string, unknown>;
  input_schema?: Record<string, unknown>;
}

export interface ExampleMeta {
  name: string;
  description?: string;
}

export interface FitResult {
  model: string;
  effective_model?: string;
  r_squared?: number;
  r_squared_grade?: string;
  params?: {
    model?: string;
    slope?: number;
    intercept?: number;
    coefficients?: number[];
    [key: string]: unknown;
  };
  ladder_rf_range?: [number, number];
  [key: string]: unknown;
}

export interface LadderPoint {
  label: string;
  rf: number;
  log10_mw: number;
  known_size: number;
  side?: "left" | "right";
  [key: string]: unknown;
}

export interface SamplePoint {
  label: string;
  estimated_size?: number;
  estimated_size_display?: string;
  rf: number;
  status?: string;
  log10_mw?: number;
  warning?: string;
  [key: string]: unknown;
}

export interface LadderLensWarningObject {
  code?: string;
  message: string;
  severity?: string;
  [key: string]: unknown;
}

export type LadderLensWarning = string | LadderLensWarningObject;

export interface LadderLensResult {
  fit?: FitResult | null;
  ladder_points?: LadderPoint[];
  samples?: SamplePoint[];
  warnings?: LadderLensWarning[];
  methods_text?: string;
  sample_count?: number;
  [key: string]: unknown;
}

export class PepkioAPIError extends Error {
  readonly status: number;
  readonly body?: unknown;
  readonly runId?: string;
  readonly code?: string;

  constructor(
    message: string,
    opts: { status: number; body?: unknown; runId?: string; code?: string },
  ) {
    super(message);
    this.name = "PepkioAPIError";
    this.status = opts.status;
    this.body = opts.body;
    this.runId = opts.runId;
    this.code = opts.code;
  }
}
