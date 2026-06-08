"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import ExportPdfButton from "../components/ExportPdfButton";
import ProfileHeader from "./components/ProfileHeader";
import DashboardStats from "./components/DashboardStats";
import PortfolioModalShell from "../components/PortfolioModalShell";
import PortfolioDetailClient from "../portfolio/[id]/PortfolioDetailClient";
import { useAuthStore } from "../store/useAuthStore";

import type {
  AuthUser,
  PortfolioDetail,
  PortfolioPdfProfile,
} from "../types/api";
import {
  profileActionSchema,
  type ProfileActionValues,
} from "../utils/validationSchemas";

import { api } from "../utils/api";

type DashboardClientProps = {
  user: AuthUser;
  myPortfolios: PortfolioDetail[];
};

type DashboardTab = "profile" | "portfolios" | "export";

function getValidDashboardTab(tab: string | null): DashboardTab {
  if (tab === "portfolios") return "portfolios";
  if (tab === "export") return "export";
  return "profile";
}
const categoryLabels: Record<string, string> = {
  design: "Design",
  art: "Art",
  photo: "Photo",
  "3d": "3D",
  other: "Other",
};

function getPortfolioId(portfolio: PortfolioDetail) {
  const item = portfolio as PortfolioDetail & {
    id?: string;
    slug?: string;
  };

  return item._id || item.id || item.slug || portfolio.title;
}

function getPortfolioImage(portfolio: PortfolioDetail) {
  const item = portfolio as PortfolioDetail & {
    image?: string;
    images?: string[];
  };

  return item.image || item.images?.[0] || "/next.svg";
}

function mergePortfolios(items: PortfolioDetail[]) {
  const existedIds = new Set<string>();
  const result: PortfolioDetail[] = [];

  items.forEach((item) => {
    const id = getPortfolioId(item);

    if (existedIds.has(id)) return;

    existedIds.add(id);
    result.push(item);
  });

  return result;
}

function parseCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSocialLinks(value?: string) {
  const links = parseCsv(value || "");

  return {
    github: links.find((item) => item.includes("github.com")) || "",
    instagram: links.find((item) => item.includes("instagram.com")) || "",
    behance: links.find((item) => item.includes("behance.net")) || "",
    linkedin: links.find((item) => item.includes("linkedin.com")) || "",
  };
}

function formatSocialLinks(user: AuthUser) {
  return [
    user.socialLinks?.github,
    user.socialLinks?.instagram,
    user.socialLinks?.behance,
    user.socialLinks?.linkedin,
  ]
    .filter(Boolean)
    .join(", ");
}

export default function DashboardClient({
  user,
  myPortfolios,
}: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");
  const previewPortfolioId = searchParams.get("preview");
  const activeTab = getValidDashboardTab(currentTab);
  const fetchMe = useAuthStore((state) => state.fetchMe);

  const [portfolios, setPortfolios] = useState<PortfolioDetail[]>(() =>
    mergePortfolios(myPortfolios),
  );

  useEffect(() => {
    setPortfolios(mergePortfolios(myPortfolios));
  }, [myPortfolios]);
  useEffect(() => {
    if (activeTab === "portfolios" && previewPortfolioId) {
      setSelectedPortfolioId(previewPortfolioId);
    }
  }, [activeTab, previewPortfolioId]);
  useEffect(() => {
  function handlePortfolioLikeChanged(event: Event) {
    const customEvent = event as CustomEvent<{
      portfolioId?: string;
      likesCount?: number;
    }>;

    const portfolioId = customEvent.detail?.portfolioId;
    const likesCount = customEvent.detail?.likesCount;

    if (!portfolioId || typeof likesCount !== "number") return;

    setPortfolios((current) =>
      current.map((portfolio) =>
        getPortfolioId(portfolio) === portfolioId
          ? {
              ...portfolio,
              likesCount,
            }
          : portfolio,
      ),
    );
  }

  window.addEventListener(
    "artfolio:portfolio-like-changed",
    handlePortfolioLikeChanged,
  );

  return () => {
    window.removeEventListener(
      "artfolio:portfolio-like-changed",
      handlePortfolioLikeChanged,
    );
  };
}, []);

  const [submitResult, setSubmitResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(
    null,
  );

  function handleChangeTab(tab: DashboardTab) {
    router.replace(`/dashboard?tab=${tab}`, { scroll: false });
  }

  function goToCreatePortfolio() {
    router.push("/create");
  }

  function handleOpenPortfolio(portfolioId: string) {
    setSelectedPortfolioId(portfolioId);
  }

  function handleClosePortfolio() {
    setSelectedPortfolioId(null);

    if (previewPortfolioId) {
      router.replace("/dashboard?tab=portfolios", { scroll: false });
    }
  }
  function handleDeletedPortfolio(deletedPortfolioId: string) {
    setSelectedPortfolioId(null);

    setPortfolios((current) =>
      current.filter(
        (portfolio) => getPortfolioId(portfolio) !== deletedPortfolioId,
      ),
    );

    if (previewPortfolioId) {
      router.replace("/dashboard?tab=portfolios", { scroll: false });
    }

    router.refresh();
  }

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
      userId: user._id || user.id,
      name: user.name,
      portfolioDescription: user.portfolioDescription || "",
      skills: user.skills?.join(", ") || "",
      experience: user.experience?.join("\n") || "",
      socialLinks: formatSocialLinks(user),
    },
  });

  const onSubmit = async (values: ProfileActionValues) => {
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      await api.put(`/api/users/${values.userId}`, {
        name: values.name,
        portfolioDescription: values.portfolioDescription,
        skills: parseCsv(values.skills),
        experience: parseLines(values.experience),
        socialLinks: parseSocialLinks(values.socialLinks),
      });

      await fetchMe();

      setSubmitResult({
        ok: true,
        message: "Cập nhật hồ sơ thành công.",
      });
    } catch (error) {
      setSubmitResult({
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Backend từ chối cập nhật hồ sơ.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  const pdfProfile: PortfolioPdfProfile = {
    name: user.name,
    email: user.email,
    title:
      user.portfolioTitle ||
      (user.role === "admin" ? "Admin · Artfolio" : "Creative Portfolio"),
    skills: user.skills || [],
    experience: user.experience || [],
    socialLinks: parseCsv(formatSocialLinks(user)),
    totalLikes,
    totalViews,
    works: portfolios.map((p) => ({
      title: p.title,
      category: categoryLabels[p.category] ?? p.category,
      description: p.description,
      image: getPortfolioImage(p),
      likesCount: p.likesCount || 0,
      views: p.views || 0,
      tags: p.tags || [],
    })),
  };

  const tabs = [
    { key: "profile" as const, label: "Hồ sơ" },
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
              Quản lý hồ sơ, xem danh sách portfolio cá nhân và xuất hồ sơ sáng tạo ra PDF.
            </p>
          </div>

        </div>

        <div className="grid min-w-0 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="grid h-fit min-w-0 gap-4">
            {activeTab === "profile" && (
              <div className="surface grid gap-4 rounded-lg p-5">
                {user.avatar && user.avatar !== "default-avatar.png" ? (
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
            )}

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
                  onClick={() => handleChangeTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="grid min-w-0 gap-5">
            {activeTab === "profile" && (
              <>
                <ProfileHeader
                  user={user}
                  onEditProfile={() => handleChangeTab("profile")}
                />

                <DashboardStats
                  portfoliosCount={portfolios.length}
                  totalLikes={totalLikes}
                  totalViews={totalViews}
                  role={user.role === "admin" ? "Admin" : "User"}
                />
              </>
            )}

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
                    <span className="label">Giới thiệu bản thân</span>
                    <textarea
                      rows={4}
                      className={`input h-auto py-2.5 leading-relaxed${
                        errors.portfolioDescription ? " input-error" : ""
                      }`}
                      placeholder="Mô tả ngắn về bản thân, phong cách sáng tạo hoặc định hướng portfolio..."
                      {...register("portfolioDescription")}
                    />
                    {errors.portfolioDescription && (
                      <span className="error-text">
                        {errors.portfolioDescription.message}
                      </span>
                    )}
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
                    onClick={goToCreatePortfolio}
                    className="btn btn-primary text-sm"
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

                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {portfolios.map((portfolio) => {
                      const portfolioId = getPortfolioId(portfolio);
                      const image = getPortfolioImage(portfolio);

                      return (
                        <button
                          key={portfolioId}
                          type="button"
                          onClick={() => handleOpenPortfolio(portfolioId)}
                          className="surface flex gap-4 rounded-xl p-3 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
                        >
                          <img
                            src={image}
                            alt={portfolio.title}
                            className="h-20 w-28 rounded-lg object-cover"
                          />

                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-bold">{portfolio.title}</h3>

                            {portfolio.category && (
                              <span className="badge mt-2 inline-flex">
                                {portfolio.category}
                              </span>
                            )}

                            <div className="mt-3 flex gap-3 text-sm text-muted">
                              <span>♥ {portfolio.likesCount || 0}</span>
                              <span>👁 {portfolio.views || 0}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
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
      {selectedPortfolioId && (
        <PortfolioModalShell onClose={handleClosePortfolio}>
          <PortfolioDetailClient
            key={selectedPortfolioId}
            portfolioId={selectedPortfolioId}
            mode="modal"
            onDeleted={handleDeletedPortfolio}
          />
        </PortfolioModalShell>
      )}
    </section>
  );
}
