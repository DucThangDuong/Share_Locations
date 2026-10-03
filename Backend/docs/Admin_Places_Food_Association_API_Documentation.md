# Tài liệu API & Kỹ thuật: Liên kết Món ăn Đặc sản với Địa điểm (Admin Places)

Tài liệu này đặc tả chi tiết các thay đổi và cấu trúc dữ liệu cho tính năng tích hợp món ăn đặc sản vào luồng quản trị địa điểm du lịch dành cho Quản trị viên (Admin).

---

## 1. Tổng quan kiến trúc (Architecture Overview)

- **Mối quan hệ dữ liệu:** Nhiều - Nhiều (Many-to-Many) giữa `dbo.Places` và `dbo.Foods` thông qua bảng trung gian `dbo.FoodPlaces`.
- **Cơ chế lưu trữ:** 
  - Đọc dữ liệu (Query): Sử dụng **Dapper** truy vấn kết hợp bảng `FoodPlaces` và `Foods` với hiệu năng tối ưu.
  - Ghi / Cập nhật dữ liệu (Command): Sử dụng **Entity Framework Core** để đồng bộ dữ liệu vào `TravelReviewDbContext.FoodPlaces`.
- **Bộ chuyển đổi dữ liệu linh hoạt (Flexible Converter):** Tích hợp `FlexibleLongListConverter` cho phép nhận payload dạng danh sách số nguyên `[1, 2]`, chuỗi `["1", "2"]`, hoặc mảng đối tượng `[{"id": 1}]`.

---

## 2. Đặc tả chi tiết các Endpoints

### 2.1. Lấy chi tiết địa điểm (Get Place Detail)

- **Endpoint:** `GET /api/admin/places/{id}`
- **Quyền hạn (Roles):** `CategoryAdmin`, `SystemAdmin`
- **Mô tả:** Lấy toàn bộ thông tin chi tiết của địa điểm, bao gồm toạ độ, danh mục, hình ảnh, giờ mở cửa và **danh sách các món ăn đặc sản liên kết**.
- **Đặc điểm:** Nếu địa điểm chưa có món ăn nào được gán, trường `foods` và `foodIds` sẽ **trả về mảng rỗng `[]`**.

#### Phản hồi mẫu (Response Example):
```json
{
  "code": 200,
  "message": "Thành công",
  "data": {
    "id": 10,
    "name": "Nhà hàng Cố Đô",
    "category": "Nhà hàng",
    "categoryId": 2,
    "province": "Thừa Thiên Huế",
    "provinceId": 15,
    "location": "123 Lê Lợi, TP. Huế",
    "latitude": 16.4637,
    "longitude": 107.5909,
    "minPrice": 50000,
    "maxPrice": 250000,
    "hours": "08:00 - 22:00",
    "phone": "0234 3822 123",
    "website": "https://nhahangcodo.vn",
    "statusNum": 1,
    "status": "Đã duyệt",
    "rating": 4.8,
    "reviewsCount": 42,
    "img": "https://travelblob.core.windows.net/places/codo_main.jpg",
    "description": "Nhà hàng phục vụ các món ăn cung đình và đặc sản Huế.",
    "photos": [
      "https://travelblob.core.windows.net/places/codo_1.jpg",
      "https://travelblob.core.windows.net/places/codo_2.jpg"
    ],
    "createdAt": "2026-09-15T08:30:00Z",
    "updatedAt": "2026-10-03T03:20:00Z",
    "foods": [
      {
        "id": 1,
        "name": "Bún Bò Huế",
        "minPrice": 35000,
        "maxPrice": 65000,
        "coverImg": "https://travelblob.core.windows.net/foods/bunbo.jpg",
        "coverImageUrl": "https://travelblob.core.windows.net/foods/bunbo.jpg",
        "description": "Bún bò chuẩn vị Huế đậm đà mắm ruốc và sả.",
        "desc": "Bún bò chuẩn vị Huế đậm đà mắm ruốc và sả.",
        "status": "active",
        "statusNum": 1
      },
      {
        "id": 5,
        "name": "Bánh Bèo Chén",
        "minPrice": 20000,
        "maxPrice": 40000,
        "coverImg": "https://travelblob.core.windows.net/foods/banhbeo.jpg",
        "coverImageUrl": "https://travelblob.core.windows.net/foods/banhbeo.jpg",
        "description": "Bánh bèo chén tôm cháy thơm ngon.",
        "desc": "Bánh bèo chén tôm cháy thơm ngon.",
        "status": "active",
        "statusNum": 1
      }
    ],
    "foodIds": [1, 5]
  }
}
```

---

### 2.2. Tạo mới địa điểm kèm món ăn (Create Place)

- **Endpoint:** `POST /api/admin/places`
- **Quyền hạn (Roles):** `CategoryAdmin`, `SystemAdmin`
- **Mô tả:** Tạo mới địa điểm du lịch, hỗ trợ gán danh sách ID món ăn đặc sản ngay khi tạo.
- **Request Body (JSON):**

| Trường (Field) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `name` | `string` | **Có** | Tên địa điểm. |
| `provinceId` | `int` | **Có** | ID Tỉnh/Thành phố. |
| `categoryId` | `int` | **Có** | ID Danh mục địa điểm. |
| `address` / `location` | `string` | **Có** | Địa chỉ chi tiết. |
| `latitude` | `decimal?` | Không | Toạ độ Vĩ độ (GPS). |
| `longitude` | `decimal?` | Không | Toạ độ Kinh độ (GPS). |
| `minPrice` | `decimal?` | Không | Giá thấp nhất (VNĐ). |
| `maxPrice` | `decimal?` | Không | Giá cao nhất (VNĐ). |
| `hours` / `openingHours` | `string?` | Không | Giờ mở cửa hoạt động. |
| `phone` | `string?` | Không | Số điện thoại liên hệ. |
| `website` | `string?` | Không | Địa chỉ trang web. |
| `description` / `desc` | `string?` | Không | Bài viết giới thiệu / mô tả chi tiết. |
| `coverImg` / `primaryImageUrl` | `string?` | Không | URL hình ảnh đại diện chính. |
| `photos` / `images` | `List<string>?` | Không | Danh sách URL hình ảnh bổ sung. |
| `autoApprove` | `bool` | Không | Tự động duyệt trạng thái (mặc định `true`). |
| **`foodIds`** / **`foods`** | `List<long>?` | Không | Danh sách ID các món ăn đặc sản liên kết. |

#### Yêu cầu mẫu (Request Body Example):
```json
{
  "name": "Quán Bún Bò Bà Hoa",
  "provinceId": 15,
  "categoryId": 2,
  "address": "45 Mai Thúc Loan, TP. Huế",
  "latitude": 16.4715,
  "longitude": 107.5842,
  "minPrice": 30000,
  "maxPrice": 50000,
  "hours": "06:00 - 11:00",
  "description": "Quán bún bò gia truyền hơn 30 năm tại đất cố đô.",
  "coverImg": "https://travelblob.core.windows.net/places/bahuy_cover.jpg",
  "photos": [
    "https://travelblob.core.windows.net/places/bahuy_1.jpg"
  ],
  "foodIds": [1, 5]
}
```

#### Phản hồi mẫu (Response Example):
```json
{
  "code": 201,
  "message": "Tạo mới địa điểm thành công.",
  "data": 105
}
```

---

### 2.3. Cập nhật thông tin địa điểm và danh sách món ăn (Update Place)

- **Endpoint:** `PUT /api/admin/places/{id}`
- **Quyền hạn (Roles):** `CategoryAdmin`, `SystemAdmin`
- **Mô tả:** Cập nhật thông tin địa điểm và đồng bộ lại danh sách món ăn liên kết.
- **Quy tắc cập nhật món ăn (`FoodIds`):**
  - **`foodIds: [1, 5, 8]`**: Đồng bộ danh sách mới (hệ thống sẽ thay thế liên kết cũ bằng danh sách ID mới).
  - **`foodIds: []`**: Xóa toàn bộ liên kết món ăn của địa điểm này.
  - **Không gửi `foodIds` (hoặc gửi `null`)**: Giữ nguyên danh sách món ăn hiện tại, không thay đổi.

#### Yêu cầu mẫu (Request Body Example):
```json
{
  "name": "Quán Bún Bò & Bánh Bèo Bà Hoa (Đã đổi tên)",
  "minPrice": 35000,
  "maxPrice": 60000,
  "hours": "06:00 - 13:00",
  "foodIds": [1, 5, 8]
}
```

#### Phản hồi mẫu (Response Example):
```json
{
  "code": 200,
  "message": "Cập nhật thông tin địa điểm thành công.",
  "data": true
}
```

---

## 3. Cấu trúc các DTOs & Classes

### 3.1. `AdminPlaceFoodDto`
```csharp
public class AdminPlaceFoodDto
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string? CoverImg { get; set; }
    public string? CoverImageUrl
    {
        get => CoverImg;
        set => CoverImg = value;
    }
    public string? Description { get; set; }
    public string? Desc
    {
        get => Description;
        set => Description = value;
    }
    public string Status { get; set; } = "active";
    public int StatusNum { get; set; } = 1;
}
```

### 3.2. `AdminPlaceDetailDto`
```csharp
public class AdminPlaceDetailDto : AdminPlaceListItemDto
{
    public string? Description { get; set; }
    public List<string> Photos { get; set; } = new();
    public List<string> Images
    {
        get => Photos;
        set => Photos = value;
    }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Danh sách chi tiết món ăn (luôn trả về [] nếu không có)
    public List<AdminPlaceFoodDto> Foods { get; set; } = new();

    // Danh sách ID món ăn phục vụ cho các form chỉnh sửa phía Client
    public List<long> FoodIds => Foods.Select(f => f.Id).ToList();
}
```

### 3.3. `FlexibleLongListConverter`
Được gán trên các thuộc tính `FoodIds` trong `CreateAdminPlaceInput` và `UpdateAdminPlaceInput`:
```csharp
[JsonConverter(typeof(FlexibleLongListConverter))]
public List<long>? FoodIds { get; set; }
```
Converter này tự động xử lý:
1. Mảng số ID: `[1, 2, 3]`
2. Mảng chuỗi: `["1", "2", "3"]`
3. Mảng Object: `[{"id": 1}, {"foodId": 2}]`

---

## 4. Bảng tổng hợp các tệp tin đã sửa đổi

| STT | Tệp tin (File Path) | Tóm tắt thay đổi |
| :---: | :--- | :--- |
| 1 | `Domain/Entities/FoodPlace.cs` | Thêm constructor `protected FoodPlace()` và `public FoodPlace(long foodId, long placeId)`. |
| 2 | `Application/Common/Converters/FlexibleLongListConverter.cs` | Tạo mới converter JSON tùy biến để parse mảng ID linh hoạt. |
| 3 | `Application/DTOs/Admin/AdminPlaceDtos.cs` | Khai báo `AdminPlaceFoodDto`, thêm `Foods`/`FoodIds` vào `AdminPlaceDetailDto`, `CreateAdminPlaceInput`, `UpdateAdminPlaceInput`. |
| 4 | `Infrastructure/Persistence/Repositories/AdminPlaceRepository.cs` | Thêm query lấy món ăn trong `GetAdminPlaceDetailAsync`, lưu món ăn trong `CreateAdminPlaceAsync` và đồng bộ trong `UpdateAdminPlaceAsync`. |
| 5 | `API/Endpoints/Admin/Places/GetAdminPlaceDetailEndpoint.cs` | Cập nhật Swagger doc mô tả danh sách món ăn liên kết. |
| 6 | `API/Endpoints/Admin/Places/CreateAdminPlaceEndpoint.cs` | Cập nhật Swagger doc hỗ trợ gán món ăn khi tạo mới. |
| 7 | `API/Endpoints/Admin/Places/UpdateAdminPlaceEndpoint.cs` | Cập nhật Swagger doc hỗ trợ cập nhật danh sách món ăn. |
