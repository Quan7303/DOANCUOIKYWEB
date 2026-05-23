export type ProfileUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatar?: string;
  bio: string;
  location?: string;
  skills: string[];
  followersCount: number;
  followingCount: number;
  createdAt: string;
  socialLinks?: {
    github?: string;
    behance?: string;
    linkedin?: string;
    website?: string;
  };
};

export type ProfilePortfolio = {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  category: "design" | "art" | "photo" | "3d" | "other";
  tags: string[];
  likesCount: number;
  commentsCount: number;
  userId: string;
  createdAt: string;
};

export const mockProfileUsers: ProfileUser[] = [
  {
    id: "u1",
    name: "Nguyen Minh Anh",
    email: "minhanh@artfolio.vn",
    role: "user",
    avatar: "https://i.pravatar.cc/160?img=1",
    bio: "UI/UX Designer yêu thích xây dựng hệ thống nhận diện thương hiệu, landing page và trải nghiệm sản phẩm số.",
    location: "Ho Chi Minh City, Vietnam",
    skills: ["UI/UX", "Branding", "Figma", "React", "Tailwind CSS"],
    followersCount: 186,
    followingCount: 42,
    createdAt: "2026-04-12T00:00:00.000Z",
    socialLinks: {
      github: "https://github.com",
      behance: "https://behance.net",
      linkedin: "https://linkedin.com",
    },
  },
  {
    id: "u2",
    name: "Tran Gia Bao",
    email: "giabao@artfolio.vn",
    role: "user",
    avatar: "https://i.pravatar.cc/160?img=2",
    bio: "Photographer tập trung vào street photography, màu sắc đô thị và câu chuyện đời sống.",
    location: "Da Nang, Vietnam",
    skills: ["Photography", "Lightroom", "Color Grading", "Storytelling"],
    followersCount: 128,
    followingCount: 35,
    createdAt: "2026-04-15T00:00:00.000Z",
    socialLinks: {
      behance: "https://behance.net",
      website: "https://example.com",
    },
  },
  {
    id: "u3",
    name: "Le Khanh Linh",
    email: "khanhlinh@artfolio.vn",
    role: "admin",
    avatar: "https://i.pravatar.cc/160?img=3",
    bio: "Product designer quan tâm tới dashboard, dữ liệu trực quan và thiết kế giao diện cho sản phẩm fintech.",
    location: "Ha Noi, Vietnam",
    skills: ["Product Design", "Dashboard", "Data UI", "UX Research"],
    followersCount: 241,
    followingCount: 58,
    createdAt: "2026-04-20T00:00:00.000Z",
    socialLinks: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
    },
  },
];

export const mockProfilePortfolios: ProfilePortfolio[] = [
  {
    id: "aurora-brand-system",
    slug: "aurora-brand-system",
    title: "Aurora Brand System",
    description:
      "Bộ nhận diện thương hiệu cho studio thiết kế độc lập, tập trung vào guideline màu và typography.",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900",
    category: "design",
    tags: ["branding", "identity", "social"],
    likesCount: 184,
    commentsCount: 6,
    userId: "u1",
    createdAt: "2026-04-12T00:00:00.000Z",
  },
  {
    id: "creative-landing-page",
    slug: "creative-landing-page",
    title: "Creative Landing Page",
    description:
      "Giao diện landing page sáng tạo dùng Next.js và Tailwind CSS.",
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900",
    category: "design",
    tags: ["ui", "landing", "nextjs"],
    likesCount: 45,
    commentsCount: 6,
    userId: "u1",
    createdAt: "2026-04-18T00:00:00.000Z",
  },
  {
    id: "saigon-night-photo",
    slug: "saigon-night-photo",
    title: "Saigon Night Photo Essay",
    description:
      "Bộ ảnh đường phố ban đêm, khai thác ánh sáng neon và chuyển động đô thị.",
    image:
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=900",
    category: "photo",
    tags: ["street", "night", "city"],
    likesCount: 256,
    commentsCount: 12,
    userId: "u2",
    createdAt: "2026-04-16T00:00:00.000Z",
  },
  {
    id: "finflow-dashboard",
    slug: "finflow-dashboard",
    title: "FinFlow Dashboard UI",
    description:
      "Dashboard quản lý tài chính cá nhân với biểu đồ, chỉ số và bảng giao dịch.",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900",
    category: "design",
    tags: ["dashboard", "fintech", "ux"],
    likesCount: 341,
    commentsCount: 9,
    userId: "u3",
    createdAt: "2026-04-21T00:00:00.000Z",
  },
];

export function getMockProfileData(userId: string) {
  const user = mockProfileUsers.find((item) => item.id === userId) || null;

  if (!user) {
    return {
      user: null,
      portfolios: [],
    };
  }

  return {
    user,
    portfolios: mockProfilePortfolios.filter(
      (portfolio) => portfolio.userId === user.id
    ),
  };
}