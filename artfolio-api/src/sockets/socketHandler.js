export const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(` Socket connected: ${socket.id}`)

    // Frontend gửi: socket.emit("join_room", { userId })
    socket.on('join_room', (data) => {
      // Chấp nhận cả object { userId } lẫn string thuần để tương thích
      const userId = data?.userId || data
      if (!userId) return
      socket.join(`user_${userId}`)
      console.log(` User ${userId} joined room user_${userId}`)
    })

    socket.on('join_portfolio', (portfolioId) => {
      if (!portfolioId) return
      socket.join(`portfolio_${portfolioId}`)
    })

    socket.on('leave_portfolio', (portfolioId) => {
      if (!portfolioId) return
      socket.leave(`portfolio_${portfolioId}`)
    })

    // Hỗ trợ tên event cũ từ frontend (join_portfolio_room / leave_portfolio_room)
    socket.on('join_portfolio_room', ({ portfolioId } = {}) => {
      if (!portfolioId) return
      socket.join(`portfolio_${portfolioId}`)
    })

    socket.on('leave_portfolio_room', ({ portfolioId } = {}) => {
      if (!portfolioId) return
      socket.leave(`portfolio_${portfolioId}`)
    })

    socket.on('disconnect', (reason) => {
      console.log(` Socket disconnected: ${socket.id} — ${reason}`)
    })
  })
}


export const emitNotification = (io, targetUserId, type, sender, portfolioTitle = '', portfolioId = '') => {
  const senderName = sender?.name || 'Ai đó'
  
  const messages = {
    like:    `${senderName} đã thích tác phẩm "${portfolioTitle}"`,
    comment: `${senderName} đã bình luận vào "${portfolioTitle}"`,
    follow:  `${senderName} đã bắt đầu theo dõi bạn`
  }

  const titles = {
    like:    'Lượt thích mới',
    comment: 'Bình luận mới',
    follow:  'Người theo dõi mới'
  }

  const links = {
    like:    portfolioId ? `/portfolio/${portfolioId}` : undefined,
    comment: portfolioId ? `/portfolio/${portfolioId}` : undefined,
    follow:  undefined
  }

  io.to(`user_${targetUserId}`).emit('send_notification', {
    type,
    title:   titles[type] || 'Thông báo mới',
    message: messages[type] || `${senderName} đã tương tác với bạn`,
    link:    links[type],
    sender: {
      _id: sender?._id || '',
      name: senderName,
      avatar: sender?.avatar || 'default-avatar.png'
    }
  })
}

/**
 * @param {import('socket.io').Server} io
 * @param {string[]} followerIds   - Mảng userId của followers
 * @param {string}   authorName
 * @param {string}   portfolioId
 * @param {string}   portfolioTitle
 */
export const emitNewPostToFollowers = (io, followerIds, authorName, portfolioId, portfolioTitle) => {
  for (const followerId of followerIds) {
    io.to(`user_${followerId}`).emit('new_post_for_follower', {
      authorName,
      portfolioId,
      portfolioTitle
    })
  }
}


export const emitNewComment = (io, portfolioId, comment) => {
  io.to(`portfolio_${portfolioId}`).emit('new_comment', {
    comment,
    portfolioId
  })
}
