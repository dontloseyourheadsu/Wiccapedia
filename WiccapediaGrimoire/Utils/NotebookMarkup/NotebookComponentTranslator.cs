using System.Text.RegularExpressions;

namespace WiccapediaGrimoire.Utils.NotebookMarkup;

public static partial class NotebookComponentTranslator
{
    public static IReadOnlyList<NotebookComponentModel> Parse(string? markup)
    {
        var text = markup ?? string.Empty;
        var lines = text.Replace("\r\n", "\n").Split('\n');
        var components = new List<NotebookComponentModel>();
        var paragraphBuffer = new List<string>();

        void FlushParagraph()
        {
            if (paragraphBuffer.Count == 0)
            {
                return;
            }

            components.Add(NotebookComponentModel.Paragraph(string.Join("\n", paragraphBuffer)));
            paragraphBuffer.Clear();
        }

        for (var index = 0; index < lines.Length; index++)
        {
            var line = lines[index];
            var trimmed = line.Trim();

            if (string.IsNullOrWhiteSpace(trimmed))
            {
                FlushParagraph();
                continue;
            }

            var headingMatch = HeadingRegex().Match(line);
            if (headingMatch.Success)
            {
                FlushParagraph();
                var level = Math.Clamp(headingMatch.Groups[1].Value.Length, 1, 6);
                components.Add(NotebookComponentModel.Heading(headingMatch.Groups[2].Value.Trim(), level));
                continue;
            }

            var lottieMatch = LottieRegex().Match(trimmed);
            if (lottieMatch.Success)
            {
                FlushParagraph();
                components.Add(NotebookComponentModel.Lottie(lottieMatch.Groups[1].Value.Trim()));
                continue;
            }

            var imageMatch = ImageRegex().Match(trimmed);
            if (imageMatch.Success)
            {
                FlushParagraph();
                var alt = imageMatch.Groups[1].Value.Trim();
                var url = imageMatch.Groups[2].Value.Trim();
                var isGif = url.EndsWith(".gif", StringComparison.OrdinalIgnoreCase);
                components.Add(isGif
                    ? NotebookComponentModel.Gif(url, alt)
                    : NotebookComponentModel.Image(url, alt));
                continue;
            }

            var linkMatch = LinkRegex().Match(trimmed);
            if (linkMatch.Success)
            {
                FlushParagraph();
                components.Add(NotebookComponentModel.Link(linkMatch.Groups[1].Value.Trim(), linkMatch.Groups[2].Value.Trim()));
                continue;
            }

            if (trimmed.StartsWith("- ", StringComparison.Ordinal))
            {
                FlushParagraph();
                var items = new List<string>();

                while (index < lines.Length && lines[index].TrimStart().StartsWith("- ", StringComparison.Ordinal))
                {
                    items.Add(lines[index].TrimStart()[2..].Trim());
                    index++;
                }

                index--;
                components.Add(NotebookComponentModel.List(items));
                continue;
            }

            if (trimmed.Contains('|')
                && index + 1 < lines.Length
                && TableSeparatorRegex().IsMatch(lines[index + 1].Trim()))
            {
                FlushParagraph();
                var tableLines = new List<string> { line };
                index++;
                tableLines.Add(lines[index]);

                while (index + 1 < lines.Length && lines[index + 1].Contains('|'))
                {
                    index++;
                    tableLines.Add(lines[index]);
                }

                components.Add(NotebookComponentModel.Table(string.Join("\n", tableLines)));
                continue;
            }

            paragraphBuffer.Add(line);
        }

        FlushParagraph();

        return components.Count == 0
            ? [NotebookComponentModel.Paragraph(string.Empty)]
            : components;
    }

    public static string Serialize(IReadOnlyList<NotebookComponentModel> components)
    {
        if (components.Count == 0)
        {
            return string.Empty;
        }

        var parts = components.Select(ToMarkup).Where(part => !string.IsNullOrWhiteSpace(part));
        return string.Join("\n\n", parts);
    }

    public static string ToMarkup(NotebookComponentModel component)
    {
        return component.Type switch
        {
            NotebookComponentType.Heading => $"{new string('#', Math.Clamp(component.Level, 1, 6))} {component.Text}",
            NotebookComponentType.Paragraph => component.Text,
            NotebookComponentType.List => string.Join("\n", component.Items.Where(item => !string.IsNullOrWhiteSpace(item)).Select(item => $"- {item}")),
            NotebookComponentType.Table => component.TableRaw,
            NotebookComponentType.Image => $"![{component.Alt}]({component.Url})",
            NotebookComponentType.Gif => $"![{component.Alt}]({component.Url})",
            NotebookComponentType.Link => $"[{component.Text}]({component.Url})",
            NotebookComponentType.Lottie => $"\\{{lottie:{component.LottieSource}\\}}",
            _ => component.Text
        };
    }

    [GeneratedRegex("^(#{1,6})\\s+(.+)$")]
    private static partial Regex HeadingRegex();

    [GeneratedRegex("^!\\[(.*?)\\]\\((.*?)\\)$")]
    private static partial Regex ImageRegex();

    [GeneratedRegex("^\\[(.*?)\\]\\((.*?)\\)$")]
    private static partial Regex LinkRegex();

    [GeneratedRegex("^\\\\\\{lottie:(.+)\\}$", RegexOptions.IgnoreCase)]
    private static partial Regex LottieRegex();

    [GeneratedRegex("^\\|?[\\s:-|]+\\|?$")]
    private static partial Regex TableSeparatorRegex();
}

public enum NotebookComponentType
{
    Heading,
    Paragraph,
    List,
    Table,
    Image,
    Gif,
    Link,
    Lottie
}

public record NotebookComponentModel(
    NotebookComponentType Type,
    string Text,
    int Level,
    IReadOnlyList<string> Items,
    string TableRaw,
    string Url,
    string Alt,
    string LottieSource)
{
    public static NotebookComponentModel Heading(string text, int level)
        => new(NotebookComponentType.Heading, text, level, [], string.Empty, string.Empty, string.Empty, string.Empty);

    public static NotebookComponentModel Paragraph(string text)
        => new(NotebookComponentType.Paragraph, text, 2, [], string.Empty, string.Empty, string.Empty, string.Empty);

    public static NotebookComponentModel List(IReadOnlyList<string> items)
        => new(NotebookComponentType.List, string.Empty, 2, items, string.Empty, string.Empty, string.Empty, string.Empty);

    public static NotebookComponentModel Table(string tableRaw)
        => new(NotebookComponentType.Table, string.Empty, 2, [], tableRaw, string.Empty, string.Empty, string.Empty);

    public static NotebookComponentModel Image(string url, string alt)
        => new(NotebookComponentType.Image, string.Empty, 2, [], string.Empty, url, alt, string.Empty);

    public static NotebookComponentModel Gif(string url, string alt)
        => new(NotebookComponentType.Gif, string.Empty, 2, [], string.Empty, url, alt, string.Empty);

    public static NotebookComponentModel Link(string text, string url)
        => new(NotebookComponentType.Link, text, 2, [], string.Empty, url, string.Empty, string.Empty);

    public static NotebookComponentModel Lottie(string source)
        => new(NotebookComponentType.Lottie, string.Empty, 2, [], string.Empty, string.Empty, string.Empty, source);
}

public record NotebookPaletteGroup(string Name, string Icon, IReadOnlyList<NotebookPaletteComponent> Components);

public record NotebookPaletteComponent(string Name, string TypeKey, string Icon);
