using System.Text;
using System.Text.Json;
using Application.Common.Interfaces;
using Domain.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services.ContentModeration;

public class ContentModerationService : IContentModerationService
{
    private readonly ILogger<ContentModerationService> _logger;
    private readonly HttpClient _httpClient;
    private readonly IModerationKeywordStore _keywordStore;
    private readonly string _sentimentServiceUrl;
    private readonly bool _sentimentServiceEnabled;

    public ContentModerationService(
        ILogger<ContentModerationService> logger,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        IModerationKeywordStore keywordStore)
    {
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient("SentimentService");
        _keywordStore = keywordStore;
        _sentimentServiceUrl = configuration["SentimentService:Url"] ?? "http://127.0.0.1:5002/analyze";
        _sentimentServiceEnabled = configuration.GetValue<bool>("SentimentService:Enabled", true);
    }

    public TextModerationResult ModerateReview(string? content, byte rating)
    {
        return ModerateReviewAsync(content, rating).GetAwaiter().GetResult();
    }

    public TextModerationResult ModerateComment(string content)
    {
        return ModerateCommentAsync(content).GetAwaiter().GetResult();
    }

    public async Task<TextModerationResult> ModerateReviewAsync(string? content, byte rating, CancellationToken ct = default)
    {
        var result = new TextModerationResult();

        var cleanedText = TextPreprocessor.Preprocess(content);
        result.CleanedText = cleanedText;

        if (string.IsNullOrWhiteSpace(cleanedText))
        {
            result.IsPassed = true;
            result.SentimentScore = 0.0;
            result.RecommendedStatus = ReviewStatus.Active;
            return result;
        }

        var hardCheck = await HardContentFilter.CheckAsync(cleanedText, _keywordStore, ct);
        if (hardCheck.HasViolation)
        {
            result.IsPassed = false;
            result.BlockReason = hardCheck.Reason;
            result.DetectedViolations.Add($"[Vi phạm quy chuẩn] {hardCheck.ViolationCategory}: {hardCheck.Reason}");
            result.RecommendedStatus = ReviewStatus.Hidden;

            _logger.LogWarning("Đánh giá bị chặn do vi phạm quy chuẩn cứng: {Reason}", hardCheck.Reason);
            return result;
        }

        var aiResult = await CallPhoBertServiceAsync(cleanedText, ct);
        var isSarcastic = false;

        if (aiResult.Succeeded)
        {
            if (aiResult.IsToxic)
            {
                result.IsPassed = false;
                result.BlockReason = aiResult.ToxicityReason ?? "Nội dung vi phạm tiêu chuẩn cộng đồng do có tính chất lăng mạ hoặc thù địch (Kiểm duyệt bởi AI ViHSD).";
                result.RecommendedStatus = ReviewStatus.Hidden;
                result.DetectedViolations.Add($"[ViHSD AI] {aiResult.ToxicityLabel} ({aiResult.ToxicityScore:P0}): {aiResult.ToxicityReason}");
                _logger.LogWarning("AI ViHSD phát hiện nội dung độc hại: Label={Label}, Score={Score}", aiResult.ToxicityLabel, aiResult.ToxicityScore);
                return result;
            }

            result.SentimentScore = aiResult.Score;
            result.DetectedViolations.Add($"[PhoBERT AI] Nhãn: {aiResult.Label}, Độ tin cậy: {aiResult.Confidence:P0}, Điểm: {aiResult.Score:+0.00;-0.00}");

            if (aiResult.IsSarcastic)
            {
                isSarcastic = true;
                result.IsSarcastic = true;
                result.SarcasmReason = aiResult.SarcasmReason ?? "Phát hiện châm biếm / mỉa mai qua mạng nơ-ron sâu.";
                if (result.SentimentScore > 0)
                {
                    result.SentimentScore = -0.85;
                }
                result.DetectedViolations.Add("[Phát hiện Châm biếm / Mỉa mai]");
            }
        }
        else
        {
            result.SentimentScore = 0.0;
            result.NeedsAdminReview = true;
            result.RecommendedStatus = ReviewStatus.PendingReview;
            result.ModerationReason = "Nghi vấn lệch sao hoặc nội dung cần kiểm duyệt thủ công.";
            result.DetectedViolations.Add("[Hàng chờ AI Thẩm định]");
            return result;
        }

        if (result.SentimentScore >= 0.45 && rating <= 2)
        {
            result.IsInconsistent = true;
            result.NeedsAdminReview = true;
            result.RecommendedStatus = ReviewStatus.PendingReview;
            result.ModerationReason = $"Nghi vấn lệch sao: Nội dung khen ngợi (+{result.SentimentScore:F2}) nhưng chỉ đánh giá {rating} sao.";
            _logger.LogInformation("Phát hiện đánh giá lệch sao (Khen nhưng {Rating} sao): Score={Score}", rating, result.SentimentScore);
        }
        else if (result.SentimentScore <= -0.35 && rating >= 4)
        {
            result.IsInconsistent = true;
            result.NeedsAdminReview = true;
            result.RecommendedStatus = ReviewStatus.PendingReview;
            result.ModerationReason = $"Nghi vấn lệch sao: Nội dung phản ánh chưa hài lòng ({result.SentimentScore:F2}) nhưng đánh giá {rating} sao.";
            _logger.LogInformation("Phát hiện đánh giá lệch sao (Chê nhưng {Rating} sao): Score={Score}", rating, result.SentimentScore);
        }
        else if (isSarcastic && rating >= 4)
        {
            result.IsInconsistent = true;
            result.NeedsAdminReview = true;
            result.RecommendedStatus = ReviewStatus.PendingReview;
            result.ModerationReason = $"Nghi vấn châm biếm/mỉa mai ({result.SentimentScore:F2}) nhưng đánh giá {rating} sao.";
            _logger.LogInformation("Phát hiện châm biếm mỉa mai: Rating={Rating}", rating);
        }
        else
        {
            result.RecommendedStatus = ReviewStatus.Active;
        }

        return result;
    }

    public async Task<TextModerationResult> ModerateCommentAsync(string content, CancellationToken ct = default)
    {
        var result = new TextModerationResult();

        var cleanedText = TextPreprocessor.Preprocess(content);
        result.CleanedText = cleanedText;

        if (string.IsNullOrWhiteSpace(cleanedText))
        {
            result.IsPassed = false;
            result.BlockReason = "Nội dung bình luận không được để trống.";
            return result;
        }

        var hardCheck = await HardContentFilter.CheckAsync(cleanedText, _keywordStore, ct);
        if (hardCheck.HasViolation)
        {
            result.IsPassed = false;
            result.BlockReason = hardCheck.Reason;
            result.RecommendedStatus = ReviewStatus.Hidden;
            return result;
        }

        var aiResult = await CallPhoBertServiceAsync(cleanedText, ct);
        if (aiResult.Succeeded)
        {
            if (aiResult.IsToxic)
            {
                result.IsPassed = false;
                result.BlockReason = aiResult.ToxicityReason ?? "Bình luận vi phạm tiêu chuẩn cộng đồng do có tính chất lăng mạ hoặc thù địch (Kiểm duyệt bởi AI ViHSD).";
                result.RecommendedStatus = ReviewStatus.Hidden;
                result.DetectedViolations.Add($"[ViHSD AI] {aiResult.ToxicityLabel} ({aiResult.ToxicityScore:P0}): {aiResult.ToxicityReason}");
                _logger.LogWarning("Bình luận bị chặn bởi AI ViHSD: Label={Label}, Score={Score}", aiResult.ToxicityLabel, aiResult.ToxicityScore);
                return result;
            }

            result.SentimentScore = aiResult.Score;
            result.DetectedViolations.Add($"[PhoBERT AI] {aiResult.Label} ({aiResult.Score:+0.00;-0.00})");
        }
        else
        {
            result.SentimentScore = 0.0;
        }

        result.RecommendedStatus = ReviewStatus.Active;
        return result;
    }

    private async Task<(double Score, string Label, double Confidence, bool IsToxic, string ToxicityLabel, double ToxicityScore, string? ToxicityReason, bool IsSarcastic, string? SarcasmReason, bool Succeeded)> CallPhoBertServiceAsync(string text, CancellationToken ct)
    {
        if (!_sentimentServiceEnabled || string.IsNullOrWhiteSpace(_sentimentServiceUrl))
        {
            return (0.0, "NEU", 0.0, false, "CLEAN", 0.0, null, false, null, false);
        }

        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeSpan.FromSeconds(7.5));

            var payload = JsonSerializer.Serialize(new { text });
            using var stringContent = new StringContent(payload, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(_sentimentServiceUrl, stringContent, cts.Token);
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync(cts.Token);
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                var score = root.GetProperty("score").GetDouble();
                var label = root.GetProperty("label").GetString() ?? "NEU";
                var confidence = root.GetProperty("confidence").GetDouble();

                var isToxic = root.TryGetProperty("is_toxic", out var toxicProp) && toxicProp.GetBoolean();
                var toxicityLabel = root.TryGetProperty("toxicity_label", out var toxLblProp) ? toxLblProp.GetString() ?? "CLEAN" : "CLEAN";
                var toxicityScore = root.TryGetProperty("toxicity_score", out var toxScProp) ? toxScProp.GetDouble() : 0.0;
                var toxicityReason = root.TryGetProperty("toxicity_reason", out var toxReaProp) && toxReaProp.ValueKind == JsonValueKind.String ? toxReaProp.GetString() : null;

                var isSarcastic = root.TryGetProperty("is_sarcastic", out var sarcProp) && sarcProp.GetBoolean();
                var sarcasmReason = root.TryGetProperty("sarcasm_reason", out var sarcReaProp) && sarcReaProp.ValueKind == JsonValueKind.String ? sarcReaProp.GetString() : null;

                return (score, label, confidence, isToxic, toxicityLabel, toxicityScore, toxicityReason, isSarcastic, sarcasmReason, true);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Không thể kết nối tới PhoBERT Dual-AI Service ({Url}): {Message}. Chuyển trạng thái sang Hàng chờ kiểm duyệt bất đồng bộ.", _sentimentServiceUrl, ex.Message);
        }

        return (0.0, "NEU", 0.0, false, "CLEAN", 0.0, null, false, null, false);
    }
}
