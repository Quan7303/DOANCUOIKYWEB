
import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from '../config/environment.js'

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)


export const analyzePalette = async (req, res) => {
  try {
    const { colors } = req.body

    if (!colors || !Array.isArray(colors) || colors.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp ít nhất 1 mã màu HEX'
      })
    }

    // Giới hạn 10 màu mỗi lần phân tích
    const colorList = colors.slice(0, 10).join(', ')

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = `
Bạn là chuyên gia thiết kế màu sắc và nghệ thuật thị giác. Hãy phân tích bảng màu sau theo phong cách của một nhà phê bình nghệ thuật chuyên nghiệp.

Bảng màu: ${colorList}

Hãy trả lời bằng tiếng Việt, gồm 3 phần ngắn gọn:
1. **Cảm xúc & Tông màu**: Bảng màu này gợi lên cảm xúc gì? Tông màu chủ đạo là gì?
2. **Phân tích nghệ thuật**: Sự kết hợp màu sắc này phù hợp với phong cách thiết kế nào?
3. **Gợi ý phối màu**: Đề xuất 3 mã HEX bổ sung để tăng cường hiệu quả thị giác cho bảng màu này.

Giữ câu trả lời trong 150-200 từ, ngắn gọn và hữu ích.
    `.trim()

    const result = await model.generateContent(prompt)
    const analysis = result.response.text()

    return res.status(200).json({
      status: 'success',
      analysis,
      inputColors: colors.slice(0, 10)
    })
  } catch (error) {
    console.error('analyzePalette error FULL:', error)

    // Xử lý lỗi API key không hợp lệ
    if (error.message?.includes('API_KEY')) {
      return res.status(503).json({
        status: 'error',
        message: 'Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau.'
      })
    }

    return res.status(500).json({ status: 'error', message: 'Lỗi khi phân tích màu sắc' })
  }
}
