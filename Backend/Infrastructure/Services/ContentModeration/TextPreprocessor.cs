using System.Text;
using System.Text.RegularExpressions;

namespace Infrastructure.Services.ContentModeration;

/// <summary>
/// Bộ chuẩn hóa đầu vào tiếng Việt (Input Normalization Engine)
/// Xử lý chuẩn hóa định dạng, khử các thủ thuật lách luật (ký tự ẩn, dấu phân cách, unicode phân rã)
/// Hoàn toàn tổng quát bằng thuật toán ký tự, KHÔNG hardcode bất kỳ từ ngữ cụ thể nào.
/// </summary>
public static class TextPreprocessor
{
    // 1. Khử ký tự ẩn zero-width (thủ thuật chèn byte ẩn lách bộ lọc: Zero-Width Space, Joiner, Non-Joiner, BOM)
    private static readonly Regex ZeroWidthRegex = new(@"[\u200B-\u200D\uFEFF\u00A0]", RegexOptions.Compiled);

    // 2. Khử dấu phân cách lách luật giữa các chữ cái (ví dụ: d.m -> dm, c.ặ.c -> cặc, v_c_l -> vcl, b-á-n -> bán)
    // Thuật toán: Nhận diện mọi ký hiệu phân cách xen giữa 2 ký tự chữ Unicode (\p{L}) và loại bỏ chúng
    private static readonly Regex ObfuscationSymbolRegex = new(@"(?<=\p{L})[\.\-_\*~^#@/\\]+(?=\p{L})", RegexOptions.Compiled);

    // 3. Chuẩn hóa khoảng trắng thừa, tab, ngắt dòng
    private static readonly Regex MultiWhitespaceRegex = new(@"\s+", RegexOptions.Compiled);

    /// <summary>
    /// Chuẩn hóa đầu vào để đối sánh với Redis và gửi sang mô hình AI
    /// </summary>
    public static string Preprocess(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return string.Empty;

        // Bước 1: Khử ký tự zero-width ẩn
        var cleaned = ZeroWidthRegex.Replace(text, "");

        // Bước 2: Chuẩn hóa Unicode dựng sẵn (Form C) để thống nhất bảng mã tiếng Việt
        cleaned = cleaned.Normalize(NormalizationForm.FormC).Trim();

        // Bước 3: Khử dấu phân cách lách luật xen kẽ giữa các ký tự
        cleaned = ObfuscationSymbolRegex.Replace(cleaned, "");

        // Bước 4: Thu gọn khoảng trắng thừa
        cleaned = MultiWhitespaceRegex.Replace(cleaned, " ");

        return cleaned.Trim();
    }

    /// <summary>
    /// Rút gọn các ký tự lặp kéo dài (ví dụ: 'ngonnnnn' -> 'ngon', 'dơơơơ' -> 'dơ')
    /// </summary>
    public static string CollapseRepeatedChars(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return string.Empty;

        // Giữ lại 1 ký tự đại diện cho các ký tự lặp liên tiếp từ 3 lần trở lên
        return Regex.Replace(text, @"(.)\1{2,}", "$1", RegexOptions.Compiled);
    }
}
