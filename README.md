# 🌍 Hệ Thống Chia Sẻ Địa Điểm (Travel & Place Sharing Platform)

Dự án nền tảng chia sẻ và đánh giá địa điểm du lịch, ẩm thực, hành trình và cộng đồng được xây dựng theo kiến trúc **Clean Architecture** kết hợp với **Domain-Driven Design (DDD)** trên nền tảng **.NET 8** và **React 19 + Vite + Tailwind CSS v4**.

---

## 📌 Mục Lục
1. [Kiến Trúc & Công Nghệ](#-kiến-trúc--công-nghệ)
2. [Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục)
3. [Bảo Mật Thông Tin & Cấu Hình Môi Trường](#-bảo-mật-thông-tin--cấu-hình-môi-trường)
4. [Cách 1: Chạy Bằng Docker (Khuyên Dùng - Nhanh Nhất)](#-cách-1-chạy-bằng-docker-khuyên-dùng)
5. [Cách 2: Chạy Thủ Công Trên Máy Thật (Local Development)](#-cách-2-chạy-thủ-công-trên-máy-thật)
6. [Cơ Chế Tự Động Tạo Bảng Database](#-cơ-chế-tự-động-tạo-bảng-database)
7. [Danh Sách Thực Thể (34 Entities)](#-danh-sách-thực-thể-34-entities)
8. [Các Lệnh Hữu Ích](#-các-lệnh-hữu-ích)

---

## 🚀 Kiến Trúc & Công Nghệ

### 🔹 Backend (.NET 8 Web API)
* **Kiến trúc**: Clean Architecture (Domain, Application, Infrastructure, Presentation API).
* **Framework & Thư viện**:
  * **FastEndpoints**: Xử lý HTTP Endpoints theo chuẩn REPR (Request-Endpoint-Response).
  * **Entity Framework Core 8**: Quản lý và ánh xạ dữ liệu trực tiếp với 34 Entities và 11 Module Fluent API Configurations.
  * **MassTransit**: Hỗ trợ Message Broker / Event-Driven.
  * **StackExchange.Redis**: Caching & session management.
  * **Database**: Microsoft SQL Server 2022.

### 🔹 Frontend (SPA Web Client)
* **Framework**: React 19 + TypeScript.
* **Build Tool**: Vite (cực nhanh, hỗ trợ HMR).
* **Styling**: Tailwind CSS v4.
* **Web Server trong Docker**: Nginx Alpine hỗ trợ SPA Routing & Reverse Proxy.

---

## 📂 Cấu Trúc Thư Mục

```text
├── Backend/
│   ├── Domain/                 # Tầng lõi nghiệp vụ: 34 Entities, Enums (độc lập 100%)
│   │   ├── Entities/           # Toàn bộ 34 Domain Entities (chuẩn Encapsulation private set)
│   │   └── Enums/              # Các Enum nghiệp vụ theo từng Entity
│   ├── Application/            # Tầng ứng dụng: Use Cases, CQRS, DTOs, Business Logic
│   ├── Infrastructure/         # Tầng hạ tầng: DbContext, 11 Fluent API Configurations
│   │   └── Persistence/        # TravelReviewDbContext, Configurations/
│   ├── Backend/                # Tầng Presentation API: Program.cs, FastEndpoints, Swagger
│   │   ├── appsettings.json    # File mẫu cấu hình chung (Đã ẩn các thông tin bí mật)
│   │   └── appsettings.example.json # File mẫu cấu hình chi tiết cho developer
│   └── Backend.slnx            # Solution file quản lý 4 projects
├── FrontEnd/                   # Giao diện React + TypeScript + Tailwind CSS v4
│   ├── src/                    # Source code giao diện React
│   ├── .env.example            # File mẫu cấu hình URL API Backend cho Frontend
│   ├── Dockerfile              # Multi-stage Dockerfile cho Frontend
│   └── nginx.conf              # Cấu hình Nginx reverse proxy và SPA
├── docker-compose.yml          # Điều phối 4 container (SQL Server, Redis, Backend, Frontend)
├── .env.example                # File mẫu cấu hình cổng và mật khẩu Docker
├── .gitignore                  # File loại trừ git chuẩn bảo mật (ẩn .env, appsettings local)
└── README.md                   # Tài liệu hướng dẫn sử dụng
```

---

## 🔒 Bảo Mật Thông Tin & Cấu Hình Môi Trường

> ⚠️ **Quy tắc bảo mật khi đẩy code lên GitHub:**
> Toàn bộ file chứa thông tin nhạy cảm thực tế (`.env`, `appsettings.Development.json`, `appsettings.Production.json`, `secrets.json`) đã được thêm vào [.gitignore](file:///d:/Y4-HK1/KLCN/H%E1%BB%87%20th%E1%BB%91ng%20chia%20s%E1%BA%BB%20%C4%91%E1%BB%8Ba%20%C4%91i%E1%BB%83m/.gitignore) để **không bao giờ bị lộ lên GitHub**. 
> Khi clone dự án về máy, bạn chỉ cần tạo file cấu hình từ các file `.example` tương ứng.

### 1. Cấu hình Backend (`Backend/Backend/`)

Sao chép từ file mẫu [appsettings.example.json](file:///d:/Y4-HK1/KLCN/H%E1%BB%87%20th%E1%BB%91ng%20chia%20s%E1%BA%BB%20%C4%91%E1%BB%8Ba%20%C4%91i%E1%BB%83m/Backend/Backend/appsettings.example.json) thành `appsettings.Development.json` (dùng cho môi trường dev cục bộ):

```json
{
  "ConnectionStrings": {
    "SqlServer": "Server=localhost;Database=TravelReviewDB;Trusted_Connection=True;TrustServerCertificate=True;",
    "Redis": "localhost:6379"
  },
  "Jwt": {
    "SecretKey": "YOUR_STRONG_SECRET_KEY_HERE_MIN_32_CHARS",
    "Issuer": "TravelReviewBackend",
    "Audience": "TravelReviewClient",
    "ExpireMinutes": 1440
  }
}
```

* **`SqlServer`**: Điền chuỗi kết nối SQL Server trên máy bạn (Ví dụ: `Server=thang;...` hoặc `Server=localhost;...`).
* **`Jwt:SecretKey`**: Khóa bí mật dùng để mã hóa Token (tối thiểu 32 ký tự).

---

### 2. Cấu hình Docker (`Root/.env.example`)

Tại thư mục gốc dự án, sao chép file [.env.example](file:///d:/Y4-HK1/KLCN/H%E1%BB%87%20th%E1%BB%91ng%20chia%20s%E1%BA%BB%20%C4%91%E1%BB%8Ba%20%C4%91i%E1%BB%83m/.env.example) thành `.env`:

```bash
# Tạo file .env cục bộ từ file mẫu
cp .env.example .env
```

**Nội dung cấu hình trong `.env`:**
```env
# 1. SQL Server Container
MSSQL_SA_PASSWORD=ChangeThisPassword123!
SQLSERVER_PORT=14333

# 2. Redis Container
REDIS_PORT=63799

# 3. Backend & Frontend Ports
BACKEND_PORT=5000
JWT_SECRET_KEY=YOUR_STRONG_SECRET_KEY_HERE_MIN_32_CHARS
FRONTEND_PORT=3000
```

---

### 3. Cấu hình Frontend (`FrontEnd/.env.example`)

Tại thư mục `FrontEnd/`, sao chép file [.env.example](file:///d:/Y4-HK1/KLCN/H%E1%BB%87%20th%E1%BB%91ng%20chia%20s%E1%BA%BB%20%C4%91%E1%BB%8Ba%20%C4%91i%E1%BB%83m/FrontEnd/.env.example) thành `.env`:

```bash
cd FrontEnd
cp .env.example .env
```

**Nội dung `FrontEnd/.env`:**
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🐳 Cách 1: Chạy Bằng Docker (Khuyên Dùng)

Chỉ với **1 câu lệnh duy nhất**, toàn bộ hệ thống gồm Database, Redis, Backend và Frontend sẽ tự động khởi tạo, liên kết mạng nội bộ và tự động sinh 34 bảng database.

### 1. Yêu cầu môi trường
* Đã cài đặt **Docker Desktop** (hoặc Docker Engine + Docker Compose).

### 2. Khởi động hệ thống
Mở Terminal tại thư mục gốc của dự án và chạy:

```bash
docker compose up --build -d
```

### 3. Địa chỉ truy cập các dịch vụ:
| Dịch vụ | Địa chỉ URL / Cổng | Tài khoản / Ghi chú |
| :--- | :--- | :--- |
| **Frontend UI (React)** | [http://localhost:3000](http://localhost:3000) | Giao diện người dùng |
| **Backend Web API** | [http://localhost:5000](http://localhost:5000) | API Endpoint |
| **Swagger UI (Tài liệu API)** | [http://localhost:5000/swagger](http://localhost:5000/swagger) | Giao diện test API trực tiếp |
| **SQL Server 2022** | `localhost:14333` | `sa` / Mật khẩu cấu hình trong `.env` |
| **Redis Cache** | `localhost:63799` | Cổng riêng biệt |

> 💡 **Ghi chú về cổng**: SQL Server trong Docker được ánh xạ ra cổng `14333` và Redis ra cổng `63799` để **hoàn toàn không bị xung đột** nếu máy bạn đã có sẵn SQL Server (cổng `1433`) hoặc Redis (cổng `6379`).

### 4. Dừng hệ thống:
```bash
docker compose down
```
*(Nếu muốn xóa sạch toàn bộ volume database để khởi tạo lại từ đầu, thêm cờ `-v`: `docker compose down -v`)*

---

## 💻 Cách 2: Chạy Thủ Công Trên Máy Thật (Local Development)

### 1. Yêu cầu môi trường
* [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
* [Node.js 20+](https://nodejs.org/) (khuyên dùng bản LTS)
* SQL Server (cục bộ hoặc SQL Server Express)

### 2. Cấu hình & Chạy Backend

1. Mở file `Backend/Backend/appsettings.Development.json` và cấu hình chuỗi kết nối phù hợp với máy của bạn:
   ```json
   "ConnectionStrings": {
     "SqlServer": "Server=localhost;Database=TravelReviewDB;Trusted_Connection=True;TrustServerCertificate=True"
   }
   ```
2. Khởi chạy Backend:
   ```bash
   cd Backend/Backend
   dotnet run
   ```
3. Backend sẽ tự động kiểm tra và tạo database + 34 bảng. Truy cập Swagger API tại: `https://localhost:7000/swagger` hoặc `http://localhost:5000/swagger`.

### 3. Cấu hình & Chạy Frontend

1. Mở một terminal mới:
   ```bash
   cd FrontEnd
   npm install
   npm run dev
   ```
2. Mở trình duyệt và truy cập: [http://localhost:3000](http://localhost:3000).

---

## ⚡ Cơ Chế Tự Động Tạo Bảng Database

Trong file `Program.cs`, Backend được trang bị tính năng tự động khởi tạo:
```csharp
await dbContext.Database.EnsureCreatedAsync();
```

* **Khi chạy lần đầu tiên**: EF Core tự động quét toàn bộ 34 Entities và cấu hình Fluent API trong `Infrastructure`, tạo cơ sở dữ liệu `TravelReviewDB` cùng 34 bảng, khóa chính, khóa ngoại và indexes mà **không cần chạy script SQL thủ công**.
* **Từ các lần chạy sau**: EF Core tự động nhận diện dữ liệu đã có và bỏ qua, không làm ảnh hưởng đến dữ liệu đang lưu.

---

## 📋 Danh Sách Thực Thể (34 Entities)

Hệ thống được thiết kế theo 11 phân hệ nghiệp vụ hoàn chỉnh:

1. **Identity**: `User`, `UserProfile`, `Friendship`
2. **Geography**: `Region`, `Province`
3. **Catalog**: `PlaceType`, `Category`
4. **Places**: `Place`, `PlaceMedia`, `Collection`, `CollectionPlace`
5. **Foods**: `Food`, `FoodMedia`, `FoodPlace`, `FoodProvince`
6. **Trips**: `Trip`, `TripDay`, `TripPlace`
7. **Reviews**: `Review`, `ReviewMedia`, `Comment`
8. **Community**: `Proposal`, `Blog`
9. **Chat**: `ChatRoom`, `ChatRoomMember`, `Message`
10. **Personalization**: `Favorite`, `VisitLog`, `AccessHistory`, `Notification`
11. **Moderation**: `PlaceReport`, `ReviewReport`, `CommentReport`, `BlogReport`

---

## 🛠️ Các Lệnh Hữu Ích

```bash
# Kiểm tra build toàn bộ solution backend
dotnet build Backend/Backend.slnx

# Build production bundle frontend
cd FrontEnd && npm run build

# Xem nhật ký (logs) của container backend khi chạy Docker
docker logs -f travel_review_backend

# Khởi động lại riêng container backend
docker compose restart backend
```
