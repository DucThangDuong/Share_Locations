using System.Text.RegularExpressions;
using Application.Common.Interfaces;

namespace Infrastructure.Services.ContentModeration;

public class HardFilterViolationResult
{
    public bool HasViolation { get; set; }
    public string? Reason { get; set; }
    public string? ViolationCategory { get; set; }
}

/// <summary>
/// Bộ lọc quy chuẩn cứng & Spam đa tầng:
/// 1. Tầng đối sánh từ khóa động: Thuật toán Aho-Corasick Automaton lấy từ kho Redis Sets O(N+M)
/// 2. Tầng nhận diện mẫu cấu trúc: Regex chuyên biệt phát hiện URL, Số điện thoại Việt Nam, Gõ phím bừa
/// </summary>
public static class HardContentFilter
{
    // 1. Regex phát hiện URL / liên kết web
    private static readonly Regex UrlRegex = new(
        @"(?i)(https?:\/\/[^\s]+|www\.[^\s]+|\b[\w\.-]+\.(?:com|vn|com\.vn|net|org|xyz|info|top|online|vip|shop|site|biz|club|cc|me|app)\b(?:\/[^\s]*)?)",
        RegexOptions.Compiled);

    // 2. Regex phát hiện số điện thoại (Việt Nam 10-11 số, kể cả viết cách hay gạch nối)
    private static readonly Regex PhoneRegex = new(
        @"(?i)(?:\+?84|0)(?:3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[\s\.\-]*\d{3}[\s\.\-]*\d{3,4}\b",
        RegexOptions.Compiled);

    // 3. Danh sách các mẫu gõ bàn phím bừa vô nghĩa (Keyboard mash)
    private static readonly string[] KeyboardMashes = new[]
    {
        "asdfgh", "qwerty", "zxcvbn", "hjkl;", "ghjkl", "123456", "abcdef"
    };

    // Aho-Corasick Automaton rỗng dự phòng (khi chưa cấu hình Redis hoặc chưa nạp từ khóa)
    private static readonly AhoCorasick EmptyAutomaton = new(Enumerable.Empty<(string, string)>());

    /// <summary>
    /// Kiểm tra vi phạm cứng không đồng bộ với Redis Keyword Store qua Thuật toán Aho-Corasick
    /// </summary>
    public static async Task<HardFilterViolationResult> CheckAsync(
        string text,
        IModerationKeywordStore? keywordStore = null,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return new HardFilterViolationResult
            {
                HasViolation = true,
                Reason = "Nội dung không được để trống.",
                ViolationCategory = "EmptyContent"
            };
        }

        // 1. Quét từ cấm và từ khóa spam bằng Thuật toán Aho-Corasick Automaton từ Redis
        AhoCorasick automaton;
        if (keywordStore != null)
        {
            automaton = (AhoCorasick)await keywordStore.GetCompiledAutomatonAsync(ct);
        }
        else
        {
            automaton = EmptyAutomaton;
        }

        var matches = automaton.SearchAll(text);
        if (matches.Count > 0)
        {
            var first = matches[0];
            return new HardFilterViolationResult
            {
                HasViolation = true,
                Reason = first.Category == "Profanity"
                    ? "Nội dung của bạn chứa từ ngữ thô tục hoặc không phù hợp với tiêu chuẩn cộng đồng."
                    : "Nội dung bị nghi ngờ là tin nhắn quảng cáo hoặc thương mại không hợp lệ.",
                ViolationCategory = first.Category
            };
        }

        // 2. Kiểm tra Regex đường dẫn URL quảng cáo
        if (UrlRegex.IsMatch(text))
        {
            return new HardFilterViolationResult
            {
                HasViolation = true,
                Reason = "Nội dung không được chứa liên kết website hoặc đường link quảng cáo.",
                ViolationCategory = "UrlSpam"
            };
        }

        // 3. Kiểm tra Regex số điện thoại liên hệ / bán hàng
        if (PhoneRegex.IsMatch(text))
        {
            return new HardFilterViolationResult
            {
                HasViolation = true,
                Reason = "Nội dung không được chia sẻ số điện thoại cá nhân hoặc số bán hàng quảng cáo.",
                ViolationCategory = "PhoneSpam"
            };
        }

        // 4. Kiểm tra gõ phím bừa (keyboard mash)
        var lower = text.ToLowerInvariant();
        foreach (var mash in KeyboardMashes)
        {
            if (lower.Contains(mash))
            {
                return new HardFilterViolationResult
                {
                    HasViolation = true,
                    Reason = "Nội dung có dấu hiệu gõ phím bừa vô nghĩa.",
                    ViolationCategory = "KeyboardMash"
                };
            }
        }

        // 5. Kiểm tra độ đa dạng ký tự (Character Diversity)
        if (text.Length >= 15)
        {
            var distinctCount = text.Where(char.IsLetterOrDigit).Distinct().Count();
            if (distinctCount <= 3)
            {
                return new HardFilterViolationResult
                {
                    HasViolation = true,
                    Reason = "Nội dung có độ lặp ký tự quá cao hoặc không có nghĩa.",
                    ViolationCategory = "LowDiversitySpam"
                };
            }
        }

        return new HardFilterViolationResult { HasViolation = false };
    }

    /// <summary>
    /// Hàm kiểm tra đồng bộ hỗ trợ các vị trí chưa chuyển async
    /// </summary>
    public static HardFilterViolationResult Check(string text)
    {
        return CheckAsync(text, null).GetAwaiter().GetResult();
    }
}
