# 🌍 Hệ Thống Chia Sẻ Địa Điểm (Travel & Place Sharing Platform)

Nền tảng chia sẻ, đánh giá địa điểm du lịch, ẩm thực, lịch trình và kết nối cộng đồng.

---

## 🚀 Công Nghệ Sử Dụng

### 🔹 Backend (.NET 8 Web API)
- **Kiến trúc**: Clean Architecture kết hợp CQRS & Domain-Driven Design (DDD).
- **Web API Framework**: **FastEndpoints** (chuẩn REPR - Request-Endpoint-Response).
- **ORM & Data Access**: 
  - **Entity Framework Core 8** & **LINQ**: Quản lý nghiệp vụ, Command ghi dữ liệu và truy vấn đơn giản (`AsNoTracking`).
  - **Dapper**: Tối ưu hóa hiệu năng cho các truy vấn phức tạp (nhiều bảng JOIN, phân trang, lọc đa tiêu chí).
- **CQRS & Validation**: **MediatR**, **FluentValidation**.
- **Xác thực & Bảo mật**: **JWT Bearer Authentication**, **Google OAuth 2.0**, Rate Limiting.
- **Logging**: **Serilog**.

### 🔹 Frontend (SPA Web Client)
- **Framework**: **React 19** + **TypeScript**.
- **Build Tool**: **Vite** (HMR cực nhanh, tối ưu hóa bundle).
- **Styling**: **Tailwind CSS v4** (thiết kế hiện đại, responsive).
- **Bản đồ số**: **Mapbox GL JS** (tương tác trực quan vị trí địa điểm, tọa độ).
- **HTTP Client**: **Axios** (kèm interceptor tự động gắn token và xử lý refresh token khi hết hạn).
- **Icons**: **Lucide React**.

### 🔹 Cơ Sở Dữ Liệu & Hạ Tầng
- **Database chính**: **Microsoft SQL Server 2022**.
- **Bộ nhớ đệm (Cache)**: **Redis 7** (quản lý session, cache dữ liệu và blacklist token).
- **Lưu trữ tệp tin**: **Azure Blob Storage** (lưu trữ ảnh đại diện, ảnh địa điểm, đánh giá).
- **Containerization**: **Docker** & **Docker Compose**.

---

## 🛠️ Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### 1. Yêu Cầu Hệ Thống (Prerequisites)
- Đã cài đặt **Docker** & **Docker Desktop** (nếu chạy qua Docker).
- Hoặc nếu chạy thủ công:
  - **.NET 8 SDK**
  - **Node.js 20+** & **npm**
  - **SQL Server 2022** & **Redis**

---

### 2. Cấu Hình Biến Môi Trường (`.env`)

Tại thư mục gốc của dự án, sao chép file `.env.example` thành `.env`:

```bash
cp .env.example .env
```

Kiểm tra và điền các giá trị trong file `.env`:

```env
# Database & Cache
MSSQL_SA_PASSWORD=ChangeThisPassword123!
SQLSERVER_PORT=14333
REDIS_PORT=63799

# Backend
BACKEND_PORT=5000
ASPNETCORE_ENVIRONMENT=Development
JWT_SECRET_KEY=SuperSecretKeyForTravelReviewPlatform2026!MustBeLongEnough
JWT_ISSUER=TravelReviewBackend
JWT_AUDIENCE=TravelReviewClient
JWT_EXPIRE_MINUTES=1440

# Azure Blob Storage & Google Auth
AZURE_STORAGE_CONNECTION_STRING=your_azure_storage_connection_string
GOOGLE_CLIENT_ID=your_google_client_id

# Frontend
FRONTEND_PORT=5173
VITE_API_BASE_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
```

---

### 3. Cách 1: Chạy Bằng Docker (Khuyên Dùng - Nhanh Nhất) 🐳

Chỉ cần một câu lệnh duy nhất tại thư mục gốc dự án:

```bash
docker compose up --build -d
```

Hệ thống sẽ tự động khởi dựng cả 4 dịch vụ: SQL Server, Redis, Backend API và Frontend.

#### 📌 Danh Sách Cổng & Địa Chỉ Truy Cập:

| Dịch vụ | Địa chỉ URL / Cổng | Ghi chú |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:5173](http://localhost:5173) | Giao diện người dùng |
| **Backend Web API** | [http://localhost:5000](http://localhost:5000) | Cổng API backend |
| **Swagger UI (Tài liệu API)** | [http://localhost:5000/swagger](http://localhost:5000/swagger) | Giao diện kiểm thử API |
| **SQL Server 2022** | `localhost:14333` | Tài khoản `sa` |
| **Redis Cache** | `localhost:63799` | Cache server |

*Để dừng toàn bộ dịch vụ:*
```bash
docker compose down
```

---

### 4. Cách 2: Chạy Thủ Công (Local Development) 💻

#### Bước 1: Khởi động Backend
```bash
cd Backend/API
dotnet run
```
Backend sẽ khởi chạy tại: `https://localhost:7027` hoặc `http://localhost:5000`.  
Xem tài liệu API Swagger tại: `https://localhost:7027/swagger` hoặc `http://localhost:5000/swagger`.

#### Bước 2: Khởi động Frontend
Mở một terminal mới:
```bash
cd FrontEnd
npm install
npm run dev
```
Giao diện người dùng sẽ chạy tại: [http://localhost:5173](http://localhost:5173).
