"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import FollowButton from "./components/FollowButton";
import UserStats from "./components/UserStats";
import {
  getMockProfileData,
  type ProfilePortfolio,
  type ProfileUser,
} from "./profileMockData";

type ProfileClientProps = {
  userId: string;
};

type ProfileState = {
  user: ProfileUser | null;
  portfolios: ProfilePortfolio[];
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const LOCAL_PORTFOLIOS_KEY = "artfolio-local-portfolios";

function extractUser(data: unknown): ProfileUser | null {
  const value = data as {
    user?: ProfileUser;
    data?: {
      user?: ProfileUser;
    };
  };

  return value.user || value.data?.user || null;
}

function extractPortfolios(data: unknown, userId: string): ProfilePortfolio[] {
  const value = data as {
    portfolios?: unknown[];
    data?: {
      portfolios?: unknown[];
    };
  };

  const rawItems = value.portfolios || value.data?.portfolios || [];

  return rawItems.map((item) => {
    const portfolio = item as {
      _id?: string;
      id?: string;
      slug?: string;
      title?: string;
      description?: string;
      images?: string[];
      image?: string;
      category?: ProfilePortfolio["category"];
      tags?: string[];
      likesCount?: number;
      commentsCount?: number;
      comments?: unknown[];
      createdAt?: string;
      user?: {
        _id?: string;
        id?: string;
      };
    };

    const id = portfolio._id || portfolio.id || portfolio.slug || "";

    return {
      id,
      slug: portfolio.slug || id,
      title: portfolio.title || "Untitled Portfolio",
      description: portfolio.description || "",
      image: portfolio.image || portfolio.images?.[0] || "/next.svg",
      category: portfolio.category || "other",
      tags: portfolio.tags || [],
      likesCount: portfolio.likesCount || 0,
      commentsCount: portfolio.commentsCount || portfolio.comments?.length || 0,
      userId: portfolio.user?._id || portfolio.user?.id || userId,
      createdAt: portfolio.createdAt || new Date().toISOString(),
    };
  });
}

function readLocalUploadedPortfolios(userId: string): ProfilePortfolio[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(LOCAL_PORTFOLIOS_KEY);
    const items = raw ? (JSON.parse(raw) as unknown[]) : [];

    return items
      .filter((item) => {
        const portfolio = item as {
          user?: {
            id?: string;
            _id?: string;
          };
          author?: {
            id?: string;
            _id?: string;
          };
        };

        const ownerId =
          portfolio.user?.id ||
          portfolio.user?._id ||
          portfolio.author?.id ||
          portfolio.author?._id;

        return ownerId === userId;
      })
      .map((item) => {
        const portfolio = item as {
          _id?: string;
          id?: string;
          slug?: string;
          title?: string;
          description?: string;
          images?: string[];
          image?: string;
          category?: ProfilePortfolio["category"];
          tags?: string[];
          likesCount?: number;
          commentsCount?: number;
          comments?: unknown[];
          createdAt?: string;
        };

        const id = portfolio._id || portfolio.id || portfolio.slug || "";

        return {
          id,
          slug: portfolio.slug || id,
          title: portfolio.title || "Untitled Portfolio",
          description: portfolio.description || "",
          image: portfolio.image || portfolio.images?.[0] || "/next.svg",
          category: portfolio.category || "other",
          tags: portfolio.tags || [],
          likesCount: portfolio.likesCount || 0,
          commentsCount:
            portfolio.commentsCount || portfolio.comments?.length || 0,
          userId,
          createdAt: portfolio.createdAt || new Date().toISOString(),
        };
      });
  } catch {
    return [];
  }
}

function mergePortfolios(items: ProfilePortfolio[]) {
  const existed = new Set<string>();

  return items.filter((item) => {
    const key = item.id || item.slug;

    if (existed.has(key)) {
      return false;
    }

    existed.add(key);
    return true;
  });
}

async function loadProfileData(userId: string): Promise<ProfileState> {
  const fallbackData = getMockProfileData(userId);

  try {
    const [userResponse, portfoliosResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/api/users/${userId}`, {
        cache: "no-store",
      }),
      fetch(`${API_BASE_URL}/api/portfolios?user=${userId}`, {
        cache: "no-store",
      }),
    ]);

    if (!userResponse.ok || !portfoliosResponse.ok) {
      return fallbackData;
    }

    const [userData, portfoliosData] = await Promise.all([
      userResponse.json(),
      portfoliosResponse.json(),
    ]);

    const user = extractUser(userData);
    const portfolios = extractPortfolios(portfoliosData, userId);

    if (!user) {
      return fallbackData;
    }

    return {
      user,
      portfolios,
    };
  } catch {
    return fallbackData;
  }
}

export default function ProfileClient({ userId }: ProfileClientProps) {
  const [profileState, setProfileState] = useState<ProfileState>({
    user: null,
    portfolios: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function run() {
      setIsLoading(true);
      setErrorMessage("");

      const data = await loadProfileData(userId);

      if (!isMounted) return;

      const localPortfolios = readLocalUploadedPortfolios(userId);

      setProfileState({
        user: data.user,
        portfolios: mergePortfolios([...localPortfolios, ...data.portfolios]),
      });

      if (!data.user) {
        setErrorMessage("Không tìm thấy hồ sơ người dùng.");
      }

      setIsLoading(false);
    }

    run();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const totalLikes = useMemo(
    () =>
      profileState.portfolios.reduce(
        (total, portfolio) => total + portfolio.likesCount,
        0
      ),
    [profileState.portfolios]
  );

  function handleFollowerChange(delta: number) {
    setProfileState((current) => {
      if (!current.user) return current;

      return {
        ...current,
        user: {
          ...current.user,
          followersCount: Math.max(0, current.user.followersCount + delta),
        },
      };
    });
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background py-10">
        <div className="app-container">
          <div className="surface rounded-2xl p-8">
            <p className="font-semibold">Đang tải hồ sơ...</p>
            <p className="mt-2 text-sm text-muted">
              Hệ thống đang tải thông tin người dùng và danh sách tác phẩm.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!profileState.user) {
    return (
      <main className="min-h-screen bg-background py-10">
        <div className="app-container">
          <div className="surface rounded-2xl p-8 text-center">
            <h1 className="text-2xl font-bold">Không tìm thấy hồ sơ</h1>
            <p className="mt-2 text-muted">
              {errorMessage || "Người dùng không tồn tại hoặc đã bị xóa."}
            </p>
            <Link href="/" className="btn btn-primary mt-5">
              Quay về trang chủ
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const user = profileState.user;

  return (
    <main className="min-h-screen bg-background py-8 sm:py-12">
      <div className="app-container">
        <section className="surface overflow-hidden rounded-2xl">
          <div className="h-36 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500" />

          <div className="p-5 sm:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <img
                  src={user.avatar || "/next.svg"}
                  alt={user.name}
                  className="-mt-16 h-28 w-28 rounded-full border-4 border-background object-cover"
                />

                <div>
                  <p className="text-sm font-bold uppercase text-primary">
                    Public Profile
                  </p>
                  <h1 className="mt-1 text-3xl font-bold">{user.name}</h1>
                  <p className="mt-1 text-sm text-muted">{user.email}</p>
                  {user.location && (
                    <p className="mt-1 text-sm text-muted">{user.location}</p>
                  )}
                </div>
              </div>

              <div className="w-full md:w-56">
                <FollowButton
                  targetUserId={user.id}
                  onFollowerChange={handleFollowerChange}
                />
              </div>
            </div>

            <p className="mt-6 max-w-3xl leading-7 text-muted">{user.bio}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {user.skills.map((skill) => (
                <span key={skill} className="badge">
                  {skill}
                </span>
              ))}
            </div>

            <div className="mt-6">
              <UserStats
                portfoliosCount={profileState.portfolios.length}
                followersCount={user.followersCount}
                followingCount={user.followingCount}
                totalLikes={totalLikes}
              />
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase text-primary">
                Portfolio
              </p>
              <h2 className="text-2xl font-bold">Tác phẩm của {user.name}</h2>
            </div>

            <p className="text-sm text-muted">
              {profileState.portfolios.length} tác phẩm được hiển thị
            </p>
          </div>

          {profileState.portfolios.length === 0 ? (
            <div className="surface rounded-2xl p-8 text-center">
              <p className="font-semibold">Người dùng chưa có tác phẩm.</p>
              <p className="mt-2 text-sm text-muted">
                Khi người dùng đăng portfolio, danh sách sẽ hiển thị tại đây.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {profileState.portfolios.map((portfolio) => (
                <Link
                  key={portfolio.id}
                  href={`/portfolio/${portfolio.slug || portfolio.id}`}
                  className="surface group overflow-hidden rounded-2xl transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-surface-soft">
                    <img
                      src={portfolio.image}
                      alt={portfolio.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>

                  <div className="p-4">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="badge">{portfolio.category}</span>
                      {portfolio.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="badge">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <h3 className="text-lg font-bold">{portfolio.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-muted">
                      {portfolio.description}
                    </p>

                    <div className="mt-4 flex items-center justify-between text-sm text-muted">
                      <span>♥ {portfolio.likesCount}</span>
                      <span>{portfolio.commentsCount} bình luận</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}