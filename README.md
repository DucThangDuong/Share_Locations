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
* **Kiến trúc**: Clean Architecture (Domain, Application, Infrastructure, API Presentation).
* **Framework & Thư viện**:
  * **FastEndpoints**: Xử lý HTTP Endpoints theo chuẩn REPR (Request-Endpoint-Response).
  * **Entity Framework Core 8**: Quản lý và ánh xạ dữ liệu trực tiếp với 34 Entities và 11 Module Fluent API Configurations.
  * **MediatR (CQRS)**: Tách biệt rõ ràng Commands và Queries.
  * **FluentValidation**: Kiểm tra hợp lệ dữ liệu đầu vào.
  * **MassTransit**: Hỗ trợ Message Broker / Event-Driven.
  * **StackExchange.Redis**: Caching & token management.
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
│   ├── Domain/                 # Tầng lõi nghiệp vụ: 34 Entities, Enums, Repository Interfaces
│   ├── Application/            # Tầng ứng dụng: Use Cases, CQRS (MediatR), DTOs, Service Interfaces
│   ├── Infrastructure/         # Tầng hạ tầng: DbContext, Repositories, Redis, Services
│   ├── API/                    # Tầng Presentation API: Endpoints, DTOs, Configurations, Program.cs
│   │   ├── Configurations/     # Các cấu hình tập trung (JWT, RateLimiter, CORS, Swagger, GlobalException)
│   │   ├── DTOs/               # Các Request/Response DTOs đầu vào và Schema chuẩn
│   │   ├── Endpoints/          # FastEndpoints (Auth, Places, Foods, Trips, Reviews...)
│   │   ├── Extensions/         # EndpointExtensions (SendApiResponseAsync)
│   │   ├── appsettings.json    # File cấu hình chung
│   │   └── appsettings.example.json # File mẫu cấu hình chi tiết cho developer
│   └── Backend.slnx            # Solution file quản lý 4 projects (Domain, Application, Infrastructure, API)
├── FrontEnd/                   # Giao diện React + TypeScript + Tailwind CSS v4
│   ├── src/                    # Source code giao diện React
│   ├── .env.example            # File mẫu cấu hình URL API Backend cho Frontend
│   ├── Dockerfile              # Multi-stage Dockerfile cho Frontend
│   └── nginx.conf              # Cấu hình Nginx reverse proxy và SPA
├── docker-compose.yml          # Điều phối các container (SQL Server, Redis, Backend API, Frontend)
├── .env.example                # File mẫu cấu hình cổng và mật khẩu Docker
├── .gitignore                  # File loại trừ git chuẩn bảo mật
└── README.md                   # Tài liệu hướng dẫn sử dụng
```

---

## 🔒 Bảo Mật Thông Tin & Cấu Hình Môi Trường

> ⚠️ **Quy tắc bảo mật khi đẩy code lên GitHub:**
> Toàn bộ file chứa thông tin nhạy cảm thực tế (`.env`, `appsettings.Development.json`, `appsettings.Production.json`, `secrets.json`) đã được thêm vào [.gitignore](file:///d:/Y4-HK1/KLCN/H%E1%BB%87%20th%E1%BB%91ng%20chia%20s%E1%BA%BB%20%C4%91%E1%BB%8Ba%20%C4%91i%E1%BB%83m/.gitignore) để **không bao giờ bị lộ lên GitHub**. 
> Khi clone dự án về máy, bạn chỉ cần tạo file cấu hình từ các file `.example` tương ứng.

### 1. Cấu hình Backend (`Backend/API/`)

Sao chép từ file mẫu [appsettings.example.json](file:///d:/Y4-HK1/KLCN/H%E1%BB%87%20th%E1%BB%91ng%20chia%20s%E1%BA%BB%20%C4%91%E1%BB%8Ba%20%C4%91i%E1%BB%83m/Backend/API/appsettings.example.json) thành `appsettings.Development.json`:

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

---

### 2. Cấu hình Docker (`Root/.env.example`)

Tại thư mục gốc dự án, sao chép file [.env.example](file:///d:/Y4-HK1/KLCN/H%E1%BB%87%20th%E1%BB%91ng%20chia%20s%E1%BA%BB%20%C4%91%E1%BB%8Ba%20%C4%91i%E1%BB%83m/.env.example) thành `.env`:

```bash
cp .env.example .env
```

---

## 🐳 Cách 1: Chạy Bằng Docker (Khuyên Dùng)

```bash
docker compose up --build -d
```

### Địa chỉ truy cập các dịch vụ:
| Dịch vụ | Địa chỉ URL / Cổng | Ghi chú |
| :--- | :--- | :--- |
| **Frontend UI (React)** | [http://localhost:3000](http://localhost:3000) | Giao diện người dùng |
| **Backend Web API** | [http://localhost:5000](http://localhost:5000) | API Endpoint |
| **Swagger UI (Tài liệu API)** | [http://localhost:5000/swagger](http://localhost:5000/swagger) | Giao diện test API trực tiếp |
| **SQL Server 2022** | `localhost:14333` | Cổng riêng biệt không xung đột |
| **Redis Cache** | `localhost:63799` | Cổng riêng biệt |

---

## 💻 Cách 2: Chạy Thủ Công Trên Máy Thật (Local Development)

### 1. Khởi chạy Backend:
```bash
cd Backend/API
dotnet run
```
Truy cập Swagger API tại: `https://localhost:7000/swagger` hoặc `http://localhost:5000/swagger`.

### 2. Khởi chạy Frontend:
```bash
cd FrontEnd
npm install
npm run dev
```
Truy cập giao diện tại: [http://localhost:3000](http://localhost:3000).

---

## 📋 Danh Sách Thực Thể (34 Entities)

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
