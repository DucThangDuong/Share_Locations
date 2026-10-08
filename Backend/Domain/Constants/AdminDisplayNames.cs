using Domain.Enums;

namespace Domain.Constants;
public static class AdminDisplayNames
{
    private static readonly Dictionary<string, string> SettingKeyNames = new(StringComparer.OrdinalIgnoreCase)
    {
        ["MAINTENANCE_MODE"] = "Chế độ bảo trì toàn hệ thống",
        ["SITE_NAME"] = "Tên hiển thị hệ thống",
        ["SITE_EMAIL"] = "Email hỗ trợ khách hàng",
        ["SITE_HOTLINE"] = "Đường dây nóng hỗ trợ du khách",
        ["AUTO_APPROVE_PLACES"] = "Tự động duyệt địa điểm mới",
        ["AUTO_APPROVE_REVIEWS"] = "Tự động duyệt bài đánh giá",
        ["MAX_UPLOAD_PHOTOS"] = "Số lượng ảnh tối đa mỗi bài",
        ["MAX_UPLOAD_SIZE_MB"] = "Dung lượng tối đa mỗi ảnh",
        ["BLACKLIST_WORDS"] = "Danh sách từ khóa cấm & nhạy cảm",
        ["ALLOW_REGISTRATION"] = "Cho phép đăng ký tài khoản mới",
        ["REQUIRE_EMAIL_VERIFICATION"] = "Yêu cầu xác thực Email khi đăng ký",
        ["ENABLE_TWO_FACTOR"] = "Bật xác thực hai bước",
        ["DEFAULT_USER_AVATAR"] = "Ảnh đại diện mặc định người dùng",
        ["DEFAULT_GROUP_AVATAR"] = "Ảnh đại diện mặc định nhóm trò chuyện",
        ["HOME_HERO_IMAGE"] = "Ảnh nền màn hình chính"
    };

    public static string StripParentheses(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;
        return System.Text.RegularExpressions.Regex.Replace(text, @"\s*\([^)]*\)", "").Trim();
    }

    private static readonly Dictionary<string, string> SettingGroupNames = new(StringComparer.OrdinalIgnoreCase)
    {
        ["GENERAL"] = "Cài đặt chung",
        ["MODERATION"] = "Kiểm duyệt & Nội dung",
        ["SECURITY"] = "Bảo mật & An toàn",
        ["SYSTEM"] = "Hệ thống & Vận hành",
        ["NOTIFICATION"] = "Thông báo & Tin nhắn",
        ["MEDIA"] = "Hình ảnh & Giao diện"
    };

    public static string GetSettingName(string? key)
    {
        if (string.IsNullOrWhiteSpace(key)) return "Không xác định";
        var rawName = SettingKeyNames.TryGetValue(key.Trim(), out var name)
            ? name
            : key.Trim();
        return StripParentheses(rawName);
    }

    public static string GetSettingGroupName(string? group)
    {
        if (string.IsNullOrWhiteSpace(group)) return "Chung";
        return SettingGroupNames.TryGetValue(group.Trim(), out var name)
            ? name
            : group.Trim();
    }

    // =========================================================================
    // 2. PHẠM VI ÁP DỤNG BÁO CÁO VI PHẠM (REPORT TYPES TARGET SCOPE)
    // =========================================================================
    private static readonly Dictionary<string, string> TargetScopeNames = new(StringComparer.OrdinalIgnoreCase)
    {
        ["PLACE"] = "Địa điểm",
        ["CONTENT"] = "Nội dung & Bài viết",
        ["REVIEW"] = "Bài đánh giá",
        ["COMMENT"] = "Bình luận",
        ["ALL"] = "Toàn bộ hệ thống"
    };

    public static string GetTargetScopeName(string? scope)
    {
        if (string.IsNullOrWhiteSpace(scope)) return "Toàn bộ hệ thống";
        return TargetScopeNames.TryGetValue(scope.Trim(), out var name)
            ? name
            : scope.Trim();
    }

    // =========================================================================
    // 3. TRẠNG THÁI BẢN GHI MASTER DATA (STATUS: 1 = ACTIVE, 2 = INACTIVE)
    // =========================================================================
    public static string GetStatusName(byte? status)
    {
        return status switch
        {
            1 => "Hoạt động",
            2 => "Tạm ẩn",
            _ => "Không xác định"
        };
    }

    // =========================================================================
    // 4. LOẠI HÀNH ĐỘNG KIỂM TOÁN (AUDIT LOG ACTION TYPES)
    // =========================================================================
    private static readonly Dictionary<string, string> ActionTypeNames = new(StringComparer.OrdinalIgnoreCase)
    {
        // Địa điểm & Nội dung
        ["APPROVE_PLACE"] = "Duyệt công khai địa điểm",
        ["REJECT_PLACE"] = "Từ chối duyệt địa điểm",
        ["UPDATE_PLACE"] = "Cập nhật thông tin địa điểm",
        ["DELETE_PLACE"] = "Xóa địa điểm",
        ["LOCK_USER"] = "Khóa tài khoản người dùng",
        ["UNLOCK_USER"] = "Mở khóa tài khoản người dùng",
        ["CHANGE_USER_ROLE"] = "Phân quyền vai trò quản trị",

        // Địa lý & Hành chính
        ["CREATE_REGION"] = "Thêm mới Vùng/Miền",
        ["UPDATE_REGION"] = "Cập nhật thông tin Vùng/Miền",
        ["DELETE_REGION"] = "Xóa Vùng/Miền",
        ["CHANGE_REGION_STATUS"] = "Đổi trạng thái Vùng/Miền",
        ["CREATE_PROVINCE"] = "Thêm mới Tỉnh/Thành phố",
        ["UPDATE_PROVINCE"] = "Cập nhật Tỉnh/Thành phố",
        ["DELETE_PROVINCE"] = "Xóa Tỉnh/Thành phố",
        ["CHANGE_PROVINCE_STATUS"] = "Đổi trạng thái Tỉnh/Thành phố",

        // Phân loại & Trải nghiệm
        ["CREATE_PLACE_TYPE"] = "Thêm mới Loại địa điểm lớn",
        ["UPDATE_PLACE_TYPE"] = "Cập nhật Loại địa điểm lớn",
        ["DELETE_PLACE_TYPE"] = "Xóa Loại địa điểm lớn",
        ["CHANGE_PLACE_TYPE_STATUS"] = "Đổi trạng thái Loại địa điểm",
        ["CREATE_CATEGORY"] = "Thêm mới Danh mục chi tiết",
        ["UPDATE_CATEGORY"] = "Cập nhật Danh mục chi tiết",
        ["DELETE_CATEGORY"] = "Xóa Danh mục chi tiết",
        ["CHANGE_CATEGORY_STATUS"] = "Đổi trạng thái Danh mục chi tiết",

        // Cài đặt & Báo cáo
        ["CREATE_REPORT_TYPE"] = "Thêm mới Lý do báo cáo vi phạm",
        ["UPDATE_REPORT_TYPE"] = "Cập nhật Lý do báo cáo vi phạm",
        ["DELETE_REPORT_TYPE"] = "Xóa Lý do báo cáo vi phạm",
        ["CHANGE_REPORT_TYPE_STATUS"] = "Đổi trạng thái Lý do báo cáo",
        ["UPDATE_SYSTEM_SETTING"] = "Cập nhật tham số hệ thống",
        ["BATCH_UPDATE_SYSTEM_SETTINGS"] = "Cập nhật đồng loạt cấu hình hệ thống"
    };

    public static string GetActionTypeName(string? actionType)
    {
        if (string.IsNullOrWhiteSpace(actionType)) return "Thao tác hệ thống";
        return ActionTypeNames.TryGetValue(actionType.Trim(), out var name)
            ? name
            : actionType.Trim();
    }
    private static readonly Dictionary<string, string> TargetTableNames = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Places"] = "Địa điểm",
        ["Users"] = "Người dùng",
        ["Regions"] = "Vùng / Miền",
        ["Provinces"] = "Tỉnh / Thành phố",
        ["PlaceTypes"] = "Loại địa điểm lớn",
        ["Categories"] = "Danh mục trải nghiệm",
        ["ReportTypes"] = "Lý do báo cáo vi phạm",
        ["SystemSettings"] = "Cài đặt hệ thống",
        ["Foods"] = "Món ăn đặc sản",
        ["Collections"] = "Bộ sưu tập",
        ["Blogs"] = "Bài viết khám phá",
        ["Reviews"] = "Bài đánh giá",
        ["Comments"] = "Bình luận"
    };

    public static string GetTargetTableName(string? table)
    {
        if (string.IsNullOrWhiteSpace(table)) return "Dữ liệu hệ thống";
        return TargetTableNames.TryGetValue(table.Trim(), out var name)
            ? name
            : table.Trim();
    }

    // =========================================================================
    // 6. MÃ VAI TRÒ NGƯỜI DÙNG / QUẢN TRỊ VIÊN (ACTOR ROLES)
    // =========================================================================
    private static readonly Dictionary<string, string> RoleNames = new(StringComparer.OrdinalIgnoreCase)
    {
        ["SYSTEM_ADMIN"] = "Quản trị viên tối cao",
        ["SystemAdmin"] = "Quản trị viên tối cao",
        ["CATEGORY_ADMIN"] = "Điều phối viên danh mục",
        ["CategoryAdmin"] = "Điều phối viên danh mục",
        ["USER"] = "Thành viên người dùng",
        ["User"] = "Thành viên người dùng"
    };

    public static string GetRoleName(string? roleCode)
    {
        if (string.IsNullOrWhiteSpace(roleCode)) return "Người dùng";
        return RoleNames.TryGetValue(roleCode.Trim(), out var name)
            ? name
            : roleCode.Trim();
    }

    // =========================================================================
    // 7. LOẠI THÔNG BÁO (NOTIFICATION TYPES)
    // =========================================================================
    private static readonly Dictionary<NotificationType, string> NotificationTypeNames = new()
    {
        [NotificationType.System] = "Hệ thống",
        [NotificationType.Social] = "Bạn bè & Tương tác",
        [NotificationType.Review] = "Đánh giá & Bình luận",
        [NotificationType.Trip] = "Chuyến đi & Lịch trình",
        [NotificationType.Proposal] = "Đề xuất địa điểm",
        [NotificationType.Moderation] = "Kiểm duyệt & Báo cáo"
    };

    public static string GetNotificationTypeName(NotificationType type)
    {
        return NotificationTypeNames.TryGetValue(type, out var name) ? name : "Thông báo";
    }
}
