import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  nid: z
    .string()
    .length(10, "NID must be exactly 10 digits")
    .regex(/^\d{10}$/, "NID must be numeric"),
  email: z.string().email("Enter a valid email"),
  phone: z
    .string()
    .regex(/^01[3-9]\d{8}$/, "Enter a valid Bangladeshi phone number"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  confirmPassword: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  presentAddress: z.string().min(5, "Enter your present address"),
  permanentAddress: z.string().min(5, "Enter your permanent address"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d{6}$/, "OTP must be numeric"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export const resetPasswordSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d{6}$/),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type OtpInput = z.infer<typeof otpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ─── Complaint schemas ────────────────────────────────────────────────────────

const complaintCategorySchema = z.enum(["POLICE", "FIRE", "CITY", "ANIMAL"]);
const complaintUrgencySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const complaintStep1Schema = z.object({
  category: complaintCategorySchema,
  urgency: complaintUrgencySchema,
  title: z.string().min(5, "Title must be at least 5 characters").max(500),
  details: z.string().min(20, "Details must be at least 20 characters").max(5000),
  isPublic: z.boolean().default(true),
});

export const complaintStep2Schema = z.object({
  district: z.string().min(1, "District is required").max(100),
  area: z.string().min(1, "Area is required").max(100),
  locationLat: z.number().min(-90).max(90).optional(),
  locationLng: z.number().min(-180).max(180).optional(),
  locationText: z.string().max(500).optional(),
});

export const complaintStep3Schema = z.object({
  tags: z.array(z.string().max(100)).max(10).default([]),
  photoPublicIds: z.array(z.string()).max(5).default([]),
});

export const complaintSchema = complaintStep1Schema
  .merge(complaintStep2Schema)
  .merge(complaintStep3Schema);

export const statusUpdateSchema = z.object({
  status: z.enum(["UNSOLVED", "IN_PROGRESS", "SOLVED"]),
  note: z.string().max(2000).optional(),
});

export const authorityNoteSchema = z.object({
  note: z.string().min(1, "Note cannot be blank").max(2000),
});

export type ComplaintStep1Input = z.infer<typeof complaintStep1Schema>;
export type ComplaintStep2Input = z.infer<typeof complaintStep2Schema>;
export type ComplaintStep3Input = z.infer<typeof complaintStep3Schema>;
export type ComplaintInput = z.infer<typeof complaintSchema>;
export type StatusUpdateInput = z.infer<typeof statusUpdateSchema>;
export type AuthorityNoteInput = z.infer<typeof authorityNoteSchema>;
