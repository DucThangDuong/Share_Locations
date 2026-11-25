using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace Application.Common;

public static class BlogContentValidator
{
    public static string? ValidateSubmission(
        string? title,
        string? excerpt,
        string? coverImageUrl,
        string? contentRaw,
        int? categoryId,
        bool requireCategory = true)
    {
        var trimmedCover = coverImageUrl?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(trimmedCover))
        {
            return "Vui lòng chọn hoặc tải lên ảnh bìa cho bài viết cẩm nang trước khi gửi duyệt.";
        }

        var trimmedTitle = NormalizeSpaces(title);
        var titleWords = SplitWords(trimmedTitle);
        if (string.Equals(trimmedTitle, "Bản nháp chưa đặt tên", StringComparison.OrdinalIgnoreCase) ||
            trimmedTitle.Length < 10 ||
            titleWords.Length < 2)
        {
            return "Tiêu đề cẩm nang phải có ít nhất 10 ký tự và tối thiểu 2 từ.";
        }

        if (trimmedTitle.Length > 255)
        {
            return "Tiêu đề cẩm nang không được vượt quá 255 ký tự.";
        }

        var trimmedExcerpt = NormalizeSpaces(excerpt);
        var excerptWords = SplitWords(trimmedExcerpt);
        if (string.IsNullOrWhiteSpace(trimmedExcerpt) || trimmedExcerpt.Length < 20 || excerptWords.Length < 4)
        {
            return "Nội dung tóm tắt cẩm nang là bắt buộc (tối thiểu 20 ký tự và ít nhất 4 từ).";
        }

        if (trimmedExcerpt.Length > 1000)
        {
            return "Nội dung tóm tắt cẩm nang không được vượt quá 1000 ký tự.";
        }

        if (string.Equals(trimmedExcerpt, trimmedTitle, StringComparison.OrdinalIgnoreCase))
        {
            return "Nội dung tóm tắt không được sao chép nguyên tiêu đề bài viết.";
        }

        if (requireCategory && (!categoryId.HasValue || categoryId.Value <= 0))
        {
            return "Vui lòng chọn danh mục cho bài viết cẩm nang.";
        }

        var plainText = ExtractPlainText(contentRaw);
        var bodyWords = SplitWords(plainText);
        if (plainText.Length < 50 || bodyWords.Length < 10)
        {
            return "Nội dung chi tiết cẩm nang quá ngắn (yêu cầu tối thiểu 50 ký tự và ít nhất 10 từ).";
        }

        return null;
    }

    public static string ExtractPlainText(string? contentRaw)
    {
        if (string.IsNullOrWhiteSpace(contentRaw))
        {
            return string.Empty;
        }

        var trimmed = contentRaw.Trim();
        if (trimmed == "{}" || trimmed == "[]")
        {
            return string.Empty;
        }

        if (trimmed.StartsWith('{') || trimmed.StartsWith('['))
        {
            try
            {
                using var doc = JsonDocument.Parse(trimmed);
                var sb = new StringBuilder();
                AppendJsonText(doc.RootElement, sb);
                return NormalizeSpaces(sb.ToString());
            }
            catch (JsonException)
            {
            }
        }

        var decoded = WebUtility.HtmlDecode(trimmed);
        var withoutTags = Regex.Replace(decoded, "<[^>]+>", " ");
        return NormalizeSpaces(withoutTags);
    }

    private static void AppendJsonText(JsonElement element, StringBuilder sb)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                if (element.TryGetProperty("text", out var textProp) && textProp.ValueKind == JsonValueKind.String)
                {
                    sb.Append(textProp.GetString());
                    sb.Append(' ');
                }
                else if (element.TryGetProperty("insert", out var insertProp) && insertProp.ValueKind == JsonValueKind.String)
                {
                    sb.Append(insertProp.GetString());
                    sb.Append(' ');
                }

                if (element.TryGetProperty("content", out var contentProp))
                {
                    AppendJsonText(contentProp, sb);
                    sb.Append(' ');
                }

                if (element.TryGetProperty("ops", out var opsProp))
                {
                    AppendJsonText(opsProp, sb);
                    sb.Append(' ');
                }
                break;

            case JsonValueKind.Array:
                foreach (var item in element.EnumerateArray())
                {
                    AppendJsonText(item, sb);
                }
                break;
        }
    }

    private static string NormalizeSpaces(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return string.Empty;
        }
        return Regex.Replace(input.Trim(), @"\s+", " ");
    }

    private static string[] SplitWords(string normalizedText)
    {
        if (string.IsNullOrWhiteSpace(normalizedText))
        {
            return Array.Empty<string>();
        }
        return normalizedText.Split(' ', StringSplitOptions.RemoveEmptyEntries);
    }
}
