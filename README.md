# 🎨 ArtFolio - Nền tảng chia sẻ Danh mục Nghệ thuật

![Next.js](https://img.shields.io/badge/Next.js%2016-black?style=for-the-badge&logo=next.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini_AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)

**ArtFolio** là nền tảng mạng xã hội và không gian danh mục đầu tư (portfolio) chuyên nghiệp dành riêng cho các nghệ sĩ, họa sĩ và nhà thiết kế kỹ thuật số. Dự án là Đồ Án Cuối Kỳ Web được phát triển bởi **Nhóm 1B LTWEB D23CN**

---

## 🌟 Mô tả Chức năng (Key Features)

Dự án cung cấp một hệ sinh thái đầy đủ cho các nhà sáng tạo nội dung số:

### 1. Dành cho Người dùng (Nghệ sĩ & Người xem)

* **👤 Quản lý Tài khoản & Hồ sơ:** Đăng nhập an toàn (có hỗ trợ Google OAuth). Người dùng có thể tùy biến trang cá nhân (Portfolio), ảnh đại diện, và thông tin giới thiệu bản thân.
* **🖼️ Đăng tải & Quản lý Tác phẩm:** Đăng tải hình ảnh tác phẩm nghệ thuật với chất lượng cao (lưu trữ trên Cloudinary). Quản lý bài đăng, chỉnh sửa mô tả và gắn thẻ (Tags).
* **❤️ Tương tác Xã hội:** Tính năng Like (Thả tim), Comment (Bình luận) và Follow (Theo dõi) nghệ sĩ yêu thích.
* **💬 Nhắn tin Trực tiếp (Real-time):** Trò chuyện riêng tư giữa các người dùng theo thời gian thực nhờ công nghệ Socket.io.
* **🔔 Hệ thống Thông báo:** Nhận thông báo ngay lập tức khi có người tương tác với tác phẩm hoặc gửi tin nhắn.
* **🤖 Trợ lý AI Thông minh:** Tích hợp Google Gemini AI giúp nghệ sĩ lên ý tưởng sáng tác, tự động viết đoạn mô tả (caption) hay cho tác phẩm, và gợi ý các thẻ Tags phù hợp.

### 2. Dành cho Quản trị viên (Admin)

* Quản lý danh sách người dùng, theo dõi các báo cáo vi phạm.
* Kiểm duyệt các tác phẩm nghệ thuật.

---

## 🎯 Điểm nhấn Kỹ thuật (Đáp ứng Rubric Giảng viên)

Dự án được xây dựng với các tiêu chuẩn khắt khe nhất để đảm bảo hiệu năng và điểm số tuyệt đối:

### Frontend (CLO1)

* **Giao diện & UX:** 100% Responsive, hỗ trợ **Dark Mode/Theme**, animation mượt mà với Framer Motion.
* **Next.js App Router:** Sử dụng triệt để `loading.tsx`, `error.tsx` để tối ưu UX. Áp dụng **Parallel/Intercepting Routes** cho trải nghiệm xem ảnh nâng cao.
* **Rendering Strategy:** Áp dụng kết hợp **SSR** (Server-Side Rendering cho trang chi tiết tác phẩm để SEO) và **SSG/ISR** (Cho landing page để tăng tốc độ tải).
* **State Management:** Tối ưu hóa hiệu năng bằng **Zustand**. Tích hợp cơ chế **Optimistic Update** (thả tim, bình luận phản hồi ngay lập tức không cần chờ API).
* **Form Validation:** Validate phức tạp nhiều lớp (cross-field, async kiểm tra trùng lặp) bằng **React Hook Form + Zod**.

### Backend (CLO1)

* **Kiến trúc:** Phân tầng 3 lớp rõ ràng (Router -> Controller -> Service), tái sử dụng middleware. Có endpoint `GET /health` để theo dõi sức khỏe server.
* **Database:** Tối ưu query Mongoose (Index, Populate). Áp dụng **Transaction MongoDB** cho các luồng dữ liệu quan trọng để tránh lỗi phân mảnh.
* **Bảo mật & Auth:** JWT + cơ chế **Refresh Token**, bảo vệ route đa tầng. Tích hợp **Social Login (Google OAuth)** và giới hạn truy cập (Rate Limiting).
* **Tính năng nâng cao (Extra Credit):**
  * Tích hợp AI tạo content tự động (Google Gemini API).
  * Hệ thống nhắn tin & thông báo Realtime (Socket.io).
  * Xử lý file và lưu trữ đám mây (Cloudinary + Multer).

### CI/CD & Vận hành (CLO2)

* Quản lý mã nguồn chặt chẽ với **Semantic Commits**, tính năng được gộp qua Pull Requests có Review.
* Triển khai Container hóa toàn bộ hệ thống bằng **Docker Compose**.
* Sẵn sàng tích hợp **GitHub Actions** deploy tự động.

---

## 🏗 Kiến trúc Công nghệ (Tech Stack)

### 🖥️ Frontend (`artfolio-web` - Cổng 3000)

* **Core:** React 19, Next.js 16.
* **Styling:** TailwindCSS v4.
* **State Management:** Zustand.
* **API & Realtime:** Axios, Socket.io-client.

### ⚙️ Backend (`artfolio-api` - Cổng 5000)

* **Core:** Node.js (>=18.x), Express.js.
* **Database & ODM:** MongoDB, Mongoose.
* **Media Storage:** Cloudinary, Sharp.
* **Bảo mật:** Express-rate-limit, CORS, Cookie-parser.

---

## 🚀 Hướng dẫn Khởi chạy (Getting Started)

### 1. Cấu hình Biến Môi Trường (.env)

**Backend (`artfolio-api/.env`)**

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/artfolio
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GOOGLE_CLIENT_ID=your_google_client_id
GEMINI_API_KEY=your_gemini_api_key
```

**Frontend (`artfolio-web/.env.local`)**

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

### 2. Khởi chạy bằng Docker (Khuyên dùng)

Docker sẽ tự động setup Database, Backend và Frontend chỉ bằng 1 lệnh.

```bash
# Đứng tại thư mục DOANCUOIKYWEB
docker-compose up --build
```

* **Trang web:** http://localhost:3000
* **API:** http://localhost:5000

---

## 📚 Tài liệu API (API Docs)

Import file **`ArtFolio_API_Collection.json`** vào **Postman** để xem toàn bộ danh sách API, Body, Headers đã được chuẩn hóa.

---

*Developed with ❤️ by Team 1B*
