import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Vui long nhap email")
    .email("Email khong dung dinh dang"),
  password: z.string().min(6, "Mat khau phai co it nhat 6 ky tu"),
});

export const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, "Ho ten phai co it nhat 2 ky tu")
      .max(60, "Ho ten toi da 60 ky tu"),
    email: z
      .string()
      .min(1, "Vui long nhap email")
      .email("Email khong dung dinh dang"),
    password: z
      .string()
      .min(8, "Mat khau phai co it nhat 8 ky tu")
      .regex(/[A-Za-z]/, "Mat khau can co it nhat 1 chu cai")
      .regex(/[0-9]/, "Mat khau can co it nhat 1 chu so"),
    confirmPassword: z.string().min(1, "Vui long nhap lai mat khau"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Mat khau nhap lai khong khop",
    path: ["confirmPassword"],
  });

export const profileActionSchema = z.object({
  userId: z.string().min(1, "Thieu userId"),
  name: z
    .string()
    .min(2, "Ten phai co it nhat 2 ky tu")
    .max(60, "Ten toi da 60 ky tu"),
  portfolioDescription: z.string().max(500, "Gioi thieu toi da 500 ky tu"),
  skills: z.string(),
  experience: z.string(),
  socialLinks: z.string(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
export type ProfileActionValues = z.infer<typeof profileActionSchema>;
