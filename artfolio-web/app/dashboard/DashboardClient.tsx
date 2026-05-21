"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { updateProfileAction } from "../actions/profileActions";
import ExportPdfButton from "../components/ExportPdfButton";
import ProfileHeader from "./components/ProfileHeader";
import DashboardStats from "./components/DashboardStats";
import PortfolioCard from "../components/PortfolioCard";
import type {
  AuthUser,
  PortfolioDetail,
  PortfolioPdfProfile,
} from "../types/api";
import {
  profileActionSchema,
  type ProfileActionValues,
} from "../utils/validationSchemas";
import DashboardUploadForm from "./DashboardUploadForm";

type DashboardClientProps = {
  user: AuthUser;
  myPortfolios: PortfolioDetail[];
};

const categoryLabels: Record<string, string> = {
  design: "Design",
  art: "Art",
  photo: "Photo",
  "3d": "3D",
  other: "Other",
};

const LOCAL_PORTFOLIOS_KEY = "artfolio-local-portfolios";
const LIKE_COUNTS_KEY = "artfolio-like-counts";

function readLikeCounts(): Record<string, number> {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(LIKE_COUNTS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function getPortfolioId(portfolio: PortfolioDetail) {
  const item = portfolio as PortfolioDetail & {
    id?: string;
    slug?: string;
  };

  return item._id || item.id || item.slug || portfolio.title;
}

function applyLocalLikeCounts(items: PortfolioDetail[]) {
  const likeCounts = readLikeCounts();

  return items.map((item) => {
    const portfolioId = getPortfolioId(item);

    if (typeof likeCounts[portfolioId] !== "number") {
      return item;
    }

    return {
      ...item,
      likesCount: likeCounts[portfolioId],
    };
  });
}

function mergePortfolios(
  localPortfolios: PortfolioDetail[],
  basePortfolios: PortfolioDetail[]
) {
  const existedIds = new Set<string>();
  const result: PortfolioDetail[] = [];

  [...localPortfolios, ...basePortfolios].forEach((item) => {
    const id = getPortfolioId(item);

    if (existedIds.has(id)) return;

    existedIds.add(id);
    result.push(item);
  });

  return result;
}

function readLocalPortfolios(): PortfolioDetail[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(LOCAL_PORTFOLIOS_KEY);
    return raw ? (JSON.parse(raw) as PortfolioDetail[]) : [];
  } catch {
    return [];
  }
}

function saveLocalPortfolios(items: PortfolioDetail[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_PORTFOLIOS_KEY, JSON.stringify(items));
}

export default function DashboardClient({
  user,
  myPortfolios,
}: DashboardClientProps) {
  const [portfolios, setPortfolios] =
    useState<PortfolioDetail[]>(myPortfolios);

useEffect(() => {
  const syncPortfolios = () => {
    const localPortfolios = readLocalPortfolios();
    const merged = mergePortfolios(localPortfolios, myPortfolios);
    const portfoliosWithLatestLikes = applyLocalLikeCounts(merged);

    setPortfolios(portfoliosWithLatestLikes);
  };

  syncPortfolios();

  window.addEventListener("focus", syncPortfolios);
  window.addEventListener("storage", syncPortfolios);
  window.addEventListener("artfolio-like-updated", syncPortfolios);

  return () => {
    window.removeEventListener("focus", syncPortfolios);
    window.removeEventListener("storage", syncPortfolios);
    window.removeEventListener("artfolio-like-updated", syncPortfolios);
  };
}, [myPortfolios]);
  const [toastMessage, setToastMessage] = useState("");
  const [activeTab, setActiveTab] = useState<
    "profile" | "upload" | "portfolios" | "export"
  >("profile");

  const [submitResult, setSubmitResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalLikes = useMemo(() => {
    return portfolios.reduce((sum, item) => sum + item.likesCount, 0);
  }, [portfolios]);

  const totalViews = useMemo(() => {
    return portfolios.reduce((sum, item) => sum + item.views, 0);
  }, [portfolios]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileActionValues>({
    resolver: zodResolver(profileActionSchema),
    defaultValues: {
      userId: user.id,
      name: user.name,
      skills: "",
      experience: "",
      socialLinks: "",
    },
  });

  const onSubmit = async (values: ProfileActionValues) => {
    setIsSubmitting(true);
    setSubmitResult(null);

    const formData = new FormData();
    Object.entries(values).forEach(([key, val]) =>
      formData.append(key, val ?? "")
    );

    const result = await updateProfileAction(formData);
    setSubmitResult(result);
    setIsSubmitting(false);
  };


  const handleCreatedPortfolio = (portfolio: PortfolioDetail) => {
    const currentLocalPortfolios = readLocalPortfolios();

    const updatedLocalPortfolios = mergePortfolios(
      [portfolio],
      currentLocalPortfolios
    );

    saveLocalPortfolios(updatedLocalPortfolios);

    setPortfolios((current) =>
      applyLocalLikeCounts(mergePortfolios(updatedLocalPortfolios, current))
    );

    setToastMessage("Đăng tác phẩm thành công.");
    setActiveTab("portfolios");

    window.setTimeout(() => {
      setToastMessage("");
    }, 2500);
  };

  const pdfProfile: PortfolioPdfProfile = {
    name: user.name,
    email: user.email,
    title: user.role === "admin" ? "Admin · Artfolio" : "Creative Portfolio",
    skills: [],
    experience: [],
    socialLinks: [],
    works: portfolios.map((p) => ({
      title: p.title,
      category: p.category,
      description: p.description,
    })),
  };

  const tabs = [
    { key: "profile" as const, label: "Hồ sơ" },
    { key: "upload" as const, label: "Đăng tác phẩm" },
    { key: "portfolios" as const, label: `Tác phẩm (${portfolios.length})` },
    { key: "export" as const, label: "Xuất PDF" },
  ];

  return (
    <section className="py-8 sm:py-10">
      <div className="app-container">
        <div className="mb-6 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-bold uppercase text-primary">
              Dashboard
            </p>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
              Không gian cá nhân
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Quản lý hồ sơ, đăng tác phẩm mới, xem danh sách portfolio cá nhân
              và xuất hồ sơ sáng tạo ra PDF.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className="btn btn-primary text-sm"
              onClick={() => setActiveTab("upload")}
            >
              Đăng tác phẩm
            </button>
          </div>
        </div>
        {toastMessage && (
          <div className="mb-5 rounded-lg border border-border bg-surface-soft p-3 text-sm font-semibold text-foreground">
            {toastMessage}
          </div>
        )}
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="grid h-fit gap-4">
            <div className="surface grid gap-4 rounded-lg p-5">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name}
                  width={72}
                  height={72}
                  sizes="72px"
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="grid h-[72px] w-[72px] place-items-center rounded-full bg-primary text-2xl font-bold text-white">
                  {user.name.slice(0, 1)}
                </div>
              )}

              <div>
                <p className="font-bold">{user.name}</p>
                <p className="text-sm text-muted">{user.email}</p>
                {user.role === "admin" && <span className="badge mt-2">Admin</span>}
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg border border-border bg-surface-soft p-3">
                  <strong className="block text-xl">{portfolios.length}</strong>
                  <span className="text-xs text-muted">tác phẩm</span>
                </div>

                <div className="rounded-lg border border-border bg-surface-soft p-3">
                  <strong className="block text-xl">{totalLikes}</strong>
                  <span className="text-xs text-muted">lượt thích</span>
                </div>

                <div className="rounded-lg border border-border bg-surface-soft p-3">
                  <strong className="block text-xl">{totalViews}</strong>
                  <span className="text-xs text-muted">lượt xem</span>
                </div>

                <div className="rounded-lg border border-border bg-surface-soft p-3">
                  <strong className="block text-xl">
                    {user.role === "admin" ? "Admin" : "User"}
                  </strong>
                  <span className="text-xs text-muted">vai trò</span>
                </div>
              </div>
            </div>

            <nav className="surface overflow-hidden rounded-lg">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`block w-full px-4 py-3 text-left text-sm font-semibold transition ${
                    activeTab === tab.key
                      ? "bg-primary text-white"
                      : "text-muted hover:bg-surface-soft hover:text-foreground"
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="grid gap-5">
            <ProfileHeader
              user={user}
              onEditProfile={() => setActiveTab("profile")}
            />

            <DashboardStats
              portfoliosCount={portfolios.length}
              totalLikes={totalLikes}
              totalViews={totalViews}
              role={user.role === "admin" ? "Admin" : "User"}
            />

            {activeTab === "profile" && (
              <div className="surface rounded-lg p-5 sm:p-7">
                <h2 className="mb-5 text-xl font-bold">Chỉnh sửa hồ sơ</h2>

                {submitResult && (
                  <div
                    className={`mb-5 rounded-lg border p-3 text-sm font-semibold ${
                      submitResult.ok
                        ? "border-border bg-surface-soft text-foreground"
                        : "border-danger bg-surface text-danger"
                    }`}
                  >
                    {submitResult.message}
                  </div>
                )}

                <form
                  className="grid gap-5"
                  noValidate
                  onSubmit={handleSubmit(onSubmit)}
                >
                  <input type="hidden" {...register("userId")} />

                  <label className="field">
                    <span className="label">Họ tên</span>
                    <input
                      className={`input${errors.name ? " input-error" : ""}`}
                      placeholder="Nguyen Van A"
                      {...register("name")}
                    />
                    {errors.name && (
                      <span className="error-text">{errors.name.message}</span>
                    )}
                  </label>

                  <label className="field">
                    <span className="label">Email</span>
                    <input
                      className="input cursor-not-allowed opacity-60"
                      value={user.email}
                      disabled
                      title="Email không thể thay đổi"
                    />
                    <span className="text-xs text-muted">
                      Email không thể thay đổi.
                    </span>
                  </label>

                  <label className="field">
                    <span className="label">Kỹ năng</span>
                    <input
                      className={`input${errors.skills ? " input-error" : ""}`}
                      placeholder="Figma, Branding, UI/UX"
                      {...register("skills")}
                    />
                    {errors.skills && (
                      <span className="error-text">{errors.skills.message}</span>
                    )}
                    <span className="text-xs text-muted">
                      Nhập các kỹ năng cách nhau bằng dấu phẩy.
                    </span>
                  </label>

                  <label className="field">
                    <span className="label">Kinh nghiệm</span>
                    <textarea
                      rows={4}
                      className={`input h-auto py-2.5 leading-relaxed${
                        errors.experience ? " input-error" : ""
                      }`}
                      placeholder="Mô tả ngắn kinh nghiệm làm việc..."
                      {...register("experience")}
                    />
                    {errors.experience && (
                      <span className="error-text">
                        {errors.experience.message}
                      </span>
                    )}
                  </label>

                  <label className="field">
                    <span className="label">Social Links</span>
                    <input
                      className="input"
                      placeholder="https://github.com/..., https://dribbble.com/..."
                      {...register("socialLinks")}
                    />
                    <span className="text-xs text-muted">
                      Nhập các link cách nhau bằng dấu phẩy.
                    </span>
                  </label>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>

                    <button type="reset" className="btn btn-secondary">
                      Đặt lại
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "upload" && (
              <DashboardUploadForm
                user={user}
                onCreated={handleCreatedPortfolio}
              />
            )}

            {activeTab === "portfolios" && (
              <div className="grid gap-4">
                <div className="surface flex flex-col gap-3 rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-bold">Tác phẩm của tôi</h2>
                    <p className="mt-1 text-sm text-muted">
                      Upload thành công sẽ hiển thị ngay trong danh sách này.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary text-sm"
                    onClick={() => setActiveTab("upload")}
                  >
                    Thêm tác phẩm
                  </button>
                </div>

                {portfolios.length === 0 ? (
                  <div className="surface rounded-lg p-10 text-center">
                    <p className="text-lg font-bold">Chưa có tác phẩm nào</p>
                    <p className="mt-2 text-sm text-muted">
                      Hãy đăng tác phẩm đầu tiên để xây dựng portfolio cá nhân.
                    </p>

                    <button
                      type="button"
                      className="btn btn-primary mt-5"
                      onClick={() => setActiveTab("upload")}
                    >
                      Upload your first shot
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {portfolios.map((portfolio) => (
                      <PortfolioCard
                        key={getPortfolioId(portfolio)}
                        portfolio={portfolio}
                        compact
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "export" && (
              <div className="surface rounded-lg p-5 sm:p-7">
                <h2 className="mb-2 text-xl font-bold">
                  Xuất Portfolio ra PDF
                </h2>
                <p className="mb-6 text-sm text-muted">
                  File PDF sẽ bao gồm thông tin hồ sơ và danh sách tác phẩm của
                  bạn.
                </p>

                <div className="mb-6 grid gap-3 rounded-lg border border-border bg-surface-soft p-5 text-sm">
                  <div>
                    <p className="text-xs font-bold uppercase text-muted">Tên</p>
                    <p className="font-semibold">{pdfProfile.name}</p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase text-muted">
                      Email
                    </p>
                    <p>{pdfProfile.email}</p>
                  </div>

                  {pdfProfile.works.length > 0 ? (
                    <div>
                      <p className="text-xs font-bold uppercase text-muted">
                        Tác phẩm ({pdfProfile.works.length})
                      </p>

                      <ul className="mt-1 grid gap-0.5">
                        {pdfProfile.works.map((w) => (
                          <li key={w.title} className="text-muted">
                            · {w.title} —{" "}
                            <span className="capitalize">
                              {categoryLabels[w.category] ?? w.category}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-muted">
                      Chưa có tác phẩm nào trong hồ sơ.
                    </p>
                  )}
                </div>

                <ExportPdfButton profile={pdfProfile} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}