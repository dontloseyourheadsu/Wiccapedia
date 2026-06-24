using System.Text;
using System.Text.RegularExpressions;

namespace WiccapediaGrimoire.Utils;

public static class CssHelper
{
    public static string ScopeCss(int pageId, string? css)
    {
        if (string.IsNullOrWhiteSpace(css)) return string.Empty;

        var containerSelector = $".page-container-{pageId}";

        // Clean up CSS comments
        var cleanCss = Regex.Replace(css, @"/\*.*?\*/", string.Empty, RegexOptions.Singleline);

        // Check if there are braces. If not, treat the whole thing as properties on the page container.
        if (!cleanCss.Contains('{'))
        {
            return $"{containerSelector} {{ {cleanCss.Trim()} }}";
        }

        var sb = new StringBuilder();

        // Check if there are bare properties before the first '{'
        var firstBrace = cleanCss.IndexOf('{');
        if (firstBrace > 0)
        {
            var prefix = cleanCss[..firstBrace].Trim();
            // Verify if it contains property-like declarations
            if (prefix.Contains(':') && !prefix.Contains('}') && !prefix.Contains('{'))
            {
                sb.AppendLine($"{containerSelector} {{ {prefix} }}");
            }
        }

        // Match selector blocks: selector { properties }
        var matches = Regex.Matches(cleanCss, @"(?<selector>[^{]+)\{(?<properties>[^}]+)\}");
        foreach (Match match in matches)
        {
            var selector = match.Groups["selector"].Value.Trim();
            var properties = match.Groups["properties"].Value.Trim();

            var scopedSelectors = selector.Split(',')
                .Select(s =>
                {
                    var trimmed = s.Trim();
                    if (trimmed.Equals(":self", StringComparison.OrdinalIgnoreCase))
                    {
                        return containerSelector;
                    }
                    if (trimmed.StartsWith(":self", StringComparison.OrdinalIgnoreCase))
                    {
                        return containerSelector + trimmed[5..];
                    }
                    return $"{containerSelector} {trimmed}";
                });

            sb.AppendLine($"{string.Join(", ", scopedSelectors)} {{ {properties} }}");
        }

        return sb.ToString();
    }

    public static string GetBackgroundStyle(string? type, string? value)
    {
        if (string.IsNullOrWhiteSpace(type) || type.Equals("none", StringComparison.OrdinalIgnoreCase))
        {
            return string.Empty;
        }

        if (type.Equals("url", StringComparison.OrdinalIgnoreCase) || type.Equals("upload", StringComparison.OrdinalIgnoreCase))
        {
            return $"background-image: url('{value}'); background-size: cover; background-position: center; background-repeat: no-repeat;";
        }

        if (type.Equals("style", StringComparison.OrdinalIgnoreCase) || type.Equals("color", StringComparison.OrdinalIgnoreCase))
        {
            if (value != null && (value.Contains(':') || value.Contains(';')))
            {
                return value;
            }
            return $"background: {value};";
        }

        return string.Empty;
    }
}
