--DATABASE DU LỊCH & ẨM THỰC "LANG THANG"

USE [master];
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'TravelReviewDB_VIP')
BEGIN
    CREATE DATABASE [TravelReviewDB];
END
GO
USE [TravelReviewDB];
GO

BEGIN TRANSACTION;

-- 1. HỆ THỐNG NGƯỜI DÙNG & MẠNG XÃ HỘI
CREATE TABLE dbo.Users (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(150) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role TINYINT NOT NULL DEFAULT 1,   -- 1: User, 2: Category Admin, 3: System Admin
    Status TINYINT NOT NULL DEFAULT 1, -- 0: Inactive, 1: Active, 2: Banned
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    IsDeleted BIT NOT NULL DEFAULT 0,

    CONSTRAINT CHK_Users_Role CHECK (Role IN (1, 2, 3)),
    CONSTRAINT CHK_Users_Status CHECK (Status IN (0, 1, 2)),
    CONSTRAINT UQ_Users_Email UNIQUE (Email)
);

-- Bảng thông tin cá nhân & hiển thị (1-1 với Users)
CREATE TABLE dbo.UserProfiles (
    UserId BIGINT PRIMARY KEY, -- Vừa là PK vừa là FK trỏ về Users(Id)
    FullName NVARCHAR(100) NOT NULL,
    Phone NVARCHAR(20) NULL,
    AvatarUrl NVARCHAR(500) NULL,
    CoverUrl NVARCHAR(500) NULL,
    Bio NVARCHAR(500) NULL,
    GoogleId NVARCHAR(100) NULL,
    ReputationScore INT NOT NULL DEFAULT 0,
    RankLevel NVARCHAR(50) NOT NULL DEFAULT N'Tân binh',
    UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_UserProfiles_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE
);

CREATE TABLE dbo.Friendships (
    User1Id BIGINT NOT NULL,
    User2Id BIGINT NOT NULL,
    Status TINYINT NOT NULL DEFAULT 0, -- 0: Pending, 1: Accepted, 2: Blocked
    ActionUserId BIGINT NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_Friendships PRIMARY KEY (User1Id, User2Id),
    CONSTRAINT FK_Friendships_User1 FOREIGN KEY (User1Id) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_Friendships_User2 FOREIGN KEY (User2Id) REFERENCES dbo.Users(Id),
    CONSTRAINT CHK_Friendships_Status CHECK (Status IN (0, 1, 2))
);

-- 2. HỆ THỐNG ĐỊA LÝ & DANH MỤC
CREATE TABLE dbo.Regions (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(50) NOT NULL,
    Tagline NVARCHAR(200) NULL,
    Description NVARCHAR(800) NULL,
    ImageUrl NVARCHAR(500) NULL,
    OrderIndex INT NOT NULL DEFAULT 0,
    Status TINYINT NOT NULL DEFAULT 1,

    CONSTRAINT UQ_Regions_Name UNIQUE (Name)
);

CREATE TABLE dbo.Provinces (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    RegionId INT NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Tagline NVARCHAR(200) NULL,
    Description NVARCHAR(MAX) NULL,
    ImageUrl NVARCHAR(500) NULL,
    Featured BIT NOT NULL DEFAULT 0,
    DisplayOrder INT NOT NULL DEFAULT 0,
    Status TINYINT NOT NULL DEFAULT 1, 

    CONSTRAINT UQ_Provinces_Name_RegionId UNIQUE (Name, RegionId),
    CONSTRAINT FK_Provinces_Regions FOREIGN KEY (RegionId) REFERENCES dbo.Regions(Id)
);

CREATE TABLE dbo.PlaceTypes (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(50) NOT NULL,
    IconClass NVARCHAR(50) NULL,
    Status TINYINT NOT NULL DEFAULT 1
);

CREATE TABLE dbo.Categories (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    PlaceTypeId INT NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    IconClass NVARCHAR(50) NULL,
    Status TINYINT NOT NULL DEFAULT 1,

    CONSTRAINT FK_Categories_PlaceTypes FOREIGN KEY (PlaceTypeId) REFERENCES dbo.PlaceTypes(Id)
);

-- 3. ĐỊA ĐIỂM CHÍNH (Nhà hàng, Khách sạn, Khu vui chơi)
CREATE TABLE dbo.Places (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    ProvinceId INT NOT NULL,
    CategoryId INT NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    Address NVARCHAR(255) NOT NULL,
    Phone NVARCHAR(20) NULL,
    Website NVARCHAR(500) NULL,
    MinPrice DECIMAL(12,0) NULL,
    MaxPrice DECIMAL(12,0) NULL,
    OpeningHours NVARCHAR(255) NULL,
    
    Latitude DECIMAL(10,7) NULL,
    Longitude DECIMAL(10,7) NULL,
    AvgRating DECIMAL(3,2) NOT NULL DEFAULT 0.0,
    ReviewCount INT NOT NULL DEFAULT 0,
    
    Status TINYINT NOT NULL DEFAULT 0, -- 0: Pending, 1: Approved, 2: Rejected, 3: Hidden
    CreatedBy BIGINT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_Places_Categories FOREIGN KEY (CategoryId) REFERENCES dbo.Categories(Id),
    CONSTRAINT FK_Places_Provinces FOREIGN KEY (ProvinceId) REFERENCES dbo.Provinces(Id),
    CONSTRAINT FK_Places_Users FOREIGN KEY (CreatedBy) REFERENCES dbo.Users(Id)
);

CREATE TABLE dbo.PlaceMedia (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    PlaceId BIGINT NOT NULL,
    UploadedBy BIGINT NULL,
    MediaType TINYINT NOT NULL DEFAULT 1, -- 1: Image, 2: Video, 3: 360-View
    Url NVARCHAR(500) NOT NULL,
    DisplayOrder INT NOT NULL DEFAULT 0,
    IsVerified BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_PlaceMedia_Places FOREIGN KEY (PlaceId) REFERENCES dbo.Places(Id) ON DELETE CASCADE
);

-- 3.1 BỘ SƯU TẬP (Collections - Ghim cụm địa điểm ra Trang chủ)
CREATE TABLE dbo.Collections (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(250) NOT NULL,       
    Description NVARCHAR(500) NULL,     
    IsFeatured BIT NOT NULL DEFAULT 0,  
    DisplayOrder INT NOT NULL DEFAULT 0,
    Status TINYINT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.CollectionPlaces (
    CollectionId INT NOT NULL,
    PlaceId BIGINT NOT NULL,
    DisplayOrder INT NOT NULL DEFAULT 0, 

    CONSTRAINT PK_CollectionPlaces PRIMARY KEY (CollectionId, PlaceId),
    CONSTRAINT FK_CollectionPlaces_Collections FOREIGN KEY (CollectionId) REFERENCES dbo.Collections(Id) ON DELETE CASCADE,
    CONSTRAINT FK_CollectionPlaces_Places FOREIGN KEY (PlaceId) REFERENCES dbo.Places(Id) ON DELETE CASCADE
);

COMMIT;
GO

BEGIN TRANSACTION;

-- 4. HỆ THỐNG ĐẶC SẢN ẨM THỰC (Food Master)
CREATE TABLE dbo.Foods (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(150) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    HistoryInfo NVARCHAR(MAX) NULL, -- Nguồn gốc, lịch sử món ăn
    CoverImageUrl NVARCHAR(500) NULL,
    Status TINYINT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT UQ_Foods_Name UNIQUE (Name),
    CONSTRAINT CHK_Foods_Status CHECK (Status IN (0, 1))
);

-- Bảng thư viện ảnh/video riêng cho Món ăn
CREATE TABLE dbo.FoodMedia (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    FoodId BIGINT NOT NULL,
    MediaType TINYINT NOT NULL DEFAULT 1, -- 1: Image, 2: Video
    Url NVARCHAR(500) NOT NULL,
    Title NVARCHAR(150) NULL,
    DisplayOrder INT NOT NULL DEFAULT 0,

    CONSTRAINT FK_FoodMedia_Foods FOREIGN KEY (FoodId) REFERENCES dbo.Foods(Id) ON DELETE CASCADE,
    CONSTRAINT CHK_FoodMedia_Type CHECK (MediaType IN (1, 2))
);

-- Quán nào bán món nào (Quan hệ N-N)
CREATE TABLE dbo.FoodPlaces (
    FoodId BIGINT NOT NULL,
    PlaceId BIGINT NOT NULL,

    CONSTRAINT PK_FoodPlaces PRIMARY KEY (FoodId, PlaceId),
    CONSTRAINT FK_FoodPlaces_Foods FOREIGN KEY (FoodId) REFERENCES dbo.Foods(Id) ON DELETE CASCADE,
    CONSTRAINT FK_FoodPlaces_Places FOREIGN KEY (PlaceId) REFERENCES dbo.Places(Id) ON DELETE CASCADE
);

-- Món này là đặc sản của tỉnh nào (Quan hệ N-N)
CREATE TABLE dbo.FoodProvinces (
    FoodId BIGINT NOT NULL,
    ProvinceId INT NOT NULL,

    CONSTRAINT PK_FoodProvinces PRIMARY KEY (FoodId, ProvinceId),
    CONSTRAINT FK_FoodProvinces_Foods FOREIGN KEY (FoodId) REFERENCES dbo.Foods(Id) ON DELETE CASCADE,
    CONSTRAINT FK_FoodProvinces_Provinces FOREIGN KEY (ProvinceId) REFERENCES dbo.Provinces(Id) ON DELETE CASCADE
);

-- 5. HỆ THỐNG LÊN HÀNH TRÌNH (TRIP PLANNER)
-- Bảng Gốc: Chuyến đi
CREATE TABLE dbo.Trips (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserId BIGINT NOT NULL,
    Title NVARCHAR(200) NOT NULL,
    Description NVARCHAR(1000) NULL,
    CoverImageUrl NVARCHAR(500) NULL,
    StartDate DATE NULL,
    EndDate DATE NULL,
    Privacy TINYINT NOT NULL DEFAULT 2, -- 0: Public (Cho mng copy), 1: Friends Only, 2: Private
    Status TINYINT NOT NULL DEFAULT 0,  -- 0: Planning, 1: Ongoing, 2: Completed
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_Trips_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE,
    CONSTRAINT CHK_Trips_Privacy CHECK (Privacy IN (0, 1, 2)),
    CONSTRAINT CHK_Trips_Status CHECK (Status IN (0, 1, 2))
);

-- Bảng Con cấp 1: Các ngày trong chuyến đi (Day 1, Day 2...)
CREATE TABLE dbo.TripDays (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    TripId BIGINT NOT NULL,
    DayNumber INT NOT NULL,
    DayTitle NVARCHAR(150) NULL,
    Date DATE NULL,

    CONSTRAINT FK_TripDays_Trips FOREIGN KEY (TripId) REFERENCES dbo.Trips(Id) ON DELETE CASCADE
);

-- Bảng Con cấp 2: Các địa điểm đi trong ngày đó 
CREATE TABLE dbo.TripPlaces (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    TripDayId BIGINT NOT NULL,
    PlaceId BIGINT NOT NULL,
    VisitOrder INT NOT NULL DEFAULT 0, -- Thứ tự sắp xếp kéo thả
    PlannedTime TIME NULL,             -- Mấy giờ đến
    Note NVARCHAR(500) NULL,

    CONSTRAINT FK_TripPlaces_TripDays FOREIGN KEY (TripDayId) REFERENCES dbo.TripDays(Id) ON DELETE CASCADE,
    CONSTRAINT FK_TripPlaces_Places FOREIGN KEY (PlaceId) REFERENCES dbo.Places(Id)
);

COMMIT;
GO

BEGIN TRANSACTION;

-- 6. HỆ THỐNG ĐÁNH GIÁ & BÌNH LUẬN (Reviews & Comments)
CREATE TABLE dbo.Reviews (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    PlaceId BIGINT NOT NULL,
    UserId BIGINT NOT NULL,
    Rating TINYINT NOT NULL, -- 1 đến 5 sao
    Content NVARCHAR(MAX) NULL,
    VisitDate DATE NULL,
    Status TINYINT NOT NULL DEFAULT 1, -- 0: Hidden, 1: Active, 2: Reported
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT CHK_Reviews_Rating CHECK (Rating BETWEEN 1 AND 5),
    CONSTRAINT CHK_Reviews_Status CHECK (Status IN (0, 1, 2)),
    CONSTRAINT FK_Reviews_Places FOREIGN KEY (PlaceId) REFERENCES dbo.Places(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Reviews_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id)
);

CREATE TABLE dbo.ReviewMedia (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    ReviewId BIGINT NOT NULL,
    MediaType TINYINT NOT NULL DEFAULT 1, -- 1: Image, 2: Video
    Url NVARCHAR(500) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT CHK_ReviewMedia_Type CHECK (MediaType IN (1, 2)),
    CONSTRAINT FK_ReviewMedia_Reviews FOREIGN KEY (ReviewId) REFERENCES dbo.Reviews(Id) ON DELETE CASCADE
);

CREATE TABLE dbo.Comments (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    ReviewId BIGINT NOT NULL,
    UserId BIGINT NOT NULL,
    ParentId BIGINT NULL, 
    Content NVARCHAR(1000) NOT NULL,
    Status TINYINT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT CHK_Comments_Status CHECK (Status IN (0, 1)),
    CONSTRAINT FK_Comments_Reviews FOREIGN KEY (ReviewId) REFERENCES dbo.Reviews(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Comments_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_Comments_Parent FOREIGN KEY (ParentId) REFERENCES dbo.Comments(Id)
);

COMMIT;
GO

BEGIN TRANSACTION;

-- 7. ĐÓNG GÓP DỮ LIỆU TỪ CỘNG ĐỒNG (UGC - JSON Data)
CREATE TABLE dbo.Proposals (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserId BIGINT NOT NULL,
    TargetPlaceId BIGINT NULL, 
    ProposedDataJSON NVARCHAR(MAX) NOT NULL, 
    Status TINYINT NOT NULL DEFAULT 0, -- 0: Pending, 1: Approved, 2: Rejected
    RejectReason NVARCHAR(500) NULL,
    ReviewedBy BIGINT NULL,
    ReviewedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT CHK_Proposals_Data CHECK (ISJSON(ProposedDataJSON) = 1),
    CONSTRAINT CHK_Proposals_Status CHECK (Status IN (0, 1, 2)),
    CONSTRAINT FK_Proposals_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_Proposals_Places FOREIGN KEY (TargetPlaceId) REFERENCES dbo.Places(Id),
    CONSTRAINT FK_Proposals_Admin FOREIGN KEY (ReviewedBy) REFERENCES dbo.Users(Id)
);

-- 8. HỆ THỐNG BLOG & CẨM NANG (Nội dung lưu JSON bằng NVARCHAR(MAX))
CREATE TABLE dbo.Blogs (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    AuthorId BIGINT NOT NULL,
    CategoryId INT NULL, 
    Title NVARCHAR(255) NOT NULL,
    Excerpt NVARCHAR(500) NULL,
    ContentJSON NVARCHAR(MAX) NOT NULL, -- Nội dung blog lưu dạng JSON
    CoverImageUrl NVARCHAR(500) NULL,
    ReadTimeMinutes INT NOT NULL DEFAULT 5,
    ViewCount INT NOT NULL DEFAULT 0,
    Status TINYINT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT CHK_Blogs_ContentJSON CHECK (ISJSON(ContentJSON) = 1),
    CONSTRAINT FK_Blogs_Users FOREIGN KEY (AuthorId) REFERENCES dbo.Users(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Blogs_Categories FOREIGN KEY (CategoryId) REFERENCES dbo.Categories(Id)
);

-- 9. HỆ THỐNG PHÒNG CHAT (Chat 1-1 & Group Chat)
CREATE TABLE dbo.ChatRooms (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NULL, 
    IsGroup BIT NOT NULL DEFAULT 0, 
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.ChatRoomMembers (
    ChatRoomId BIGINT NOT NULL,
    UserId BIGINT NOT NULL,
    JoinedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    LastReadAt DATETIME2 NULL, 

    CONSTRAINT PK_ChatRoomMembers PRIMARY KEY (ChatRoomId, UserId),
    CONSTRAINT FK_ChatRoomMembers_Rooms FOREIGN KEY (ChatRoomId) REFERENCES dbo.ChatRooms(Id) ON DELETE CASCADE,
    CONSTRAINT FK_ChatRoomMembers_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE
);

CREATE TABLE dbo.Messages (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    ChatRoomId BIGINT NOT NULL,
    SenderId BIGINT NOT NULL,
    Content NVARCHAR(MAX) NULL,
    AttachedPlaceId BIGINT NULL,
    AttachedFoodId BIGINT NULL,
    AttachedTripId BIGINT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_Messages_Rooms FOREIGN KEY (ChatRoomId) REFERENCES dbo.ChatRooms(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Messages_Users FOREIGN KEY (SenderId) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_Messages_Places FOREIGN KEY (AttachedPlaceId) REFERENCES dbo.Places(Id),
    CONSTRAINT FK_Messages_Foods FOREIGN KEY (AttachedFoodId) REFERENCES dbo.Foods(Id),
    CONSTRAINT FK_Messages_Trips FOREIGN KEY (AttachedTripId) REFERENCES dbo.Trips(Id)
);

-- 10. CÁ NHÂN HÓA & THÔNG BÁO
CREATE TABLE dbo.Favorites (
    UserId BIGINT NOT NULL,
    TargetId BIGINT NOT NULL,
    TargetType TINYINT NOT NULL, -- 1: Place, 2: Food, 3: Trip, 4: Blog
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_Favorites PRIMARY KEY (UserId, TargetId, TargetType),
    CONSTRAINT CHK_Favorites_Type CHECK (TargetType IN (1, 2, 3, 4)),
    CONSTRAINT FK_Favorites_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE
);

CREATE TABLE dbo.VisitLogs (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserId BIGINT NOT NULL,
    PlaceId BIGINT NOT NULL,
    VisitedDate DATE NOT NULL,
    Privacy TINYINT NOT NULL DEFAULT 0, 
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT CHK_VisitLogs_Privacy CHECK (Privacy IN (0, 1)),
    CONSTRAINT FK_VisitLogs_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE,
    CONSTRAINT FK_VisitLogs_Places FOREIGN KEY (PlaceId) REFERENCES dbo.Places(Id) ON DELETE CASCADE
);

CREATE TABLE dbo.AccessHistories (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserId BIGINT NOT NULL,
    PlaceId BIGINT NOT NULL,
    ViewedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_AccessHistories_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE,
    CONSTRAINT FK_AccessHistories_Places FOREIGN KEY (PlaceId) REFERENCES dbo.Places(Id) ON DELETE CASCADE
);

CREATE TABLE dbo.Notifications (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserId BIGINT NOT NULL,
    Title NVARCHAR(200) NOT NULL,
    Content NVARCHAR(500) NOT NULL,
    Type TINYINT NOT NULL, 
    ReferenceId BIGINT NULL,
    IsRead BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_Notifications_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE
);

-- 11. HỆ THỐNG BÁO CÁO VI PHẠM (4 BẢNG ĐỘC LẬP)
CREATE TABLE dbo.PlaceReports (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    ReporterId BIGINT NOT NULL,
    PlaceId BIGINT NOT NULL,
    Reason NVARCHAR(500) NOT NULL,
    Status TINYINT NOT NULL DEFAULT 0, 
    ResolvedBy BIGINT NULL,
    ResolvedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT CHK_PlaceReports_Status CHECK (Status IN (0, 1, 2)),
    CONSTRAINT FK_PlaceReports_Reporter FOREIGN KEY (ReporterId) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_PlaceReports_Places FOREIGN KEY (PlaceId) REFERENCES dbo.Places(Id) ON DELETE CASCADE,
    CONSTRAINT FK_PlaceReports_Resolver FOREIGN KEY (ResolvedBy) REFERENCES dbo.Users(Id)
);

CREATE TABLE dbo.ReviewReports (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    ReporterId BIGINT NOT NULL,
    ReviewId BIGINT NOT NULL,
    Reason NVARCHAR(500) NOT NULL,
    Status TINYINT NOT NULL DEFAULT 0, 
    ResolvedBy BIGINT NULL,
    ResolvedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT CHK_ReviewReports_Status CHECK (Status IN (0, 1, 2)),
    CONSTRAINT FK_ReviewReports_Reporter FOREIGN KEY (ReporterId) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_ReviewReports_Reviews FOREIGN KEY (ReviewId) REFERENCES dbo.Reviews(Id) ON DELETE CASCADE,
    CONSTRAINT FK_ReviewReports_Resolver FOREIGN KEY (ResolvedBy) REFERENCES dbo.Users(Id)
);

CREATE TABLE dbo.CommentReports (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    ReporterId BIGINT NOT NULL,
    CommentId BIGINT NOT NULL,
    Reason NVARCHAR(500) NOT NULL,
    Status TINYINT NOT NULL DEFAULT 0, 
    ResolvedBy BIGINT NULL,
    ResolvedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT CHK_CommentReports_Status CHECK (Status IN (0, 1, 2)),
    CONSTRAINT FK_CommentReports_Reporter FOREIGN KEY (ReporterId) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_CommentReports_Comments FOREIGN KEY (CommentId) REFERENCES dbo.Comments(Id) ON DELETE CASCADE,
    CONSTRAINT FK_CommentReports_Resolver FOREIGN KEY (ResolvedBy) REFERENCES dbo.Users(Id)
);

CREATE TABLE dbo.BlogReports (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    ReporterId BIGINT NOT NULL,
    BlogId BIGINT NOT NULL,
    Reason NVARCHAR(500) NOT NULL,
    Status TINYINT NOT NULL DEFAULT 0, 
    ResolvedBy BIGINT NULL,
    ResolvedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT CHK_BlogReports_Status CHECK (Status IN (0, 1, 2)),
    CONSTRAINT FK_BlogReports_Reporter FOREIGN KEY (ReporterId) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_BlogReports_Blogs FOREIGN KEY (BlogId) REFERENCES dbo.Blogs(Id) ON DELETE CASCADE,
    CONSTRAINT FK_BlogReports_Resolver FOREIGN KEY (ResolvedBy) REFERENCES dbo.Users(Id)
);

-- CÁC CHỈ MỤC (INDEXES) TỐI ƯU
CREATE INDEX IX_Places_Province_Category ON dbo.Places (ProvinceId, CategoryId);
CREATE INDEX IX_Reviews_PlaceId ON dbo.Reviews (PlaceId);
CREATE INDEX IX_Messages_ChatRoomId_CreatedAt ON dbo.Messages (ChatRoomId, CreatedAt);
CREATE INDEX IX_ChatRoomMembers_UserId ON dbo.ChatRoomMembers (UserId);
CREATE INDEX IX_Notifications_UserId_IsRead ON dbo.Notifications (UserId, IsRead);
CREATE INDEX IX_AccessHistories_UserId_ViewedAt ON dbo.AccessHistories (UserId, ViewedAt);

COMMIT;
GO