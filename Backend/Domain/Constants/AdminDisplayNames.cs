using Domain.Enums;

namespace Domain.Constants;

public static class AdminDisplayNames
{
    private static readonly Dictionary<string, string> SettingKeyNames = new(StringComparer.OrdinalIgnoreCase)
    {
        [nameof(SystemSettingKey.MAINTENANCE_MODE)] = "Chế độ bảo trì toàn hệ thống",
        [nameof(SystemSettingKey.SITE_NAME)] = "Tên hiển thị hệ thống",
        [nameof(SystemSettingKey.SITE_EMAIL)] = "Email hỗ trợ khách hàng",
        [nameof(SystemSettingKey.SITE_HOTLINE)] = "Đường dây nóng hỗ trợ du khách",
        [nameof(SystemSettingKey.AUTO_APPROVE_PLACES)] = "Tự động duyệt địa điểm mới",
        [nameof(SystemSettingKey.AUTO_APPROVE_REVIEWS)] = "Tự động duyệt bài đánh giá",
        [nameof(SystemSettingKey.MAX_UPLOAD_PHOTOS)] = "Số lượng ảnh tối đa mỗi bài",
        [nameof(SystemSettingKey.MAX_UPLOAD_SIZE_MB)] = "Dung lượng tối đa mỗi ảnh",
        [nameof(SystemSettingKey.BLACKLIST_WORDS)] = "Danh sách từ khóa cấm & nhạy cảm",
        [nameof(SystemSettingKey.ALLOW_REGISTRATION)] = "Cho phép đăng ký tài khoản mới",
        [nameof(SystemSettingKey.REQUIRE_EMAIL_VERIFICATION)] = "Yêu cầu xác thực Email khi đăng ký",
        [nameof(SystemSettingKey.ENABLE_TWO_FACTOR)] = "Bật xác thực hai bước",
        [nameof(SystemSettingKey.DEFAULT_USER_AVATAR)] = "Ảnh đại diện mặc định người dùng",
        [nameof(SystemSettingKey.DEFAULT_GROUP_AVATAR)] = "Ảnh đại diện mặc định nhóm trò chuyện",
        [nameof(SystemSettingKey.HOME_HERO_IMAGE)] = "Ảnh nền màn hình chính"
    };

    public static string StripParentheses(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;
        return System.Text.RegularExpressions.Regex.Replace(text, @"\s*\([^)]*\)", "").Trim();
    }

    private static readonly Dictionary<string, string> SettingGroupNames = new(StringComparer.OrdinalIgnoreCase)
    {
        [nameof(SystemSettingGroup.GENERAL)] = "Cài đặt chung",
        [nameof(SystemSettingGroup.MODERATION)] = "Kiểm duyệt & Nội dung",
        [nameof(SystemSettingGroup.SECURITY)] = "Bảo mật & An toàn",
        [nameof(SystemSettingGroup.SYSTEM)] = "Hệ thống & Vận hành",
        [nameof(SystemSettingGroup.NOTIFICATION)] = "Thông báo & Tin nhắn",
        [nameof(SystemSettingGroup.MEDIA)] = "Hình ảnh & Giao diện"
    };

    public static string GetSettingName(SystemSettingKey key) => GetSettingName(key.ToString());

    public static string GetSettingName(string? key)
    {
        if (string.IsNullOrWhiteSpace(key)) return "Không xác định";
        var rawName = SettingKeyNames.TryGetValue(key.Trim(), out var name)
            ? name
            : key.Trim();
        return StripParentheses(rawName);
    }

    public static string GetSettingGroupName(SystemSettingGroup group) => GetSettingGroupName(group.ToString());

    public static string GetSettingGroupName(string? group)
    {
        if (string.IsNullOrWhiteSpace(group)) return "Chung";
        return SettingGroupNames.TryGetValue(group.Trim(), out var name)
            ? name
            : group.Trim();
    }

    private static readonly Dictionary<string, string> TargetScopeNames = new(StringComparer.OrdinalIgnoreCase)
    {
        [nameof(ReportTargetScope.PLACE)] = "Địa điểm",
        [nameof(ReportTargetScope.CONTENT)] = "Nội dung & Bài viết",
        [nameof(ReportTargetScope.REVIEW)] = "Bài đánh giá",
        [nameof(ReportTargetScope.COMMENT)] = "Bình luận",
        [nameof(ReportTargetScope.ALL)] = "Toàn bộ hệ thống"
    };

    public static string GetTargetScopeName(ReportTargetScope scope) => GetTargetScopeName(scope.ToString());

    public static string GetTargetScopeName(string? scope)
    {
        if (string.IsNullOrWhiteSpace(scope)) return "Toàn bộ hệ thống";
        return TargetScopeNames.TryGetValue(scope.Trim(), out var name)
            ? name
            : scope.Trim();
    }

    public static string GetStatusName(byte? status)
    {
        return status switch
        {
            1 => "Hoạt động",
            2 => "Tạm ẩn",
            _ => "Không xác định"
        };
    }

    private static readonly Dictionary<string, string> ActionTypeNames = new(StringComparer.OrdinalIgnoreCase)
    {
        [nameof(AdminActionType.CREATE_PLACE)] = "Thêm mới địa điểm",
        [nameof(AdminActionType.APPROVE_PLACE)] = "Duyệt công khai địa điểm",
        [nameof(AdminActionType.REJECT_PLACE)] = "Từ chối duyệt địa điểm",
        [nameof(AdminActionType.UPDATE_PLACE)] = "Cập nhật thông tin địa điểm",
        [nameof(AdminActionType.UPDATE_PLACE_STATUS)] = "Đổi trạng thái địa điểm",
        [nameof(AdminActionType.UPDATE_PLACE_COVER)] = "Cập nhật ảnh bìa địa điểm",
        [nameof(AdminActionType.ADD_PLACE_MEDIA)] = "Thêm ảnh thư viện địa điểm",
        [nameof(AdminActionType.DELETE_PLACE_MEDIA)] = "Xóa ảnh thư viện địa điểm",
        [nameof(AdminActionType.DELETE_PLACE)] = "Xóa địa điểm",

        [nameof(AdminActionType.APPROVE_PROPOSAL)] = "Duyệt đề xuất địa điểm",
        [nameof(AdminActionType.REJECT_PROPOSAL)] = "Từ chối đề xuất địa điểm",
        [nameof(AdminActionType.RESOLVE_REPORT)] = "Xử lý báo cáo vi phạm",
        [nameof(AdminActionType.RESOLVE_REPORT_GROUP)] = "Xử lý nhóm báo cáo vi phạm",

        [nameof(AdminActionType.UPDATE_REVIEW_STATUS)] = "Đổi trạng thái đánh giá",
        [nameof(AdminActionType.DELETE_REVIEW)] = "Xóa bài đánh giá",
        [nameof(AdminActionType.UPDATE_COMMENT_STATUS)] = "Đổi trạng thái bình luận",
        [nameof(AdminActionType.DELETE_COMMENT)] = "Xóa bình luận",

        [nameof(AdminActionType.CREATE_BLOG)] = "Đăng bài viết mới",
        [nameof(AdminActionType.UPDATE_BLOG)] = "Cập nhật bài viết",
        [nameof(AdminActionType.UPDATE_BLOG_STATUS)] = "Đổi trạng thái bài viết",
        [nameof(AdminActionType.DELETE_BLOG)] = "Xóa bài viết",

        [nameof(AdminActionType.CREATE_FOOD)] = "Thêm món ăn đặc sản",
        [nameof(AdminActionType.UPDATE_FOOD)] = "Cập nhật món ăn đặc sản",
        [nameof(AdminActionType.UPDATE_FOOD_STATUS)] = "Đổi trạng thái món ăn",
        [nameof(AdminActionType.DELETE_FOOD)] = "Xóa món ăn đặc sản",

        [nameof(AdminActionType.UPDATE_TRIP)] = "Cập nhật lịch trình chuyến đi",

        [nameof(AdminActionType.CREATE_COLLECTION)] = "Tạo bộ sưu tập mới",
        [nameof(AdminActionType.UPDATE_COLLECTION_PLACES)] = "Cập nhật địa điểm trong bộ sưu tập",
        [nameof(AdminActionType.UPDATE_COLLECTION_STATUS)] = "Đổi trạng thái bộ sưu tập",

        [nameof(AdminActionType.LOCK_USER)] = "Khóa tài khoản người dùng",
        [nameof(AdminActionType.UNLOCK_USER)] = "Mở khóa tài khoản người dùng",
        [nameof(AdminActionType.ACTIVATE_USER)] = "Mở khóa tài khoản người dùng",
        [nameof(AdminActionType.CHANGE_USER_ROLE)] = "Phân quyền vai trò quản trị",
        [nameof(AdminActionType.ASSIGN_SCOPES)] = "Cập nhật phạm vi phân quyền",

        [nameof(AdminActionType.CREATE_REGION)] = "Thêm mới Vùng/Miền",
        [nameof(AdminActionType.UPDATE_REGION)] = "Cập nhật thông tin Vùng/Miền",
        [nameof(AdminActionType.DELETE_REGION)] = "Xóa Vùng/Miền",
        [nameof(AdminActionType.CHANGE_REGION_STATUS)] = "Đổi trạng thái Vùng/Miền",
        [nameof(AdminActionType.CREATE_PROVINCE)] = "Thêm mới Tỉnh/Thành phố",
        [nameof(AdminActionType.UPDATE_PROVINCE)] = "Cập nhật Tỉnh/Thành phố",
        [nameof(AdminActionType.UPDATE_PROVINCE_IMAGE)] = "Cập nhật ảnh đại diện Tỉnh/Thành phố",
        [nameof(AdminActionType.DELETE_PROVINCE)] = "Xóa Tỉnh/Thành phố",
        [nameof(AdminActionType.CHANGE_PROVINCE_STATUS)] = "Đổi trạng thái Tỉnh/Thành phố",

        [nameof(AdminActionType.CREATE_PLACE_TYPE)] = "Thêm mới Loại địa điểm lớn",
        [nameof(AdminActionType.UPDATE_PLACE_TYPE)] = "Cập nhật Loại địa điểm lớn",
        [nameof(AdminActionType.DELETE_PLACE_TYPE)] = "Xóa Loại địa điểm lớn",
        [nameof(AdminActionType.CHANGE_PLACE_TYPE_STATUS)] = "Đổi trạng thái Loại địa điểm",
        [nameof(AdminActionType.CREATE_CATEGORY)] = "Thêm mới Danh mục chi tiết",
        [nameof(AdminActionType.UPDATE_CATEGORY)] = "Cập nhật Danh mục chi tiết",
        [nameof(AdminActionType.DELETE_CATEGORY)] = "Xóa Danh mục chi tiết",
        [nameof(AdminActionType.CHANGE_CATEGORY_STATUS)] = "Đổi trạng thái Danh mục chi tiết",

        [nameof(AdminActionType.CREATE_REPORT_TYPE)] = "Thêm mới Lý do báo cáo vi phạm",
        [nameof(AdminActionType.UPDATE_REPORT_TYPE)] = "Cập nhật Lý do báo cáo vi phạm",
        [nameof(AdminActionType.DELETE_REPORT_TYPE)] = "Xóa Lý do báo cáo vi phạm",
        [nameof(AdminActionType.CHANGE_REPORT_TYPE_STATUS)] = "Đổi trạng thái Lý do báo cáo",
        [nameof(AdminActionType.UPDATE_SYSTEM_SETTING)] = "Cập nhật tham số hệ thống",
        [nameof(AdminActionType.BATCH_UPDATE_SYSTEM_SETTINGS)] = "Cập nhật đồng loạt cấu hình hệ thống"
    };

    public static string GetActionTypeName(AdminActionType actionType) => GetActionTypeName(actionType.ToString());

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
        ["Proposals"] = "Đề xuất địa điểm",
        ["PlaceReports"] = "Báo cáo địa điểm",
        ["ReviewReports"] = "Báo cáo đánh giá",
        ["CommentReports"] = "Báo cáo bình luận",
        ["BlogReports"] = "Báo cáo bài viết",
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
        ["Comments"] = "Bình luận",
        ["Trips"] = "Lịch trình chuyến đi"
    };

    public static string GetTargetTableName(string? table)
    {
        if (string.IsNullOrWhiteSpace(table)) return "Dữ liệu hệ thống";
        return TargetTableNames.TryGetValue(table.Trim(), out var name)
            ? name
            : table.Trim();
    }

    private static readonly Dictionary<string, string> RoleNames = new(StringComparer.OrdinalIgnoreCase)
    {
        [AppRoles.DbSystemAdmin] = "Quản trị viên tối cao",
        [AppRoles.SystemAdmin] = "Quản trị viên tối cao",
        [AppRoles.DbCategoryAdmin] = "Điều phối viên danh mục",
        [AppRoles.CategoryAdmin] = "Điều phối viên danh mục",
        [AppRoles.DbUser] = "Thành viên người dùng",
        [AppRoles.User] = "Thành viên người dùng"
    };

    public static string GetRoleName(string? roleCode)
    {
        if (string.IsNullOrWhiteSpace(roleCode)) return "Người dùng";
        return RoleNames.TryGetValue(roleCode.Trim(), out var name)
            ? name
            : roleCode.Trim();
    }

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
