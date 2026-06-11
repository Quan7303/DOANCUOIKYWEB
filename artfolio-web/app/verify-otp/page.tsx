"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useAuthStore } from "../store/useAuthStore";
import { getApiUrl } from "../utils/apiConfig";

const otpSchema = z.object({
  otp: z
    .string()
    .regex(/^\d{6}$/, "Mã OTP phải gồm đúng 6 chữ số"),
});

type OtpFormValues = z.infer<typeof otpSchema>;

function getSafeNextPath(value?: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

async function requestResetOtpCheck(email: string, otp: string) {
  const res = await fetch(getApiUrl("auth/verify-otp"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || "Mã OTP không chính xác hoặc đã hết hạn.");
  }
}

async function resendResetOtp(email: string) {
  const res = await fetch(getApiUrl("auth/forgot-password"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || "Không thể gửi lại mã OTP.");
  }

  return data?.message as string | undefined;
}

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const mode = searchParams.get("mode") === "reset" ? "reset" : "signup";
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const { verifySignupOtp, resendSignupOtp } = useAuthStore();

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
    mode: "onBlur",
  });

  const onSubmit = async (values: OtpFormValues) => {
    setIsSubmitting(true);
    setApiError("");
    setSuccessMessage("");

    try {
      if (mode === "reset") {
        await requestResetOtpCheck(email, values.otp);
        router.push(
          `/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(values.otp)}`,
        );
        return;
      }

      await verifySignupOtp({ email, otp: values.otp });
      router.replace(nextPath);
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
      const message =
        mode === "reset"
          ? await resendResetOtp(email)
          : await resendSignupOtp(email);

      setSuccessMessage(message || "Đã gửi lại mã OTP vào email của bạn.");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    } finally {
      setIsResending(false);
    }
  };

  const title =
    mode === "reset" ? "Xác thực khôi phục mật khẩu" : "Xác thực đăng ký";

  return (
    <div className="surface w-full max-w-md rounded-lg p-5 sm:p-7">
      <div className="mb-6">
        <p className="text-sm font-bold uppercase text-primary">Artfolio</p>
        <h1 className="mt-2 text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-muted">
          Nhập mã OTP 6 số đã được gửi đến{" "}
          <span className="font-semibold text-foreground">
            {email || "email của bạn"}
          </span>
          .
        </p>
      </div>

      {!email && (
        <div className="mb-4 rounded-lg border border-danger bg-surface p-3 text-sm font-semibold text-danger">
          Thiếu email xác thực. Vui lòng quay lại trang đăng ký.
        </div>
      )}

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
            className={`input text-center font-mono text-lg tracking-[0.4em]${
              errors.otp ? " input-error" : ""
            }`}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
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

      <div className="mt-5 flex items-center justify-between gap-3 text-sm text-muted">
        <button
          type="button"
          onClick={handleResendOtp}
          disabled={isResending || !email}
          className="font-bold text-primary hover:underline disabled:text-muted disabled:no-underline"
        >
          {isResending ? "Đang gửi..." : "Gửi lại OTP"}
        </button>
        <Link href={mode === "reset" ? "/forgot-password" : "/signup"} className="font-bold text-primary">
          Quay lại
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
