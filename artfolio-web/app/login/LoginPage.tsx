"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuthStore } from "../store/useAuthStore";
import { loginSchema, type LoginFormValues } from "../utils/validationSchemas";

type LoginPageProps = {
  registered?: boolean;
  resetSuccess?: boolean;
  nextPath?: string;
};

function getSafeNextPath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export default function LoginPage({
  registered = false,
  resetSuccess = false,
  nextPath,
}: LoginPageProps) {
  const router = useRouter();
  const { login, isAuthenticated } = useAuthStore();
  const redirectPath = getSafeNextPath(nextPath);
  const signupHref =
    redirectPath === "/dashboard"
      ? "/signup"
      : `/signup?next=${encodeURIComponent(redirectPath)}`;
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace(redirectPath);
  }, [isAuthenticated, redirectPath, router]);

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
      router.replace(redirectPath);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Dang nhap that bai.");
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
            <h1 className="mt-2 text-2xl font-bold">Dang nhap</h1>
          </div>

          {apiError && (
            <div className="mb-4 rounded-lg border border-danger bg-surface p-3 text-sm font-semibold text-danger">
              {apiError}
            </div>
          )}

          {registered && !apiError && (
            <div className="mb-4 rounded-lg border border-border bg-surface-soft p-3 text-sm font-semibold text-foreground">
              Dang ky thanh cong. Vui long dang nhap de tiep tuc.
            </div>
          )}

          {resetSuccess && !apiError && (
            <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm font-semibold text-primary">
              Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.
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
              <div className="flex items-center justify-between">
                <span className="label">Mật khẩu</span>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <input
                id="login-password"
                className={`input${errors.password ? " input-error" : ""}`}
                type="password"
                autoComplete="current-password"
                placeholder="Mat khau"
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
              {isSubmitting ? "Dang dang nhap..." : "Dang nhap"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted">
            Chua co tai khoan?{" "}
            <Link href={signupHref} className="font-bold text-primary">
              Dang ky
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
