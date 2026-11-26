import { z } from "zod";

export const EgrangSpecCreateSchema = z.object({
  name: z
    .string()
    .min(3, "Nama minimal 3 karakter")
    .max(100, "Nama maksimal 100 karakter"),
  stepHeightCm: z
    .number()
    .int()
    .min(10, "Tinggi pijakan minimal 10 cm")
    .max(80, "Tinggi pijakan maksimal 80 cm"),
  poleLengthCm: z
    .number()
    .int()
    .min(80, "Panjang tongkat minimal 80 cm")
    .max(250, "Panjang tongkat maksimal 250 cm"),
  material: z
    .string()
    .min(2, "Material wajib diisi")
    .max(50),
});

export type EgrangSpecCreateInput = z.infer<typeof EgrangSpecCreateSchema>;
