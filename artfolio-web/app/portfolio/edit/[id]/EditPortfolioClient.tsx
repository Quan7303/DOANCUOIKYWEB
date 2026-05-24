"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowLeft, Save, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "../../../store/useAuthStore";
import { api } from "../../../utils/api";
import { getApiUrl } from "../../../utils/apiConfig";
import StateBlock from "../../../components/StateBlock";

const editSchema = z.object({
  title: z
    .string()
    .min(5, "Tiêu đề ít nhất 5 ký tự")
    .max(100, "Tối đa 100 ký tự"),
  description: z.string().max(1000, "Mô tả tối đa 1000 ký tự").optional(),
  category: z.enum(["design", "art", "photo", "3d", "other"], {
    message: "Vui lòng chọn danh mục",
  }),
  tags: z.string().optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

type EditPortfolioClientProps = {
  portfolioId: string;
};

export default function EditPortfolioClient({
  portfolioId,
}: EditPortfolioClientProps) {
  const router = useRouter();
  const { isAuthenticated, isHydrated, accessToken, user: currentUser } =
    useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isOwner, setIsOwner] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
  });

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace(`/login?next=/portfolio/edit/${portfolioId}`);
    }
  }, [isHydrated, isAuthenticated, router, portfolioId]);

  useEffect(() => {
    let isMounted = true;

    async function loadPortfolio() {
      if (!portfolioId) return;
      setIsLoading(true);
      setApiError("");

      try {
        const response = await fetch(getApiUrl(`portfolios/${portfolioId}`), {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Không thể tải thông tin tác phẩm.");
        }

        const { data } = await response.json();

        if (!isMounted) return;

        if (data) {
          // Check ownership
          const ownerId = data.user?._id;
          const currentUserId = currentUser?._id || currentUser?.id;

          if (ownerId && currentUserId && ownerId !== currentUserId) {
            setIsOwner(false);
            setApiError("Bạn không có quyền chỉnh sửa tác phẩm này.");
            setIsLoading(false);
            return;
          }

          setIsOwner(true);
          setExistingImages(data.images || []);

          reset({
            title: data.title,
            description: data.description || "",
            category: data.category || "design",
            tags: data.tags?.join(", ") || "",
          });
        }
      } catch (err) {
        if (isMounted) {
          setApiError(
            err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (isHydrated && isAuthenticated && currentUser) {
      loadPortfolio();
    }

    return () => {
      isMounted = false;
    };
  }, [portfolioId, isHydrated, isAuthenticated, currentUser, reset]);

  const onSubmit = async (values: EditFormValues) => {
    setIsSubmitting(true);
    setApiError("");

    try {
      // Tags can be parsed as array of strings
      const tagsArray = values.tags
        ? values.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
        : [];

      const response = await api.put(`/api/portfolios/${portfolioId}`, {
        title: values.title,
        description: values.description || "",
        category: values.category,
        tags: tagsArray,
      });

      if (response.status === 200) {
        router.push(`/portfolio/${portfolioId}`);
        router.refresh();
      } else {
        throw new Error(response.data?.message || "Không thể cập nhật tác phẩm.");
      }
    } catch (err: any) {
      console.error(err);
      setApiError(
        err.response?.data?.message ||
        err.message ||
        "Lỗi mạng hoặc server không phản hồi."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <StateBlock type="loading" title="Đang tải dữ liệu tác phẩm..." />
      </main>
    );
  }

  if (apiError && !isOwner) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <StateBlock
          type="error"
          title="Truy cập bị từ chối"
          description={apiError}
          actionLabel="Quay lại"
          actionHref={`/portfolio/${portfolioId}`}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-10">
      <div className="app-container max-w-4xl">
        {/* Back Link */}
        <Link
          href={`/portfolio/${portfolioId}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại chi tiết tác phẩm
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold sm:text-4xl">Chỉnh Sửa Tác Phẩm</h1>
          <p className="mt-2 text-muted">Cập nhật thông tin mô tả dự án của bạn.</p>
        </div>

        {apiError && (
          <div className="mb-6 rounded-xl border border-danger/30 bg-danger/10 p-4 font-semibold text-danger">
            {apiError}
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-8 lg:grid-cols-2 lg:gap-12"
        >
          {/* Cột Trái: Form fields */}
          <div className="flex flex-col gap-6">
            <label className="field">
              <span className="label">Tiêu đề *</span>
              <input
                className={`input ${errors.title ? "input-error" : ""}`}
                placeholder="Ví dụ: Creative Dashboard UI..."
                {...register("title")}
              />
              {errors.title && (
                <span className="error-text">{errors.title.message}</span>
              )}
            </label>

            <label className="field">
              <span className="label">Danh mục *</span>
              <select
                className={`input ${errors.category ? "input-error" : ""}`}
                {...register("category")}
              >
                <option value="design">Design</option>
                <option value="art">Art</option>
                <option value="photo">Photography</option>
                <option value="3d">3D Rendering</option>
                <option value="other">Khác</option>
              </select>
              {errors.category && (
                <span className="error-text">{errors.category.message}</span>
              )}
            </label>

            <label className="field">
              <span className="label">Thẻ (Tags)</span>
              <input
                className="input"
                placeholder="Phân cách bằng dấu phẩy (vd: ui, ux, dashboard)"
                {...register("tags")}
              />
            </label>

            <label className="field">
              <span className="label">Mô tả</span>
              <textarea
                rows={5}
                className={`input py-3 ${errors.description ? "input-error" : ""}`}
                placeholder="Giới thiệu về quá trình và cảm hứng của bạn..."
                {...register("description")}
              />
              {errors.description && (
                <span className="error-text">{errors.description.message}</span>
              )}
            </label>

            <div className="mt-4 pt-6 border-t border-border">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary w-full h-12 text-base gap-2 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Đang cập nhật...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" /> Lưu Thay Đổi
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Cột Phải: Read-only visual assets */}
          <div className="flex flex-col gap-6">
            <div>
              <span className="label block mb-1">Hình ảnh tác phẩm (Chỉ đọc)</span>
              <p className="text-xs text-muted mb-4">
                API hiện tại không hỗ trợ cập nhật hoặc thay thế hình ảnh sau khi đăng tải.
              </p>
            </div>

            {existingImages.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface-soft p-8 text-center text-sm text-muted">
                Không tìm thấy hình ảnh nào của tác phẩm.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {existingImages.map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-video rounded-xl border border-border bg-surface-soft overflow-hidden group"
                  >
                    <img
                      src={image}
                      alt={`Asset ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 text-[10px] font-bold bg-black/60 text-white rounded-md">
                      Ảnh {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
