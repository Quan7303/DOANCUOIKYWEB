# 🎨 ArtFolio REST API Server

ArtFolio là một nền tảng danh mục tác phẩm nghệ thuật kỹ thuật số (Creative Portfolio Hub) đột phá, giúp các nhà thiết kế UI/UX, lập trình viên frontend và nghệ sĩ 3D trưng bày các tác phẩm tuyệt đẹp của họ. 

Mã nguồn máy chủ này được xây dựng trên nền tảng **Node.js, Express.js và MongoDB Atlas**, tối ưu hóa hiệu năng và tuân thủ các tiêu chuẩn bảo mật API tiên tiến nhất năm 2026.

---

## 🚀 Tính năng nổi bật & Bảo mật API (BE3 Standard)

*   **Xử lý lỗi tập trung (Centralized Error Handling)**: Quản lý lỗi hệ thống đồng bộ thông qua lớp lỗi tùy chỉnh `ApiError` và middleware Express xử lý lỗi tập trung. Tự động bẫy lỗi trùng khóa cơ sở dữ liệu (chẳng hạn như trùng Email) trả về mã trạng thái HTTP chuẩn xác.
*   **Xác thực JWT kép (Double Token JWT Architecture)**:
    *   **Access Token**: Mã hóa ngắn hạn (hết hạn trong 1 giờ) trả về dưới dạng JSON lưu tại RAM phía Client nhằm tránh bị rò rỉ.
    *   **Refresh Token**: Mã hóa dài hạn (hết hạn trong 14 ngày) lưu trữ trong **HttpOnly, SameSite: None Cookie** bảo mật tuyệt đối, chống lại 100% các cuộc tấn công XSS đánh cắp token.
*   **Đồng bộ Validate FE & BE**: Tích hợp các Middleware Joi để xác thực tính hợp lệ của dữ liệu đầu vào (Signup/Login), đồng bộ hóa khắt khe với các schema Zod ở phía Frontend React (tên tối thiểu 2 ký tự, mật khẩu tối thiểu 8 ký tự chứa ít nhất 1 chữ cái và 1 chữ số).
*   **Bộ chặn Brute-Force (Rate Limiting)**: Tích hợp `express-rate-limit` để giới hạn tần suất gửi yêu cầu đăng nhập liên tiếp từ cùng một IP, ngăn chặn hoàn toàn tấn công dò mật khẩu.
*   **MongoDB Atlas Seeding**: Hệ thống nạp dữ liệu ảo (seeding) mạnh mẽ, tự động hóa việc khởi tạo người dùng, portfolio, bình luận và thông báo mẫu chất lượng cao.

---

## 📁 Cấu trúc thư mục dự án (Clean Architecture)

```text
artfolio-api/
├── src/
│   ├── config/             # Cấu hình môi trường, CSDL, Cors
│   ├── controllers/        # Tiếp nhận HTTP Request và điều phối phản hồi
│   ├── middlewares/        # Bộ lọc trung gian (Error handler, Upload, Rate Limiting)
│   ├── models/             # Định nghĩa Schema dữ liệu Mongoose (User, Portfolio, Comment...)
│   ├── routes/v1/          # Phân luồng định tuyến API Version 1
│   ├── services/           # Chứa logic nghiệp vụ chính (Business Logic)
│   ├── utils/              # Các hàm bổ trợ (ApiError, Sorter, Algorthims...)
│   ├── seed.js             # Kịch bản nạp dữ liệu mẫu vào database Atlas
│   └── server.js           # Điểm khởi chạy (Entry Point) của ứng dụng
├── postman_collection.json # Bộ sưu tập API test tự động trên Postman
└── package.json            # Quản lý các thư viện và tập lệnh (Scripts) của Node.js
```

---

## 💻 Hướng dẫn cài đặt & Chạy ứng dụng

### 1. Chuẩn bị môi trường
*   **Node.js** >= 18.x
*   **npm** >= 9.x hoặc **yarn**

### 2. Cài đặt các thư viện
Di chuyển vào thư mục `artfolio-api` và chạy lệnh sau để cài đặt toàn bộ dependencies:
```bash
npm install --legacy-peer-deps
```

### 3. Cấu hình biến môi trường
Tạo tệp `.env` tại thư mục gốc của dự án với các thông số sau (mẫu mặc định):
```env
APP_HOST=localhost
APP_PORT=8017
NODE_ENV=development

MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net
DATABASE_NAME=artfolio

JWT_SECRET=dev-jwt-secret-key-2026
JWT_REFRESH_SECRET=dev-jwt-refresh-secret-key-2026
```

### 4. Chạy nạp dữ liệu mẫu (Seeding)
Để khởi tạo nhanh dữ liệu mẫu lên cơ sở dữ liệu MongoDB Atlas:
```bash
npm run seed
```

### 5. Chạy máy chủ ở chế độ Phát triển (Development)
```bash
npm run dev
```
Máy chủ sẽ bắt đầu chạy tại địa chỉ: `http://localhost:8017/`

---

## 🧪 Kiểm thử tự động với Postman

Dự án có đi kèm tệp **`postman_collection.json`** chứa đầy đủ các đầu API phục vụ kiểm thử tích hợp (Đăng ký, Đăng nhập, Đăng nhập sai, Làm mới token, Đăng xuất).

1.  Mở **Postman** lên.
2.  Bấm nút **Import** ở góc trên cùng bên trái.
3.  Chọn kéo thả tệp `postman_collection.json` trong thư mục dự án vào.
4.  Bấm nút **Import** và chạy trực tiếp để xem kết quả kiểm thử tự động (Test Results) hiển thị 100% màu xanh lá cây cực kỳ chuyên nghiệp!
