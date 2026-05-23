"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Upload, X, Loader2, Sparkles } from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";

const createSchema = z.object({
  title: z.string().min(5, "Tiêu đề ít nhất 5 ký tự").max(100, "Tối đa 100 ký tự"),
  description: z.string().max(1000, "Mô tả tối đa 1000 ký tự").optional(),
  category: z.enum(["design", "art", "photo", "3d", "other"], { required_error: "Vui lòng chọn danh mục" }),
  tags: z.string().optional(),
});

type CreateFormValues = z.infer<typeof createSchema>;

export default function CreatePortfolioPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [colors, setColors] = useState<string[]>(["#0f172a", "#3b82f6", "#f472b6"]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  
  // AI State
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { register, handleSubmit, formState: { errors }, control } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { category: "design", tags: "" }
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setApiError("Vui lòng chọn file ảnh (jpg, png, webp, gif)");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setApiError("");
    }
  };

  const handleColorChange = (index: number, newColor: string) => {
    const newColors = [...colors];
    newColors[index] = newColor;
    setColors(newColors);
  };

  const analyzePaletteWithAI = async () => {
    if (!token) return;
    setIsAnalyzing(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${apiUrl}/ai/analyze-palette`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ colors })
      });
      
      const data = await res.json();
      if (res.ok) {
        setAiAnalysis(data.analysis);
      } else {
        alert(data.message || "Lỗi khi gọi AI");
      }
    } catch (e) {
      alert("Lỗi khi kết nối với AI Server");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onSubmit = async (values: CreateFormValues) => {
    if (!isAuthenticated || !token) {
      setApiError("Vui lòng đăng nhập để đăng tác phẩm.");
      return;
    }

    if (!imageFile) {
      setApiError("Bạn phải chọn ít nhất 1 ảnh làm tác phẩm.");
      return;
    }

    setIsSubmitting(true);
    setApiError("");

    try {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("description", values.description || "");
      formData.append("category", values.category);
      
      // Parse tags từ string (comma separated)
      if (values.tags) {
        const tagArray = values.tags.split(",").map(t => t.trim()).filter(Boolean);
        tagArray.forEach(t => formData.append("tags", t)); // Gửi mảng tags
      }

      // Đính kèm màu
      colors.forEach(c => formData.append("colors", c));

      // File ảnh
      formData.append("image", imageFile);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${apiUrl}/portfolios`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.status === "success") {
        router.push(`/portfolio/${data.data._id}`);
        router.refresh();
      } else {
        throw new Error(data.message || "Đã xảy ra lỗi khi tạo tác phẩm.");
      }
    } catch (error: any) {
      console.error(error);
      setApiError(error.message || "Lỗi mạng hoặc server không phản hồi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background py-10">
      <div className="app-container max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold sm:text-4xl">Đăng Tác Phẩm Mới</h1>
          <p className="mt-2 text-muted">Chia sẻ dự án sáng tạo của bạn với cộng đồng.</p>
        </div>

        {apiError && (
          <div className="mb-6 rounded-xl border border-danger/30 bg-danger/10 p-4 font-semibold text-danger">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Cột Trái: Thông tin chung */}
          <div className="flex flex-col gap-6">
            <label className="field">
              <span className="label">Tiêu đề *</span>
              <input
                className={`input ${errors.title ? "input-error" : ""}`}
                placeholder="Ví dụ: Creative Dashboard UI..."
                {...register("title")}
              />
              {errors.title && <span className="error-text">{errors.title.message}</span>}
            </label>

            <label className="field">
              <span className="label">Danh mục *</span>
              <select className={`input ${errors.category ? "input-error" : ""}`} {...register("category")}>
                <option value="design">Design</option>
                <option value="art">Art</option>
                <option value="photo">Photography</option>
                <option value="3d">3D Rendering</option>
                <option value="other">Khác</option>
              </select>
              {errors.category && <span className="error-text">{errors.category.message}</span>}
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
                rows={4}
                className={`input py-3 ${errors.description ? "input-error" : ""}`}
                placeholder="Giới thiệu về quá trình và cảm hứng của bạn..."
                {...register("description")}
              />
              {errors.description && <span className="error-text">{errors.description.message}</span>}
            </label>

            {/* Bảng Màu & AI */}
            <div className="surface mt-4 rounded-xl p-5 border-primary/20 bg-primary/5">
              <div className="flex items-center justify-between mb-4">
                <span className="label text-primary">Bảng màu chủ đạo</span>
                <button
                  type="button"
                  onClick={analyzePaletteWithAI}
                  disabled={isAnalyzing}
                  className="btn btn-primary h-8 px-3 text-xs gap-1.5 rounded-full"
                >
                  {isAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  AI Phân Tích
                </button>
              </div>
              <div className="flex gap-3">
                {colors.map((c, i) => (
                  <input
                    key={i}
                    type="color"
                    value={c}
                    onChange={(e) => handleColorChange(i, e.target.value)}
                    className="h-12 w-full cursor-pointer rounded-lg border border-border p-1 bg-surface transition-transform hover:scale-105"
                  />
                ))}
              </div>
              
              {/* Kết quả AI */}
              {aiAnalysis && (
                <div className="mt-4 text-sm text-foreground bg-surface p-4 rounded-lg border border-primary/30 whitespace-pre-wrap leading-relaxed">
                  <span className="font-bold text-primary block mb-1">🤖 Gemini Analysis:</span>
                  {aiAnalysis}
                </div>
              )}
            </div>
          </div>

          {/* Cột Phải: Upload File */}
          <div className="flex flex-col gap-6">
            <span className="label">File Tác Phẩm (Tối đa 10MB) *</span>
            <div className="relative flex min-h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/50 bg-surface-soft p-6 text-center transition-colors hover:bg-primary/5">
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="max-h-full max-w-full rounded-lg object-contain shadow-lg" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute right-4 top-4 rounded-full bg-black/60 p-1.5 text-white backdrop-blur-md hover:bg-danger"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <>
                  <Upload className="mb-4 h-12 w-12 text-primary" />
                  <p className="text-sm font-semibold">Kéo thả ảnh hoặc click để chọn</p>
                  <p className="mt-1 text-xs text-muted">Hỗ trợ JPG, PNG, WEBP (Max: 10MB)</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </>
              )}
            </div>

            <div className="mt-auto pt-6 border-t border-border">
              <button
                type="submit"
                disabled={isSubmitting || !imageFile}
                className="btn btn-primary w-full h-12 text-base"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải lên...
                  </>
                ) : (
                  "Đăng Tác Phẩm"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
