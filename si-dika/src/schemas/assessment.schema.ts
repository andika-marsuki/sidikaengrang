import { z } from "zod";

const RubricScore = z
  .number()
  .int()
  .min(1, "Skor minimal 1")
  .max(4, "Skor maksimal 4");

export const AssessmentCreateSchema = z.object({
  localId:         z.string().min(1, "localId wajib diisi"),
  studentId:       z.string().min(1),
  teacherId:       z.string().min(1),
  egrangSpecId:    z.string().min(1),
  testType:        z.enum(["PRE_TEST", "POST_TEST", "PRACTICE"]),
  // Antropometri
  heightCm:        z.number().positive().max(250),
  weightKg:        z.number().positive().max(200),
  // Data lapangan
  trackDistanceM:  z.number().positive().default(10),
  durationSeconds: z.number().positive(),
  fallCount:       z.number().int().min(0).default(0),
  stepCount:       z.number().int().min(0).optional(),
  // Rubrik
  scoreStatic:     RubricScore,
  scoreDynamic:    RubricScore,
  scoreCoord:      RubricScore,
  scorePosture:    RubricScore,
  // Timestamp dari device
  assessedAt:      z.string().datetime().optional(),
});

export const AssessmentSyncSchema = z.object({
  items: z.array(AssessmentCreateSchema).min(1).max(100),
});

export type AssessmentCreateInput = z.infer<typeof AssessmentCreateSchema>;
export type AssessmentSyncInput   = z.infer<typeof AssessmentSyncSchema>;
