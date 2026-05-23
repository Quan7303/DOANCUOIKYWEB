import type { PortfolioDetail, PortfolioSummary } from "../types/api";

export const portfolios: PortfolioDetail[] = [
  {
    _id: "aurora-brand-system",
    title: "Aurora Brand System",
    description:
      "Bộ nhận diện thương hiệu cho studio thiết kế độc lập, tập trung vào guideline màu, typography và ứng dụng social media.",
    images: [
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&q=80",
    ],
    colors: ["#2563eb", "#f59e0b", "#0f766e"],
    category: "design",
    tags: ["branding", "identity", "social"],
    likesCount: 184,
    views: 2910,
    likes: ["u2", "u4", "u6"],
    createdAt: "2026-04-12T09:00:00.000Z",
    user: {
      _id: "u1",
      name: "Nguyen Minh Anh",
      avatar: "https://i.pravatar.cc/80?img=1",
    },
  },
  {
    _id: "saigon-night-photo",
    title: "Saigon Night Photo Essay",
    description:
      "Chuỗi ảnh đường phố ban đêm ghi lại tương phản ánh đèn, chuyển động và sinh hoạt đô thị.",
    images: [
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200&q=80",
    ],
    colors: ["#111827", "#e11d48", "#facc15"],
    category: "photo",
    tags: ["street", "night", "city"],
    likesCount: 256,
    views: 4380,
    likes: ["u1", "u5"],
    createdAt: "2026-03-22T15:30:00.000Z",
    user: {
      _id: "u2",
      name: "Tran Gia Bao",
      avatar: "https://i.pravatar.cc/80?img=2",
    },
  },
  {
    _id: "finflow-dashboard",
    title: "FinFlow Dashboard UI",
    description:
      "Dashboard tài chính tối ưu cho việc scan số liệu, so sánh dòng tiền và thao tác lặp lại hằng ngày.",
    images: [
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80",
    ],
    colors: ["#0f172a", "#22c55e", "#38bdf8"],
    category: "design",
    tags: ["dashboard", "fintech", "ux"],
    likesCount: 341,
    views: 5120,
    likes: ["u3", "u7"],
    createdAt: "2026-02-18T08:15:00.000Z",
    user: {
      _id: "u3",
      name: "Le Khanh Linh",
      avatar: "https://i.pravatar.cc/80?img=3",
    },
  },
  {
    _id: "paper-bloom-illustration",
    title: "Paper Bloom Illustration",
    description:
      "Series minh họa hoa giấy dùng cho campaign mùa xuân, kết hợp texture thủ công và bảng màu tươi.",
    images: [
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1200&q=80",
    ],
    colors: ["#ec4899", "#f97316", "#84cc16"],
    category: "art",
    tags: ["illustration", "botanical", "campaign"],
    likesCount: 119,
    views: 1844,
    likes: ["u1"],
    createdAt: "2026-01-30T10:45:00.000Z",
    user: {
      _id: "u4",
      name: "Pham Ha Vy",
      avatar: "https://i.pravatar.cc/80?img=4",
    },
  },
  {
    _id: "modular-chair-3d",
    title: "Modular Chair 3D Study",
    description:
      "Nghiên cứu sản phẩm 3D cho ghế module, nhấn vào vật liệu, ánh sáng studio và khả năng thay đổi layout.",
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80",
    ],
    colors: ["#f8fafc", "#64748b", "#b45309"],
    category: "3d",
    tags: ["product", "render", "furniture"],
    likesCount: 207,
    views: 3720,
    likes: ["u2", "u8"],
    createdAt: "2026-04-01T11:20:00.000Z",
    user: {
      _id: "u5",
      name: "Do Thanh Nam",
      avatar: "https://i.pravatar.cc/80?img=5",
    },
  },
  {
    _id: "type-specimen-vietnam",
    title: "Type Specimen Vietnam",
    description:
      "Trang specimen cho bộ chữ display hỗ trợ tiếng Việt, có layout poster, quote và bảng ký tự.",
    images: [
      "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=1200&q=80",
    ],
    colors: ["#991b1b", "#f8fafc", "#1f2937"],
    category: "other",
    tags: ["typography", "poster", "vietnamese"],
    likesCount: 92,
    views: 1510,
    likes: ["u6"],
    createdAt: "2026-03-09T07:30:00.000Z",
    user: {
      _id: "u6",
      name: "Hoang Phuc",
      avatar: "https://i.pravatar.cc/80?img=6",
    },
  },
  {
    _id: "healthcare-mobile-flow",
    title: "Healthcare Mobile Flow",
    description:
      "Thiết kế mobile app đặt lịch khám, nhắc thuốc và theo dõi chỉ số sức khỏe với luồng form ngắn.",
    images: [
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1200&q=80",
    ],
    colors: ["#14b8a6", "#e0f2fe", "#334155"],
    category: "design",
    tags: ["healthcare", "mobile", "forms"],
    likesCount: 168,
    views: 2675,
    likes: ["u1", "u2"],
    createdAt: "2026-02-05T13:40:00.000Z",
    user: {
      _id: "u7",
      name: "Bui Mai Chi",
      avatar: "https://i.pravatar.cc/80?img=7",
    },
  },
  {
    _id: "ink-motion-art",
    title: "Ink Motion Art Direction",
    description:
      "Art direction cho bộ ảnh chuyển động mực màu, dùng cho visual key của sự kiện sáng tạo.",
    images: [
      "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1200&q=80",
    ],
    colors: ["#7c3aed", "#06b6d4", "#f43f5e"],
    category: "art",
    tags: ["abstract", "motion", "color"],
    likesCount: 224,
    views: 3099,
    likes: ["u3", "u4"],
    createdAt: "2026-01-14T16:00:00.000Z",
    user: {
      _id: "u8",
      name: "Vo Minh Quan",
      avatar: "https://i.pravatar.cc/80?img=8",
    },
  },
];

export async function getFeaturedPortfolios(): Promise<PortfolioSummary[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const res = await fetch(`${apiUrl}/portfolios?page=1&limit=8`, {
      next: { revalidate: 3600 },
    });
    
    if (res.ok) {
      const json = await res.json();
      if (json.status === "success" && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    console.error("Failed to fetch portfolios from API, falling back to mock data:", err);
  }

  // Fallback
  return portfolios.map((portfolio) => ({
    _id: portfolio._id,
    title: portfolio.title,
    images: portfolio.images,
    colors: portfolio.colors,
    category: portfolio.category,
    tags: portfolio.tags,
    likesCount: portfolio.likesCount,
    user: portfolio.user,
  }));
}

export async function getPortfolioById(
  id: string,
): Promise<PortfolioDetail | undefined> {
  return portfolios.find((portfolio) => portfolio._id === id);
}

export function getAllPortfolioIds() {
  return portfolios.map((portfolio) => portfolio._id);
}
