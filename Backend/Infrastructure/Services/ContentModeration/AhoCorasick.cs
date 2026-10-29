using System.Collections.Concurrent;

namespace Infrastructure.Services.ContentModeration;

/// <summary>
/// Kết quả phát hiện từ khóa khớp từ thuật toán Aho-Corasick
/// </summary>
public record AhoCorasickMatch(string Keyword, string Category, int Index, int Length);

/// <summary>
/// Thuật toán Aho-Corasick Automaton (Multi-Pattern String Matching)
/// Chuẩn công nghiệp được các hệ thống IDS/DFA (như Snort, Cloudflare, TikTok) sử dụng
/// để quét đồng thời hàng chục ngàn từ khóa trong một lần duyệt O(N + M).
/// </summary>
public class AhoCorasick
{
    private class Node
    {
        public ConcurrentDictionary<char, Node> Children { get; } = new();
        public Node? Failure { get; set; }
        public List<(string Keyword, string Category)> Outputs { get; } = new();
    }

    private readonly Node _root = new();

    public AhoCorasick(IEnumerable<(string Keyword, string Category)> patterns)
    {
        BuildTrie(patterns);
        BuildFailureLinks();
    }

    private void BuildTrie(IEnumerable<(string Keyword, string Category)> patterns)
    {
        foreach (var (rawKeyword, category) in patterns)
        {
            if (string.IsNullOrWhiteSpace(rawKeyword)) continue;
            var keyword = rawKeyword.Trim().ToLowerInvariant();

            var current = _root;
            foreach (var ch in keyword)
            {
                current = current.Children.GetOrAdd(ch, _ => new Node());
            }
            current.Outputs.Add((keyword, category));
        }
    }

    private void BuildFailureLinks()
    {
        var queue = new Queue<Node>();

        // Thiết lập liên kết thất bại (Failure links) cho độ sâu 1
        foreach (var child in _root.Children.Values)
        {
            child.Failure = _root;
            queue.Enqueue(child);
        }

        // BFS duyệt cây xây dựng failure link cho toàn bộ Automaton
        while (queue.Count > 0)
        {
            var current = queue.Dequeue();

            foreach (var (ch, child) in current.Children)
            {
                var failure = current.Failure;
                while (failure != null && !failure.Children.ContainsKey(ch))
                {
                    failure = failure.Failure;
                }

                child.Failure = failure?.Children.GetValueOrDefault(ch) ?? _root;

                // Kế thừa các kết quả khớp từ failure node
                if (child.Failure.Outputs.Count > 0)
                {
                    child.Outputs.AddRange(child.Failure.Outputs);
                }

                queue.Enqueue(child);
            }
        }
    }

    /// <summary>
    /// Quét văn bản với độ phức tạp tuyến tính O(N + M)
    /// </summary>
    public List<AhoCorasickMatch> SearchAll(string text)
    {
        var matches = new List<AhoCorasickMatch>();
        if (string.IsNullOrWhiteSpace(text)) return matches;

        var normalized = text.ToLowerInvariant();
        var current = _root;

        for (var i = 0; i < normalized.Length; i++)
        {
            var ch = normalized[i];

            while (current != _root && !current.Children.ContainsKey(ch))
            {
                current = current.Failure ?? _root;
            }

            if (current.Children.TryGetValue(ch, out var next))
            {
                current = next;
            }
            else
            {
                current = _root;
            }

            if (current.Outputs.Count > 0)
            {
                foreach (var (kw, cat) in current.Outputs)
                {
                    var startIndex = i - kw.Length + 1;

                    // Kiểm tra ranh giới từ (Word boundary) để không bắt nhầm các từ có chứa chuỗi con
                    // Ví dụ: tránh bắt nhầm "lan can", "giao diện", "duyệt" khi quét từ cấm
                    if (IsWordBoundary(normalized, startIndex, kw.Length))
                    {
                        matches.Add(new AhoCorasickMatch(kw, cat, startIndex, kw.Length));
                    }
                }
            }
        }

        return matches;
    }

    private static bool IsWordBoundary(string text, int startIndex, int length)
    {
        // Ký tự trước từ
        if (startIndex > 0)
        {
            var prevChar = text[startIndex - 1];
            if (char.IsLetterOrDigit(prevChar)) return false;
        }

        // Ký tự sau từ
        var endIndex = startIndex + length;
        if (endIndex < text.Length)
        {
            var nextChar = text[endIndex];
            if (char.IsLetterOrDigit(nextChar)) return false;
        }

        return true;
    }
}
