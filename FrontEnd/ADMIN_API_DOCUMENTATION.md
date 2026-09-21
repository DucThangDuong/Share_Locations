# TÀI LIỆU KỸ THUẬT BỘ API ADMIN & KIỂM DUYỆT (ADMIN & MODERATION API SPECIFICATION)

Tài liệu này tổng hợp toàn bộ các API Quản trị viên (Admin) và Báo cáo Kiểm duyệt (Moderation) vừa được triển khai trên hệ thống Backend (.NET 8 Clean Architecture).

---

## 1. QUY CHUẨN CHUNG (GENERAL CONVENTIONS)

### 1.1. Base URL & Authentication
- **Base URL:** `http://localhost:5000` (hoặc domain môi trường triển khai)
- **Authentication:** `Bearer <JWT_TOKEN>` truyền qua Header:
  ```http
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...
  ```
- **Vai trò phân quyền (Roles):**
  - Người dùng thông thường: Các endpoint `/api/reports/*`
  - Quản trị viên: Tất cả các endpoint `/api/admin/*` yêu cầu quyền `CategoryAdmin` hoặc `SystemAdmin`.

### 1.2. Định dạng phản hồi chuẩn (Standard Response Format)
Tất cả các API trả về đều được đóng gói theo định dạng `ApiSuccessResponse<T>` hoặc `ErrorResponse`:

#### Phản hồi thành công (Success - HTTP 200/201):
```json
{
  "success": true,
  "message": "Thông điệp thành công.",
  "data": { ... }
}
```

#### Phản hồi phân trang (Paged Result):
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [ ... ],
    "total": 120,
    "page": 1,
    "pageSize": 20,
    "totalPages": 6
  }
}
```

#### Phản hồi lỗi (Error - HTTP 400/401/403/404/500):
```json
{
  "success": false,
  "message": "Mô tả chi tiết lỗi.",
  "errors": [
    "Chi tiết mã lỗi hoặc thông báo kiểm tra hợp lệ"
  ]
}
```

---

## 2. MODULE 1: BÁO CÁO VI PHẠM & KIỂM DUYỆT (REPORTS & MODERATION)

### 2.1. Lấy danh mục lý do báo cáo
- **Endpoint:** `GET /api/reports/reasons`
- **Quyền hạn:** Public / Authenticated
- **Mô tả:** Trả về danh sách gợi ý các lý do khi người dùng muốn báo cáo vi phạm.
- **Request:** Không yêu cầu query/body.
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "code": "spam",
      "name": "Nội dung rác hoặc quảng cáo trái phép"
    },
    {
      "code": "inappropriate",
      "name": "Nội dung không phù hợp hoặc phản cảm"
    },
    {
      "code": "harassment",
      "name": "Quấy rối, đe dọa hoặc thù địch"
    },
    {
      "code": "misinformation",
      "name": "Thông tin sai lệch hoặc gây hiểu nhầm"
    },
    {
      "code": "violence",
      "name": "Nội dung bạo lực hoặc nguy hiểm"
    },
    {
      "code": "copyright",
      "name": "Vi phạm bản quyền hình ảnh / tác quyền"
    },
    {
      "code": "other",
      "name": "Lý do khác"
    }
  ]
}
```

---

### 2.2. Gửi báo cáo vi phạm
- **Endpoint:** `POST /api/reports`
- **Quyền hạn:** Authenticated User
- **Mô tả:** Người dùng gửi báo cáo vi phạm đối với Địa điểm, Đánh giá, Bình luận, hoặc Blog.
- **Request Body (JSON):**
```json
{
  "targetType": "Place", // "Place" | "Review" | "Comment" | "Blog"
  "targetId": 128,
  "reason": "Spam hoặc quảng cáo",
  "notes": "Địa điểm này đã đóng cửa và chứa link cờ bạc trái phép"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Báo cáo vi phạm đã được ghi nhận.",
  "data": 15 // Report ID vừa được tạo
}
```

---

### 2.3. Xem lịch sử báo cáo của người dùng hiện tại
- **Endpoint:** `GET /api/reports/my-reports`
- **Quyền hạn:** Authenticated User
- **Mô tả:** Danh sách các báo cáo do tài khoản hiện tại đã gửi lên hệ thống.
- **Query Parameters:**
  - `page`: int (mặc định: 1)
  - `pageSize`: int (mặc định: 20)
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [
      {
        "id": 15,
        "targetType": "Place",
        "targetId": 128,
        "targetTitle": "Quán Cà Phê Trứng Góc Phố",
        "reason": "Spam hoặc quảng cáo",
        "notes": "Địa điểm này đã đóng cửa và chứa link cờ bạc trái phép",
        "status": "Pending", // "Pending" | "Reviewed" | "Dismissed"
        "createdAt": "2026-09-20T10:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

---

### 2.4. Hàng đợi kiểm duyệt báo cáo (Admin Queue)
- **Endpoint:** `GET /api/admin/reports`
- **Quyền hạn:** `CategoryAdmin`, `SystemAdmin`
- **Mô tả:** Lấy danh sách toàn bộ báo cáo vi phạm trên hệ thống kết hợp đa hình từ 4 bảng vi phạm.
- **Query Parameters:**
  - `targetType`: string (Tùy chọn: `Place`, `Review`, `Comment`, `Blog`)
  - `status`: string (Tùy chọn: `Pending`, `Reviewed`, `Dismissed`)
  - `page`: int (mặc định: 1)
  - `pageSize`: int (mặc định: 20)
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [
      {
        "id": 15,
        "targetType": "Place",
        "targetId": 128,
        "targetTitle": "Quán Cà Phê Trứng Góc Phố",
        "reporterId": 45,
        "reporterName": "Lê Văn Hùng",
        "reason": "Spam hoặc quảng cáo",
        "notes": "Địa điểm này đã đóng cửa và chứa link cờ bạc trái phép",
        "status": "Pending",
        "createdAt": "2026-09-20T10:00:00Z",
        "resolvedBy": null,
        "resolvedAt": null
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

---

### 2.5. Danh sách báo cáo gom nhóm (Grouped Reports)
- **Endpoint:** `GET /api/admin/reports/grouped`
- **Quyền hạn:** `CategoryAdmin`, `SystemAdmin`
- **Mô tả:** Lọc các đối tượng (Place, Review, Comment, Blog) bị nhiều người báo cáo cùng lúc (`count >= 2`), giúp Admin ưu tiên xử lý đối tượng nghiêm trọng.
- **Query Parameters:**
  - `minReports`: int (mặc định: 2)
  - `targetType`: string (Tùy chọn)
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "targetType": "Review",
      "targetId": 890,
      "targetTitle": "Đánh giá tại Quán Ăn Ngon",
      "reportCount": 5,
      "reasons": [
        "Nội dung xúc phạm",
        "Spam"
      ],
      "latestReportAt": "2026-09-21T02:15:00Z"
    }
  ]
}
```

---

### 2.6. Xử lý báo cáo vi phạm (Resolve Report)
- **Endpoint:** `POST /api/admin/reports/{id}/resolve`
- **Quyền hạn:** `CategoryAdmin`, `SystemAdmin`
- **Path Parameters:**
  - `id`: long (Mã báo cáo)
- **Request Body (JSON):**
```json
{
  "action": "hide_content", // "dismiss" | "warn" | "hide_content" | "delete_content" | "ban_user"
  "adminNotes": "Tạm ẩn nội dung do phát hiện vi phạm bản quyền hình ảnh",
  "targetType": "Place",
  "targetId": 128
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Xử lý báo cáo thành công.",
  "data": true
}
```

---

## 3. MODULE 2: QUẢN LÝ ĐỊA ĐIỂM & TỌA ĐỘ MAPBOX (PLACES MANAGEMENT)

### 3.1. Danh sách địa điểm (Admin List)
- **Endpoint:** `GET /api/admin/places`
- **Quyền hạn:** `CategoryAdmin`, `SystemAdmin`
- **Query Parameters:**
  - `q`: string (Từ khóa tìm kiếm theo tên)
  - `provinceId`: int (Lọc theo mã tỉnh thành)
  - `categoryId`: int (Lọc theo danh mục)
  - `status`: string (Tùy chọn: `active`, `pending`, `suspended`, `closed`)
  - `page`: int (mặc định: 1)
  - `pageSize`: int (mặc định: 20)
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [
      {
        "id": 128,
        "name": "Hồ Hoàn Kiếm",
        "slug": "ho-hoan-kiem",
        "coverImg": "https://cdn.example.com/ho-guom.jpg",
        "address": "Phố Đinh Tiên Hoàng, Hoàn Kiếm, Hà Nội",
        "provinceName": "Hà Nội",
        "categoryName": "Thắng cảnh",
        "status": "Active",
        "avgRating": 4.8,
        "reviewCount": 1420,
        "createdAt": "2026-01-15T08:30:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

---

### 3.2. Xem chi tiết địa điểm
- **Endpoint:** `GET /api/admin/places/{id}`
- **Quyền hạn:** `CategoryAdmin`, `SystemAdmin`
- **Path Parameters:**
  - `id`: long
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": 128,
    "name": "Hồ Hoàn Kiếm",
    "slug": "ho-hoan-kiem",
    "desc": "Trái tim của thủ đô Hà Nội với tháp Rùa cổ kính...",
    "coverImg": "https://cdn.example.com/ho-guom.jpg",
    "address": "Phố Đinh Tiên Hoàng, Hoàn Kiếm, Hà Nội",
    "latitude": 21.028511,
    "longitude": 105.854444,
    "provinceId": 1,
    "provinceName": "Hà Nội",
    "categoryId": 3,
    "categoryName": "Thắng cảnh",
    "status": "Active",
    "avgRating": 4.8,
    "reviewCount": 1420,
    "viewCount": 25000,
    "priceLevel": "Free",
    "openingHours": "Mở cửa cả ngày",
    "createdAt": "2026-01-15T08:30:00Z",
    "media": [
      {
        "id": 301,
        "url": "https://cdn.example.com/ho-guom-1.jpg",
        "type": "Image",
        "caption": "Cầu Thê Húc"
      }
    ]
  }
}
```

---

### 3.3. Tạo địa điểm mới thủ công
- **Endpoint:** `POST /api/admin/places`
- **Quyền hạn:** `CategoryAdmin`, `SystemAdmin`
- **Request Body (JSON):**
```json
{
  "name": "Đỉnh Fansipan - Nóc Nhà Đông Dương",
  "desc": "Đỉnh núi cao nhất Việt Nam với quần thể tâm linh kỳ vĩ",
  "coverImg": "https://cdn.example.com/fansipan.jpg",
  "address": "Thị xã Sa Pa, Lào Cai",
  "latitude": 22.303388,
  "longitude": 103.775105,
  "provinceId": 15,
  "categoryId": 3,
  "priceLevel": "High",
  "openingHours": "07:30 - 17:30",
  "mediaUrls": [
    "https://cdn.example.com/fansipan-view.jpg",
    "https://cdn.example.com/fansipan-cabin.jpg"
  ]
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Tạo địa điểm thành công.",
  "data": 129 // ID của địa điểm mới
}
```

---

### 3.4. Cập nhật thông tin địa điểm
- **Endpoint:** `PUT /api/admin/places/{id}`
- **Quyền hạn:** `CategoryAdmin`, `SystemAdmin`
- **Path Parameters:**
  - `id`: long
- **Request Body (JSON):**
```json
{
  "name": "Đỉnh Fansipan - Legend Sun World",
  "desc": "Khu du lịch cáp treo Fansipan Legend...",
  "coverImg": "https://cdn.example.com/fansipan-new.jpg",
  "address": "Thị xã Sa Pa, Lào Cai",
  "latitude": 22.303388,
  "longitude": 103.775105,
  "provinceId": 15,
  "categoryId": 3,
  "status": "Active", // "Active" | "Pending" | "Suspended" | "Closed"
  "priceLevel": "High",
  "openingHours": "08:00 - 18:00"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Cập nhật địa điểm thành công.",
  "data": true
}
```

---

### 3.5. Cập nhật nhanh trạng thái địa điểm
- **Endpoint:** `PATCH /api/admin/places/{id}/status`
- **Quyền hạn:** `CategoryAdmin`, `SystemAdmin`
- **Path Parameters:**
  - `id`: long
- **Request Body (JSON):**
```json
{
  "status": "suspended" // "active" | "pending" | "suspended" | "closed"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Cập nhật trạng thái địa điểm thành công.",
  "data": true
}
```

---

### 3.6. Xóa mềm địa điểm
- **Endpoint:** `DELETE /api/admin/places/{id}`
- **Quyền hạn:** `CategoryAdmin`, `SystemAdmin`
- **Path Parameters:**
  - `id`: long
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Xóa địa điểm thành công.",
  "data": true
}
```

---

## 4. MODULE 3: QUẢN LÝ ĐỀ XUẤT ĐÓNG GÓP (PROPOSALS MANAGEMENT)

### 4.1. Danh sách đề xuất đóng góp địa điểm
- **Endpoint:** `GET /api/admin/proposals`
- **Quyền hạn:** `CategoryAdmin`, `SystemAdmin`
- **Query Parameters:**
  - `status`: string (Tùy chọn: `pending`, `approved`, `rejected`)
  - `page`: int (mặc định: 1)
  - `pageSize`: int (mặc định: 20)
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [
      {
        "id": 4,
        "name": "Thác Nàng Tiên",
        "address": "Chiềng Khoa, Vân Hồ, Sơn La",
        "provinceName": "Sơn La",
        "proposerId": 23,
        "proposerName": "Nguyễn Minh Đức",
        "proposerAvatar": "https://cdn.example.com/user23.jpg",
        "status": "Pending",
        "submittedAt": "2026-09-18T14:30:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

---

### 4.2. Chi tiết đề xuất đóng góp
- **Endpoint:** `GET /api/admin/proposals/{id}`
- **Quyền hạn:** `CategoryAdmin`, `SystemAdmin`
- **Path Parameters:**
  - `id`: long
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": 4,
    "name": "Thác Nàng Tiên",
    "desc": "Thác nước hoang sơ gồm 3 tầng với làn nước trong xanh ngọc bích...",
    "coverImg": "https://cdn.example.com/thac-nang-tien.jpg",
    "address": "Chiềng Khoa, Vân Hồ, Sơn La",
    "latitude": 20.81234,
    "longitude": 104.91234,
    "provinceId": 28,
    "provinceName": "Sơn La",
    "categoryId": 3,
    "proposerId": 23,
    "proposerName": "Nguyễn Minh Đức",
    "status": "Pending",
    "submittedAt": "2026-09-18T14:30:00Z",
    "reviewedAt": null,
    "reviewedBy": null,
    "adminNotes": null,
    "mediaUrls": [
      "https://cdn.example.com/thac-nang-tien-1.jpg",
      "https://cdn.example.com/thac-nang-tien-2.jpg"
    ]
  }
}
```

---

### 4.3. Phê duyệt đề xuất (Approve Proposal)
- **Endpoint:** `POST /api/admin/proposals/{id}/approve`
- **Quyền hạn:** `CategoryAdmin`, `SystemAdmin`
- **Mô tả:** Hệ thống tự động tạo mới một địa điểm trong `dbo.Places` và đồng bộ các ảnh đính kèm vào `dbo.PlaceMedia`.
- **Path Parameters:**
  - `id`: long
- **Request Body (JSON):**
```json
{
  "adminNotes": "Thông tin đề xuất chính xác, hình ảnh sắc nét, đã duyệt vào danh mục Thắng cảnh."
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Phê duyệt đề xuất thành công.",
  "data": true
}
```

---

### 4.4. Từ chối đề xuất (Reject Proposal)
- **Endpoint:** `POST /api/admin/proposals/{id}/reject`
- **Quyền hạn:** `CategoryAdmin`, `SystemAdmin`
- **Path Parameters:**
  - `id`: long
- **Request Body (JSON):**
```json
{
  "rejectionReason": "Địa điểm này đã có trên hệ thống với tên gọi Thác Chiềng Khoa."
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Từ chối đề xuất thành công.",
  "data": true
}
```

---

## 5. MODULE 4: QUẢN LÝ ĐÁNH GIÁ & BÌNH LUẬN (REVIEWS & COMMENTS)

### 5.1. Danh sách đánh giá địa điểm (Reviews)
- **Endpoint:** `GET /api/admin/reviews`
- **Quyền hạn:** `CategoryAdmin`, `SystemAdmin`
- **Query Parameters:**
  - `placeId`: long (Lọc theo địa điểm cụ thể)
  - `rating`: int (Lọc từ 1 đến 5 sao)
  - `status`: string (Tùy chọn: `active`, `hidden`, `deleted`)
  - `page`: int (mặc định: 1)
  - `pageSize`: int (mặc định: 20)
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [
      {
        "id": 512,
        "placeId": 128,
        "placeName": "Hồ Hoàn Kiếm",
        "userId": 77,
        "userName": "Trần Thị Mai",
        "userAvatar": "https://cdn.example.com/avatar77.jpg",
        "rating": 1,
        "content": "Quá đông đúc và nhiều người chèo kéo du khách...",
        "status": "Active",
        "createdAt": "2026-09-15T09:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

---

### 5.2. Cập nhật trạng thái đánh giá
- **Endpoint:** `PATCH /api/admin/reviews/{id}/status`
- **Quyền hạn:** `CategoryAdmin`, `SystemAdmin`
- **Mô tả:** Đổi trạng thái hiển thị của đánh giá. Tự động tính toán lại điểm `AvgRating` và `ReviewCount` của địa điểm tương ứng.
- **Path Parameters:**
  - `id`: long
- **Request Body (JSON):**
```json
{
  "status": "hidden" // "active" | "hidden" | "deleted"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Cập nhật trạng thái đánh giá thành công.",
  "data": true
}
```

---

### 5.3. Xóa đánh giá
- **Endpoint:** `DELETE /api/admin/reviews/{id}`
- **Quyền hạn:** `CategoryAdmin`, `SystemAdmin`
- **Path Parameters:**
  - `id`: long
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Xóa đánh giá thành công.",
  "data": true
}
```

---

### 5.4. Danh sách bình luận (Comments)
- **Endpoint:** `GET /api/admin/comments`
- **Quyền hạn:** `CategoryAdmin`, `SystemAdmin`
- **Query Parameters:**
  - `q`: string (Từ khóa tìm kiếm nội dung bình luận)
  - `blogId`: long (Lọc theo bài blog)
  - `status`: string (Tùy chọn: `active`, `hidden`, `deleted`)
  - `page`: int (mặc định: 1)
  - `pageSize`: int (mặc định: 20)
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [
      {
        "id": 921,
        "blogId": 34,
        "blogTitle": "Kinh nghiệm du lịch Sa Pa 3 ngày 2 đêm",
        "userId": 88,
        "userName": "Hoàng Anh",
        "content": "Bài viết rất hữu ích, cảm ơn tác giả!",
        "status": "Active",
        "createdAt": "2026-09-17T11:20:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

---

### 5.5. Cập nhật trạng thái & Xóa bình luận
- **Cập nhật trạng thái:** `PATCH /api/admin/comments/{id}/status`
  - **Body:** `{ "status": "hidden" }`
- **Xóa bình luận:** `DELETE /api/admin/comments/{id}`

---

## 6. MODULE 5: QUẢN LÝ ẨM THỰC & ĐẶC SẢN (FOODS & SPECIALTIES)

### 6.1. Danh sách món ăn ẩm thực
- **Endpoint:** `GET /api/admin/foods`
- **Quyền hạn:** `CategoryAdmin`, `SystemAdmin`
- **Query Parameters:**
  - `q`: string (Tìm kiếm theo tên)
  - `provinceId`: int (Lọc theo tỉnh thành xuất xứ)
  - `status`: string (Tùy chọn: `active`, `hidden`)
  - `page`: int (mặc định: 1)
  - `pageSize`: int (mặc định: 20)
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [
      {
        "id": 67,
        "name": "Bún Chả Hà Nội",
        "coverImg": "https://cdn.example.com/bun-cha.jpg",
        "provinceName": "Hà Nội",
        "minPrice": 35000,
        "maxPrice": 60000,
        "status": "Active",
        "createdAt": "2026-02-10T07:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

---

### 6.2. Tạo món ăn mới
- **Endpoint:** `POST /api/admin/foods`
- **Quyền hạn:** `CategoryAdmin`, `SystemAdmin`
- **Request Body (JSON):**
```json
{
  "name": "Bê Chao Mộc Châu",
  "desc": "Món đặc sản trứ danh vùng cao nguyên Mộc Châu, thịt bê mềm thơm phức vị gừng sả.",
  "historyInfo": "Bắt nguồn từ văn hóa ẩm thực người Thái tại Tây Bắc.",
  "coverImg": "https://cdn.example.com/be-chao.jpg",
  "minPrice": 120000,
  "maxPrice": 250000,
  "provinceId": 28,
  "status": "active"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Tạo món ăn thành công.",
  "data": 68 // ID của món ăn vừa tạo
}
```

---

### 6.3. Cập nhật thông tin món ăn
- **Endpoint:** `PUT /api/admin/foods/{id}`
- **Quyền hạn:** `CategoryAdmin`, `SystemAdmin`
- **Path Parameters:**
  - `id`: long
- **Request Body (JSON):**
```json
{
  "name": "Bê Chao Mộc Châu - Loại 1",
  "desc": "Món đặc sản trứ danh vùng cao nguyên Mộc Châu...",
  "historyInfo": "Bắt nguồn từ văn hóa ẩm thực người Thái...",
  "coverImg": "https://cdn.example.com/be-chao-moi.jpg",
  "minPrice": 150000,
  "maxPrice": 300000,
  "provinceId": 28,
  "status": "active"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Cập nhật món ăn thành công.",
  "data": true
}
```

---

### 6.4. Đổi trạng thái & Xóa món ăn
- **Đổi trạng thái:** `PATCH /api/admin/foods/{id}/status`
  - **Body:** `{ "status": "hidden" }`
- **Xóa mềm:** `DELETE /api/admin/foods/{id}`

---

## 7. MODULE 6: QUẢN LÝ BLOG & CẨM NANG DU LỊCH (BLOGS MANAGEMENT)

### 7.1. Danh sách bài viết blog
- **Endpoint:** `GET /api/admin/blogs`
- **Quyền hạn:** `CategoryAdmin`, `SystemAdmin`
- **Query Parameters:**
  - `q`: string (Tìm kiếm tiêu đề)
  - `status`: string (Tùy chọn: `draft`, `published`, `archived`)
  - `page`: int (mặc định: 1)
  - `pageSize`: int (mặc định: 20)
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [
      {
        "id": 105,
        "title": "Top 10 Địa Điểm Ngắm Hoàng Hôn Đẹp Nhất Đà Lạt",
        "slug": "top-10-dia-diem-ngam-hoang-hon-dep-nhat-da-lat",
        "coverImg": "https://cdn.example.com/da-lat-sunset.jpg",
        "authorName": "Admin Tuyển Chọn",
        "status": "Published",
        "viewCount": 8900,
        "createdAt": "2026-08-01T15:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

---

### 7.2. Chi tiết bài viết blog
- **Endpoint:** `GET /api/admin/blogs/{id}`
- **Quyền hạn:** `CategoryAdmin`, `SystemAdmin`
- **Path Parameters:**
  - `id`: long
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": 105,
    "title": "Top 10 Địa Điểm Ngắm Hoàng Hôn Đẹp Nhất Đà Lạt",
    "slug": "top-10-dia-diem-ngam-hoang-hon-dep-nhat-da-lat",
    "content": "<p>Đà Lạt mùa này đẹp nhất vào buổi xế chiều khi ánh hoàng hôn buông xuống trên sườn đồi...</p>",
    "coverImg": "https://cdn.example.com/da-lat-sunset.jpg",
    "authorId": 1,
    "authorName": "Admin Tuyển Chọn",
    "status": "Published",
    "viewCount": 8900,
    "createdAt": "2026-08-01T15:00:00Z"
  }
}
```

---

### 7.3. Tạo bài viết blog mới
- **Endpoint:** `POST /api/admin/blogs`
- **Quyền hạn:** `CategoryAdmin`, `SystemAdmin`
- **Request Body (JSON):**
```json
{
  "title": "Kinh Nghiệm Phượt Hà Giang Mùa Hoa Tam Giác Mạch",
  "content": "<p>Hà Giang luôn là điểm đến hấp dẫn với những cung đèo ngoạn mục...</p>",
  "coverImg": "https://cdn.example.com/ha-giang.jpg",
  "status": "published" // "draft" | "published" | "archived"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Tạo blog thành công.",
  "data": 106 // ID của bài blog vừa tạo
}
```

---

### 7.4. Cập nhật thông tin blog
- **Endpoint:** `PUT /api/admin/blogs/{id}`
- **Quyền hạn:** `CategoryAdmin`, `SystemAdmin`
- **Path Parameters:**
  - `id`: long
- **Request Body (JSON):**
```json
{
  "title": "Kinh Nghiệm Phượt Hà Giang Mùa Hoa Tam Giác Mạch (Cập Nhật 2026)",
  "content": "<p>Nội dung bài viết bổ sung các quán ăn mới...</p>",
  "coverImg": "https://cdn.example.com/ha-giang-new.jpg",
  "status": "published"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Cập nhật blog thành công.",
  "data": true
}
```

---

### 7.5. Đổi trạng thái & Xóa bài blog
- **Đổi trạng thái:** `PATCH /api/admin/blogs/{id}/status`
  - **Body:** `{ "status": "archived" }`
- **Xóa bài:** `DELETE /api/admin/blogs/{id}`

---

## 8. MODULE 7 & 8: DASHBOARD THỐNG KÊ & DANH MỤC (DASHBOARD & CATALOG)

### 8.1. Thống kê KPI tổng quan Dashboard
- **Endpoint:** `GET /api/admin/dashboard/metrics`
- **Quyền hạn:** `CategoryAdmin`, `SystemAdmin`
- **Mô tả:** Cung cấp toàn bộ các chỉ số điều hành quan trọng trên màn hình chính Admin.
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "summary": {
      "totalPlaces": 1250,
      "newProposalsPending": 14,
      "unresolvedReports": 8,
      "urgentSlaBreached": 2, // Số báo cáo quá 24h chưa xử lý
      "totalReviews": 4320,
      "reportedReviews": 5,
      "totalFoods": 310,
      "totalBlogs": 85
    },
    "provinceStats": [
      {
        "province": "Hà Nội",
        "placesCount": 350,
        "completeness": 95
      },
      {
        "province": "Đà Nẵng",
        "placesCount": 210,
        "completeness": 88
      }
    ]
  }
}
```

---

### 8.2. Mức độ phủ dữ liệu theo 63 Tỉnh Thành (Completeness)
- **Endpoint:** `GET /api/admin/provinces/completeness`
- **Quyền hạn:** `CategoryAdmin`, `SystemAdmin`
- **Mô tả:** Đánh giá độ phủ dữ liệu (%) của địa điểm và món ăn trên toàn quốc, giúp điều hướng đội ngũ nội dung bổ sung thông tin.
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": 1,
      "name": "Hà Nội",
      "placesCount": 350,
      "foodsCount": 85,
      "completenessPercent": 95
    },
    {
      "id": 28,
      "name": "Sơn La",
      "placesCount": 42,
      "foodsCount": 18,
      "completenessPercent": 65
    }
  ]
}
```

---

### 8.3. Danh sách Danh mục phân loại (Categories)
- **Endpoint:** `GET /api/admin/categories`
- **Quyền hạn:** `CategoryAdmin`, `SystemAdmin`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": 1,
      "name": "Ẩm thực & Quán ăn",
      "slug": "am-thuc-quan-an",
      "iconUrl": "https://cdn.example.com/icons/food.svg",
      "displayOrder": 1
    },
    {
      "id": 2,
      "name": "Cà phê & Trà",
      "slug": "ca-phe-tra",
      "iconUrl": "https://cdn.example.com/icons/coffee.svg",
      "displayOrder": 2
    },
    {
      "id": 3,
      "name": "Danh lam thắng cảnh",
      "slug": "thang-canh",
      "iconUrl": "https://cdn.example.com/icons/mountain.svg",
      "displayOrder": 3
    }
  ]
}
```

---

### 8.4. Danh sách Bộ sưu tập tuyển chọn (Featured Collections)
- **Endpoint:** `GET /api/admin/collections`
- **Quyền hạn:** `CategoryAdmin`, `SystemAdmin`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": 10,
      "name": "Top Quán Cà Phê View Đẹp Hà Nội",
      "desc": "Tổng hợp các quán cà phê ngắm trọn hồ Tây và phố cổ",
      "coverImg": "https://cdn.example.com/cafe-collection.jpg",
      "placesCount": 15
    }
  ]
}
```
