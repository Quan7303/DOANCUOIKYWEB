"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuthStore } from "../store/useAuthStore";
import { signupSchema, type SignupFormValues } from "../utils/validationSchemas";

type SignupPageProps = {
  nextPath?: string;
};

function getSafeNextPath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export default function SignupPage({ nextPath }: SignupPageProps) {
  const router = useRouter();
  const { signup, isAuthenticated } = useAuthStore();
  const redirectPath = getSafeNextPath(nextPath);
  const loginHref =
    redirectPath === "/dashboard"
      ? "/login"
      : `/login?next=${encodeURIComponent(redirectPath)}`;
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Nếu đã đăng nhập, chuyển về dashboard
  useEffect(() => {
    if (isAuthenticated) router.replace(redirectPath);
  }, [isAuthenticated, redirectPath, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur",
  });

  const onSubmit = async (values: SignupFormValues) => {
    setIsSubmitting(true);
    setApiError("");
    try {
      await signup({ name: values.name, email: values.email, password: values.password });
      router.replace(`/login?registered=1&next=${encodeURIComponent(redirectPath)}`);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Tạo tài khoản thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-10">
      <div className="app-container grid min-h-[calc(100dvh-210px)] place-items-center">
        <div className="surface w-full max-w-lg rounded-lg p-5 sm:p-7">
          <div className="mb-6">
            <p className="text-sm font-bold uppercase text-primary">Artfolio</p>
            <h1 className="mt-2 text-2xl font-bold">Đăng ký</h1>
            <p className="mt-2 text-sm text-muted">
              Tạo tài khoản để upload và quản lý portfolio của bạn.
            </p>
          </div>

          {apiError && (
            <div className="mb-4 rounded-lg border border-danger bg-surface p-3 text-sm font-semibold text-danger">
              {apiError}
            </div>
          )}

          <form className="grid gap-4" noValidate onSubmit={handleSubmit(onSubmit)}>
            <label className="field">
              <span className="label">Họ tên</span>
              <input
                id="signup-name"
                className={`input${errors.name ? " input-error" : ""}`}
                autoComplete="name"
                placeholder="Nguyen Van A"
                {...register("name")}
              />
              {errors.name && <span className="error-text">{errors.name.message}</span>}
            </label>

            <label className="field">
              <span className="label">Email</span>
              <input
                id="signup-email"
                className={`input${errors.email ? " input-error" : ""}`}
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                {...register("email")}
              />
              {errors.email && <span className="error-text">{errors.email.message}</span>}
            </label>

            <label className="field">
              <span className="label">Mật khẩu</span>
              <input
                id="signup-password"
                className={`input${errors.password ? " input-error" : ""}`}
                type="password"
                autoComplete="new-password"
                placeholder="Ít nhất 8 ký tự, có chữ và số"
                {...register("password")}
              />
              {errors.password && <span className="error-text">{errors.password.message}</span>}
              <span className="text-xs text-muted">
                Mật khẩu cần ít nhất 8 ký tự, có chữ cái và chữ số.
              </span>
            </label>

            <button
              id="signup-submit"
              type="submit"
              className="btn btn-primary mt-2 w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang tạo tài khoản..." : "Đăng ký"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted">
            Đã có tài khoản?{" "}
            <Link href={loginHref} className="font-bold text-primary">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
