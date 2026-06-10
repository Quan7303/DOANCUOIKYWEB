import mongoose from 'mongoose'
import Portfolio from '~/models/portfolioModel.js'
import User from '~/models/userModel.js'
import { ApiError } from '~/utils/ApiError.js'

/**
 * Lấy danh sách tag từ những bài mà user đã tym (like).
 * Trả về mảng tag được sắp xếp theo tần suất xuất hiện (phổ biến nhất trước).
 */
const getLikedTags = async (userId) => {
  const likedPortfolios = await Portfolio.find(
    { likes: userId },
    { tags: 1 }
  ).lean()

  const tagFrequency = {}
  for (const portfolio of likedPortfolios) {
    for (const tag of portfolio.tags || []) {
      const normalizedTag = tag.toLowerCase().trim()
      tagFrequency[normalizedTag] = (tagFrequency[normalizedTag] || 0) + 1
    }
  }

  // Sắp xếp theo tần suất giảm dần, lấy tối đa 20 tag tiêu biểu nhất
  return Object.entries(tagFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([tag]) => tag)
}

/**
 * "Just For You" – gợi ý bài viết cá nhân hoá cho user dựa trên:
 *   1. Bài của những người user đang follow
 *   2. Bài có tag tương tự những bài user đã tym
 *
 * Hai nguồn được hợp nhất, khử trùng và sắp xếp theo điểm liên quan,
 * sau đó phân trang.
 *
 * @param {string} userId   - ID của user đang đăng nhập
 * @param {object} query    - { page, limit }
 */
const getJustForYouFeed = async (userId, query = {}) => {
  const page = Math.max(parseInt(query.page) || 1, 1)
  const limit = Math.min(parseInt(query.limit) || 12, 50)
  const skip = (page - 1) * limit

  // 1. Lấy danh sách following của user
  const currentUser = await User.findById(userId).select('following').lean()
  if (!currentUser) {
    throw new ApiError(404, 'Không tìm thấy người dùng')
  }

  const followingIds = currentUser.following || []

  // Nếu user chưa follow ai → trả về rỗng
  if (followingIds.length === 0) {
    return {
      results: 0,
      totalCount: 0,
      totalPages: 0,
      currentPage: page,
      data: [],
      meta: {
        followingCount: 0
      }
    }
  }

  // Không hiển thị bài của chính user trong feed (tuy rằng user không follow chính mình, nhưng cứ cẩn thận)
  const userObjectId = new mongoose.Types.ObjectId(userId)
  const followingObjectIds = followingIds.map(
    (id) => new mongoose.Types.ObjectId(id.toString())
  )

  const baseQuery = {
    user: { $in: followingObjectIds, $ne: userObjectId }
  }

  // 5. Aggregation pipeline:
  //    - Chỉ cần sort theo thời gian tạo mới nhất
  //    - Phân trang với $facet
  const pipeline = [
    { $match: baseQuery },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: '_id',
              as: 'user',
              pipeline: [{ $project: { name: 1, avatar: 1 } }]
            }
          },
          { $unwind: '$user' }
        ],
        totalCount: [{ $count: 'count' }]
      }
    }
  ]

  const [aggregationResult] = await Portfolio.aggregate(pipeline)

  const portfolios = aggregationResult?.data || []
  const totalCount = aggregationResult?.totalCount?.[0]?.count || 0

  return {
    results: portfolios.length,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    data: portfolios,
    meta: {
      followingCount: followingIds.length
    }
  }
}

export const justForYouService = {
  getJustForYouFeed
}