import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from '../config/environment.js'

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)

// Các model Gemini còn hoạt động năm 2026, thử lần lượt khi hết quota
const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const generateWithFallback = async (prompt) => {
  let lastError

  for (const modelName of MODELS) {
    try {
      console.log(`Thử model: ${modelName}`)
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (error) {
      lastError = error

      if (error.status === 429) {
        console.warn(`${modelName} hết quota (429), thử model tiếp theo...`)
        continue
      }

      if (error.status === 503) {
        console.warn(`${modelName} quá tải (503), chờ 3s rồi thử model tiếp theo...`)
        await sleep(3000)
        continue
      }

      if (error.status === 404) {
        console.warn(`${modelName} không tồn tại (404), thử model tiếp theo...`)
        continue
      }

      // Lỗi khác (401, 400...) → dừng luôn
      throw error
    }
  }

  throw lastError
}

export const analyzeMultipleImages = async (req, res) => {
  try {
    const { images } = req.body

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp ít nhất 1 ảnh' })
    }

    const imageParts = images.slice(0, 5).map(({ imageBase64, mimeType }) => ({
      inlineData: { data: imageBase64, mimeType }
    }))

    let lastError
    for (const modelName of MODELS) {
      try {
        console.log(`Thử model vision (all): ${modelName}`)
        const model = genAI.getGenerativeModel({ model: modelName })

        const result = await model.generateContent([
          ...imageParts,
          `Bạn là chuyên gia thiết kế nghệ thuật. Hãy xem tất cả ${imageParts.length} ảnh trên (đây là các ảnh của cùng 1 tác phẩm/bộ sưu tập).

NHIỆM VỤ: Trả về đúng 1 JSON object với 3 trường bắt buộc, KHÔNG thêm bất kỳ text nào khác ngoài JSON:
{
  "title": "tiêu đề sáng tạo 3-8 từ phù hợp toàn bộ tác phẩm",
  "tags": "4-6 tags liên quan, viết thường, phân cách bằng dấu phẩy, không có dấu #",
  "description": "mô tả 2-4 câu bằng tiếng Việt: phong cách nghệ thuật, cảm hứng sáng tác, điểm nổi bật của tác phẩm, phù hợp đăng portfolio sáng tạo"
}

QUAN TRỌNG: Trường "description" là BẮT BUỘC, không được bỏ trống.`
        ])

        const text = result.response.text().trim()
        console.log('[analyzeMultipleImages] raw Gemini response:', text.slice(0, 300))

        // Robust JSON extraction: tìm {...} đầu tiên trong response
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) throw new Error('Gemini không trả về JSON hợp lệ')
        const clean = jsonMatch[0]
        const parsed = JSON.parse(clean)

        console.log('[analyzeMultipleImages] parsed:', { title: parsed.title, tags: parsed.tags, descLen: (parsed.description || '').length })

        return res.status(200).json({ status: 'success', title: parsed.title || '', tags: parsed.tags || '', description: parsed.description || '' })
      } catch (error) {
        lastError = error
        if (error.status === 429 || error.status === 503 || error.status === 404) {
          if (error.status === 503) await sleep(3000)
          continue
        }
        throw error
      }
    }
    throw lastError
  } catch (error) {
    console.error('analyzeMultipleImages error:', error)
    if (error.status === 429) return res.status(429).json({ status: 'error', message: 'AI hết giới hạn miễn phí hôm nay.' })
    if (error.status === 503) return res.status(503).json({ status: 'error', message: 'AI đang quá tải, thử lại sau.' })
    return res.status(500).json({ status: 'error', message: 'Không thể phân tích ảnh. Vui lòng thử lại.' })
  }
}

export const analyzeImage = async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body

    if (!imageBase64 || !mimeType) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp ảnh (imageBase64 và mimeType)'
      })
    }

    let lastError
    for (const modelName of MODELS) {
      try {
        console.log(`Thử model vision: ${modelName}`)
        const model = genAI.getGenerativeModel({ model: modelName })

        const result = await model.generateContent([
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType
            }
          },
          `Bạn là chuyên gia thiết kế nghệ thuật. Hãy phân tích tác phẩm trong ảnh.

NHIỆM VỤ: Trả về đúng 1 JSON object với 3 trường bắt buộc, KHÔNG thêm bất kỳ text nào khác ngoài JSON:
{
  "title": "tiêu đề sáng tạo ngắn gọn 3-8 từ tiếng Việt hoặc tiếng Anh phù hợp phong cách tác phẩm",
  "tags": "4-6 tags liên quan, viết thường, phân cách bằng dấu phẩy, không có dấu #",
  "description": "mô tả 2-4 câu bằng tiếng Việt: phong cách nghệ thuật, cảm hứng sáng tác, điểm nổi bật của tác phẩm, phù hợp đăng portfolio sáng tạo"
}

QUAN TRỌNG: Trường "description" là BẮT BUỘC, không được bỏ trống.`
        ])

        const text = result.response.text().trim()
        console.log('[analyzeImage] raw Gemini response:', text.slice(0, 300))

        // Robust JSON extraction: tìm {...} đầu tiên trong response
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) throw new Error('Gemini không trả về JSON hợp lệ')
        const clean = jsonMatch[0]
        const parsed = JSON.parse(clean)

        console.log('[analyzeImage] parsed:', { title: parsed.title, tags: parsed.tags, descLen: (parsed.description || '').length })

        return res.status(200).json({
          status: 'success',
          title: parsed.title || '',
          tags: parsed.tags || '',
          description: parsed.description || ''
        })
      } catch (error) {
        lastError = error
        if (error.status === 429 || error.status === 503 || error.status === 404) {
          if (error.status === 503) await sleep(3000)
          continue
        }
        throw error
      }
    }

    throw lastError
  } catch (error) {
    console.error('analyzeImage error:', error)

    if (error.status === 429) {
      return res.status(429).json({ status: 'error', message: 'AI đã hết giới hạn miễn phí hôm nay. Vui lòng thử lại sau.' })
    }
    if (error.status === 503) {
      return res.status(503).json({ status: 'error', message: 'Dịch vụ AI đang quá tải, vui lòng thử lại sau ít phút.' })
    }
    if (error.message?.includes('API_KEY') || error.status === 401 || error.status === 403) {
      return res.status(503).json({ status: 'error', message: 'Cấu hình API không hợp lệ. Vui lòng kiểm tra GEMINI_API_KEY.' })
    }

    return res.status(500).json({ status: 'error', message: 'Không thể phân tích ảnh. Vui lòng thử lại.' })
  }
}

export const analyzePalette = async (req, res) => {
  try {
    const { colors } = req.body

    if (!colors || !Array.isArray(colors) || colors.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp ít nhất 1 mã màu HEX'
      })
    }

    const colorList = colors.slice(0, 10).join(', ')

    const prompt = `
Bạn là chuyên gia thiết kế màu sắc và nghệ thuật thị giác. Hãy phân tích bảng màu sau theo phong cách của một nhà phê bình nghệ thuật chuyên nghiệp.

Bảng màu: ${colorList}

Hãy trả lời bằng tiếng Việt, gồm 3 phần ngắn gọn:
1. **Cảm xúc & Tông màu**: Bảng màu này gợi lên cảm xúc gì? Tông màu chủ đạo là gì?
2. **Phân tích nghệ thuật**: Sự kết hợp màu sắc này phù hợp với phong cách thiết kế nào?
3. **Gợi ý phối màu**: Đề xuất 3 mã HEX bổ sung để tăng cường hiệu quả thị giác cho bảng màu này.

Giữ câu trả lời trong 150-200 từ, ngắn gọn và hữu ích.
    `.trim()

    const analysis = await generateWithFallback(prompt)

    return res.status(200).json({
      status: 'success',
      analysis,
      inputColors: colors.slice(0, 10)
    })
  } catch (error) {
    console.error('analyzePalette error FULL:', error)

    if (error.status === 429) {
      return res.status(429).json({
        status: 'error',
        message: 'Dịch vụ AI đã hết giới hạn miễn phí hôm nay. Vui lòng thử lại sau hoặc nâng cấp tài khoản tại https://ai.dev'
      })
    }

    if (error.status === 503) {
      return res.status(503).json({
        status: 'error',
        message: 'Dịch vụ AI đang quá tải, vui lòng thử lại sau ít phút.'
      })
    }

    if (error.message?.includes('API_KEY') || error.status === 401 || error.status === 403) {
      return res.status(503).json({
        status: 'error',
        message: 'Cấu hình API không hợp lệ. Vui lòng kiểm tra lại GEMINI_API_KEY.'
      })
    }

    return res.status(500).json({ status: 'error', message: 'Lỗi khi phân tích màu sắc' })
  }
}