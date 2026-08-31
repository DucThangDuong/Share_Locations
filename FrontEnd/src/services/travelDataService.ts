import type { DestinationItem, CuisineItem, ItineraryItem, BlogItem, SavedPlaceItem, SuggestedPlaceItem } from '@/types/travel'

export const NORTH_DESTINATIONS: DestinationItem[] = [
  {
    id: 'hanoi',
    name: 'Hà Nội',
    province: 'Thủ đô nghìn năm văn hiến',
    region: 'north',
    regionName: 'Miền Bắc',
    imageUrl: 'https://images.unsplash.com/photo-1599839619722-39751411ea63?q=80&w=600&auto=format&fit=crop',
    tag: 'Văn hóa & Lịch sử',
    description: '36 phố phường, hồ Gươm thơ mộng, ẩm thực tinh tế và những nét cổ kính trăm năm.'
  },
  {
    id: 'halong',
    name: 'Vịnh Hạ Long',
    province: 'Quảng Ninh',
    region: 'north',
    regionName: 'Miền Bắc',
    imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=600&auto=format&fit=crop',
    tag: 'Di sản thế giới',
    description: 'Hàng ngàn hòn đảo đá vôi kỳ vĩ nổi bật trên làn nước xanh ngọc bích.'
  },
  {
    id: 'sapa',
    name: 'Sa Pa',
    province: 'Lào Cai',
    region: 'north',
    regionName: 'Miền Bắc',
    imageUrl: 'https://images.unsplash.com/photo-1570641963303-92ce4845ed4c?q=80&w=600&auto=format&fit=crop',
    tag: 'Mây ngàn & Ruộng bậc thang',
    description: 'Thị trấn trong sương mù, đỉnh Fansipan hùng vĩ và bản sắc dân tộc độc đáo.'
  },
  {
    id: 'ninhbinh',
    name: 'Ninh Bình',
    province: 'Tràng An - Tam Cốc',
    region: 'north',
    regionName: 'Miền Bắc',
    imageUrl: 'https://images.unsplash.com/photo-1574343168241-11881b95ff84?q=80&w=600&auto=format&fit=crop',
    tag: 'Vịnh Hạ Long cạn',
    description: 'Quần thể danh thắng non nước hữu tình, chùa Bái Đính và hang Múa kỳ thú.'
  },
  {
    id: 'hagiang',
    name: 'Hà Giang',
    province: 'Cao nguyên đá Đồng Văn',
    region: 'north',
    regionName: 'Miền Bắc',
    imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=600&auto=format&fit=crop',
    tag: 'Cung đường phượt',
    description: 'Đèo Mã Pí Lèng hiểm trở, dòng sông Nho Quế xanh ngắt và mùa hoa tam giác mạch.'
  }
]

export const CENTRAL_DESTINATIONS: DestinationItem[] = [
  {
    id: 'hoian',
    name: 'Hội An',
    province: 'Quảng Nam',
    region: 'central',
    regionName: 'Miền Trung',
    imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=600&auto=format&fit=crop',
    tag: 'Phố cổ đèn lồng',
    description: 'Không gian trầm mặc với những ngôi nhà cổ sơn vàng, dòng sông Hoài hoa đăng lung linh.'
  },
  {
    id: 'hue',
    name: 'Cố đô Huế',
    province: 'Thừa Thiên Huế',
    region: 'central',
    regionName: 'Miền Trung',
    imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=600&auto=format&fit=crop',
    tag: 'Di sản Hoàng Cung',
    description: 'Đại nội uy nghiêm, lăng tẩm các vua triều Nguyễn và dòng sông Hương êm đềm.'
  },
  {
    id: 'danang',
    name: 'Đà Nẵng',
    province: 'Thành phố đáng sống',
    region: 'central',
    regionName: 'Miền Trung',
    imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=600&auto=format&fit=crop',
    tag: 'Cầu Vàng & Bãi biển',
    description: 'Biển Mỹ Khê cát trắng, Bà Nà Hills bồng bềnh tiên cảnh và những cây cầu biểu tượng.'
  },
  {
    id: 'dalat',
    name: 'Đà Lạt',
    province: 'Lâm Đồng',
    region: 'central',
    regionName: 'Miền Trung',
    imageUrl: 'https://images.unsplash.com/photo-1528181304800-259b08848526?q=80&w=600&auto=format&fit=crop',
    tag: 'Thành phố ngàn hoa',
    description: 'Khí hậu mát mẻ quanh năm, rừng thông reo vi vu và những quán cà phê săn mây tuyệt đẹp.'
  },
  {
    id: 'quangbinh',
    name: 'Phong Nha - Kẻ Bàng',
    province: 'Quảng Bình',
    region: 'central',
    regionName: 'Miền Trung',
    imageUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=600&auto=format&fit=crop',
    tag: 'Vương quốc hang động',
    description: 'Hệ thống hang động thạch nhũ huyền ảo triệu năm tuổi và thiên nhiên hoang sơ.'
  }
]

export const SOUTH_DESTINATIONS: DestinationItem[] = [
  {
    id: 'hcm',
    name: 'TP. Hồ Chí Minh',
    province: 'Hòn ngọc Viễn Đông',
    region: 'south',
    regionName: 'Miền Nam',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600&auto=format&fit=crop',
    tag: 'Nhộn nhịp & Năng động',
    description: 'Trung tâm kinh tế sầm uất, sự giao thoa kiến trúc Đông Tây và văn hóa đường phố rực rỡ về đêm.'
  },
  {
    id: 'phuquoc',
    name: 'Đảo Ngọc Phú Quốc',
    province: 'Kiên Giang',
    region: 'south',
    regionName: 'Miền Nam',
    imageUrl: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?q=80&w=600&auto=format&fit=crop',
    tag: 'Thiên đường biển đảo',
    description: 'Bãi Sao cát trắng mịn, hoàng hôn rực lửa Bãi Trường và ẩm thực hải sản phong phú.'
  },
  {
    id: 'cantho',
    name: 'Cần Thơ',
    province: 'Tây Đô miệt vườn',
    region: 'south',
    regionName: 'Miền Nam',
    imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=600&auto=format&fit=crop',
    tag: 'Chợ nổi sông nước',
    description: 'Nét sinh hoạt chợ nổi Cái Răng độc đáo, vườn cây ăn trái xum xuê và đờn ca tài tử.'
  },
  {
    id: 'vungtau',
    name: 'Vũng Tàu',
    province: 'Bà Rịa - Vũng Tàu',
    region: 'south',
    regionName: 'Miền Nam',
    imageUrl: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?q=80&w=600&auto=format&fit=crop',
    tag: 'Gió biển & Ngọn hải đăng',
    description: 'Thành phố biển gần gũi với con đường ven biển ngắm hoàng hôn và hải sản tươi ngon.'
  },
  {
    id: 'anglang',
    name: 'An Giang',
    province: 'Vùng Thất Sơn huyền bí',
    region: 'south',
    regionName: 'Miền Nam',
    imageUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=600&auto=format&fit=crop',
    tag: 'Rừng tràm Trà Sư',
    description: 'Thảm bèo xanh mướt trải dài mùa nước nổi và văn hóa giao thoa đa sắc tộc Chăm, Khmer, Kinh.'
  }
]

export const CUISINE_ITEMS: CuisineItem[] = [
  {
    id: 1,
    name: 'Phở Bò Hà Nội',
    origin: 'Hà Nội (Miền Bắc)',
    region: 'north',
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=600&auto=format&fit=crop',
    description: 'Nước dùng trong vắt, ngọt thanh từ xương ống ninh kĩ, thơm mùi quế hồi và hành lá nồng ấm.'
  },
  {
    id: 2,
    name: 'Bún Bò Huế',
    origin: 'Thừa Thiên Huế (Miền Trung)',
    region: 'central',
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=600&auto=format&fit=crop',
    description: 'Hương vị đậm đà thơm ngát mùi sả mắm ruốc, sợi bún to ăn kèm giò heo béo ngậy và ớt sa tế cay nồng.'
  },
  {
    id: 3,
    name: 'Cơm Tấm Sài Gòn',
    origin: 'TP. Hồ Chí Minh (Miền Nam)',
    region: 'south',
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=600&auto=format&fit=crop',
    description: 'Hạt tấm thơm bùi kết hợp sườn nướng than hoa vàng ươm, bì thính, chả trứng và chén nước mắm kẹo chua ngọt.'
  },
  {
    id: 4,
    name: 'Mì Quảng Ếch',
    origin: 'Đà Nẵng - Quảng Nam (Miền Trung)',
    region: 'central',
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=600&auto=format&fit=crop',
    description: 'Sợi mì vàng óng ả từ bột nghệ, thịt ếch đồng om sả nghệ thơm lừng chan xâm xấp nước dùng béo ngọt.'
  }
]

export const ITINERARY_ITEMS: ItineraryItem[] = [
  {
    id: 1,
    title: 'Hành trình 3N2Đ: Lạc vào miền sương khói Sa Pa & Chinh phục Fansipan',
    destination: 'Sa Pa, Lào Cai',
    duration: '3 Ngày 2 Đêm',
    placesCount: 8,
    imageUrl: 'https://images.unsplash.com/photo-1570641963303-92ce4845ed4c?q=80&w=600&auto=format&fit=crop',
    description: 'Khám phá bản Cát Cát, check-in đèo Ô Quy Hồ và trải nghiệm cáp treo lên đỉnh nóc nhà Đông Dương.',
    author: 'Hoàng Long',
    updatedAt: 'Cập nhật tháng 8/2026'
  },
  {
    id: 2,
    title: 'Khám phá miền di sản Huế - Hội An: 4 ngày đắm chìm trong nét cổ kính',
    destination: 'Huế - Đà Nẵng - Hội An',
    duration: '4 Ngày 3 Đêm',
    placesCount: 14,
    imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=600&auto=format&fit=crop',
    description: 'Lịch trình trọn vẹn từ Đại Nội Huế, đèo Hải Vân hùng vĩ đến đêm phố cổ Hội An rực rỡ hoa đăng.',
    author: 'Minh Anh',
    updatedAt: 'Cập nhật tháng 8/2026'
  },
  {
    id: 3,
    title: 'Tour nghỉ dưỡng Đảo Ngọc Phú Quốc: 3N2Đ ngắm hoàng hôn bãi biển',
    destination: 'Phú Quốc, Kiên Giang',
    duration: '3 Ngày 2 Đêm',
    placesCount: 6,
    imageUrl: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?q=80&w=600&auto=format&fit=crop',
    description: 'Trải nghiệm lặn ngắm san hô tại hòn Móng Tay, thưởng thức hải sản làng chài Hàm Ninh và ngắm hoàng hôn Sunset Sanato.',
    author: 'Thu Hằng',
    updatedAt: 'Cập nhật tháng 8/2026'
  }
]

export const BLOG_ITEMS: BlogItem[] = [
  {
    id: 1,
    title: 'Kinh nghiệm săn mây Tà Xùa cho người đi lần đầu: Đi đâu, ở đâu và mùa nào đẹp nhất?',
    summary: 'Tất tần tật trải nghiệm thực tế 2N1Đ vượt đèo gió, những homestay view thung lũng mây đẹp như tranh vẽ.',
    imageUrl: 'https://images.unsplash.com/photo-1570641963303-92ce4845ed4c?q=80&w=600&auto=format&fit=crop',
    authorName: 'Đức Thắng',
    authorAvatar: 'https://i.pravatar.cc/150?img=12',
    publishedAt: '28/08/2026',
    readTime: '5 phút đọc',
    category: 'Kinh nghiệm'
  },
  {
    id: 2,
    title: 'Top 10 quán cà phê ngắm hoàng hôn Hội An cực chill mà ít khách du lịch biết',
    summary: 'Rời xa những con phố đông đúc để tìm về những góc quán ven sông Hoài và giữa cánh đồng lúa xanh ngát.',
    imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=600&auto=format&fit=crop',
    authorName: 'Minh Anh',
    authorAvatar: 'https://i.pravatar.cc/150?img=47',
    publishedAt: '25/08/2026',
    readTime: '4 phút đọc',
    category: 'Gợi ý quán'
  },
  {
    id: 3,
    title: 'Review chi tiết ẩm thực chợ đêm Đà Lạt: Món nào nhất định phải thử?',
    summary: 'Bánh tráng nướng giòn rụm, dâu lắc chua ngọt, sữa đậu nành nóng hổi giữa tiết trời se lạnh 15 độ C.',
    imageUrl: 'https://images.unsplash.com/photo-1528181304800-259b08848526?q=80&w=600&auto=format&fit=crop',
    authorName: 'Thanh Hà',
    authorAvatar: 'https://i.pravatar.cc/150?img=32',
    publishedAt: '20/08/2026',
    readTime: '6 phút đọc',
    category: 'Ẩm thực'
  }
]

export const USER_SAVED_PLACES: SavedPlaceItem[] = [
  {
    id: 1,
    title: 'Đồi chè Cầu Đất',
    location: 'Đà Lạt, Lâm Đồng',
    imageUrl: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?q=85&w=500&auto=format&fit=crop',
    savedAt: 'Đã lưu 2 ngày trước'
  },
  {
    id: 2,
    title: 'Chùa Tam Chúc',
    location: 'Hà Nam',
    imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=85&w=500&auto=format&fit=crop',
    savedAt: 'Đã lưu 5 ngày trước'
  }
]

export const USER_SUGGESTED_PLACES: SuggestedPlaceItem[] = [
  {
    id: 1,
    title: 'Hồ Tà Đùng',
    location: 'Đắk Nông',
    imageUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=85&w=500&auto=format&fit=crop',
    suggestedBy: 'Địa điểm do bạn đề xuất (Đã duyệt)'
  }
]
