import mongoose from 'mongoose'
import Portfolio from '~/models/portfolioModel.js'
import User from '~/models/userModel.js'
import { ApiError } from '~/utils/ApiError.js'

const MIN_FEED_SIZE = 8

const getLikedTags = async (userId) => {
  const likedPortfolios = await Portfolio.find({ likes: userId }, { tags: 1 }).lean()
  const tagFrequency = {}
  for (const portfolio of likedPortfolios) {
    for (const tag of portfolio.tags || []) {
      const normalizedTag = tag.toLowerCase().trim()
      tagFrequency[normalizedTag] = (tagFrequency[normalizedTag] || 0) + 1
    }
  }
  return Object.entries(tagFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([tag]) => tag)
}

/** Lookup pipeline tái sử dụng: populate user.name + user.avatar */
const userLookup = {
  $lookup: {
    from: 'users',
    localField: 'user',
    foreignField: '_id',
    as: 'user',
    pipeline: [{ $project: { name: 1, avatar: 1 } }]
  }
}

/**
 * "Dành cho bạn" feed — trả về 3 sections riêng biệt:
 *   1. followingPosts  — bài mới nhất từ những người đang follow
 *   2. tagPosts        — bài cùng tag với những bài đã tym (loại trừ bài đã có ở trên)
 *   3. randomPosts     — bổ sung ngẫu nhiên nếu tổng 2 nguồn trên < MIN_FEED_SIZE
 *
 * Cũng trả về danh sách followingUsers (avatar + tên) để hiển thị section "Đang theo dõi".
 */
const getJustForYouFeed = async (userId, query = {}) => {
  const page  = Math.max(parseInt(query.page)  || 1,  1)
  const limit = Math.min(parseInt(query.limit) || 12, 50)

  const currentUser = await User.findById(userId).select('following').lean()
  if (!currentUser) throw new ApiError(404, 'Không tìm thấy người dùng')

  const followingIds = currentUser.following || []
  const userObjectId = new mongoose.Types.ObjectId(userId)

  // ── Section 1: bài từ người đang follow ──────────────────────────────────
  let followingPosts = []
  let followingUsers = []

  if (followingIds.length > 0) {
    const followingObjectIds = followingIds.map(id => new mongoose.Types.ObjectId(id.toString()))

    // Lấy thông tin người follow (avatar + name)
    followingUsers = await User.find(
      { _id: { $in: followingObjectIds } },
      { name: 1, avatar: 1 }
    ).lean()

    // Bài của người follow, mới nhất trước
    const followingRaw = await Portfolio.aggregate([
      { $match: { user: { $in: followingObjectIds, $ne: userObjectId } } },
      { $sort: { createdAt: -1 } },
      { $limit: Math.max(limit, 20) },
      userLookup,
      { $unwind: '$user' }
    ])

    followingPosts = followingRaw
  }

  // ── Section 2: bài cùng tag với bài đã tym ───────────────────────────────
  let tagPosts = []
  const likedTags = await getLikedTags(userId)

  if (likedTags.length > 0) {
    const existingIds = new Set(followingPosts.map(p => p._id.toString()))

    const tagRaw = await Portfolio.aggregate([
      {
        $match: {
          user: { $ne: userObjectId },
          tags: { $in: likedTags },
          // Loại trừ bài đã có trong section following
          _id: { $nin: [...existingIds].map(id => new mongoose.Types.ObjectId(id)) }
        }
      },
      // Tính điểm relevance: số tag khớp càng nhiều càng lên đầu
      {
        $addFields: {
          relevanceScore: {
            $size: {
              $ifNull: [
                { $filter: { input: '$tags', as: 't', cond: { $in: ['$$t', likedTags] } } },
                []
              ]
            }
          }
        }
      },
      { $sort: { relevanceScore: -1, createdAt: -1 } },
      { $limit: Math.max(limit, 20) },
      userLookup,
      { $unwind: '$user' }
    ])

    tagPosts = tagRaw
  }

  // ── Section 3: fallback random nếu tổng < MIN_FEED_SIZE ─────────────────
  let randomPosts = []
  const totalSoFar = followingPosts.length + tagPosts.length

  if (totalSoFar < MIN_FEED_SIZE) {
    const allExcludeIds = [
      ...followingPosts.map(p => p._id),
      ...tagPosts.map(p => p._id)
    ]

    const needed = MIN_FEED_SIZE - totalSoFar + 4 // lấy dư một chút
    const randomRaw = await Portfolio.aggregate([
      {
        $match: {
          user: { $ne: userObjectId },
          _id: { $nin: allExcludeIds }
        }
      },
      { $sample: { size: needed } },
      userLookup,
      { $unwind: '$user' }
    ])

    randomPosts = randomRaw
  }

  // ── Phân trang trên combined feed (following + tag) ───────────────────────
  const combinedAll = [...followingPosts, ...tagPosts]
  const totalCount = combinedAll.length
  const skip = (page - 1) * limit
  const pagedData = combinedAll.slice(skip, skip + limit)

  return {
    results: pagedData.length,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    data: pagedData,

    // Sections riêng biệt cho trang /for-you
    sections: {
      followingPosts: followingPosts.slice(0, 12),
      tagPosts:       tagPosts.slice(0, 12),
      randomPosts,
      likedTags:      likedTags.slice(0, 10),
      followingUsers
    },

    meta: {
      followingCount: followingIds.length,
      likedTagCount:  likedTags.length,
      hasRandom:      randomPosts.length > 0
    }
  }
}

export const justForYouService = { getJustForYouFeed }