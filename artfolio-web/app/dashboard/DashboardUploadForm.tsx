"use client";

import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { AuthUser, PortfolioDetail } from "../types/api";

const uploadSchema = z.object({
  title: z.string().min(5, "Tiêu đề phải có ít nhất 5 ký tự"),
  description: z.string().min(10, "Mô tả phải có ít nhất 10 ký tự"),
  category: z.enum(["design", "art", "photo", "3d", "other"], {
    message: "Vui lòng chọn danh mục",
  }),
  tags: z.string().min(1, "Vui lòng nhập ít nhất 1 tag"),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

type DashboardUploadFormProps = {
  user: AuthUser;
  onCreated: (portfolio: PortfolioDetail) => void;
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result as string);
    };

    reader.onerror = () => {
      reject(new Error("Không đọc được file ảnh"));
    };

    reader.readAsDataURL(file);
  });
}

function formatFileSize(size: number) {
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function createSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function DashboardUploadForm({
  user,
  onCreated,
}: DashboardUploadFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [fileError, setFileError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "design",
      tags: "",
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    setFileError("");
    setSubmitMessage("");

    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!validTypes.includes(file.type)) {
      setFileError("Chỉ cho phép upload ảnh JPG, PNG hoặc WEBP.");
      setImageFile(null);
      setPreviewUrl("");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError("Dung lượng ảnh không được vượt quá 5MB.");
      setImageFile(null);
      setPreviewUrl("");
      return;
    }

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setPreviewUrl("");
    setFileError("");
  };

  const onSubmit = async (values: UploadFormValues) => {
    setSubmitMessage("");
    setFileError("");

    if (!imageFile) {
      setFileError("Vui lòng chọn ảnh tác phẩm.");
      return;
    }

    setIsSubmitting(true);

    try {
      const imageUrl = await fileToDataUrl(imageFile);

      const tagList = values.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const slug = `${createSlug(values.title)}-${Date.now()}`;

      const newPortfolio = {
        _id: slug,
        id: slug,
        slug,
        title: values.title,
        description: values.description,
        category: values.category,
        tags: tagList,
        colors: ["#6366f1", "#ec4899", "#0f172a"],
        images: [imageUrl],
        likesCount: 0,
        views: 0,
        author: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
        },
        user: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
        },
        comments: [],
        createdAt: new Date().toISOString(),
      } as unknown as PortfolioDetail;

      onCreated(newPortfolio);

      reset();
      removeImage();
      setSubmitMessage("Đăng tác phẩm thành công.");
    } catch {
      setSubmitMessage("Đăng tác phẩm thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="surface rounded-lg p-5 sm:p-7">
      <div className="mb-6">
        <p className="mb-2 text-sm font-bold uppercase text-primary">
          Upload Portfolio
        </p>
        <h2 className="text-2xl font-bold">Đăng tác phẩm mới</h2>
        <p className="mt-2 text-sm text-muted">
          Tải ảnh tác phẩm, nhập tiêu đề, mô tả, danh mục và tags. Sau khi đăng
          thành công, tác phẩm sẽ xuất hiện ngay trong danh sách cá nhân.
        </p>
      </div>

      {submitMessage && (
        <div className="mb-5 rounded-lg border border-border bg-surface-soft p-3 text-sm font-semibold">
          {submitMessage}
        </div>
      )}

      <form className="grid gap-5" noValidate onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span className="label">Tiêu đề tác phẩm</span>
          <input
            className={`input${errors.title ? " input-error" : ""}`}
            placeholder="Ví dụ: Aurora Brand System"
            {...register("title")}
          />
          {errors.title && (
            <span className="error-text">{errors.title.message}</span>
          )}
        </label>

        <label className="field">
          <span className="label">Mô tả</span>
          <textarea
            rows={4}
            className={`input h-auto py-2.5 leading-relaxed${
              errors.description ? " input-error" : ""
            }`}
            placeholder="Mô tả ngắn về tác phẩm..."
            {...register("description")}
          />
          {errors.description && (
            <span className="error-text">{errors.description.message}</span>
          )}
        </label>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="field">
            <span className="label">Danh mục</span>
            <select
              className={`input${errors.category ? " input-error" : ""}`}
              {...register("category")}
            >
              <option value="design">Design</option>
              <option value="art">Art</option>
              <option value="photo">Photo</option>
              <option value="3d">3D</option>
              <option value="other">Other</option>
            </select>
            {errors.category && (
              <span className="error-text">{errors.category.message}</span>
            )}
          </label>

          <label className="field">
            <span className="label">Tags</span>
            <input
              className={`input${errors.tags ? " input-error" : ""}`}
              placeholder="branding, identity, social"
              {...register("tags")}
            />
            {errors.tags && (
              <span className="error-text">{errors.tags.message}</span>
            )}
            <span className="text-xs text-muted">
              Nhập tags cách nhau bằng dấu phẩy.
            </span>
          </label>
        </div>

        <div className="field">
          <span className="label">Ảnh tác phẩm</span>

          {!previewUrl ? (
            <label className="grid min-h-[220px] cursor-pointer place-items-center rounded-lg border border-dashed border-border bg-surface-soft p-8 text-center transition hover:border-primary">
              <div>
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface text-primary">
                  <ImagePlus size={26} />
                </div>
                <p className="mt-4 font-bold">Chọn ảnh tác phẩm</p>
                <p className="mt-1 text-sm text-muted">
                  Hỗ trợ JPG, PNG, WEBP. Tối đa 5MB.
                </p>
              </div>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-surface-soft">
              <div className="relative h-[260px] bg-surface-soft">
                <img
                  src={previewUrl}
                  alt="Preview tác phẩm"
                  className="h-full w-full object-cover"
                />

                <button
                  type="button"
                  className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white text-foreground shadow"
                  onClick={removeImage}
                  aria-label="Xóa ảnh đã chọn"
                >
                  <X size={18} />
                </button>
              </div>

              {imageFile && (
                <div className="flex items-center justify-between px-4 py-3 text-sm text-muted">
                  <span className="truncate">{imageFile.name}</span>
                  <span>{formatFileSize(imageFile.size)}</span>
                </div>
              )}
            </div>
          )}

          {fileError && <span className="error-text">{fileError}</span>}
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Đang đăng..." : "Xuất bản tác phẩm"}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              reset();
              removeImage();
              setSubmitMessage("");
            }}
          >
            Đặt lại
          </button>
        </div>
      </form>
    </div>
  );
}