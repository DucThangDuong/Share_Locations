# Tài liệu API: Cập nhật Món ăn Đặc sản (Admin)

Tài liệu đặc tả chi tiết cho endpoint cập nhật thông tin và hình ảnh món ăn đặc sản dành cho Quản trị viên, hỗ trợ lưu trữ hình ảnh trực tiếp lên **Azure Blob Storage**.

---

## 1. Thông tin chung (Endpoint Overview)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Endpoint** | `/api/admin/foods/{id}` |
| **Phương thức HTTP** | `PUT` hoặc `POST` |
| **Authentication** | Bearer Token (JWT) |
| **Phân quyền (Roles)** | `CategoryAdmin`, `SystemAdmin` |
| **Định dạng dữ liệu hỗ trợ** | `multipart/form-data` (Upload file trực tiếp) <br> `application/json` (Gửi chuỗi Base64 hoặc URL) |
| **Dung lượng tệp tối đa** | 10 MB |
| **Định dạng ảnh cho phép** | `.jpg`, `.jpeg`, `.png`, `.webp` |
| **Lưu trữ Blob Container** | Azure Blob Storage — Container: `foods` |

---

## 2. Tham số đường dẫn (Route Parameters)

| Tham số | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `id` | `long` / `number` | **Có** | ID định danh của món ăn đặc sản cần cập nhật. |

---

## 3. Cấu trúc dữ liệu yêu cầu (Request Body)

Endpoint hỗ trợ 2 hình thức truyền tải dữ liệu linh hoạt:

### Cách 1: `multipart/form-data` (Khuyên dùng khi có tệp ảnh)

| Trường (Field) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `name` | `string` | **Có** | Tên món ăn đặc sản (không được để trống). |
| `image` / `file` / `coverImage` / `coverImg` | `File` (Binary) | Không | Tệp hình ảnh món ăn từ máy tính / thiết bị. Hệ thống sẽ tự động upload lên Azure Blob container `foods`. |
| `provinceId` | `number` / `int` | Không | ID của tỉnh thành gắn liền với món ăn đặc sản. |
| `minPrice` | `number` / `decimal` | Không | Mức giá thấp nhất tham khảo (VNĐ). |
| `maxPrice` | `number` / `decimal` | Không | Mức giá cao nhất tham khảo (VNĐ). Phải $\ge$ `minPrice`. |
| `desc` | `string` | Không | Mô tả ngắn / hương vị / cách thưởng thức món ăn. |
| `historyInfo` | `string` | Không | Nguồn gốc, lịch sử, văn hóa truyền thống của món ăn. |
| `status` | `string` | Không | Trạng thái hiển thị: `"active"` (công khai) hoặc `"hidden"` (tạm ẩn). Mặc định là `"active"`. |
| `coverImg` | `string` | Không | URL hình ảnh hiện tại (nếu không chọn file mới). Nếu để trống và không upload file mới, hệ thống sẽ **giữ nguyên ảnh cũ**. |

---

### Cách 2: `application/json` (Khi cập nhật thông tin chữ hoặc gửi ảnh Base64)

```json
{
  "name": "Bún Bò Huế",
  "provinceId": 15,
  "minPrice": 35000,
  "maxPrice": 65000,
  "desc": "Món ăn đặc sản đậm đà hương vị ruốc sả của cố đô Huế.",
  "historyInfo": "Bún bò xuất hiện từ thời chúa Nguyễn Hoàng (thế kỷ 16)...",
  "status": "active",
  "coverImg": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..." 
}
```

> [!TIP]
> Nếu `coverImg` là chuỗi Base64 (`data:image/...`), backend sẽ tự động giải mã, nén và upload lên Azure Blob Storage, sau đó lưu URL chính thức `https://<account>.blob.core.windows.net/foods/...` vào cơ sở dữ liệu.

---

## 4. Cơ chế xử lý nghiệp vụ tại Backend

1. **Xác thực & Phân quyền**:
   - Kiểm tra Token JWT của Admin (`SystemAdmin` hoặc `CategoryAdmin`).
   - Kiểm tra phạm vi quản lý (Scope): `CategoryAdmin` chỉ được chỉnh sửa món ăn thuộc tỉnh thành hoặc danh mục mình được phân công.
2. **Xử lý hình ảnh tải lên**:
   - Nếu có tệp đính kèm (`File` / `Image` / `CoverImage` / `CoverImg`): Kiểm tra dung lượng $\le 10\text{ MB}$, định dạng `.jpg`, `.jpeg`, `.png`, `.webp`. Upload trực tiếp stream lên container `foods` trên Azure Blob Storage.
   - Nếu `coverImg` là chuỗi Base64: Giải mã chuỗi bytes và upload lên Azure Blob Storage.
   - Nếu không truyền ảnh mới: Giữ nguyên ảnh bìa hiện tại của món ăn trong DB, tránh làm mất ảnh.
3. **Cập nhật dữ liệu & Dọn dẹp**:
   - Cập nhật thông tin chi tiết vào bảng `dbo.Foods`.
   - Cập nhật liên kết tỉnh thành vào bảng `dbo.FoodProvinces`.
   - Nếu ảnh bìa cũ nằm trên Azure Blob (`.blob.core.windows.net/`) và đã được thay bằng ảnh mới: Background task tự động dọn dẹp ảnh cũ để tiết kiệm dung lượng lưu trữ.

---

## 5. Cấu trúc dữ liệu phản hồi (Response)

### Phản hồi thành công (`200 OK`)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cập nhật món ăn thành công.",
  "data": {
    "id": 12,
    "coverImg": "https://langthangstorage.blob.core.windows.net/foods/5b8f6458d6894da0a23277cb7a5f0134.webp",
    "success": true
  }
}
```

---

### Các mã lỗi thường gặp

| HTTP Code | Trường hợp xảy ra | Ví dụ thông báo lỗi |
| :---: | :--- | :--- |
| **`400 Bad Request`** | Tên món ăn rỗng, dung lượng ảnh $> 10\text{ MB}$, định dạng tệp không hợp lệ, hoặc `minPrice > maxPrice`. | `{"success": false, "message": "Dung lượng ảnh vượt quá giới hạn cho phép (tối đa 10MB)."}` |
| **`401 Unauthorized`** | Token JWT không hợp lệ hoặc đã hết hạn. | `{"success": false, "message": "Bạn chưa đăng nhập."}` |
| **`403 Forbidden`** | Tài khoản không có vai trò `CategoryAdmin` / `SystemAdmin` hoặc món ăn không nằm trong phạm vi tỉnh thành được phân quyền. | `{"success": false, "message": "Không tìm thấy món ăn yêu cầu cập nhật hoặc bạn không có quyền chỉnh sửa."}` |
| **`404 Not Found`** | Món ăn với `{id}` không tồn tại trong hệ thống. | `{"success": false, "message": "Không tìm thấy món ăn yêu cầu cập nhật."}` |

---

## 6. Ví dụ Code tích hợp (Code Samples)

### A. TypeScript / React (với `FormData` & Axios / Fetch)

```typescript
import apiClient from "@/services/apiClient";

export interface UpdateFoodPayload {
  name: string;
  provinceId?: number;
  minPrice?: number;
  maxPrice?: number;
  desc?: string;
  historyInfo?: string;
  status?: "active" | "hidden";
  imageFile?: File | null;
  coverImg?: string;
}

export async function updateAdminFood(id: number, payload: UpdateFoodPayload) {
  const formData = new FormData();
  formData.append("name", payload.name);
  if (payload.provinceId) formData.append("provinceId", String(payload.provinceId));
  if (payload.minPrice !== undefined) formData.append("minPrice", String(payload.minPrice));
  if (payload.maxPrice !== undefined) formData.append("maxPrice", String(payload.maxPrice));
  if (payload.desc) formData.append("desc", payload.desc);
  if (payload.historyInfo) formData.append("historyInfo", payload.historyInfo);
  if (payload.status) formData.append("status", payload.status);

  // Đính kèm tệp ảnh nếu người dùng chọn ảnh mới
  if (payload.imageFile) {
    formData.append("image", payload.imageFile);
  } else if (payload.coverImg) {
    formData.append("coverImg", payload.coverImg);
  }

  const response = await apiClient.put(`/api/admin/foods/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data; // Trả về { success: true, data: { id, coverImg, success: true } }
}
```

---

### B. cURL (Dòng lệnh)

```bash
curl -X PUT "https://api.yourdomain.vn/api/admin/foods/12" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -F "name=Bánh Mì Phượng Hội An" \
  -F "provinceId=17" \
  -F "minPrice=25000" \
  -F "maxPrice=40000" \
  -F "desc=Bánh mì kẹp nổi tiếng với nước sốt gia truyền đặc trưng." \
  -F "status=active" \
  -F "image=@/path/to/banh_mi.jpg"
```
