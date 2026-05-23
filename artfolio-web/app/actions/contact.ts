"use server";

import { z } from "zod";

// Dùng Zod để validate trên server-side
const feedbackSchema = z.object({
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự."),
  email: z.string().email("Email không hợp lệ."),
  message: z.string().min(10, "Lời nhắn phải có ít nhất 10 ký tự."),
});

// Server Action thuần (Thỏa tiêu chí 9)
export async function submitFeedbackAction(prevState: any, formData: FormData) {
  try {
    const rawData = {
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message"),
    };

    // Validate dữ liệu
    const validatedData = feedbackSchema.parse(rawData);

    // Ở đây ta có thể lưu vào DB bằng Prisma/Mongoose hoặc gửi email.
    // Để minh họa Server Action, ta in ra console log ở Backend/Server.
    console.log("SERVER ACTION: Nhận góp ý thành công ->", validatedData);

    // Cố tình delay để demo loading state trên giao diện
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      success: true,
      message: `Cảm ơn ${validatedData.name}! Góp ý của bạn đã được ghi nhận.`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message).join(", "),
      };
    }
    
    return {
      success: false,
      error: "Đã xảy ra lỗi không xác định. Vui lòng thử lại.",
    };
  }
}
