using API.DTOs;
using API.Extensions;
using FastEndpoints;
using Application.Common.Interfaces;

namespace API.Endpoints.Reviews;

public class ModeratePreviewRequest
{
    public string? Content { get; set; }
    public byte Rating { get; set; } = 5;
}

public class ModeratePreviewResponse
{
    public bool IsPassed { get; set; } = true;
    public string? BlockReason { get; set; }
    public double SentimentScore { get; set; }
    public bool IsInconsistent { get; set; }
    public bool IsPositiveWithLowStars { get; set; }
    public bool IsNegativeWithHighStars { get; set; }
    public bool IsSarcastic { get; set; }
    public byte? SuggestedRating { get; set; }
    public string? AssistantMessage { get; set; }
}

public class ModeratePreviewEndpoint : Endpoint<ModeratePreviewRequest, ApiSuccessResponse<ModeratePreviewResponse>>
{
    private readonly IContentModerationService _moderationService;

    public ModeratePreviewEndpoint(IContentModerationService moderationService)
    {
        _moderationService = moderationService;
    }

    public override void Configure()
    {
        Post("/api/reviews/moderate-preview");
        AllowAnonymous();
        Summary(s =>
        {
            s.Summary = "Xem trước kết quả kiểm duyệt cảm xúc và số sao qua PhoBERT AI";
        });
    }

    public override async Task HandleAsync(ModeratePreviewRequest req, CancellationToken ct)
    {
        var trimmed = req.Content?.Trim();
        var wordCount = string.IsNullOrWhiteSpace(trimmed)
            ? 0
            : trimmed.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;

        // Chỉ bỏ qua khi văn bản quá ngắn chưa đủ cấu thành ý nghĩa (< 2 ký tự)
        if (string.IsNullOrWhiteSpace(trimmed) || trimmed.Length < 2)
        {
            var emptyResponse = new ModeratePreviewResponse
            {
                IsPassed = true,
                SentimentScore = 0.0,
                IsInconsistent = false,
                IsPositiveWithLowStars = false,
                IsNegativeWithHighStars = false,
                IsSarcastic = false
            };
            await this.SendApiResponseAsync(Application.Common.Result<ModeratePreviewResponse>.Success(emptyResponse), ct);
            return;
        }

        var result = await _moderationService.ModerateReviewAsync(trimmed, req.Rating, ct);

        // Ngưỡng phát hiện lệch sao phù hợp ngữ cảnh đánh giá địa điểm du lịch & ẩm thực
        // Khi AI phân tích Tiêu cực (Sentiment <= -0.35 hoặc Mỉa mai) nhưng người dùng chọn sao cao (>= 4 sao)
        var isNegativeWithHighStars = (result.SentimentScore <= -0.35 || result.IsSarcastic) && req.Rating >= 4;
        // Khi AI phân tích Tích cực (Sentiment >= 0.40) nhưng người dùng chọn sao thấp (<= 2 sao)
        var isPositiveWithLowStars = result.SentimentScore >= 0.40 && req.Rating <= 2;
        var isInconsistent = result.IsInconsistent || isNegativeWithHighStars || isPositiveWithLowStars;

        string? assistantMessage = null;
        byte? suggestedRating = null;

        if (result.IsSarcastic && req.Rating >= 4)
        {
            suggestedRating = 1;
            assistantMessage = $"Nội dung của bạn có dấu hiệu mỉa mai/châm biếm dịch vụ nhưng bạn đang chấm {req.Rating} sao. Bạn có muốn điều chỉnh lại số sao phản ánh đúng thực tế không?";
        }
        else if (isPositiveWithLowStars)
        {
            suggestedRating = 5;
            assistantMessage = $"Nội dung của bạn rất khen ngợi nhưng bạn đang chọn {req.Rating} sao. Có phải bạn muốn đánh giá 5 sao không?";
        }
        else if (isNegativeWithHighStars)
        {
            suggestedRating = 1;
            assistantMessage = $"Nội dung của bạn phản ánh nhiều điểm chưa hài lòng nhưng bạn đang chấm {req.Rating} sao. Bạn có muốn điều chỉnh lại số sao không?";
        }

        var response = new ModeratePreviewResponse
        {
            IsPassed = result.IsPassed,
            BlockReason = result.BlockReason,
            SentimentScore = result.SentimentScore,
            IsInconsistent = isInconsistent,
            IsPositiveWithLowStars = isPositiveWithLowStars,
            IsNegativeWithHighStars = isNegativeWithHighStars,
            IsSarcastic = result.IsSarcastic,
            SuggestedRating = suggestedRating,
            AssistantMessage = assistantMessage
        };

        await this.SendApiResponseAsync(Application.Common.Result<ModeratePreviewResponse>.Success(response), ct);
    }
}
