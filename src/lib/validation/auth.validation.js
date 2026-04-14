import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";


export const loginSchema = toTypedSchema(
    z.object({
        email: z.string().min(1, "Email is required").email("Invalid email format"),
        password: z
            .string()
            .min(1, "Password is required")
            .min(8, "Password must be at least 8 characters"),
    }),
);