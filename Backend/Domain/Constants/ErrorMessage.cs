namespace Domain.Constants;

public static class ErrorMessage
{
    public const string BAD_CREDENTIALS = "Email hoặc mật khẩu không chính xác.";
    public const string ACCOUNT_DEACTIVATED = "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.";
    public const string UNAUTHORIZED = "Người dùng chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.";
    public const string ACCESS_DENIED = "Bạn không có quyền truy cập tài nguyên này.";
    public const string INVALID_TOKEN_USER_ID = "Định dạng định danh người dùng trong token không hợp lệ.";
    public const string CANNOT_IDENTIFY_USER = "Không thể xác định người dùng từ token.";

    public const string TOKEN_CREATION_FAILED = "Không thể khởi tạo token xác thực.";
    public const string TOKEN_INVALID_SIGNATURE = "Chữ ký token không hợp lệ.";
    public const string TOKEN_EXPIRED = "Token xác thực đã hết hạn.";

    public const string VALIDATION_ERROR = "Dữ liệu đầu vào không hợp lệ.";
    public const string INTERNAL_SERVER_ERROR = "Lỗi hệ thống nội bộ.";

    public const string USER_NOT_FOUND = "Không tìm thấy người dùng hoặc người dùng đã bị xóa.";
    public const string LAST_SYSTEM_ADMIN_REQUIRED = "Hệ thống phải có ít nhất một Quản trị viên hệ thống (SystemAdmin) đang hoạt động.";

    public const string CATEGORY_NOT_FOUND = "Không tìm thấy danh mục địa điểm.";
    public const string CATEGORY_ALREADY_EXISTS = "Tên hoặc mã danh mục đã tồn tại.";
    public const string CATEGORY_INACTIVE = "Danh mục đang tạm ẩn và không thể sử dụng.";

    public const string REGION_NOT_FOUND = "Không tìm thấy vùng miền.";
    public const string PROVINCE_NOT_FOUND = "Không tìm thấy tỉnh/thành phố.";
    public const string PLACE_TYPE_NOT_FOUND = "Không tìm thấy loại hình địa điểm.";

    public const string PLACE_NOT_FOUND = "Không tìm thấy địa điểm trong hệ thống.";
    public const string PLACE_OUT_OF_SCOPE = "Địa điểm nằm ngoài phạm vi phân quyền quản lý của bạn.";

    public const string PROPOSAL_NOT_FOUND = "Không tìm thấy đề xuất địa điểm.";
    public const string PROPOSAL_ALREADY_PROCESSED = "Đề xuất này đã được xử lý trước đó.";

    public const string REPORT_NOT_FOUND = "Không tìm thấy báo cáo vi phạm.";
    public const string REPORT_TYPE_NOT_FOUND = "Không tìm thấy lý do báo cáo vi phạm.";

    public const string BLOG_NOT_FOUND = "Không tìm thấy bài viết.";
    public const string REVIEW_NOT_FOUND = "Không tìm thấy bài đánh giá.";
    public const string COMMENT_NOT_FOUND = "Không tìm thấy bình luận.";
    public const string FOOD_NOT_FOUND = "Không tìm thấy món ăn đặc sản.";
    public const string TRIP_NOT_FOUND = "Không tìm thấy lịch trình chuyến đi.";
    public const string SETTING_NOT_FOUND = "Không tìm thấy tham số cấu hình hệ thống.";
}

