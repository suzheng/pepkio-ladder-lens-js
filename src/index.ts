// SPDX-License-Identifier: MIT

export {
  DEFAULT_API_BASE_URL,
  TOOL_ID,
  apiPath,
  isLocalUrl,
  resolveApiKey,
  resolveBaseUrl,
} from "./config.js";

export {
  fitModelSchema,
  ladderBandSchema,
  ladderLensInputSchema,
  ladderModeSchema,
  ladderSideSchema,
  parseRunInput,
  sampleBandSchema,
  unitSchema,
  type FitModel,
  type LadderBand,
  type LadderLensInput,
  type LadderMode,
  type LadderSide,
  type SampleBand,
  type Unit,
} from "./schemas.js";

export {
  PepkioAPIError,
  type ExampleMeta,
  type FitResult,
  type LadderLensResult,
  type LadderLensWarning,
  type LadderLensWarningObject,
  type LadderPoint,
  type ManifestExample,
  type RunOptions,
  type RunResult,
  type RunStatus,
  type SamplePoint,
  type ToolManifest,
} from "./types.js";

export {
  PepkioClient,
  type PepkioClientOptions,
} from "./client.js";

import { PepkioClient } from "./client.js";
export default PepkioClient;
