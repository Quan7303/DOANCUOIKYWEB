"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getApiUrl } from "../utils/apiConfig";

const forgotSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (values: ForgotFormValues) => {
    setIsSubmitting(true);
    setApiError("");

    try {
      const res = await fetch(getApiUrl("auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "Không thể gửi yêu cầu khôi phục mật khẩu.");
      }

      // Chuyển hướng sang trang xác nhận OTP kèm query parameter email
      router.push(`/verify-otp?email=${encodeURIComponent(values.email)}`);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-10">
      <div className="app-container grid min-h-[calc(100dvh-210px)] place-items-center">
        <div className="surface w-full max-w-md rounded-lg p-5 sm:p-7">
          <div className="mb-6">
            <p className="text-sm font-bold uppercase text-primary">Artfolio</p>
            <h1 className="mt-2 text-2xl font-bold">Quên mật khẩu</h1>
            <p className="mt-1 text-sm text-muted">Nhập email của bạn để nhận mã xác thực OTP.</p>
          </div>

          {apiError && (
            <div className="mb-4 rounded-lg border border-danger bg-surface p-3 text-sm font-semibold text-danger">
              {apiError}
            </div>
          )}

          <form className="grid gap-4" noValidate onSubmit={handleSubmit(onSubmit)}>
            <label className="field">
              <span className="label">Email</span>
              <input
                id="forgot-email"
                className={`input${errors.email ? " input-error" : ""}`}
                type="email"
                placeholder="name@artfolio.vn"
                {...register("email")}
              />
              {errors.email && <span className="error-text">{errors.email.message}</span>}
            </label>

            <button
              id="forgot-submit"
              type="submit"
              className="btn btn-primary mt-2 w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang gửi OTP..." : "Gửi mã xác thực"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted">
            Quay lại{" "}
            <Link href="/login" className="font-bold text-primary">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
