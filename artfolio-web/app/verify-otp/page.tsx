"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getApiUrl } from "../utils/apiConfig";

const otpSchema = z.object({
  otp: z.string().length(6, "Mã OTP phải có đúng 6 ký tự"),
});

type OtpFormValues = z.infer<typeof otpSchema>;

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
  });

  const onSubmit = async (values: OtpFormValues) => {
    setIsSubmitting(true);
    setApiError("");
    setSuccessMessage("");

    try {
      const res = await fetch(getApiUrl("auth/verify-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: values.otp }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "Mã OTP không chính xác hoặc đã hết hạn.");
      }

      // Chuyển hướng sang trang đặt lại mật khẩu kèm email và otp
      router.push(
        `/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(values.otp)}`
      );
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) return;
    setIsResending(true);
    setApiError("");
    setSuccessMessage("");

    try {
      const res = await fetch(getApiUrl("auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "Không thể gửi lại mã OTP.");
      }

      setSuccessMessage("Đã gửi lại mã OTP mới vào email của bạn.");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="surface w-full max-w-md rounded-lg p-5 sm:p-7">
      <div className="mb-6">
        <p className="text-sm font-bold uppercase text-primary">Artfolio</p>
        <h1 className="mt-2 text-2xl font-bold">Xác thực OTP</h1>
        <p className="mt-1 text-sm text-muted">
          Nhập mã OTP gồm 6 chữ số đã được gửi đến <span className="font-semibold text-foreground">{email}</span>.
        </p>
      </div>

      {apiError && (
        <div className="mb-4 rounded-lg border border-danger bg-surface p-3 text-sm font-semibold text-danger">
          {apiError}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm font-semibold text-primary">
          {successMessage}
        </div>
      )}

      <form className="grid gap-4" noValidate onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span className="label">Mã OTP</span>
          <input
            id="otp-code"
            className={`input text-center text-lg tracking-[0.5em] font-mono${
              errors.otp ? " input-error" : ""
            }`}
            type="text"
            maxLength={6}
            placeholder="000000"
            {...register("otp")}
          />
          {errors.otp && <span className="error-text">{errors.otp.message}</span>}
        </label>

        <button
          id="otp-submit"
          type="submit"
          className="btn btn-primary mt-2 w-full"
          disabled={isSubmitting || !email}
        >
          {isSubmitting ? "Đang xác thực..." : "Xác nhận"}
        </button>
      </form>

      <div className="mt-5 flex items-center justify-between text-sm text-muted">
        <button
          type="button"
          onClick={handleResendOtp}
          disabled={isResending || !email}
          className="font-bold text-primary hover:underline disabled:text-muted disabled:no-underline"
        >
          {isResending ? "Đang gửi..." : "Gửi lại OTP"}
        </button>
        <Link href="/login" className="font-bold text-primary">
          Quay lại Đăng nhập
        </Link>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <section className="py-10">
      <div className="app-container grid min-h-[calc(100dvh-210px)] place-items-center">
        <Suspense fallback={<div>Đang tải thông tin...</div>}>
          <VerifyOtpContent />
        </Suspense>
      </div>
    </section>
  );
}
