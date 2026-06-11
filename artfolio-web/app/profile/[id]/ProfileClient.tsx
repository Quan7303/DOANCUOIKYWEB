"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Mail, LayoutGrid, Heart as HeartIcon, Info } from "lucide-react";
import FollowButton from "./components/FollowButton";
import UserStats from "./components/UserStats";
import StateBlock from "../../components/StateBlock";
import ExportPdfButton from "../../components/ExportPdfButton";
import { useAuthStore } from "../../store/useAuthStore";
import { getApiUrl } from "../../utils/apiConfig";
import PortfolioModalShell from "../../components/PortfolioModalShell";
import PortfolioDetailClient from "../../portfolio/[id]/PortfolioDetailClient";

type ProfileClientProps = {
  userId: string;
};

// Kiểu dữ liệu khớp với MongoDB
type MongoUser = {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  skills?: string[];
  experience?: string[];
  socialLinks?: {
    github?: string;
    instagram?: string;
    behance?: string;
    linkedin?: string;
  };
  followersCount: number;
  followingCount: number;
  followers?: string[];
};

type MongoPortfolio = {
  _id: string;
  title: string;
  description?: string;
  images: string[];
  category: string;
  tags?: string[];
  likesCount: number;
  commentsCount?: number;
  views: number;
  createdAt: string;
};

type ProfileState = {
  user: MongoUser | null;
  portfolios: MongoPortfolio[];
};

async function loadProfileData(userId: string): Promise<ProfileState> {
  try {
    const response = await fetch(getApiUrl(`users/${userId}`), {
      cache: "no-store",
    });

    if (!response.ok) {
      return { user: null, portfolios: [] };
    }

    const { data } = await response.json();
    if (!data) {
      return { user: null, portfolios: [] };
    }

    const user: MongoUser = {
      _id: data._id,
      name: data.name,
      email: data.email,
      avatar: data.avatar,
      bio: data.bio || data.portfolioDescription,
      location: data.location,
      skills: data.skills || [],
      experience: data.experience || [],
      socialLinks: data.socialLinks || {},
      followersCount: data.followersCount || 0,
      followingCount: data.followingCount || 0,
      followers: data.followers || [],
    };
    const portfolios: MongoPortfolio[] = data.portfolios || [];

    return { user, portfolios };
  } catch (err) {
    console.error("Lỗi fetch profile API:", err);
    return { user: null, portfolios: [] };
  }
}

export default function ProfileClient({ userId }: ProfileClientProps) {
  const { user: currentUser } = useAuthStore();
  
  const [profileState, setProfileState] = useState<ProfileState>({
    user: null,
    portfolios: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [initialFollowing, setInitialFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<"works" | "about">("works");
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    async function run() {
      setIsLoading(true);
      setErrorMessage("");

      const data = await loadProfileData(userId);

      if (!isMounted) return;

      setProfileState({
        user: data.user,
        portfolios: data.portfolios,
      });

      if (!data.user) {
        setErrorMessage("Không tìm thấy hồ sơ người dùng.");
      } else if (currentUser) {
        const followers = data.user.followers || [];
        setInitialFollowing(followers.includes(currentUser._id || currentUser.id));
      }

      setIsLoading(false);
    }

    run();

    return () => {
      isMounted = false;
    };
  }, [userId, currentUser]);

  const totalLikes = profileState.portfolios.reduce(
    (total, portfolio) => total + (portfolio.likesCount || 0),
    0
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
  function handleOpenPortfolio(portfolioId: string) {
    setSelectedPortfolioId(portfolioId);
  }

  function handleClosePortfolio() {
    setSelectedPortfolioId(null);
  }
  useEffect(() => {
  function handlePortfolioLikeChanged(event: Event) {
    const customEvent = event as CustomEvent<{
      portfolioId?: string;
      likesCount?: number;
    }>;

    const portfolioId = customEvent.detail?.portfolioId;
    const likesCount = customEvent.detail?.likesCount;

    if (!portfolioId || typeof likesCount !== "number") return;

    setProfileState((current) => ({
      ...current,
      portfolios: current.portfolios.map((portfolio) =>
        portfolio._id === portfolioId
          ? {
              ...portfolio,
              likesCount,
            }
          : portfolio,
      ),
    }));
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

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <StateBlock type="loading" title="Đang tải hồ sơ..." />
      </main>
    );
  }

  if (!profileState.user) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <StateBlock
          type="error"
          title="Không tìm thấy hồ sơ"
          description={errorMessage || "Người dùng không tồn tại hoặc đã bị xóa khỏi hệ thống."}
          actionLabel="Về trang chủ"
          actionHref="/"
        />
      </main>
    );
  }

  const user = profileState.user;

  return (
    <main className="min-h-screen bg-background pb-12">
      {/* Parallax Cover Photo (Sử dụng CSS sticky + âm z-index để tạo parallax fake nhẹ) */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden bg-surface-soft">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/40 via-accent/40 to-primary/40 opacity-80" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2000')] bg-cover bg-center mix-blend-overlay opacity-30" />
      </div>

      <div className="app-container relative -mt-24 sm:-mt-32">
        <section className="surface rounded-3xl p-6 sm:p-10 shadow-2xl shadow-primary/5">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            
            {/* Avatar & Basic Info */}
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative h-32 w-32 shrink-0 md:h-40 md:w-40">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary to-accent blur-md opacity-50" />
                {user.avatar && user.avatar !== "default-avatar.png" ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="relative h-full w-full rounded-full border-4 border-surface object-cover shadow-lg"
                  />
                ) : (
                  <div className="relative grid h-full w-full place-items-center rounded-full border-4 border-surface bg-primary text-4xl font-extrabold text-white shadow-lg">
                    {user.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="pt-2 sm:pt-0">
                <h1 className="text-3xl font-extrabold sm:text-4xl">{user.name}</h1>
                <div className="mt-2 flex flex-col gap-2 text-sm text-muted sm:flex-row sm:items-center">
                  <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> {user.email}</span>
                  {user.location && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {user.location}</span>
                    </>
                  )}
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
            </div>

            {/* Actions (Follow & Export PDF) */}
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row md:flex-col lg:flex-row pt-2">
              <div className="w-full sm:w-48">
                <FollowButton
                  targetUserId={user._id}
                  initialFollowing={initialFollowing}
                  onFollowerChange={handleFollowerChange}
                />
              </div>
              <div className="w-full sm:w-48">
                <ExportPdfButton
                  profile={{
                    name: user.name,
                    title: user.bio || "Thành viên Artfolio",
                    email: user.email,
                    skills: user.skills || [],
                    experience: user.experience || [],
                    socialLinks: Object.values(user.socialLinks || {}).filter(Boolean),
                    works: profileState.portfolios.map((p) => ({
                      title: p.title,
                      category: p.category,
                      description: p.description,
                      image: p.images?.[0] || "/next.svg",
                    })),
                  }}
                />
              </div>
            </div>
          </div>

          {/* Animated Tabs */}
          <div className="mt-10 border-b border-border">
            <nav className="flex gap-8">
              <button
                onClick={() => setActiveTab("works")}
                className={`relative pb-4 text-sm font-bold uppercase tracking-wider transition-colors ${
                  activeTab === "works" ? "text-primary" : "text-muted hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-2"><LayoutGrid className="h-4 w-4" /> Tác phẩm</span>
                {activeTab === "works" && (
                  <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("about")}
                className={`relative pb-4 text-sm font-bold uppercase tracking-wider transition-colors ${
                  activeTab === "about" ? "text-primary" : "text-muted hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-2"><Info className="h-4 w-4" /> Giới thiệu</span>
                {activeTab === "about" && (
                  <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            </nav>
          </div>
        </section>

        {/* Tab Content */}
        <section className="mt-8">
          <AnimatePresence mode="wait">
            {activeTab === "works" && (
              <motion.div
                key="works"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {profileState.portfolios.length === 0 ? (
                  <StateBlock
                    type="empty"
                    title="Chưa có tác phẩm nào"
                    description="Người dùng này chưa chia sẻ tác phẩm nào lên cộng đồng."
                  />
                ) : (
                  <div className="masonry-grid">
                    {profileState.portfolios.map((portfolio) => (
                      <button
                        key={portfolio._id}
                        type="button"
                        onClick={() => handleOpenPortfolio(portfolio._id)}
                        className="masonry-item surface group block w-full overflow-hidden rounded-2xl text-left transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10"
                      >
                        <div className="aspect-[4/3] w-full overflow-hidden bg-surface-soft">
                          <img
                            src={portfolio.images?.[0] || "/next.svg"}
                            alt={portfolio.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                          />
                        </div>

                        <div className="p-5">
                          <div className="mb-3 flex flex-wrap gap-2">
                            <span className="badge text-xs">{portfolio.category}</span>
                            {portfolio.tags?.slice(0, 2).map((tag) => (
                              <span key={tag} className="text-xs font-medium text-muted-foreground">
                                #{tag}
                              </span>
                            ))}
                          </div>

                          <h3 className="text-lg font-bold transition-colors group-hover:text-primary">
                            {portfolio.title}
                          </h3>

                          {portfolio.description && (
                            <p className="mt-2 line-clamp-2 text-sm text-muted">
                              {portfolio.description}
                            </p>
                          )}

                          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4 text-sm text-muted">
                            <span className="flex items-center gap-1">
                              <HeartIcon className="h-4 w-4" /> {portfolio.likesCount || 0}
                            </span>
                            <span>{portfolio.views || 0} lượt xem</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "about" && (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="surface rounded-2xl p-8 lg:w-2/3"
              >
                <h3 className="text-xl font-bold mb-4">Giới thiệu về tôi</h3>
                <p className="leading-relaxed text-muted whitespace-pre-wrap">
                  {user.bio || "Thành viên này chưa cập nhật phần giới thiệu bản thân."}
                </p>

                {user.skills && user.skills.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-xl font-bold mb-4">Kỹ năng chuyên môn</h3>
                    <div className="flex flex-wrap gap-3">
                      {user.skills.map((skill) => (
                        <span key={skill} className="rounded-lg bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-semibold text-primary">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {user.experience && user.experience.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-xl font-bold mb-4">Kinh nghiệm</h3>
                    <ul className="grid gap-3">
                      {user.experience.map((item) => (
                        <li
                          key={item}
                          className="rounded-lg border border-border bg-surface-soft px-4 py-3 text-sm leading-6 text-muted"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {user.socialLinks &&
                  Object.values(user.socialLinks).some(Boolean) && (
                    <div className="mt-8">
                      <h3 className="text-xl font-bold mb-4">Liên kết cá nhân</h3>

                      <div className="flex flex-wrap gap-3">
                        {user.socialLinks.github && (
                          <a
                            href={user.socialLinks.github}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary"
                          >
                            GitHub
                          </a>
                        )}

                        {user.socialLinks.instagram && (
                          <a
                            href={user.socialLinks.instagram}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary"
                          >
                            Instagram
                          </a>
                        )}

                        {user.socialLinks.behance && (
                          <a
                            href={user.socialLinks.behance}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary"
                          >
                            Behance
                          </a>
                        )}

                        {user.socialLinks.linkedin && (
                          <a
                            href={user.socialLinks.linkedin}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary"
                          >
                            LinkedIn
                          </a>
                        )}
                      </div>
                    </div>
                  )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
      {selectedPortfolioId && (
        <PortfolioModalShell onClose={handleClosePortfolio}>
          <PortfolioDetailClient
            key={selectedPortfolioId}
            portfolioId={selectedPortfolioId}
            mode="modal"
          />
        </PortfolioModalShell>
      )}
    </main>
  );
}
