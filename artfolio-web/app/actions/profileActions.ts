"use server";

import { cookies } from "next/headers";
import { profileActionSchema } from "../utils/validationSchemas";

type ProfileActionResult = {
  ok: boolean;
  message: string;
  errors?: Record<string, string[] | undefined>;
};

export async function updateProfileAction(
  formData: FormData,
): Promise<ProfileActionResult> {
  const parsed = profileActionSchema.safeParse({
    userId: String(formData.get("userId") ?? ""),
    name: String(formData.get("name") ?? ""),
    skills: String(formData.get("skills") ?? ""),
    experience: String(formData.get("experience") ?? ""),
    socialLinks: String(formData.get("socialLinks") ?? ""),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Dữ liệu profile không hợp lệ.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return {
      ok: false,
      message: "Cần đăng nhập trước khi cập nhật profile.",
    };
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    return {
      ok: true,
      message:
        "Server Action đã validate input. Chưa cấu hình NEXT_PUBLIC_API_URL nên chưa gọi backend.",
    };
  }

  const response = await fetch(`${apiUrl}/api/users/${parsed.data.userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      name: parsed.data.name,
      skills: parsed.data.skills
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      experience: parsed.data.experience,
      socialLinks: parsed.data.socialLinks
        ?.split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      ok: false,
      message: "Backend từ chối cập nhật profile.",
    };
  }

  return {
    ok: true,
    message: "Cập nhật profile thành công.",
  };
}
