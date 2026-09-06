# TÀI LIỆU ĐẶC TẢ API BACKEND (API SPECIFICATION)
## Hệ Thống Chia Sẻ & Khám Phá Địa Điểm Du Lịch (LangThang)

Tài liệu này đặc tả chi tiết các RESTful API v1 cần thiết cho Backend để cung cấp dữ liệu thực tế cho toàn bộ các trang chuyên mục và tính năng mới của FrontEnd (`PlaceDetailPage`, `MapPage`, `FoodPage`, `ItineraryPage`, `BlogPage`, `ReportModal`).

---
## 1. 📍 NHÓM API TRANG CHI TIẾT ĐỊA ĐIỂM (PLACE DETAIL & REPORT)

### 1.1. Lấy chi tiết thông tin địa điểm
- **Method**: `GET`
- **Endpoint**: `/api/v1/places/{id}`
- **Auth**: `Public`
- **Path Parameter**:
  - `id` *(int, required)*: ID của địa điểm.

**Response Schema (`data`):**
```json
{
  "id": 1,
  "name": "Vịnh Hạ Long - Di Sản Thiên Nhiên Thế Giới",
  "description": "Vịnh Hạ Long là một trong những kỳ quan thiên nhiên nổi tiếng thế giới của Việt Nam...",
  "detailedDescription": "Nằm ở bờ tây vịnh Bắc Bộ, Vịnh Hạ Long sở hữu diện tích khoảng 1.553 km² bao gồm 1.969 hòn đảo lớn nhỏ...\n\nDu khách có thể chèo thuyền kayak...",
  "address": "Thành phố Hạ Long, Tỉnh Quảng Ninh",
  "provinceId": 1,
  "provinceName": "Quảng Ninh",
  "regionId": 1,
  "regionName": "Miền Bắc",
  "categoryId": 1,
  "categoryName": "Danh lam thắng cảnh",
  "placeTypeId": 1,
  "placeTypeName": "Điểm tham quan",
  "minPrice": 250000,
  "maxPrice": 1500000,
  "openingHours": "06:30 - 18:30 hàng ngày",
  "avgRating": 4.9,
  "reviewCount": 1248,
  "thumbnailUrl": "https://images.unsplash.com/photo-1528127269322-539801943592",
  "mediaUrls": [
    "https://images.unsplash.com/photo-1528127269322-539801943592",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    "https://images.unsplash.com/photo-1544644181-1484b3fdfc62"
  ],
  "latitude": 20.9101,
  "longitude": 107.1839,
  "phoneNumber": "0203 384 6590",
  "website": "https://halongbay.gov.vn",
  "email": "info@halongbay.gov.vn",
  "highlights": [
    "Di sản thiên nhiên thế giới 2 lần được UNESCO công nhận",
    "Hơn 1.900 hòn đảo đá vôi muôn hình vạn trạng",
    "Trải nghiệm chèo kayak xuyên hang luồn và ngủ đêm du thuyền"
  ],
  "amenities": [
    { "id": "1", "name": "Wifi miễn phí tại bến tàu & du thuyền", "icon": "wifi" },
    { "id": "2", "name": "Bãi đỗ xe ô tô / xe du lịch 45 chỗ", "icon": "car" },
    { "id": "3", "name": "Chấp nhận thanh toán thẻ & QR Code", "icon": "credit-card" },
    { "id": "4", "name": "Không gian điều hòa trong phòng nghỉ", "icon": "wind" },
    { "id": "5", "name": "Thích hợp cho gia đình & đoàn thể", "icon": "users" },
    { "id": "6", "name": "Có hướng dẫn viên du lịch đa ngôn ngữ", "icon": "compass" }
  ],
  "status": 1,
  "createdAt": "2025-01-01T00:00:00Z"
}
```

---

### 1.2. Lấy danh sách đánh giá & thống kê sao
- **Method**: `GET`
- **Endpoint**: `/api/v1/places/{id}/reviews`
- **Auth**: `Public`
- **Query Parameters**:
  - `page` *(int, default: 1)*
  - `pageSize` *(int, default: 10)*
  - `rating` *(int, optional, 1-5)*

**Response Schema (`data`):**
```json
{
  "avgRating": 4.9,
  "totalReviews": 1248,
  "ratingBreakdown": {
    "5": 920,
    "4": 240,
    "3": 65,
    "2": 15,
    "1": 8
  },
  "items": [
    {
      "id": 101,
      "userId": "user-uuid-1",
      "userName": "Nguyễn Thành Nam",
      "userAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
      "rating": 5,
      "content": "Chuyến đi 2 ngày 1 đêm trên du thuyền thực sự ngoài mong đợi! Vịnh nước trong vắt...",
      "images": [
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
      ],
      "likesCount": 34,
      "createdAt": "2026-09-01T14:30:00Z"
    }
  ]
}
```

---

### 1.3. Gửi đánh giá mới cho địa điểm
- **Method**: `POST`
- **Endpoint**: `/api/v1/places/{id}/reviews`
- **Auth**: `Bearer Token (Required)`
- **Request Body**:
```json
{
  "placeId": 1,
  "rating": 5,
  "content": "Cảnh quan rất đẹp, dịch vụ chu đáo và nhân viên hỗ trợ nhiệt tình.",
  "images": [
    "https://res.cloudinary.com/.../review_img1.jpg"
  ]
}
```
- **Response**: Trả về `PlaceReviewDto` vừa tạo (HTTP 201 Created).

---

### 1.4. Báo cáo sai phạm / địa điểm đóng cửa (Report Place)
- **Method**: `POST`
- **Endpoint**: `/api/v1/places/{id}/reports`
- **Auth**: `Public / Optional Token`
- **Request Body**:
```json
{
  "placeId": 1,
  "reason": "Địa điểm đã đóng cửa vĩnh viễn / Tạm dừng hoạt động",
  "description": "Quán này đã trả mặt bằng từ đầu tháng trước, hiện đang sửa chữa.",
  "contactEmail": "user@example.com"
}
```
- **Response**: `true` (HTTP 200).

---

### 1.5. Lưu / Bỏ lưu địa điểm (Wishlist / Bookmark)
- **Lưu địa điểm**: `POST /api/v1/places/{id}/save`
- **Bỏ lưu địa điểm**: `DELETE /api/v1/places/{id}/save`
- **Auth**: `Bearer Token (Required)`
- **Response**: `{ "isSaved": true, "placeId": 1 }`

---

## 2. 🗺️ NHÓM API BẢN ĐỒ DU LỊCH (MAP PAGE)

### 2.1. Lấy danh sách địa điểm phục vụ hiển thị bản đồ Vector & Marker
- **Method**: `GET`
- **Endpoint**: `/api/v1/places/map`
- **Auth**: `Public`
- **Query Parameters**:
  - `keyword` *(string, optional)*: Tìm kiếm theo tên hoặc địa chỉ.
  - `region` *(string, optional)*: `north` | `central` | `south`.
  - `provinceId` *(int, optional)*: Lọc theo tỉnh thành.
  - `categoryId` *(int, optional)*: Lọc theo danh mục.
  - `bounds` *(string, optional)*: `minLng,minLat,maxLng,maxLat` (để tải theo khung nhìn camera).

**Response Schema (`data`):**
```json
[
  {
    "id": 1,
    "name": "Vịnh Hạ Long",
    "category": "Thắng cảnh",
    "categoryId": 1,
    "region": "north",
    "regionName": "Miền Bắc",
    "province": "Quảng Ninh",
    "address": "Thành phố Hạ Long, Quảng Ninh",
    "rating": 4.9,
    "reviewCount": 1248,
    "price": "250.000đ - 1.500.000đ",
    "imageUrl": "https://images.unsplash.com/photo-1528127269322-539801943592",
    "coordinates": [107.1839, 20.9101]
  },
  {
    "id": 2,
    "name": "Phố Cổ Hội An",
    "category": "Di tích & Văn hóa",
    "categoryId": 2,
    "region": "central",
    "regionName": "Miền Trung",
    "province": "Quảng Nam",
    "address": "Phường Minh An, TP Hội An, Quảng Nam",
    "rating": 4.8,
    "reviewCount": 980,
    "price": "Miễn phí / 120.000đ",
    "imageUrl": "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b",
    "coordinates": [108.3275, 15.8801]
  }
]
```

---

## 3. 🍜 NHÓM API CHUYÊN TRANG ẨM THỰC 3 MIỀN (FOOD PAGE)

### 3.1. Lấy danh sách đặc sản ẩm thực
- **Method**: `GET`
- **Endpoint**: `/api/v1/foods`
- **Auth**: `Public`
- **Query Parameters**:
  - `region` *(string, optional)*: `all` | `north` | `central` | `south`.
  - `category` *(string, optional)*: `Món nước`, `Cơm & Món khô`, `Bánh & Ăn vặt`, `Đồ uống & Chè`.
  - `keyword` *(string, optional)*: Tên món ăn hoặc địa phương.
  - `minPrice` / `maxPrice` *(int, optional)*
  - `page` *(int, default: 1)*
  - `pageSize` *(int, default: 12)*

**Response Schema (`data`):**
```json
[
  {
    "id": 1,
    "name": "Phở Bò Hà Nội",
    "region": "north",
    "regionName": "Hà Nội - Miền Bắc",
    "category": "Món nước",
    "priceRange": "45.000đ - 90.000đ",
    "minPrice": 45000,
    "maxPrice": 90000,
    "imageUrl": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43",
    "description": "Nước dùng trong veo, ngọt thanh tự nhiên từ xương bò hầm 12 tiếng hòa quyện cùng quế hồi...",
    "highlights": [
      "Nước dùng thanh ngọt bí truyền",
      "Ăn kèm quẩy giòn và giấm tỏi ớt",
      "Món ăn biểu tượng quốc hồn ẩm thực Việt"
    ],
    "suggestedPlaces": [
      {
        "name": "Phở Gia Truyền Bát Đàn",
        "address": "49 Bát Đàn, Hoàn Kiếm, Hà Nội",
        "rating": 4.8,
        "price": "60.000đ"
      },
      {
        "name": "Phở Thìn Lò Đúc",
        "address": "13 Lò Đúc, Hai Bà Trưng, Hà Nội",
        "rating": 4.6,
        "price": "75.000đ"
      }
    ]
  }
]
```

---

## 4. 🧭 NHÓM API KẾ HOẠCH LỊCH TRÌNH DU LỊCH (ITINERARY PAGE)

> **Lưu ý quan trọng**: Toàn bộ API lấy lịch trình chi tiết yêu cầu người dùng phải đăng nhập (`Authorization: Bearer <token>`).

### 4.1. Lấy danh sách lịch trình du lịch mẫu
- **Method**: `GET`
- **Endpoint**: `/api/v1/itineraries`
- **Auth**: `Bearer Token (Required)`
- **Query Parameters**:
  - `duration` *(string, optional)*: `all` | `1` | `2` | `3` | `4+`.
  - `region` *(string, optional)*: `north` | `central` | `south`.
  - `keyword` *(string, optional)*: Điểm đến hoặc tên lịch trình.
  - `page` *(int, default: 1)*
  - `pageSize` *(int, default: 10)*

**Response Schema (`data`):**
```json
[
  {
    "id": 1,
    "title": "Hành Trình Khám Phá Di Sản Đà Nẵng - Hội An 3N2Đ",
    "destination": "Đà Nẵng & Quảng Nam",
    "region": "central",
    "duration": "3 Ngày 2 Đêm",
    "daysCount": 3,
    "style": "Văn hóa & Check-in",
    "estimatedCost": "3.500.000đ / người",
    "coverUrl": "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b",
    "author": {
      "name": "Lê Hoàng Minh",
      "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"
    },
    "overview": "Lịch trình cân bằng hoàn hảo giữa vui chơi giải trí hiện đại tại Bà Nà Hills...",
    "days": [
      {
        "dayNumber": 1,
        "title": "Check-in Đà Nẵng - Bán đảo Sơn Trà & Biển Mỹ Khê",
        "stops": [
          {
            "time": "08:30",
            "activity": "Đáp sân bay Đà Nẵng & Ăn sáng Mì Quảng Bà Mua",
            "location": "19 Trần Bình Trọng, Đà Nẵng",
            "description": "Thưởng thức tô Mì Quảng ếch thơm ngon chuẩn vị tiếp năng lượng.",
            "costEstimate": "50.000đ",
            "tips": "Nên đặt bàn trước nếu đi đoàn đông."
          },
          {
            "time": "14:30",
            "activity": "Khám phá Bán đảo Sơn Trà & Viếng Chùa Linh Ứng",
            "location": "Bán đảo Sơn Trà, Đà Nẵng",
            "description": "Chiêm bái tượng Phật Bà Quan Âm cao 67m hướng ra biển Đông rộng lớn.",
            "tips": "Nên mang theo mũ rộng vành và nước uống."
          }
        ]
      }
    ]
  }
]
```

---

### 4.2. Lưu lịch trình vào bộ sưu tập cá nhân
- **Method**: `POST`
- **Endpoint**: `/api/v1/itineraries/{id}/save`
- **Auth**: `Bearer Token (Required)`
- **Response**: `{ "saved": true, "itineraryId": 1 }`

---

## 5. 📖 NHÓM API TẠP CHÍ & CẨM NANG DU LỊCH (BLOG PAGE)

### 5.1. Lấy danh sách bài viết cẩm nang du lịch
- **Method**: `GET`
- **Endpoint**: `/api/v1/blogs`
- **Auth**: `Public`
- **Query Parameters**:
  - `category` *(string, optional)*: `Kinh nghiệm thực tế`, `Tọa độ check-in`, `Mẹo du lịch`, `Văn hóa & Lễ hội`.
  - `keyword` *(string, optional)*: Tìm kiếm từ khóa.
  - `page` *(int, default: 1)*
  - `pageSize` *(int, default: 9)*

**Response Schema (`data`):**
```json
[
  {
    "id": 1,
    "slug": "kinh-nghiem-du-lich-ha-long-tu-tuc-tu-a-z",
    "title": "Kinh Nghiệm Du Lịch Hạ Long Tự Túc 2025: Ăn Gì, Chơi Gì, Ở Đâu?",
    "excerpt": "Tổng hợp tất cả kinh nghiệm thực tế về cách chọn du thuyền, đặt vé tham quan hang động...",
    "content": "Vịnh Hạ Long luôn là điểm đến không bao giờ hạ nhiệt trên bản đồ du lịch Việt Nam...\n\n### 1. Thời điểm lý tưởng...",
    "category": "Kinh nghiệm thực tế",
    "readTime": "6 phút đọc",
    "coverUrl": "https://images.unsplash.com/photo-1528127269322-539801943592",
    "author": {
      "name": "Nguyễn Hải Đăng",
      "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
      "role": "Travel Blogger"
    },
    "publishedAt": "04 Tháng 09, 2025",
    "tags": ["Hạ Long", "Du thuyền", "Kinh nghiệm phượt", "Biển đảo"],
    "featured": true
  }
]
```

---

### 5.2. Lấy bài viết tiêu điểm nổi bật (Featured Article)
- **Method**: `GET`
- **Endpoint**: `/api/v1/blogs/featured`
- **Auth**: `Public`
- **Response**: Đối tượng `BlogPostDto` có `featured: true` mới nhất.

---

### 5.3. Lấy chi tiết bài viết theo Slug hoặc ID
- **Method**: `GET`
- **Endpoint**: `/api/v1/blogs/{idOrSlug}`
- **Auth**: `Public`
- **Path Parameter**: `idOrSlug` *(string/int, required)*
- **Response**: Toàn bộ đối tượng `BlogPostDto` kèm danh sách bài viết liên quan.

---

## 📊 BẢNG TỔNG HỢP ENDPOINT

| STT | Chức năng | Method | Endpoint URL | Auth Required |
|:---:|---|:---:|---|:---:|
| 1 | Chi tiết địa điểm | `GET` | `/api/v1/places/{id}` | ❌ Public |
| 2 | Danh sách đánh giá & thống kê sao | `GET` | `/api/v1/places/{id}/reviews` | ❌ Public |
| 3 | Gửi đánh giá mới | `POST` | `/api/v1/places/{id}/reviews` | 🔒 **Bearer Token** |
| 4 | Báo cáo sai sót / đóng cửa | `POST` | `/api/v1/places/{id}/reports` | ❌ Public / Token |
| 5 | Lưu / Bỏ lưu địa điểm | `POST`/`DELETE` | `/api/v1/places/{id}/save` | 🔒 **Bearer Token** |
| 6 | Tọa độ địa điểm cho bản đồ | `GET` | `/api/v1/places/map` | ❌ Public |
| 7 | Danh sách món ăn ẩm thực 3 miền | `GET` | `/api/v1/foods` | ❌ Public |
| 8 | Danh sách lịch trình du lịch mẫu | `GET` | `/api/v1/itineraries` | 🔒 **Bearer Token** |
| 9 | Lưu lịch trình vào mục yêu thích | `POST` | `/api/v1/itineraries/{id}/save` | 🔒 **Bearer Token** |
| 10 | Danh sách bài viết cẩm nang | `GET` | `/api/v1/blogs` | ❌ Public |
| 11 | Bài viết tiêu điểm tuần | `GET` | `/api/v1/blogs/featured` | ❌ Public |
| 12 | Chi tiết bài viết cẩm nang | `GET` | `/api/v1/blogs/{idOrSlug}` | ❌ Public |
