"use client";

// Next.js 14+ sử dụng useFormState và useFormStatus cho Server Actions
import { useFormState, useFormStatus } from "react-dom";
import { submitFeedbackAction } from "../actions/contact";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-primary h-12 w-full mt-4 flex items-center justify-center gap-2"
    >
      {pending ? (
        <span className="animate-pulse">Đang gửi...</span>
      ) : (
        <>
          <Send className="h-4 w-4" /> Gửi Góp Ý
        </>
      )}
    </button>
  );
}

const initialState = {
  success: false,
  message: "",
  error: "",
};

export default function ContactPage() {
  const [state, formAction] = useFormState(submitFeedbackAction, initialState);

  return (
    <main className="min-h-screen bg-background py-16">
      <div className="app-container max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold mb-4">Liên Hệ & Góp Ý</h1>
          <p className="text-muted">
            Đây là biểu mẫu demo sử dụng <strong className="text-primary">Next.js Server Actions</strong>.
            Dữ liệu sẽ được xử lý thuần túy trên Server mà không cần viết API Route riêng.
          </p>
        </div>

        <div className="surface p-8 rounded-2xl shadow-xl border border-border/50">
          {state?.success && (
            <div className="mb-8 flex flex-col items-center justify-center rounded-xl bg-success/10 p-6 text-success border border-success/20">
              <CheckCircle2 className="h-12 w-12 mb-3" />
              <p className="font-bold text-lg text-center">{state.message}</p>
              <Link href="/" className="btn btn-outline mt-4 h-10 px-6">
                Về Trang Chủ
              </Link>
            </div>
          )}

          {!state?.success && (
            <form action={formAction} className="flex flex-col gap-5">
              {state?.error && (
                <div className="flex items-center gap-2 rounded-lg bg-danger/10 p-4 text-sm font-semibold text-danger border border-danger/20">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>{state.error}</p>
                </div>
              )}

              <label className="field">
                <span className="label">Họ và Tên</span>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Nhập tên của bạn"
                  className="input"
                />
              </label>

              <label className="field">
                <span className="label">Email liên hệ</span>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="name@example.com"
                  className="input"
                />
              </label>

              <label className="field">
                <span className="label">Nội dung góp ý</span>
                <textarea
                  name="message"
                  required
                  rows={5}
                  placeholder="Bạn muốn nói gì với chúng tôi?"
                  className="input py-3"
                ></textarea>
              </label>

              <SubmitButton />
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
