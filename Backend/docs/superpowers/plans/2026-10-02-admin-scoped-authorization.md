# Kế hoạch Triển khai Phân quyền Quản trị theo Phạm vi (Admin Scoped Authorization Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng cơ chế phân quyền kiểm soát truy cập dựa trên phạm vi (Scoped Authorization & Least Privilege) cho toàn bộ hệ thống quản trị Admin (`/api/admin/*`), đảm bảo Admin cấp 1 (`CategoryAdmin`) bị giới hạn nghiêm ngặt theo danh mục (`CategoryScopes`) và tỉnh thành (`ProvinceScopes`) được cấp trong JWT; không thể xem hoặc can thiệp vào dữ liệu ngoài phạm vi cũng như không được xem/sửa tài khoản của Admin khác; trong khi Admin tổng (`SystemAdmin`) giữ toàn quyền không giới hạn.

**Architecture:** 
1. **JWT & Context Layer**: JWT Token chứa các claims `category_scope`, `province_scope`, `region_scope` và role `CATEGORY_ADMIN` / `SYSTEM_ADMIN`. `ICurrentUserService` trích xuất các claims này thành strongly-typed lists.
2. **Policy & Helper Layer**: [AdminScopeFilterHelper.cs](file:///d:/Y4-HK1/KLCN/H%E1%BB%87%20th%E1%BB%91ng%20chia%20s%E1%BA%BB%20%C4%91%E1%BB%8Ba%20%C4%91i%E1%BB%83m/Backend/Infrastructure/Persistence/Repositories/AdminScopeFilterHelper.cs) đóng vai trò trung tâm cung cấp các hàm nạp mệnh đề SQL (`Apply...Scope`) và kiểm tra quyền (`Is...InScopeAsync`, `Validate...InputScope`) cho tất cả các thực thể.
3. **Repository & Handler Layer**: Tất cả các Repositories quản trị (`AdminPlace`, `AdminReview`, `AdminFood`, `AdminProposal`, `AdminReport`, `Collection`, `AdminBlog`, `AdminUser`) đều bắt buộc thực thi lọc danh sách và xác thực bản ghi đơn lẻ thông qua helper, ngăn chặn triệt để hành vi bypass ID qua URL.

**Tech Stack:** ASP.NET Core (.NET 8), FastEndpoints, MediatR, Dapper, Entity Framework Core, SQL Server.

## Global Constraints
- **SystemAdmin**: Tuyệt đối không bị áp bất kỳ bộ lọc phạm vi nào (`if (currentUser.IsSystemAdmin) return true;`).
- **CategoryAdmin**: 
  - Chỉ được xem và thao tác dữ liệu thỏa mãn đồng thời: `CategoryId IN @ScopeCategoryIds` VÀ `ProvinceId IN @ScopeProvinceIds` (nếu thực thể có cả 2 trường) hoặc trường tương ứng.
  - Tuyệt đối KHÔNG ĐƯỢC xem danh sách, xem chi tiết, xem lịch sử thao tác hoặc thay đổi trạng thái của các Admin cấp 1 khác và SystemAdmin.
- **Fail-Secure**: Nếu CategoryAdmin không có bất kỳ scope nào được gán (`catScopes.Count == 0 && provScopes.Count == 0`), hệ thống mặc định coi như không có quyền truy cập dữ liệu nào (`1 = 0`).
- **Idempotency & Clean API**: Không làm thay đổi cấu trúc API công khai (`/api/places`, `/api/foods`, `/api/provinces`, `/api/blogs`).

---

### Task 1: Bổ sung Scope Filter & Validation Helpers trong AdminScopeFilterHelper

**Files:**
- Modify: `Backend/Infrastructure/Persistence/Repositories/AdminScopeFilterHelper.cs`

**Interfaces:**
- Consumes: `ICurrentUserService`
- Produces: 
  - `ApplyCollectionScope(ICurrentUserService, List<string>, DynamicParameters, string)`
  - `IsCollectionInScopeAsync(ICurrentUserService, IDbConnection, int)`
  - `ValidatePlaceInputScope(ICurrentUserService, int categoryId, int provinceId)` -> `bool`
  - `ValidateFoodInputScope(ICurrentUserService, int? provinceId)` -> `bool`
  - `ValidateBlogInputScope(ICurrentUserService, int? categoryId)` -> `bool`

- [ ] **Step 1: Viết các hàm hỗ trợ phạm vi Collection vào AdminScopeFilterHelper**
Thêm `ApplyCollectionScope` để gắn mệnh đề `c.ProvinceId IN @ScopeProvinceIds` và `IsCollectionInScopeAsync` kiểm tra xem bộ sưu tập có thuộc tỉnh thành của Admin cấp 1 phụ trách hay không.

- [ ] **Step 2: Viết các hàm kiểm tra hợp lệ khi tạo mới hoặc cập nhật dữ liệu (Input Validation)**
Thêm `ValidatePlaceInputScope`, `ValidateFoodInputScope`, `ValidateBlogInputScope` để validate payload trước khi thực hiện câu lệnh INSERT / UPDATE.

- [ ] **Step 3: Biên dịch dự án Backend để xác nhận cú pháp không lỗi**
Run: `dotnet build Backend/Backend.slnx`

---

### Task 2: Cô lập phân quyền Quản lý Tài khoản trong AdminUserRepository

**Files:**
- Modify: `Backend/Infrastructure/Persistence/Repositories/AdminUserRepository.cs`
- Modify: `Backend/Application/Features/Admin/Users/GetAdminUsersQuery.cs`
- Modify: `Backend/Application/Features/Admin/Users/GetAdminUserDetailQuery.cs`
- Modify: `Backend/Application/Features/Admin/Users/GetUserActivitiesQuery.cs`
- Modify: `Backend/Application/Features/Admin/Users/GetAdminAccessHistoryQuery.cs`
- Modify: `Backend/Application/Features/Admin/Users/UpdateAdminUserStatusCommand.cs`

**Interfaces:**
- Consumes: `ICurrentUserService.IsSystemAdmin`, `ICurrentUserService.IsCategoryAdmin`, `ICurrentUserService.UserId`
- Produces: Ngăn chặn CategoryAdmin xem, list hoặc chỉnh sửa bất kỳ Admin nào khác; CategoryAdmin chỉ xem được người dùng bình thường (`USER`) hoặc thông tin của chính mình.

- [ ] **Step 1: Cập nhật GetAdminUsersAsync trong AdminUserRepository**
Khi người gọi là `CategoryAdmin`:
- Ép cứng điều kiện: Chỉ lấy người dùng có vai trò thuần `USER`, bài trừ hoàn toàn `CATEGORY_ADMIN` và `SYSTEM_ADMIN`.
- Bỏ qua tham số `role` nếu CategoryAdmin cố tình truyền `role=CATEGORY_ADMIN` hoặc `role=SYSTEM_ADMIN`.
- Lọc bổ sung: Người dùng có tương tác (đặt review, gửi proposal) trong phạm vi danh mục hoặc tỉnh thành mà CategoryAdmin quản lý (hoặc người dùng thường).

- [ ] **Step 2: Rà soát và siết chặt GetAdminUserDetailQueryHandler**
Đảm bảo khi `!currentUser.IsSystemAdmin`:
- Nếu `targetUser` có role `CATEGORY_ADMIN` hoặc `SYSTEM_ADMIN` và `targetUser.Id != currentUser.UserId`: Lập tức trả về `Result.Failure(HttpStatusCode.Forbidden, "Bạn không có quyền xem thông tin của quản trị viên khác.")`.

- [ ] **Step 3: Rà soát GetUserActivitiesQueryHandler & GetAdminAccessHistoryQueryHandler**
Cấm CategoryAdmin xem lịch sử thao tác hoặc hoạt động của bất kỳ Admin nào khác ngoài bản thân.

- [ ] **Step 4: Rà soát UpdateAdminUserStatusCommandHandler**
Cấm CategoryAdmin khóa/mở khóa tài khoản của bất kỳ Admin nào. Chỉ SystemAdmin mới có quyền thao tác trên tài khoản Admin.

- [ ] **Step 5: Kiểm tra cấu hình Endpoint**
Kiểm tra [GetAdminUsersEndpoint.cs](file:///d:/Y4-HK1/KLCN/H%E1%BB%87%20th%E1%BB%91ng%20chia%20s%E1%BA%BB%20%C4%91i%E1%BB%83m/Backend/API/Endpoints/Admin/Users/GetAdminUsersEndpoint.cs) và [UpdateAdminUserScopesEndpoint.cs](file:///d:/Y4-HK1/KLCN/H%E1%BB%87%20th%E1%BB%91ng%20chia%20s%E1%BA%BB%20%C4%91i%E1%BB%83m/Backend/API/Endpoints/Admin/Users/UpdateAdminUserScopesEndpoint.cs) đảm bảo các endpoint phân quyền gán scope chỉ SystemAdmin mới được gọi.

---

### Task 3: Siết chặt Scope Quản lý Bộ sưu tập (Collections)

**Files:**
- Modify: `Backend/Infrastructure/Persistence/Repositories/CollectionRepository.cs`

**Interfaces:**
- Consumes: `ICurrentUserService`, `AdminScopeFilterHelper`
- Produces: 
  - `GetAdminCollectionsAsync`: lọc `c.ProvinceId IN @ScopeProvinceIds`
  - `GetCollectionPlacesDetailAsync`: kiểm tra `IsCollectionInScopeAsync`
  - `CreateCollectionAsync`: chỉ cho phép tạo với `ProvinceId` nằm trong `ProvinceScopes`
  - `AddOrUpdatePlacesAsync`: kiểm tra collection nằm trong scope và các địa điểm thêm vào phải thuộc `IsPlaceInScopeAsync`
  - `UpdateCollectionStatusAsync`: kiểm tra collection nằm trong scope

- [ ] **Step 1: Tiêm ICurrentUserService vào CollectionRepository**
Bổ sung `ICurrentUserService _currentUserService` vào constructor của `CollectionRepository`.

- [ ] **Step 2: Áp dụng Scope Filter vào GetAdminCollectionsAsync**
Nếu `!currentUser.IsSystemAdmin`, thêm mệnh đề lọc `AdminScopeFilterHelper.ApplyCollectionScope(...)` để Admin Hà Nội chỉ nhìn thấy các bộ sưu tập của Hà Nội.

- [ ] **Step 3: Kiểm tra Scope trong GetCollectionPlacesDetailAsync & UpdateCollectionStatusAsync**
Nếu collection không thuộc tỉnh thành của Admin, trả về `NotFound` hoặc `Forbidden`.

- [ ] **Step 4: Kiểm tra Scope trong CreateCollectionAsync**
Nếu Admin cấp 1 gửi `provinceId` không nằm trong `_currentUserService.ProvinceScopes`, từ chối tạo mới (báo lỗi không có quyền tạo bộ sưu tập cho tỉnh thành này).

- [ ] **Step 5: Kiểm tra Scope trong AddOrUpdatePlacesAsync**
- Kiểm tra `collection.ProvinceId` phải thuộc scope của admin.
- Kiểm tra từng địa điểm trong danh sách `places`: địa điểm phải thuộc tỉnh và danh mục mà Admin được quyền quản lý.

---

### Task 4: Siết chặt Scope Quản lý Địa điểm (Places)

**Files:**
- Modify: `Backend/Infrastructure/Persistence/Repositories/AdminPlaceRepository.cs`

**Interfaces:**
- Consumes: `AdminScopeFilterHelper.ValidatePlaceInputScope`, `AdminScopeFilterHelper.IsPlaceInScopeAsync`

- [ ] **Step 1: Bổ sung kiểm tra Scope khi tạo địa điểm (CreateAdminPlaceAsync)**
Trước khi tạo bản ghi `Place`:
Kiểm tra `AdminScopeFilterHelper.ValidatePlaceInputScope(_currentUserService, input.CategoryId, input.ProvinceId)`. Nếu không thỏa mãn, ném ngoại lệ hoặc trả về lỗi không có quyền tạo địa điểm ngoài danh mục/tỉnh thành quản lý.

- [ ] **Step 2: Bổ sung kiểm tra Scope khi cập nhật địa điểm (UpdateAdminPlaceAsync)**
- Bước 1: Kiểm tra địa điểm cũ có thuộc scope không (`IsPlaceInScopeAsync`).
- Bước 2: Kiểm tra dữ liệu mới (`newCategoryId`, `newProvinceId`) có nằm trong scope của Admin không. Ngăn chặn việc Admin chuyển địa điểm sang danh mục hoặc tỉnh thành khác ngoài thẩm quyền.

- [ ] **Step 3: Kiểm tra Upload & Delete Media (UploadAdminPlaceMediaAsync, DeleteAdminPlaceMediaAsync)**
Đảm bảo đã gọi `IsPlaceInScopeAsync` trước khi thêm hoặc xóa ảnh của địa điểm.

---

### Task 5: Siết chặt Scope Quản lý Món ăn đặc sản (Foods)

**Files:**
- Modify: `Backend/Infrastructure/Persistence/Repositories/AdminFoodRepository.cs`

**Interfaces:**
- Consumes: `AdminScopeFilterHelper.ValidateFoodInputScope`, `AdminScopeFilterHelper.ApplyFoodScope`

- [ ] **Step 1: Bổ sung kiểm tra Scope khi tạo món ăn (CreateAdminFoodAsync)**
Nếu `input.ProvinceId.HasValue`:
Kiểm tra `AdminScopeFilterHelper.ValidateFoodInputScope(_currentUserService, input.ProvinceId.Value)`. Nếu tỉnh thành ngoài phạm vi, từ chối tạo món ăn.

- [ ] **Step 2: Bổ sung kiểm tra Scope khi cập nhật món ăn (UpdateAdminFoodAsync)**
- Bước 1: Kiểm tra món ăn hiện tại có trong scope không (`IsFoodInScopeAsync`).
- Bước 2: Nếu cập nhật `input.ProvinceId`, bắt buộc tỉnh mới phải thuộc `ProvinceScopes`.

- [ ] **Step 3: Kiểm tra Đổi trạng thái và Xóa món ăn**
Đảm bảo `UpdateAdminFoodStatusAsync` và `DeleteAdminFoodAsync` đều chặn nếu món ăn không thuộc phạm vi quản lý.

---

### Task 6: Siết chặt Scope Đề xuất đóng góp (Proposals)

**Files:**
- Modify: `Backend/Infrastructure/Persistence/Repositories/AdminProposalRepository.cs`

**Interfaces:**
- Consumes: `IsProposalInScopeAsync`

- [ ] **Step 1: Áp dụng Scope Check vào GetProposalDetailAsync**
Trước khi deserialize và trả về chi tiết đề xuất trong `GetProposalDetailAsync`:
Thực hiện `if (!await IsProposalInScopeAsync(id)) return null;`
Ngăn chặn Admin xem trộm đề xuất thuộc địa bàn/danh mục khác bằng cách gõ trực tiếp ID.

- [ ] **Step 2: Đảm bảo kiểm tra Scope trong ApproveProposalAsync và RejectProposalAsync**
Xác nhận rằng khi duyệt đề xuất tạo địa điểm mới (`Place`), địa điểm mới được tạo ra phải thừa hưởng đúng `CategoryId` và `ProvinceId` trong scope của Admin.

---

### Task 7: Siết chặt Scope Báo cáo vi phạm (Reports)

**Files:**
- Modify: `Backend/Infrastructure/Persistence/Repositories/AdminReportRepository.cs`

**Interfaces:**
- Consumes: `IsTargetInScopeAsync`, `ApplyPlaceScope`, `ApplyBlogScope`

- [ ] **Step 1: Kiểm tra truy vấn AllReports trong GetReportsQueueAsync**
Đảm bảo các điều kiện lọc `ScopeCategoryId` và `ScopeProvinceId` đối với từng loại mục tiêu (`place`, `review`, `comment`, `blog`):
- `place`: Lọc theo `p.CategoryId` và `p.ProvinceId`.
- `review`: Lọc theo `p.CategoryId` và `p.ProvinceId` của địa điểm được review.
- `comment`: Lọc theo `p.CategoryId` và `p.ProvinceId` của địa điểm mà review đó trực thuộc.
- `blog`: Lọc theo `b.CategoryId`.
Nếu admin chỉ quản lý Thức ăn tại Hà Nội, chỉ các báo cáo về địa điểm Thức ăn tại Hà Nội, hoặc review/comment tại địa điểm Thức ăn Hà Nội mới được hiển thị.

- [ ] **Step 2: Rà soát ResolveReportAsync**
Đảm bảo gọi `IsTargetInScopeAsync` cho mọi loại báo cáo trước khi chuyển trạng thái hoặc thực hiện hành động ẩn đối tượng.

---

### Task 8: Siết chặt Scope Cẩm nang du lịch (Blogs)

**Files:**
- Modify: `Backend/Infrastructure/Persistence/Repositories/AdminBlogRepository.cs`

**Interfaces:**
- Consumes: `AdminScopeFilterHelper.ValidateBlogInputScope`, `AdminScopeFilterHelper.IsBlogInScopeAsync`

- [ ] **Step 1: Kiểm tra Scope khi tạo bài viết cẩm nang (CreateAdminBlogAsync)**
Kiểm tra `AdminScopeFilterHelper.ValidateBlogInputScope(_currentUserService, input.CategoryId)`. Nếu `CategoryId` không nằm trong `CategoryScopes`, từ chối tạo bài viết.

- [ ] **Step 2: Kiểm tra Scope khi cập nhật bài viết cẩm nang (UpdateAdminBlogAsync)**
Kiểm tra `input.CategoryId` mới phải nằm trong `CategoryScopes`.

---

### Task 9: Biên dịch và Kiểm thử tích hợp ranh giới Scope (Verification & Scope Testing)

**Files:**
- Test: `Backend/tests/AdminScopeTests/` hoặc script PowerShell kiểm thử thực tế API.

- [ ] **Step 1: Biên dịch toàn bộ Solution Backend**
Run: `dotnet build Backend/Backend.slnx`
Expected: 0 errors, 0 warnings mới.

- [ ] **Step 2: Kiểm thử kịch bản Scoped Admin (Hà Nội + Thức ăn)**
1. Đăng nhập tài khoản CategoryAdmin phụ trách Thức ăn (`CategoryId = 1`) tại Hà Nội (`ProvinceId = 1`).
2. Gọi `GET /api/admin/places`: Xác nhận 100% địa điểm trả về có `CategoryId = 1` và `ProvinceId = 1`.
3. Gọi `GET /api/admin/collections`: Xác nhận 100% bộ sưu tập trả về là của Hà Nội (`ProvinceId = 1`).
4. Gọi `GET /api/admin/users`: Xác nhận không chứa bất kỳ tài khoản có vai trò `CATEGORY_ADMIN` hoặc `SYSTEM_ADMIN` nào.
5. Gọi `GET /api/admin/users/{systemAdminId}`: Xác nhận trả về `403 Forbidden`.
6. Gọi `POST /api/admin/places` với `ProvinceId = 2` (Đà Nẵng): Xác nhận bị từ chối `403 Forbidden` / Validation Failure.
