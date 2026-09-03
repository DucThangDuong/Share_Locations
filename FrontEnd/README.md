# 🗺️ Hệ Thống Chia Sẻ & Khám Phá Địa Điểm Du Lịch Việt Nam

Nền tảng chia sẻ địa điểm du lịch, ẩm thực và văn hóa 63 tỉnh thành Việt Nam với giao diện hiện đại, tối ưu trải nghiệm người dùng theo tiêu chuẩn quốc tế.

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy Bằng Docker

Hệ thống đã được container hóa hoàn chỉnh. Bạn chỉ cần cài đặt **Docker Desktop** và cấu hình file `.env` là có thể khởi chạy toàn bộ dịch vụ (Cơ sở dữ liệu, Backend API và FrontEnd) chỉ với **1 câu lệnh duy nhất**.

---

### 1. Yêu Cầu Duy Nhất (Prerequisites)
* Đã cài đặt và đang bật **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (hỗ trợ Windows, macOS, Linux).

---

### 2. Cấu Hình Biến Môi Trường (.env)

Trước khi khởi chạy Docker, bạn cần tạo file `.env` từ file mẫu `.env.example` tại thư mục gốc:

#### 🔹 Cách tạo file `.env`:
* **Trên Windows (PowerShell):**
  ```powershell
  Copy-Item .env.example .env
  ```
* **Trên macOS / Linux (Terminal):**
  ```bash
  cp .env.example .env
  ```

#### 🔹 Cấu hình các thông số quan trọng trong file `.env`:
```env
# Mật khẩu quản trị viên SQL Server (Docker Container)
SA_PASSWORD=YourStrong@Password123

# Cấu hình chuỗi JWT bí mật
JWT_SECRET=YourSuperSecretKeyForJwtAuthenticationTokens123!

# URL Backend API mà FrontEnd gọi tới
VITE_API_BASE_URL=https://localhost:7001

# Mã Google Client ID dùng cho chức năng Đăng nhập Google (OAuth)
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

---

### 3. Khởi Chạy Toàn Bộ Hệ Thống (1 Lệnh Duy Nhất)

Mở Terminal tại thư mục gốc của dự án và chạy:

```bash
docker compose up --build -d
```

> 💡 **Giải thích lệnh:**
> * `--build`: Tự động build lại image nếu có thay đổi trong mã nguồn.
> * `-d`: Chạy ngầm (detached mode) giúp giải phóng cửa sổ terminal.

---

### 4. Địa Chỉ Truy Cập Các Dịch Vụ

Sau khi các container khởi động thành công, bạn có thể truy cập ngay:

| Dịch vụ | Địa chỉ truy cập | Mô tả |
| :--- | :--- | :--- |
| 🌐 **Giao diện FrontEnd** | [http://localhost:5173](http://localhost:5173) | Ứng dụng web người dùng |
| ⚙️ **Backend API (Swagger)** | [https://localhost:7001/swagger](https://localhost:7001/swagger) *(hoặc http://localhost:5000/swagger)* | Tài liệu API & thử nghiệm endpoint |
| 🗄️ **Cơ sở dữ liệu SQL Server** | `localhost,1433` | Quản lý dữ liệu qua SSMS / Azure Data Studio |

---

### 5. Các Lệnh Quản Lý Docker Thường Dùng

| Thao tác | Lệnh thực hiện |
| :--- | :--- |
| **Xem log toàn bộ hệ thống** | `docker compose logs -f` |
| **Xem log riêng FrontEnd** | `docker compose logs -f frontend` |
| **Xem log riêng Backend** | `docker compose logs -f backend` |
| **Dừng toàn bộ hệ thống** | `docker compose down` |
| **Dừng và xóa toàn bộ dữ liệu volume** | `docker compose down -v` |
| **Khởi động lại các container** | `docker compose restart` |

---

### 6. (Tùy Chọn) Chạy Riêng Lẻ FrontEnd Với Docker

Nếu bạn chỉ muốn build và chạy riêng lẻ container FrontEnd:

```bash
# Build image FrontEnd
docker build -t share-locations-frontend .

# Chạy container FrontEnd ở cổng 5173
docker run -p 5173:5173 --env-file .env share-locations-frontend
```

---

## 🧰 Công Nghệ Sử Dụng (Tech Stack)

* **FrontEnd**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons, Axios, React Router v7.
* **BackEnd**: .NET 8 / 9 Web API, Entity Framework Core, SQL Server, Clean Architecture.
* **DevOps**: Docker, Docker Compose, Multi-stage builds.
