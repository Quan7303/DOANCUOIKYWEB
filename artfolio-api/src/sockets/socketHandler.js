/**
 * socketHandler.js
 * Chức năng: Khởi tạo và quản lý toàn bộ sự kiện Socket.io Server
 * - Mỗi user sau khi đăng nhập sẽ emit 'join_room' để vào phòng riêng
 * - Server emit 'send_notification' khi có like/comment/follow
 * - Server emit 'new_comment' khi có bình luận mới trên 1 tác phẩm
 *
 * Task 4.2 - Thành viên 4
 *
 * Sự kiện theo API Contract (md file):
 * Client emit: join_room (payload: userId)
 * Server emit: send_notification (payload: {type, senderName, portfolioTitle})
 *              new_comment (payload: {comment, portfolioId})
 */

export const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`)

    /**
     * Client gọi ngay sau khi kết nối để vào phòng nhận thông báo cá nhân
     * Mỗi user có 1 phòng riêng tên "user_<userId>"
     */
    socket.on('join_room', (userId) => {
      if (!userId) return
      socket.join(`user_${userId}`)
      console.log(`👤 User ${userId} joined room user_${userId}`)
    })

    /**
     * Client tham gia phòng của 1 tác phẩm để nhận bình luận realtime
     * Phòng tên "portfolio_<portfolioId>"
     */
    socket.on('join_portfolio', (portfolioId) => {
      if (!portfolioId) return
      socket.join(`portfolio_${portfolioId}`)
    })

    /**
     * Client rời phòng tác phẩm khi thoát trang chi tiết
     */
    socket.on('leave_portfolio', (portfolioId) => {
      if (!portfolioId) return
      socket.leave(`portfolio_${portfolioId}`)
    })

    socket.on('disconnect', (reason) => {
      console.log(`❌ Socket disconnected: ${socket.id} — ${reason}`)
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
 * Hàm helper: Phát bình luận mới đến tất cả người đang xem tác phẩm đó
 *
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
