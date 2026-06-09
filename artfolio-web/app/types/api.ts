export type PortfolioCategory = "design" | "art" | "photo" | "3d" | "other";

export type PortfolioSummary = {
  _id: string;
  title: string;
  images: string[];
  colors: string[];
  category: PortfolioCategory;
  tags: string[];
  likesCount: number;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
};

export type PortfolioDetail = PortfolioSummary & {
  description: string;
  views: number;
  likes: string[];
  createdAt: string;
};

export type PortfolioComment = {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  text: string;
  createdAt: string;
};

export type ApiListResponse<T> = {
  status: "success";
  results: number;
  totalPages: number;
  data: T[];
};

export type AuthUser = {
  _id?: string;
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatar?: string;
  portfolioTitle?: string;
  portfolioDescription?: string;
  skills?: string[];
  experience?: string[];
  socialLinks?: {
    github?: string;
    instagram?: string;
    behance?: string;
    linkedin?: string;
  };
  followers?: string[];
  following?: string[];
  followersCount?: number;
  followingCount?: number;
};

export type AuthStoreContract = {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  verifySignupOtp: (payload: { email: string; otp: string }) => Promise<void>;
  resendSignupOtp: (email: string) => Promise<string | undefined>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
};

export type PortfolioPdfProfile = {
  name: string;
  email: string;
  title: string;
  skills: string[];
  experience: string[];
  socialLinks: string[];
  totalLikes?: number;
  totalViews?: number;
  works: Array<{
    title: string;
    category: string;
    description?: string;
    image?: string;
    likesCount?: number;
    views?: number;
    tags?: string[];
  }>;
};
