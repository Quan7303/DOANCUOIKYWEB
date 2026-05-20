
import sharp from 'sharp'


const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase()
}

/**

 * @param {string} imageUrl - URL công khai của ảnh trên Cloudinary
 * @param {number} colorCount - Số lượng màu muốn lấy (mặc định 5)
 * @returns {Promise<string[]>} Mảng mã HEX
 */
export const extractColorsFromUrl = async (imageUrl, colorCount = 5) => {
  try {
    // Fetch ảnh từ Cloudinary
    const response = await fetch(imageUrl)
    if (!response.ok) throw new Error('Không thể tải ảnh từ Cloudinary')
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Resize về 150x150 để xử lý nhanh
    const { data, info } = await sharp(buffer)
      .resize(150, 150, { fit: 'cover' })
      .raw()
      .toBuffer({ resolveWithObject: true })

    const { width, height, channels } = info
    const totalPixels = width * height

    // Chia ảnh thành colorCount vùng theo chiều ngang
    const zoneHeight = Math.floor(height / colorCount)
    const colors = []

    for (let zone = 0; zone < colorCount; zone++) {
      const startRow = zone * zoneHeight
      const endRow = zone === colorCount - 1 ? height : startRow + zoneHeight

      let rSum = 0, gSum = 0, bSum = 0, count = 0

      for (let row = startRow; row < endRow; row++) {
        for (let col = 0; col < width; col++) {
          const idx = (row * width + col) * channels
          rSum += data[idx]
          gSum += data[idx + 1]
          bSum += data[idx + 2]
          count++
        }
      }

      if (count > 0) {
        colors.push(rgbToHex(rSum / count, gSum / count, bSum / count))
      }
    }

    // Loại bỏ màu trùng lặp (gần giống nhau)
    const uniqueColors = removeSimilarColors(colors)
    return uniqueColors.slice(0, colorCount)
  } catch (error) {
    console.error('Lỗi extractColors:', error.message)
    // Trả về mảng rỗng thay vì crash
    return []
  }
}

/**
 * Loại bỏ màu quá giống nhau (khoảng cách Euclidean < threshold)
 */
const removeSimilarColors = (hexColors, threshold = 30) => {
  const unique = []

  for (const hex of hexColors) {
    const r1 = parseInt(hex.slice(1, 3), 16)
    const g1 = parseInt(hex.slice(3, 5), 16)
    const b1 = parseInt(hex.slice(5, 7), 16)

    const isSimilar = unique.some((existing) => {
      const r2 = parseInt(existing.slice(1, 3), 16)
      const g2 = parseInt(existing.slice(3, 5), 16)
      const b2 = parseInt(existing.slice(5, 7), 16)
      const distance = Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
      return distance < threshold
    })

    if (!isSimilar) unique.push(hex)
  }

  return unique
}
