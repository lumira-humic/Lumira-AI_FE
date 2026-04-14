import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";


const ACCEPTED_IMAGE_MIME_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
];

export const addPatientSchema = toTypedSchema(
    z.object({
        name: z.string().min(1, "Name is required"),
        phone: z.string().min(1, "Phone number is required").min(10, "Phone number must be at least 10 digits"),
        address: z.string().min(1, "Address is required"),
        image: z
            .any()
            .refine((files) => {
                return files?.[0]?.size <= 5 * 1024 * 1024;
            }, `Max image size is 5MB.`)
            .refine(
                (files) => ACCEPTED_IMAGE_MIME_TYPES.includes(files?.[0]?.type),
                "Only .jpg, .jpeg, .png and .webp formats are supported."
            ),
        review: z.string().min(1, "Review is required"),
        email: z.string().min(1, "Email is required").email("Invalid email format"),
    })
);