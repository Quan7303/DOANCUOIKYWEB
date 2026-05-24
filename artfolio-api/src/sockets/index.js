export const initSocket = (io) => {
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`)

        socket.on('join_room', (data) => {
            const userId = data?.userId || data
            if (!userId) return

            socket.join(`user_${userId}`)
            console.log(`User ${userId} joined room user_${userId}`)
        })

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`)
        })
    })
}