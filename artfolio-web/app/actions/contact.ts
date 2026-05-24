"use server";

import { z } from "zod";

// Dùng Zod để validate trên server-side
const feedbackSchema = z.object({
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự."),
  email: z.string().email("Email không hợp lệ."),
  message: z.string().min(10, "Lời nhắn phải có ít nhất 10 ký tự."),
});

export type FeedbackState = {
  success: boolean;
  message: string;
  error: string;
};

// Server Action thuần (Thỏa tiêu chí 9)
export async function submitFeedbackAction(
  prevState: FeedbackState,
  formData: FormData,
): Promise<FeedbackState> {
  void prevState;

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
      error: "",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "",
        error: error.issues.map((issue) => issue.message).join(", "),
      };
    }

    return {
      success: false,
      message: "",
      error: "Đã xảy ra lỗi không xác định. Vui lòng thử lại.",
    };
  }
}