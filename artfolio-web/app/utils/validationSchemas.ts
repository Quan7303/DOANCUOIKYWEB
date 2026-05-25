import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Vui lòng nhập email")
    .email("Email không đúng định dạng"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

export const signupSchema = z.object({
  name: z
    .string()
    .min(2, "Họ tên phải có ít nhất 2 ký tự")
    .max(60, "Họ tên tối đa 60 ký tự"),
  email: z
    .string()
    .min(1, "Vui lòng nhập email")
    .email("Email không đúng định dạng"),
  password: z
    .string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .regex(/[A-Za-z]/, "Mật khẩu cần có ít nhất 1 chữ cái")
    .regex(/[0-9]/, "Mật khẩu cần có ít nhất 1 chữ số"),
});

export const profileActionSchema = z.object({
  userId: z.string().min(1, "Thiếu userId"),
  name: z
    .string()
    .min(2, "Tên phải có ít nhất 2 ký tự")
    .max(60, "Tên tối đa 60 ký tự"),
  skills: z.string(),
  experience: z.string(),
  socialLinks: z.string(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
export type ProfileActionValues = z.infer<typeof profileActionSchema>;
