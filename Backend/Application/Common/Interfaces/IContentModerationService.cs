using Domain.Enums;

namespace Application.Common.Interfaces;

public class TextModerationResult
{
    /// <summary>
    /// Cho biết nội dung có vượt qua bước lọc cứng (từ cấm, spam link/sđt, spam vô nghĩa) hay không.
    /// Nếu false -> Chặn ngay lập tức (Hard Reject).
    /// </summary>
    public bool IsPassed { get; set; } = true;

    /// <summary>
    /// Thông điệp giải thích lý do chặn trả về cho người dùng.
    /// </summary>
    public string? BlockReason { get; set; }

    /// <summary>
    /// Nội dung văn bản sau khi qua tiền xử lý (khử khoảng trắng thừa, chuẩn hóa ký tự lách luật).
    /// </summary>
    public string CleanedText { get; set; } = string.Empty;

    /// <summary>
    /// Điểm cảm xúc định lượng từ -1.0 (Rất tiêu cực) đến +1.0 (Rất tích cực).
    /// </summary>
    public double SentimentScore { get; set; } = 0.0;

    /// <summary>
    /// Cờ cảnh báo lệch số sao với cảm xúc (khen nhưng sao thấp, hoặc chê nhưng sao cao).
    /// </summary>
    public bool IsInconsistent { get; set; } = false;

    /// <summary>
    /// Cờ cảnh báo phát hiện châm biếm, mỉa mai (ví dụ: khen dịch vụ tuyệt vời nhưng giá trên trời).
    /// </summary>
    public bool IsSarcastic { get; set; } = false;

    /// <summary>
    /// Lý do châm biếm phát hiện bởi AI hoặc bộ luật Regex.
    /// </summary>
    public string? SarcasmReason { get; set; }

    /// <summary>
    /// Cần quản trị viên kiểm tra thủ công trước khi xuất bản công khai.
    /// </summary>
    public bool NeedsAdminReview { get; set; } = false;

    /// <summary>
    /// Lý do ghi chú cho quản trị viên (ví dụ: Khen ngợi (+0.80) nhưng chấm 1★).
    /// </summary>
    public string? ModerationReason { get; set; }

    /// <summary>
    /// Trạng thái được đề xuất lưu vào CSDL (Active hoặc PendingReview).
    /// </summary>
    public ReviewStatus RecommendedStatus { get; set; } = ReviewStatus.Active;

    /// <summary>
    /// Danh sách các lỗi hoặc dấu hiệu vi phạm được phát hiện.
    /// </summary>
    public List<string> DetectedViolations { get; set; } = new();
}

public interface IContentModerationService
{
    /// <summary>
    /// Kiểm duyệt đánh giá địa điểm (đồng bộ).
    /// </summary>
    TextModerationResult ModerateReview(string? content, byte rating);

    /// <summary>
    /// Kiểm duyệt bình luận (đồng bộ).
    /// </summary>
    TextModerationResult ModerateComment(string content);

    /// <summary>
    /// Kiểm duyệt đánh giá địa điểm (bất đồng bộ - gọi PhoBERT AI service với fallback Lexicon).
    /// </summary>
    Task<TextModerationResult> ModerateReviewAsync(string? content, byte rating, CancellationToken ct = default);

    /// <summary>
    /// Kiểm duyệt bình luận (bất đồng bộ - gọi PhoBERT AI service với fallback Lexicon).
    /// </summary>
    Task<TextModerationResult> ModerateCommentAsync(string content, CancellationToken ct = default);
}
