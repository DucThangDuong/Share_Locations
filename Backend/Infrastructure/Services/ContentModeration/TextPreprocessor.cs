using System.Text;
using System.Text.RegularExpressions;

namespace Infrastructure.Services.ContentModeration;

public static class TextPreprocessor
{
    private static readonly Regex ZeroWidthRegex = new(@"[\u200B-\u200D\uFEFF\u00A0]", RegexOptions.Compiled);

    private static readonly Regex ObfuscationSymbolRegex = new(@"(?<=\p{L})[\.\-_\*~^#@/\\]+(?=\p{L})", RegexOptions.Compiled);

    private static readonly Regex MultiWhitespaceRegex = new(@"\s+", RegexOptions.Compiled);

    public static string Preprocess(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return string.Empty;

        var cleaned = ZeroWidthRegex.Replace(text, "");

        cleaned = cleaned.Normalize(NormalizationForm.FormC).Trim();

        cleaned = ObfuscationSymbolRegex.Replace(cleaned, "");

        cleaned = MultiWhitespaceRegex.Replace(cleaned, " ");

        return cleaned.Trim();
    }

    public static string CollapseRepeatedChars(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return string.Empty;

        return Regex.Replace(text, @"(.)\1{2,}", "$1", RegexOptions.Compiled);
    }
}
