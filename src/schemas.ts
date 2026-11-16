// SPDX-License-Identifier: MIT
import { z } from "zod";

export const unitSchema = z.enum(["bp", "kb", "kDa"]);
export type Unit = z.infer<typeof unitSchema>;

export const fitModelSchema = z.enum(["semi_log_linear", "log_polynomial"]);
export type FitModel = z.infer<typeof fitModelSchema>;

export const ladderModeSchema = z.enum(["single", "dual"]);
export type LadderMode = z.infer<typeof ladderModeSchema>;

export const ladderSideSchema = z.enum(["left", "right"]);
export type LadderSide = z.infer<typeof ladderSideSchema>;

export const ladderBandSchema = z.object({
  label: z.string(),
  known_size: z.number(),
  migration_y: z.number(),
  x: z.number().optional(),
  side: ladderSideSchema.optional(),
});
export type LadderBand = z.infer<typeof ladderBandSchema>;

export const sampleBandSchema = z.object({
  label: z.string(),
  migration_y: z.number(),
  x: z.number().optional(),
});
export type SampleBand = z.infer<typeof sampleBandSchema>;

export const ladderLensInputSchema = z.object({
  unit: unitSchema,
  fit_model: fitModelSchema,
  ladder_mode: ladderModeSchema,
  y_well: z.number().describe("Well origin line position (pixels or mm)"),
  y_front: z.number().describe("Dye front position (pixels or mm)"),
  ladder_name: z.string().optional(),
  ladder_bands: z.array(ladderBandSchema).min(1, "At least one ladder band required"),
  sample_bands: z.array(sampleBandSchema).optional().default([]),
});
export type LadderLensInput = z.infer<typeof ladderLensInputSchema>;

export function parseRunInput(input: unknown): LadderLensInput {
  return ladderLensInputSchema.parse(input);
}
