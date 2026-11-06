using Domain.Enums;

namespace Application.Common.Interfaces;

public class TextModerationResult
{
    public bool IsPassed { get; set; } = true;
    public string? BlockReason { get; set; }
    public string CleanedText { get; set; } = string.Empty;
    public double SentimentScore { get; set; } = 0.0;
    public bool IsInconsistent { get; set; } = false;
    public bool IsSarcastic { get; set; } = false;
    public string? SarcasmReason { get; set; }
    public bool NeedsAdminReview { get; set; } = false;
    public string? ModerationReason { get; set; }
    public ReviewStatus RecommendedStatus { get; set; } = ReviewStatus.Active;
    public List<string> DetectedViolations { get; set; } = new();
}

public interface IContentModerationService
{
    TextModerationResult ModerateReview(string? content, byte rating);
    TextModerationResult ModerateComment(string content);
    Task<TextModerationResult> ModerateReviewAsync(string? content, byte rating, CancellationToken ct = default);
    Task<TextModerationResult> ModerateCommentAsync(string content, CancellationToken ct = default);
}
