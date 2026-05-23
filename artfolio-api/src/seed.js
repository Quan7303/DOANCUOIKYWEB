import bcrypt from 'bcryptjs'
import { connectDatabase, closeDatabase } from './config/mongodb.js'
import User from './models/userModel.js'
import Portfolio from './models/portfolioModel.js'
import Comment from './models/commentModel.js'
import Notification from './models/notificationModel.js'

const seedData = async () => {
  try {
    // 1. Kết nối cơ sở dữ liệu
    await connectDatabase()

    console.log('Clearing database...')
    // 2. Xóa sạch dữ liệu cũ trong các collection
    await User.deleteMany({})
    await Portfolio.deleteMany({})
    await Comment.deleteMany({})
    await Notification.deleteMany({})
    console.log('Database cleared.')

    console.log('Seeding users...')
    // 3. Tạo mật khẩu băm bảo mật (dùng chung '123456' để dễ test)
    const hashedPassword = bcrypt.hashSync('123456', 10)

    // Tạo danh sách Users mẫu
    const users = await User.insertMany([
      {
        name: 'Quản trị viên ArtFolio',
        email: 'admin@artfolio.com',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150',
        portfolioTitle: 'ArtFolio Headquarter',
        portfolioDescription: 'Hệ thống quản trị và kiểm duyệt tác phẩm chính thức.',
        skills: ['Management', 'Curation', 'Design Audit'],
        experience: ['Director at ArtFolio Ltd.'],
        role: 'admin',
        active: 'active'
      },
      {
        name: 'Hồ Vy (UI/UX Designer)',
        email: 'creative_vy@artfolio.com',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150',
        portfolioTitle: 'Vy Ho Studio',
        portfolioDescription: 'Chuyên gia thiết kế giao diện di động và web tối giản, đem lại trải nghiệm chạm vuốt tối ưu.',
        skills: ['UI/UX Design', 'Figma', 'Framer Motion', 'React Native'],
        experience: ['Senior UI Designer at FPT Software', 'Freelance UI/UX Specialist'],
        socialLinks: {
          behance: 'https://behance.net/vyho',
          instagram: 'https://instagram.com/vyho_design'
        },
        role: 'user',
        active: 'active'
      },
      {
        name: 'Hoàng Nam (Frontend Web Dev)',
        email: 'designer_nam@artfolio.com',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150',
        portfolioTitle: 'Nam Tech-Art',
        portfolioDescription: 'Lập trình viên đam mê nghệ thuật thị giác. Biến bản vẽ Figma thành những trang web responsive mượt mà.',
        skills: ['HTML/CSS', 'Tailwind CSS', 'Next.js', 'React', 'Zustand'],
        experience: ['Frontend Web Developer at VNG', 'Open-source Contributor'],
        socialLinks: {
          github: 'https://github.com/namdev',
          linkedin: 'https://linkedin.com/in/namhoang'
        },
        role: 'user',
        active: 'active'
      },
      {
        name: 'Khánh Huy (3D Illustrator)',
        email: 'artist_huy@artfolio.com',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150',
        portfolioTitle: 'Huy Blender 3D',
        portfolioDescription: 'Chuyên gia minh họa 3D, dựng hình nhân vật hoạt hình và thế giới ảo màu sắc rực rỡ.',
        skills: ['Blender', '3D Modeling', 'Character Design', 'Cinema 4D'],
        experience: ['3D Lead at Dee3 Studio', 'Indie Game Asset Creator'],
        socialLinks: {
          behance: 'https://behance.net/huyblender',
          instagram: 'https://instagram.com/huy_3dartist'
        },
        role: 'user',
        active: 'active'
      },
      {
        name: 'Thành Đạt (Viewer PTIT)',
        email: 'viewer_ptit@artfolio.com',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&h=150',
        portfolioTitle: '',
        portfolioDescription: 'Sinh viên đam mê lướt Dribbble để tìm cảm hứng thiết kế cho các dự án môn học.',
        skills: ['Lướt web', 'Cảm thụ nghệ thuật'],
        experience: ['Student at PTIT'],
        role: 'user',
        active: 'active'
      }
    ])

    const admin = users[0]
    const vy = users[1]
    const nam = users[2]
    const huy = users[3]
    const dat = users[4]

    console.log('Seeding portfolios (artworks)...')
    // 4. Tạo danh sách Portfolios mẫu với hình ảnh chất lượng cao và bảng màu HEX tương ứng
    const portfolios = await Portfolio.insertMany([
      {
        user: vy._id,
        title: 'Creative Dashboard UI Mockup',
        description: 'Bản thiết kế Dashboard phân tích doanh thu chuyên sâu cho các ứng dụng SaaS. Phối hợp giữa phong cách glassmorphism hiện đại và gam màu tối sang trọng.',
        images: ['https://images.unsplash.com/photo-1541462608141-2ff580dd0e4e?auto=format&fit=crop&w=800&q=80'],
        tags: ['dashboard', 'saas', 'ux', 'glassmorphism', 'figma'],
        colors: ['#0d0c22', '#ea4c89', '#f8f7f4'],
        category: 'design',
        views: 124,
        likes: [nam._id, dat._id],
        likesCount: 2
      },
      {
        user: vy._id,
        title: 'Minimalist Food Delivery Mobile App',
        description: 'Thiết kế ứng dụng đặt món ăn tập trung vào hình ảnh trực quan món ăn ngon miệng, các bước thanh toán tối giản chỉ với 2 lần chạm màn hình.',
        images: ['https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80'],
        tags: ['mobile', 'app', 'food', 'minimalist', 'uikit'],
        colors: ['#10b981', '#059669', '#ffffff'],
        category: 'design',
        views: 95,
        likes: [huy._id],
        likesCount: 1
      },
      {
        user: nam._id,
        title: 'Interactive Developer Portfolio Website',
        description: 'Trang web portfolio cá nhân tích hợp các hiệu ứng cuộn chuột (scroll-driven animations) bằng GSAP và Framer Motion. Tương thích 100% trên mọi loại màn hình.',
        images: ['https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80'],
        tags: ['portfolio', 'interactive', 'gsap', 'nextjs', 'tailwind'],
        colors: ['#18181b', '#3f3f46', '#f4f4f5'],
        category: 'other',
        views: 158,
        likes: [vy._id, dat._id],
        likesCount: 2
      },
      {
        user: nam._id,
        title: 'Geometric Brand Identity & Logo Design',
        description: 'Hệ thống nhận diện thương hiệu dạng hình khối hình học cho một công ty công nghệ AI. Tối giản, mạnh mẽ và dễ nhớ.',
        images: ['https://images.unsplash.com/photo-1545235617-9465d2a55698?auto=format&fit=crop&w=800&q=80'],
        tags: ['branding', 'logo', 'identity', 'vector', 'minimal'],
        colors: ['#f59e0b', '#d97706', '#3f3f46'],
        category: 'art',
        views: 84,
        likes: [vy._id],
        likesCount: 1
      },
      {
        user: huy._id,
        title: '3D Cyberpunk Street Diorama',
        description: 'Một góc phố đêm rực rỡ ánh đèn neon mang đậm phong cách Cyberpunk viễn tưởng. Dựng hình và dựng ánh sáng hoàn toàn bằng công cụ Blender Cycles.',
        images: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'],
        tags: ['blender', '3d', 'cyberpunk', 'neon', 'diorama'],
        colors: ['#3b82f6', '#8b5cf6', '#ec4899'],
        category: '3d',
        views: 242,
        likes: [vy._id, nam._id, dat._id],
        likesCount: 3
      },
      {
        user: huy._id,
        title: 'Chubby Cartoon Character Pack',
        description: 'Bộ sưu tập các mô hình nhân vật hoạt hình dạng dễ thương, mũm mĩm, thích hợp làm tài nguyên cho các tựa game casual di động hoặc minh họa web.',
        images: ['https://images.unsplash.com/photo-1561070791-26c113006238?auto=format&fit=crop&w=800&q=80'],
        tags: ['character', 'cartoon', 'toy', 'illustration', 'cute'],
        colors: ['#fbbf24', '#f59e0b', '#ffffff'],
        category: 'art',
        views: 110,
        likes: [nam._id],
        likesCount: 1
      }
    ])

    console.log('Seeding comments...')
    // 5. Tạo một số bình luận tương tác ban đầu dưới các tác phẩm
    await Comment.insertMany([
      {
        portfolio: portfolios[0]._id, // Dashboard UI
        user: nam._id,
        text: 'Thiết kế đẹp và sạch quá Vy ơi! Cách phối màu tối kết hợp glassmorphism nhìn rất hiện đại.'
      },
      {
        portfolio: portfolios[0]._id,
        user: dat._id,
        text: 'Nút bấm và các biểu đồ thống kê bố cục vô cùng hợp lý, mình sẽ học hỏi ý tưởng này!'
      },
      {
        portfolio: portfolios[2]._id, // Dev Portfolio
        user: vy._id,
        text: 'Code chạy mượt lắm Nam! Đặc biệt thích phần hiệu ứng chuyển động mượt mà lúc đổi trang.'
      },
      {
        portfolio: portfolios[4]._id, // 3D Cyberpunk Street
        user: vy._id,
        text: 'Đẹp xuất sắc luôn bạn ơi! Ánh sáng đèn neon phản chiếu trên mặt đường ướt nhìn cực kỳ chân thực.'
      },
      {
        portfolio: portfolios[4]._id,
        user: nam._id,
        text: 'Phần render này mất bao lâu thế Huy? Nhìn mê mẩn quá, rất hợp làm màn hình chờ game.'
      }
    ])

    console.log('Updating user follow stats...')
    // 6. Giả lập một số lượt theo dõi (Follows) và cập nhật trường thống kê của User
    // Vy theo dõi Nam, Nam theo dõi Vy, Huy theo dõi Vy, Đạt theo dõi Vy
    await User.findByIdAndUpdate(vy._id, {
      followers: [nam._id, huy._id, dat._id],
      following: [nam._id],
      'stats.followersCount': 3,
      'stats.followingCount': 1,
      'stats.artworksCount': 2
    })

    await User.findByIdAndUpdate(nam._id, {
      followers: [vy._id],
      following: [vy._id],
      'stats.followersCount': 1,
      'stats.followingCount': 1,
      'stats.artworksCount': 2
    })

    await User.findByIdAndUpdate(huy._id, {
      followers: [],
      following: [vy._id],
      'stats.followersCount': 0,
      'stats.followingCount': 1,
      'stats.artworksCount': 2
    })

    await User.findByIdAndUpdate(admin._id, {
      'stats.artworksCount': 0
    })

    console.log('Seeding notifications...')
    // 7. Tạo một vài thông báo mẫu trong hệ thống
    await Notification.insertMany([
      {
        recipient: vy._id, // Vy nhận thông báo
        sender: nam._id, // Từ Nam
        type: 'comment',
        portfolio: portfolios[0]._id, // Dashboard UI
        isRead: false
      },
      {
        recipient: vy._id,
        sender: dat._id,
        type: 'like',
        portfolio: portfolios[0]._id,
        isRead: false
      },
      {
        recipient: vy._id,
        sender: huy._id,
        type: 'follow',
        isRead: true
      },
      {
        recipient: nam._id,
        sender: vy._id,
        type: 'comment',
        portfolio: portfolios[2]._id, // Dev Portfolio
        isRead: false
      }
    ])

    console.log('🎉 SEEDING DATA COMPLETED SUCCESSFULLY!')
  } catch (error) {
    console.error('❌ Error seeding data:', error)
  } finally {
    // 8. Đóng kết nối CSDL sau khi seed xong
    await closeDatabase()
  }
}

// Chạy hàm nạp dữ liệu ảo
seedData()
