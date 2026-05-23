"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuthStore } from "../store/useAuthStore";
import { loginSchema, type LoginFormValues } from "../utils/validationSchemas";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuthStore();
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Nếu đã đăng nhập, chuyển về dashboard
  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    setApiError("");
    try {
      await login(values.email, values.password);
      router.replace("/dashboard");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Đăng nhập thất bại.");
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
            <h1 className="mt-2 text-2xl font-bold">Đăng nhập</h1>
            <p className="mt-2 text-sm text-muted">
              Dùng tài khoản demo:{" "}
              <span className="font-semibold text-foreground">minhanh@artfolio.vn</span> /{" "}
              <span className="font-semibold text-foreground">Demo123</span>
            </p>
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
                id="login-email"
                className={`input${errors.email ? " input-error" : ""}`}
                type="email"
                autoComplete="email"
                placeholder="name@artfolio.vn"
                {...register("email")}
              />
              {errors.email && <span className="error-text">{errors.email.message}</span>}
            </label>

            <label className="field">
              <span className="label">Mật khẩu</span>
              <input
                id="login-password"
                className={`input${errors.password ? " input-error" : ""}`}
                type="password"
                autoComplete="current-password"
                placeholder="Mật khẩu"
                {...register("password")}
              />
              {errors.password && <span className="error-text">{errors.password.message}</span>}
            </label>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary mt-2 w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted">
            Chưa có tài khoản?{" "}
            <Link href="/signup" className="font-bold text-primary">
              Đăng ký
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
