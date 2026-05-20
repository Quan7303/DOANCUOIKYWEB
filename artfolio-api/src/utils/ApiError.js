/**
  * Lớp lỗi tùy chỉnh ApiError
  * Kế thừa từ lớp Error chuẩn để ném lỗi có đính kèm mã trạng thái HTTP (statusCode)
  */
export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message)

    // Đặt tên lớp lỗi
    this.name = 'ApiError'

    // Lưu lại mã trạng thái HTTP tương ứng
    this.statusCode = statusCode

    // Ghi lại Stack Trace (dòng code gây ra lỗi) để phục vụ debug
    Error.captureStackTrace(this, this.constructor)
  }
}
