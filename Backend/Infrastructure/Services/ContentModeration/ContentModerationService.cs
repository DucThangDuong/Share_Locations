using System.Text;
using System.Text.Json;
using Application.Common.Interfaces;
using Domain.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services.ContentModeration;

/// <summary>
/// Dịch vụ Kiểm duyệt nội dung & Phân tích cảm xúc chuẩn Enterprise thông minh đa tầng:
/// - Tầng 1: Tiền xử lý văn bản tiếng Việt & Chuẩn hóa Unicode dựng sẵn (TextPreprocessor)
/// - Tầng 2: Quét từ cấm & Spam động qua Redis kết hợp Thuật toán Aho-Corasick Automaton O(N+M) dưới 0.1ms (HardContentFilter)
/// - Tầng 3 (AI Đỉnh cao): Phân tích ngữ nghĩa siêu thông minh với Google Gemini 1.5 Flash (nhận diện mỉa mai, khen đểu, ngữ cảnh tiếng lóng, spam tinh vi)
/// - Tầng 4 (Học sâu cục bộ): Fallback tự động sang Mô hình PhoBERT Titan 1536-D Dual-Pooled + ViHSD Hate Speech + MLP Neural Sarcasm Head
/// - Tầng 5: Đối sánh Cảm xúc vs Số sao (Rating Inconsistency) & Cơ chế Hàng chờ thẩm định AI bất đồng bộ (PendingReview)
/// </summary>
public class ContentModerationService : IContentModerationService
{
    private readonly ILogger<ContentModerationService> _logger;
    private readonly HttpClient _httpClient;
    private readonly IModerationKeywordStore _keywordStore;
    private readonly string _sentimentServiceUrl;
    private readonly bool _sentimentServiceEnabled;
    private readonly string? _geminiApiKey;
    private readonly string _geminiModel;
    private readonly bool _geminiEnabled;

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

        _geminiApiKey = configuration["Gemini:ApiKey"] 
            ?? configuration["AI:GeminiApiKey"] 
            ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");
        _geminiModel = configuration["Gemini:Model"] ?? "gemini-1.5-flash";
        _geminiEnabled = configuration.GetValue<bool>("Gemini:Enabled", !string.IsNullOrWhiteSpace(_geminiApiKey));
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

        // -------------------------------------------------------------
        // Bước 1: Tiền xử lý Text (Khử khoảng trắng thừa, chuẩn hóa ký tự)
        // -------------------------------------------------------------
        var cleanedText = TextPreprocessor.Preprocess(content);
        result.CleanedText = cleanedText;

        if (string.IsNullOrWhiteSpace(cleanedText))
        {
            result.IsPassed = true;
            result.SentimentScore = 0.0;
            result.RecommendedStatus = ReviewStatus.Active;
            return result;
        }

        // -------------------------------------------------------------
        // Bước 2: Lọc vi phạm cứng & Spam tốc độ cao (Aho-Corasick Automaton O(N+M) từ Redis)
        // -------------------------------------------------------------
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

        // -------------------------------------------------------------
        // Bước 3: Kiểm duyệt ngữ nghĩa thông minh tầng cao bằng Google Gemini 1.5 Flash (nếu được kích hoạt)
        // -------------------------------------------------------------
        if (_geminiEnabled && !string.IsNullOrWhiteSpace(_geminiApiKey))
        {
            var geminiResult = await CallGeminiReviewModerationAsync(cleanedText, rating, ct);
            if (geminiResult != null)
            {
                result.SentimentScore = geminiResult.SentimentScore;
                result.IsSarcastic = geminiResult.IsSarcastic;
                result.SarcasmReason = geminiResult.SarcasmReason;
                result.IsInconsistent = geminiResult.IsInconsistent;

                if (!geminiResult.IsPassed)
                {
                    result.IsPassed = false;
                    result.BlockReason = geminiResult.BlockReason ?? "Nội dung vi phạm tiêu chuẩn cộng đồng.";
                    result.RecommendedStatus = ReviewStatus.Hidden;
                    result.DetectedViolations.Add($"[Gemini AI Chặn] {geminiResult.BlockReason}");
                    _logger.LogWarning("Đánh giá bị Gemini AI chặn: {Reason}", geminiResult.BlockReason);
                    return result;
                }

                if (geminiResult.RecommendedStatus == ReviewStatus.PendingReview || geminiResult.IsInconsistent || geminiResult.IsSarcastic)
                {
                    result.NeedsAdminReview = true;
                    result.RecommendedStatus = ReviewStatus.PendingReview;
                    result.ModerationReason = geminiResult.ModerationReason 
                        ?? (geminiResult.IsSarcastic ? $"Nghi vấn mỉa mai: {geminiResult.SarcasmReason}" : "Nghi vấn lệch sao giữa nội dung và số điểm.");
                    result.DetectedViolations.Add($"[Gemini AI Gắn cờ] {result.ModerationReason}");
                    _logger.LogInformation("Gemini AI gắn cờ bài đánh giá vào hàng chờ kiểm duyệt: {Reason}", result.ModerationReason);
                    return result;
                }

                result.RecommendedStatus = ReviewStatus.Active;
                result.DetectedViolations.Add($"[Gemini AI] Cảm xúc: {geminiResult.SentimentLabel} ({geminiResult.SentimentScore:+0.00;-0.00})");
                return result;
            }
        }

        // -------------------------------------------------------------
        // Bước 4: Fallback Mô hình PhoBERT Titan 1536-D Dual-Pooled + ViHSD Toxicity + Neural Sarcasm Head
        // -------------------------------------------------------------
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
            // Circuit Breaker: Khi AI Service bận hoặc không kết nối được, chuyển vào hàng chờ kiểm duyệt an toàn
            result.SentimentScore = 0.0;
            result.NeedsAdminReview = true;
            result.RecommendedStatus = ReviewStatus.PendingReview;
            result.ModerationReason = "Nghi vấn lệch sao hoặc nội dung cần kiểm duyệt thủ công.";
            result.DetectedViolations.Add("[Hàng chờ AI Thẩm định]");
            return result;
        }

        // -------------------------------------------------------------
        // Bước 5: So khớp Cảm xúc vs Số sao (Star Inconsistency Check)
        // -------------------------------------------------------------
        // TH1: Khen ngợi tích cực (Sentiment >= 0.45) nhưng vote sao quá thấp (<= 2 sao)
        if (result.SentimentScore >= 0.45 && rating <= 2)
        {
            result.IsInconsistent = true;
            result.NeedsAdminReview = true;
            result.RecommendedStatus = ReviewStatus.PendingReview;
            result.ModerationReason = $"Nghi vấn lệch sao: Nội dung khen ngợi (+{result.SentimentScore:F2}) nhưng chỉ đánh giá {rating} sao.";
            _logger.LogInformation("Phát hiện đánh giá lệch sao (Khen nhưng {Rating} sao): Score={Score}", rating, result.SentimentScore);
        }
        // TH2: Chê bai tiêu cực (Sentiment <= -0.35) nhưng vote sao cao (>= 4 sao)
        else if (result.SentimentScore <= -0.35 && rating >= 4)
        {
            result.IsInconsistent = true;
            result.NeedsAdminReview = true;
            result.RecommendedStatus = ReviewStatus.PendingReview;
            result.ModerationReason = $"Nghi vấn lệch sao: Nội dung phản ánh chưa hài lòng ({result.SentimentScore:F2}) nhưng đánh giá {rating} sao.";
            _logger.LogInformation("Phát hiện đánh giá lệch sao (Chê nhưng {Rating} sao): Score={Score}", rating, result.SentimentScore);
        }
        // TH3: Mỉa mai / châm biếm kết hợp số sao cao (>= 4 sao)
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

        // Tầng Gemini AI cho Comment nếu có API Key
        if (_geminiEnabled && !string.IsNullOrWhiteSpace(_geminiApiKey))
        {
            var geminiResult = await CallGeminiCommentModerationAsync(cleanedText, ct);
            if (geminiResult != null)
            {
                result.SentimentScore = geminiResult.SentimentScore;
                if (!geminiResult.IsPassed)
                {
                    result.IsPassed = false;
                    result.BlockReason = geminiResult.BlockReason ?? "Bình luận vi phạm tiêu chuẩn cộng đồng.";
                    result.RecommendedStatus = ReviewStatus.Hidden;
                    return result;
                }

                result.RecommendedStatus = ReviewStatus.Active;
                return result;
            }
        }

        // Fallback sang PhoBERT + ViHSD
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

    /// <summary>
    /// Gọi Google Gemini 1.5 Flash API để phân tích ngữ nghĩa sâu, nhận diện mỉa mai, độ lệch sao và tính độc hại
    /// </summary>
    private async Task<GeminiModerationOutcome?> CallGeminiReviewModerationAsync(string text, byte rating, CancellationToken ct)
    {
        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeSpan.FromSeconds(5.5));

            var endpoint = $"https://generativelanguage.googleapis.com/v1beta/models/{_geminiModel}:generateContent?key={_geminiApiKey}";

            var systemPrompt = $$"""
            Bạn là hệ thống AI phân tích cảm xúc và kiểm duyệt nội dung đánh giá địa điểm du lịch & ẩm thực hàng đầu.
            Phân tích bài đánh giá của người dùng với xếp hạng: {{rating}} sao / 5 sao.
            Nội dung: "{{text}}"

            Quy tắc nghiệp vụ:
            1. Phát hiện vi phạm: từ ngữ thô tục, chửi thề tục tĩu, công kích cá nhân, xúc phạm, kỳ thị, quảng cáo cờ bạc, lừa đảo -> is_passed = false.
            2. Điểm cảm xúc (sentiment_score): từ -1.0 (rất tiêu cực) đến +1.0 (rất tích cực).
            3. Nhận diện mỉa mai, châm biếm, khen đểu (ví dụ: "đồ ăn tuyệt vời ăn xong đi viện", "quán 10 điểm trừ 9 điểm phục vụ") -> is_sarcastic = true.
            4. Kiểm tra mâu thuẫn lệch sao:
               - Nội dung khen tích cực (sentiment_score >= 0.45) nhưng vote <= 2 sao -> is_inconsistent = true.
               - Nội dung chê tiêu cực (sentiment_score <= -0.35) nhưng vote >= 4 sao -> is_inconsistent = true.
               - Nội dung mỉa mai châm biếm nhưng vote >= 4 sao -> is_inconsistent = true.
            5. Nếu vi phạm thô tục -> recommended_status = "Hidden".
            6. Nếu lệch sao hoặc mỉa mai -> recommended_status = "PendingReview".
            7. Nếu bình thường hợp lệ -> recommended_status = "Active".

            BẮT BUỘC trả về định dạng JSON thuần túy theo schema:
            {
              "is_passed": boolean,
              "block_reason": string or null,
              "sentiment_score": float,
              "sentiment_label": "POS" | "NEG" | "NEU",
              "is_sarcastic": boolean,
              "sarcasm_reason": string or null,
              "is_inconsistent": boolean,
              "recommended_status": "Active" | "Hidden" | "PendingReview",
              "moderation_reason": string or null
            }
            """;

            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = systemPrompt }
                        }
                    }
                },
                generationConfig = new
                {
                    temperature = 0.1,
                    responseMimeType = "application/json"
                }
            };

            var payloadJson = JsonSerializer.Serialize(requestBody);
            using var requestContent = new StringContent(payloadJson, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(endpoint, requestContent, cts.Token);
            if (response.IsSuccessStatusCode)
            {
                var responseJson = await response.Content.ReadAsStringAsync(cts.Token);
                using var doc = JsonDocument.Parse(responseJson);
                var candidates = doc.RootElement.GetProperty("candidates");
                if (candidates.GetArrayLength() > 0)
                {
                    var textPart = candidates[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString();
                    if (!string.IsNullOrWhiteSpace(textPart))
                    {
                        using var innerDoc = JsonDocument.Parse(textPart);
                        var root = innerDoc.RootElement;

                        var outcome = new GeminiModerationOutcome
                        {
                            IsPassed = root.TryGetProperty("is_passed", out var p) && p.GetBoolean(),
                            BlockReason = root.TryGetProperty("block_reason", out var br) && br.ValueKind == JsonValueKind.String ? br.GetString() : null,
                            SentimentScore = root.TryGetProperty("sentiment_score", out var sc) ? sc.GetDouble() : 0.0,
                            SentimentLabel = root.TryGetProperty("sentiment_label", out var sl) ? sl.GetString() ?? "NEU" : "NEU",
                            IsSarcastic = root.TryGetProperty("is_sarcastic", out var sarc) && sarc.GetBoolean(),
                            SarcasmReason = root.TryGetProperty("sarcasm_reason", out var sr) && sr.ValueKind == JsonValueKind.String ? sr.GetString() : null,
                            IsInconsistent = root.TryGetProperty("is_inconsistent", out var inc) && inc.GetBoolean(),
                            ModerationReason = root.TryGetProperty("moderation_reason", out var mr) && mr.ValueKind == JsonValueKind.String ? mr.GetString() : null
                        };

                        var statusStr = root.TryGetProperty("recommended_status", out var rs) ? rs.GetString() : "Active";
                        outcome.RecommendedStatus = statusStr switch
                        {
                            "Hidden" => ReviewStatus.Hidden,
                            "PendingReview" => ReviewStatus.PendingReview,
                            _ => ReviewStatus.Active
                        };

                        return outcome;
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Gemini AI API Moderation không khả dụng ({Message}). Tự động fallback sang PhoBERT Titan.", ex.Message);
        }

        return null;
    }

    private async Task<GeminiModerationOutcome?> CallGeminiCommentModerationAsync(string text, CancellationToken ct)
    {
        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeSpan.FromSeconds(4));

            var endpoint = $"https://generativelanguage.googleapis.com/v1beta/models/{_geminiModel}:generateContent?key={_geminiApiKey}";

            var systemPrompt = $$"""
            Kiểm tra bình luận tiếng Việt sau:
            "{{text}}"
            Quy tắc:
            - Từ ngữ thô tục, chửi thề tục tĩu, lăng mạ, quấy rối, spam quảng cáo cờ bạc/vay tiền -> is_passed = false, block_reason = "Lý do ngắn gọn".
            - Hợp lệ -> is_passed = true, block_reason = null.
            Trả về JSON:
            {"is_passed": boolean, "block_reason": string or null, "sentiment_score": float}
            """;

            var requestBody = new
            {
                contents = new[]
                {
                    new { parts = new[] { new { text = systemPrompt } } }
                },
                generationConfig = new
                {
                    temperature = 0.1,
                    responseMimeType = "application/json"
                }
            };

            var payloadJson = JsonSerializer.Serialize(requestBody);
            using var requestContent = new StringContent(payloadJson, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(endpoint, requestContent, cts.Token);
            if (response.IsSuccessStatusCode)
            {
                var responseJson = await response.Content.ReadAsStringAsync(cts.Token);
                using var doc = JsonDocument.Parse(responseJson);
                var textPart = doc.RootElement.GetProperty("candidates")[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString();
                if (!string.IsNullOrWhiteSpace(textPart))
                {
                    using var innerDoc = JsonDocument.Parse(textPart);
                    var root = innerDoc.RootElement;
                    return new GeminiModerationOutcome
                    {
                        IsPassed = root.TryGetProperty("is_passed", out var p) && p.GetBoolean(),
                        BlockReason = root.TryGetProperty("block_reason", out var br) && br.ValueKind == JsonValueKind.String ? br.GetString() : null,
                        SentimentScore = root.TryGetProperty("sentiment_score", out var sc) ? sc.GetDouble() : 0.0,
                        RecommendedStatus = ReviewStatus.Active
                    };
                }
            }
        }
        catch
        {
        }

        return null;
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

    private sealed class GeminiModerationOutcome
    {
        public bool IsPassed { get; set; } = true;
        public string? BlockReason { get; set; }
        public double SentimentScore { get; set; }
        public string SentimentLabel { get; set; } = "NEU";
        public bool IsSarcastic { get; set; }
        public string? SarcasmReason { get; set; }
        public bool IsInconsistent { get; set; }
        public ReviewStatus RecommendedStatus { get; set; } = ReviewStatus.Active;
        public string? ModerationReason { get; set; }
    }
}
