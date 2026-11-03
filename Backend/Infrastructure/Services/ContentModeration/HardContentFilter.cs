using System.Text.RegularExpressions;
using Application.Common.Interfaces;

namespace Infrastructure.Services.ContentModeration;

public class HardFilterViolationResult
{
    public bool HasViolation { get; set; }
    public string? Reason { get; set; }
    public string? ViolationCategory { get; set; }
}

public static class HardContentFilter
{
    private static readonly Regex UrlRegex = new(
        @"(?i)(https?:\/\/[^\s]+|www\.[^\s]+|\b[\w\.-]+\.(?:com|vn|com\.vn|net|org|xyz|info|top|online|vip|shop|site|biz|club|cc|me|app)\b(?:\/[^\s]*)?)",
        RegexOptions.Compiled);

    private static readonly Regex PhoneRegex = new(
        @"(?i)(?:\+?84|0)(?:3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[\s\.\-]*\d{3}[\s\.\-]*\d{3,4}\b",
        RegexOptions.Compiled);

    private static readonly string[] KeyboardMashes = new[]
    {
        "asdfgh", "qwerty", "zxcvbn", "hjkl;", "ghjkl", "123456", "abcdef"
    };

    private static readonly AhoCorasick EmptyAutomaton = new(Enumerable.Empty<(string, string)>());

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

        if (UrlRegex.IsMatch(text))
        {
            return new HardFilterViolationResult
            {
                HasViolation = true,
                Reason = "Nội dung không được chứa liên kết website hoặc đường link quảng cáo.",
                ViolationCategory = "UrlSpam"
            };
        }

        if (PhoneRegex.IsMatch(text))
        {
            return new HardFilterViolationResult
            {
                HasViolation = true,
                Reason = "Nội dung không được chia sẻ số điện thoại cá nhân hoặc số bán hàng quảng cáo.",
                ViolationCategory = "PhoneSpam"
            };
        }

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

    public static HardFilterViolationResult Check(string text)
    {
        return CheckAsync(text, null).GetAwaiter().GetResult();
    }
}
