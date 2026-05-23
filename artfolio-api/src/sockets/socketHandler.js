
export const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(` Socket connected: ${socket.id}`)

    socket.on('join_room', (userId) => {
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

    socket.on('disconnect', (reason) => {
      console.log(` Socket disconnected: ${socket.id} — ${reason}`)
    })
  })
}

/**
 * Hàm helper: Gửi thông báo đến 1 user cụ thể
 * Dùng trong commentController, userController (follow)
 *
 * @param {import('socket.io').Server} io
 * @param {string} targetUserId - userId của người nhận
 * @param {'like'|'comment'|'follow'} type
 * @param {string} senderName - Tên người thực hiện hành động
 * @param {string} portfolioTitle - Tiêu đề tác phẩm (optional với follow)
 */
export const emitNotification = (io, targetUserId, type, senderName, portfolioTitle = '') => {
  io.to(`user_${targetUserId}`).emit('send_notification', {
    type,
    senderName,
    portfolioTitle
  })
}

/**
 * @param {import('socket.io').Server} io
 * @param {string} portfolioId
 * @param {object} comment - Object bình luận đã populate user
 */
export const emitNewComment = (io, portfolioId, comment) => {
  io.to(`portfolio_${portfolioId}`).emit('new_comment', {
    comment,
    portfolioId
  })
}
