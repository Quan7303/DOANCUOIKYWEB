"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Upload, X, Loader2, Sparkles } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { getApiUrl } from "../utils/apiConfig";
import toast from "react-hot-toast";

const createSchema = z.object({
  title: z.string().min(5, "Tiêu đề ít nhất 5 ký tự").max(100, "Tối đa 100 ký tự"),
  description: z.string().max(1000, "Mô tả tối đa 1000 ký tự").optional(),
  category: z.enum(["design", "art", "photo", "3d", "other"], { message: "Vui lòng chọn danh mục" }),
  tags: z.string().optional(),
});

type CreateFormValues = z.infer<typeof createSchema>;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

function hslToHex(hue: number, saturation: number, lightness: number) {
  const normalizedSaturation = saturation / 100;
  const normalizedLightness = lightness / 100;
  const chroma =
    (1 - Math.abs(2 * normalizedLightness - 1)) * normalizedSaturation;
  const hueSegment = hue / 60;
  const secondComponent = chroma * (1 - Math.abs((hueSegment % 2) - 1));
  const match = normalizedLightness - chroma / 2;
  const [red, green, blue] =
    hueSegment < 1
      ? [chroma, secondComponent, 0]
      : hueSegment < 2
        ? [secondComponent, chroma, 0]
        : hueSegment < 3
          ? [0, chroma, secondComponent]
          : hueSegment < 4
            ? [0, secondComponent, chroma]
            : hueSegment < 5
              ? [secondComponent, 0, chroma]
              : [chroma, 0, secondComponent];

  return `#${[red, green, blue]
    .map((value) =>
      Math.round((value + match) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

const COLOR_PALETTE = [
  ...[0, 15, 30, 45, 60, 85, 110, 140, 165, 190, 215, 240, 265, 290, 315, 340]
    .flatMap((hue) => [82, 68, 54, 40, 28].map((lightness) => hslToHex(hue, 86, lightness))),
  "#ffffff",
  "#f1f5f9",
  "#cbd5e1",
  "#94a3b8",
  "#64748b",
  "#334155",
  "#111827",
  "#000000",
];

export default function CreatePortfolioPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, accessToken } = useAuthStore();

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>(["#0f172a", "#3b82f6", "#f472b6"]);
  const [activeColorIndex, setActiveColorIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const imagePreviewsRef = useRef<string[]>([]);

  // AI State
  const [aiSuggestedTitle, setAiSuggestedTitle] = useState("");
  const [aiSuggestedTags, setAiSuggestedTags] = useState("");
  const [aiSuggestedDescription, setAiSuggestedDescription] = useState("");
  const [aiError, setAiError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { category: "design", tags: "" }
  });

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace("/login?next=/create");
    }
  }, [isHydrated, isAuthenticated, router]);

  useEffect(() => {
    imagePreviewsRef.current = imagePreviews;
  }, [imagePreviews]);

  useEffect(() => {
    return () => {
      imagePreviewsRef.current.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        invalidFiles.push(`${file.name} khong phai file anh`);
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        invalidFiles.push(`${file.name} vuot qua 10MB`);
        return;
      }

      validFiles.push(file);
    });

    if (validFiles.length === 0) {
      setApiError(`File không hợp lệ: ${invalidFiles.join(", ")}. Chỉ hỗ trợ ảnh.`);
      e.target.value = "";
      return;
    }

    if (imageFiles.length + validFiles.length > 5) {
      e.target.value = "";
      setApiError("Bạn chỉ được tải lên tối đa 5 ảnh.");
      return;
    }

    const newFiles = [...imageFiles, ...validFiles];
    const newPreviews = [...imagePreviews, ...validFiles.map(file => URL.createObjectURL(file))];

    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
    setApiError(
      invalidFiles.length > 0
        ? `Da them file hop le. Bo qua: ${invalidFiles.join(", ")}.`
        : "",
    );
    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
    if (selectedImageIndex >= newFiles.length) {
      setSelectedImageIndex(Math.max(0, newFiles.length - 1));
    }
  };

  const handleColorChange = (index: number, newColor: string) => {
    const newColors = [...colors];
    const normalizedColor = newColor.startsWith("#")
      ? newColor
      : `#${newColor}`;
    newColors[index] = normalizedColor.slice(0, 7);
    setColors(newColors);
  };

  const applyPresetColor = (color: string) => {
    handleColorChange(activeColorIndex, color);
  };

  const validColors = colors.filter((color) => HEX_COLOR_PATTERN.test(color));

  const analyzeImageWithAI = async () => {
    if (imageFiles.length === 0) {
      setAiError("chưa thêm ảnh");
      return;
    }

    setIsAnalyzing(true);
    setAiError("");
    setAiSuggestedTitle("");
    setAiSuggestedTags("");
    setAiSuggestedDescription("");

    try {
      // Convert ảnh được chọn sang base64
      const file = imageFiles[selectedImageIndex];
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = () => reject(new Error("Không đọc được file ảnh"));
        reader.readAsDataURL(file);
      });

      const res = await fetch(getApiUrl("ai/analyze-image"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: file.type
        })
      });

      const data = await res.json();

      if (res.ok && data.status === "success") {
        setAiSuggestedTitle(data.title || "");
        setAiSuggestedTags(data.tags || "");
        setAiSuggestedDescription(data.description || "");
      } else {
        setAiError(data.message || "Không thể phân tích ảnh. Vui lòng thử lại.");
      }
    } catch {
      setAiError("Không kết nối được AI server. Vui lòng thử lại.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeAllImagesWithAI = async () => {
    if (imageFiles.length === 0) {
      setAiError("chưa thêm ảnh");
      return;
    }

    setIsAnalyzing(true);
    setAiError("");
    setAiSuggestedTitle("");
    setAiSuggestedTags("");
    setAiSuggestedDescription("");

    try {
      // Convert tất cả ảnh sang base64
      const imagesData = await Promise.all(
        imageFiles.map(async (file) => {
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(",")[1]);
            reader.onerror = () => reject(new Error("Không đọc được file ảnh"));
            reader.readAsDataURL(file);
          });
          return { imageBase64: base64Data, mimeType: file.type };
        })
      );

      const res = await fetch(getApiUrl("ai/analyze-images"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({ images: imagesData })
      });

      const data = await res.json();

      if (res.ok && data.status === "success") {
        setAiSuggestedTitle(data.title || "");
        setAiSuggestedTags(data.tags || "");
        setAiSuggestedDescription(data.description || "");
      } else {
        setAiError(data.message || "Không thể phân tích ảnh. Vui lòng thử lại.");
      }
    } catch {
      setAiError("Không kết nối được AI server. Vui lòng thử lại.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyAISuggestions = () => {
    if (aiSuggestedTitle) setValue("title", aiSuggestedTitle);
    if (aiSuggestedTags) setValue("tags", aiSuggestedTags);
    if (aiSuggestedDescription) setValue("description", aiSuggestedDescription);
  };

  const onSubmit = async (values: CreateFormValues) => {
    if (!isAuthenticated || !accessToken) {
      router.replace("/login?next=/create");
      return;
    }

    if (imageFiles.length === 0) {
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

      // File ảnh
      imageFiles.forEach(file => {
        formData.append("images", file);
      });

      const res = await fetch(getApiUrl("portfolios"), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.status === "success") {
        const createdPortfolioId = data.data._id;

        toast.success("Đăng tác phẩm thành công.");

        router.push(
          `/dashboard?tab=portfolios&preview=${encodeURIComponent(createdPortfolioId)}`,
        );

        router.refresh();
      } else {
        throw new Error(data.message || "Đã xảy ra lỗi khi tạo tác phẩm.");
      }
    } catch (error: unknown) {
      console.error(error);

      const message =
        error instanceof Error
          ? error.message
          : "Lỗi mạng hoặc server không phản hồi.";

      setApiError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isHydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

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
              <span className="label flex items-center gap-2">
                Mô tả
                {aiSuggestedDescription && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 border border-primary/30 px-1.5 py-0.5 rounded-full">
                    <Sparkles className="h-2.5 w-2.5" /> AI đã gợi ý
                  </span>
                )}
              </span>
              <textarea
                rows={4}
                className={`input py-3 ${errors.description ? "input-error" : ""} ${aiSuggestedDescription ? "ring-1 ring-primary/30 border-primary/40" : ""}`}
                placeholder="Giới thiệu về quá trình và cảm hứng của bạn..."
                {...register("description")}
              />
              {errors.description && <span className="error-text">{errors.description.message}</span>}
            </label>

            {/* Bảng Màu */}
            <div className="surface mt-4 rounded-xl p-5 border-primary/20 bg-primary/5">
              <div className="flex items-center justify-between mb-4">
                <span className="label text-primary">Bảng màu chủ đạo</span>
              </div>
              <div className="grid gap-3">
                {colors.map((c, i) => {
                  const isValid = HEX_COLOR_PATTERN.test(c);

                  return (
                    <label
                      key={i}
                      className={`flex items-center gap-3 rounded-lg border bg-surface p-2 transition ${activeColorIndex === i
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border"
                        }`}
                      onFocus={() => setActiveColorIndex(i)}
                    >
                      <span
                        className="h-9 w-9 shrink-0 rounded-md border border-border"
                        style={{ backgroundColor: isValid ? c : "#ffffff" }}
                      />
                      <input
                        className={`min-w-0 flex-1 bg-transparent text-sm font-semibold uppercase outline-none ${isValid ? "text-foreground" : "text-danger"
                          }`}
                        value={c}
                        maxLength={7}
                        onChange={(e) => handleColorChange(i, e.target.value)}
                        onFocus={() => setActiveColorIndex(i)}
                        aria-label={`Color ${i + 1}`}
                      />
                    </label>
                  );
                })}

                <div className="grid grid-cols-8 gap-1 rounded-lg border border-border bg-surface p-2 sm:grid-cols-11">
                  {COLOR_PALETTE.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={`aspect-square rounded-sm border transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/40 ${colors[activeColorIndex]?.toLowerCase() ===
                        preset.toLowerCase()
                        ? "border-foreground ring-2 ring-primary/40"
                        : "border-border/50"
                        }`}
                      style={{ backgroundColor: preset }}
                      onClick={() => applyPresetColor(preset)}
                      aria-label={`Use color ${preset}`}
                      title={preset}
                    />
                  ))}
                </div>
              </div>
              {/* end color grid */}
            </div>
          </div>

          {/* Cột Phải: Upload File */}
          <div className="flex flex-col gap-6">
            <span className="label">File Tác Phẩm (Tối đa 5 ảnh, tối đa 10MB/ảnh) *</span>

            {imagePreviews.length === 0 ? (
              <div className="relative flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/50 bg-surface-soft p-6 text-center transition-colors hover:bg-primary/5">
                <Upload className="mb-4 h-12 w-12 text-primary" />
                <p className="text-sm font-semibold">Kéo thả ảnh hoặc click để chọn</p>
                <p className="mt-1 text-xs text-muted">Hỗ trợ JPG, PNG, WEBP (Tối đa 5 ảnh)</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div
                    key={index}
                    className={`relative aspect-video rounded-xl border-2 bg-surface-soft overflow-hidden group cursor-pointer transition-all ${
                      selectedImageIndex === index
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRemoveImage(index); }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-danger transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                      <div className="px-2 py-0.5 text-[10px] font-bold bg-black/60 text-white rounded-md">
                        Ảnh {index + 1}
                      </div>
                      {selectedImageIndex === index && (
                        <div className="px-2 py-0.5 text-[10px] font-bold bg-primary text-white rounded-md flex items-center gap-1">
                          <Sparkles className="h-2.5 w-2.5" /> AI
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {imageFiles.length < 5 && (
                  <div className="relative aspect-video rounded-xl border-2 border-dashed border-primary/40 bg-surface-soft hover:bg-primary/5 transition-colors flex flex-col items-center justify-center cursor-pointer">
                    <Upload className="h-6 w-6 text-primary mb-1" />
                    <span className="text-xs font-semibold text-muted">Thêm ảnh ({imageFiles.length}/5)</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            )}

            {/* AI Phân Tích Ảnh */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="label text-primary">AI Gợi Ý Tiêu Đề, Tags & Mô Tả ✨</span>
                <div className="flex gap-2">
                  {imageFiles.length > 1 && (
                    <button
                      type="button"
                      onClick={analyzeAllImagesWithAI}
                      disabled={isAnalyzing}
                      className="btn btn-outline h-8 px-3 text-xs gap-1.5 rounded-full border-primary text-primary hover:bg-primary/10"
                    >
                      {isAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      Phân Tích Tất Cả
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={analyzeImageWithAI}
                    disabled={isAnalyzing}
                    className="btn btn-primary h-8 px-3 text-xs gap-1.5 rounded-full"
                  >
                    {isAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {isAnalyzing ? "Đang phân tích..." : "Phân Tích Ảnh"}
                  </button>
                </div>
              </div>

              {aiError && (
                <p className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm font-semibold text-danger">
                  {aiError === "chưa thêm ảnh"
                    ? "⚠️ Chưa thêm ảnh — vui lòng tải ảnh lên trước khi phân tích."
                    : aiError}
                </p>
              )}

              {(aiSuggestedTitle || aiSuggestedTags || aiSuggestedDescription) && (
                <div className="mt-2 rounded-lg border border-primary/30 bg-surface p-4 text-sm leading-relaxed space-y-3">
                  <span className="font-bold text-primary block">🤖 Gợi ý từ AI:</span>

                  {aiSuggestedTitle && (
                    <div className="rounded-lg border border-border bg-surface-soft p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-xs font-semibold text-muted uppercase tracking-wide">Tiêu đề</span>
                        <button
                          type="button"
                          onClick={() => setValue("title", aiSuggestedTitle)}
                          className="shrink-0 text-[11px] font-semibold text-primary hover:underline"
                        >
                          ✓ Áp dụng
                        </button>
                      </div>
                      <p className="text-foreground font-medium">{aiSuggestedTitle}</p>
                    </div>
                  )}

                  {aiSuggestedTags && (
                    <div className="rounded-lg border border-border bg-surface-soft p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-xs font-semibold text-muted uppercase tracking-wide">Tags</span>
                        <button
                          type="button"
                          onClick={() => setValue("tags", aiSuggestedTags)}
                          className="shrink-0 text-[11px] font-semibold text-primary hover:underline"
                        >
                          ✓ Áp dụng
                        </button>
                      </div>
                      <p className="text-foreground">{aiSuggestedTags}</p>
                    </div>
                  )}

                  {aiSuggestedDescription && (
                    <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-primary uppercase tracking-wide">Mô tả</span>
                          <span className="text-[10px] text-muted bg-surface px-1.5 py-0.5 rounded-full border border-border">
                            {aiSuggestedDescription.length} ký tự
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setValue("description", aiSuggestedDescription)}
                          className="shrink-0 text-[11px] font-semibold text-primary hover:underline"
                        >
                          ✓ Áp dụng
                        </button>
                      </div>
                      <p className="text-foreground leading-relaxed">{aiSuggestedDescription}</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={applyAISuggestions}
                    className="btn btn-primary h-8 px-4 text-xs rounded-full w-full"
                  >
                    ✓ Áp dụng tất cả
                  </button>
                </div>
              )}

              {!aiSuggestedTitle && !aiSuggestedTags && !aiSuggestedDescription && !aiError && !isAnalyzing && (
                <p className="text-xs text-muted">
                  {imageFiles.length > 1
                    ? `Click vào ảnh để chọn ảnh phân tích (đang chọn Ảnh ${selectedImageIndex + 1}), rồi nhấn "Phân Tích Ảnh".`
                    : `Tải ảnh lên rồi nhấn "Phân Tích Ảnh" để AI gợi ý tiêu đề, tags và mô tả phù hợp.`}
                </p>
              )}
            </div>

            <div className="mt-auto pt-6 border-t border-border">
              <button
                type="submit"
                disabled={isSubmitting}
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
