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

  // 2. Lấy tag từ các bài đã tym
  const likedTags = await getLikedTags(userId)

  // Nếu user chưa follow ai và chưa tym bài nào → trả về rỗng
  if (followingIds.length === 0 && likedTags.length === 0) {
    return {
      results: 0,
      totalCount: 0,
      totalPages: 0,
      currentPage: page,
      data: [],
      meta: {
        followingCount: 0,
        likedTagsUsed: []
      }
    }
  }

  // 3. Xây dựng điều kiện tổng hợp ($or)
  const orConditions = []

  if (followingIds.length > 0) {
    orConditions.push({ user: { $in: followingIds } })
  }

  if (likedTags.length > 0) {
    orConditions.push({
      tags: {
        $in: likedTags.map((t) => new RegExp(`^${t}$`, 'i'))
      }
    })
  }

  // Không hiển thị bài của chính user trong feed
  const userObjectId = new mongoose.Types.ObjectId(userId)
  const baseQuery = {
    user: { $ne: userObjectId },
    $or: orConditions
  }

  // 4. Chuyển followingIds sang ObjectId để dùng trong aggregation $in
  const followingObjectIds = followingIds.map(
    (id) => new mongoose.Types.ObjectId(id.toString())
  )

  // 5. Aggregation pipeline:
  //    - Tính relevanceScore: +2 nếu tác giả được follow, +1 mỗi tag khớp (tối đa 5 tag)
  //    - Sort theo score giảm dần, sau đó theo thời gian tạo mới nhất
  //    - Phân trang với $facet
  const tagScoreFields = likedTags.slice(0, 5).map((tag) => ({
    $cond: [
      {
        $gt: [
          {
            $size: {
              $filter: {
                input: { $ifNull: ['$tags', []] },
                as: 'tag',
                cond: {
                  $regexMatch: {
                    input: '$$tag',
                    regex: `^${tag}$`,
                    options: 'i'
                  }
                }
              }
            }
          },
          0
        ]
      },
      1,
      0
    ]
  }))

  const pipeline = [
    { $match: baseQuery },
    {
      $addFields: {
        relevanceScore: {
          $add: [
            // +2 nếu tác giả được follow
            {
              $cond: [
                { $in: ['$user', followingObjectIds] },
                2,
                0
              ]
            },
            // +1 cho mỗi tag khớp (tối đa 5 tag → tối đa +5 điểm)
            ...tagScoreFields
          ]
        }
      }
    },
    { $sort: { relevanceScore: -1, createdAt: -1 } },
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
      followingCount: followingIds.length,
      likedTagsUsed: likedTags.slice(0, 10)
    }
  }
}

export const justForYouService = {
  getJustForYouFeed
}