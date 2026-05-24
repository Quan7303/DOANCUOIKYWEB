"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getApiUrl } from "../utils/apiConfig";

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
    confirmPassword: z.string().min(6, "Vui lòng nhập lại mật khẩu mới"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không trùng khớp",
    path: ["confirmPassword"],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const otp = searchParams.get("otp") || "";

  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (values: ResetPasswordValues) => {
    if (!email || !otp) {
      setApiError("Thiếu thông tin xác thực email hoặc mã OTP.");
      return;
    }

    setIsSubmitting(true);
    setApiError("");

    try {
      const res = await fetch(getApiUrl("auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp,
          newPassword: values.newPassword,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "Không thể đặt lại mật khẩu. Vui lòng thử lại.");
      }

      // Đặt lại mật khẩu thành công, chuyển hướng đến trang đăng nhập
      router.push("/login?resetSuccess=true");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="surface w-full max-w-md rounded-lg p-5 sm:p-7">
      <div className="mb-6">
        <p className="text-sm font-bold uppercase text-primary">Artfolio</p>
        <h1 className="mt-2 text-2xl font-bold">Đặt lại mật khẩu</h1>
        <p className="mt-1 text-sm text-muted">Nhập mật khẩu mới của bạn bên dưới.</p>
      </div>

      {apiError && (
        <div className="mb-4 rounded-lg border border-danger bg-surface p-3 text-sm font-semibold text-danger">
          {apiError}
        </div>
      )}

      <form className="grid gap-4" noValidate onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span className="label">Mật khẩu mới</span>
          <input
            id="reset-new-password"
            className={`input${errors.newPassword ? " input-error" : ""}`}
            type="password"
            placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
            {...register("newPassword")}
          />
          {errors.newPassword && <span className="error-text">{errors.newPassword.message}</span>}
        </label>

        <label className="field">
          <span className="label">Xác nhận mật khẩu mới</span>
          <input
            id="reset-confirm-password"
            className={`input${errors.confirmPassword ? " input-error" : ""}`}
            type="password"
            placeholder="Xác nhận mật khẩu mới"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <span className="error-text">{errors.confirmPassword.message}</span>
          )}
        </label>

        <button
          id="reset-submit"
          type="submit"
          className="btn btn-primary mt-2 w-full"
          disabled={isSubmitting || !email || !otp}
        >
          {isSubmitting ? "Đang xử lý..." : "Đặt lại mật khẩu"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Quay lại{" "}
        <Link href="/login" className="font-bold text-primary">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
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

// Fallback component while loading verify page query strings
function VerifyOtpContent() {
  return <ResetPasswordContent />;
}
