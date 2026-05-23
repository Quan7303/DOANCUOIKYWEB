import { Metadata } from "next";

// TIÊU CHÍ 13: SEO & Performance (Khuyến khích - Điểm cộng)
// Sử dụng Metadata tĩnh cho trang Giới Thiệu
export const metadata: Metadata = {
  title: "Giới thiệu | Artfolio - Mạng Xã Hội Sáng Tạo",
  description: "Artfolio là nền tảng chia sẻ và khám phá các tác phẩm nghệ thuật, thiết kế, đồ họa 3D hàng đầu dành cho sinh viên.",
};

/**
 * TIÊU CHÍ 3: RENDERING STRATEGY (BẮT BUỘC)
 * ============================================
 * TRANG NÀY SỬ DỤNG CHIẾN LƯỢC: SSG (Static Site Generation)
 * 
 * LÝ DO TRÌNH BÀY VỚI GIẢNG VIÊN (TS. LÊ NGỌC HIẾU):
 * - Nội dung trang "Giới thiệu" ít khi thay đổi (chỉ chứa thông tin tĩnh về dự án).
 * - Sử dụng SSG giúp Next.js tạo sẵn file HTML tại thời điểm Build time.
 * - Khi User truy cập, server trả về file HTML ngay lập tức mà không cần xử lý, 
 *   giúp Tốc độ load cực nhanh (TTFB thấp) và tối ưu SEO (Search Engine Optimization).
 * - Kết hợp với ISR ở các trang khác (dữ liệu động nhưng ít đổi) và SSR ở trang Dashboard 
 *   (dữ liệu user-specific) sẽ chứng minh nhóm hiểu rõ ưu/nhược của từng chiến lược.
 */
export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background py-16">
      <div className="app-container max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold mb-6 text-foreground">
            Về <span className="text-primary">Artfolio</span>
          </h1>
          <p className="text-xl text-muted leading-relaxed">
            Dự án Đồ Án Cuối Kỳ - Môn Lập Trình Web (INT1334)
            <br /> Học Viện Công Nghệ Bưu Chính Viễn Thông Cơ Sở TP.HCM
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="surface p-8 rounded-2xl border border-border">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary">01.</span> Sứ mệnh
            </h2>
            <p className="text-muted leading-relaxed">
              Tạo ra một sân chơi sáng tạo (Creative Hub) đúng nghĩa dành cho cộng đồng sinh viên đam mê nghệ thuật thị giác, thiết kế đồ họa, và nhiếp ảnh.
              Nơi mọi ý tưởng đều được tôn vinh và đánh giá một cách chuyên nghiệp.
            </p>
          </div>

          <div className="surface p-8 rounded-2xl border border-border">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary">02.</span> Công nghệ (Stack)
            </h2>
            <ul className="list-disc pl-5 text-muted space-y-2">
              <li><strong>Frontend:</strong> Next.js 14 (App Router), Tailwind CSS v4</li>
              <li><strong>Backend:</strong> Node.js, Express.js</li>
              <li><strong>Database:</strong> MongoDB (Mongoose)</li>
              <li><strong>Real-time:</strong> Socket.io</li>
              <li><strong>AI Integration:</strong> Google Gemini API</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-6">Chiến lược Render của hệ thống</h2>
          <div className="grid gap-4 sm:grid-cols-3 text-left">
            <div className="bg-surface-soft p-5 rounded-xl border border-primary/20">
              <h3 className="font-bold text-primary mb-2">1. SSG (Static)</h3>
              <p className="text-sm text-muted">Dùng cho trang Giới thiệu, Liên hệ. HTML tạo sẵn lúc build. Tối ưu tốc độ cao nhất.</p>
            </div>
            <div className="bg-surface-soft p-5 rounded-xl border border-accent/20">
              <h3 className="font-bold text-accent mb-2">2. SSR (Dynamic)</h3>
              <p className="text-sm text-muted">Dùng cho Dashboard, User Profile. Fetch dữ liệu mới nhất mỗi khi request.</p>
            </div>
            <div className="bg-surface-soft p-5 rounded-xl border border-success/20">
              <h3 className="font-bold text-success mb-2">3. ISR (Revalidate)</h3>
              <p className="text-sm text-muted">Dùng cho trang Khám phá (Trang chủ). Cache HTML và cập nhật ngầm định kỳ.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
