using Markdig;

namespace WiccapediaGrimoire.Utils.NotebookMarkup;

public static class NotebookMarkupParser
{
    private static readonly MarkdownPipeline Pipeline = new MarkdownPipelineBuilder()
        .UseAdvancedExtensions()
        .Build();

    public static NotebookMarkupParseResult Parse(string? source)
    {
        var text = source ?? string.Empty;
        var diagnostics = new List<string>();
        var segments = new List<NotebookMarkupSegment>();
        var buffer = new System.Text.StringBuilder();

        var index = 0;
        while (index < text.Length)
        {
            var current = text[index];
            if (current != '\\')
            {
                buffer.Append(current);
                index++;
                continue;
            }

            if (index + 1 >= text.Length)
            {
                buffer.Append('\\');
                index++;
                continue;
            }

            var next = text[index + 1];

            if (next == '\\')
            {
                buffer.Append('\\');
                index += 2;
                continue;
            }

            if (next != '{')
            {
                buffer.Append('\\');
                index++;
                continue;
            }

            var closing = text.IndexOf('}', index + 2);
            if (closing < 0)
            {
                diagnostics.Add("Missing closing '}' for custom block.");
                buffer.Append(text[index..]);
                break;
            }

            if (buffer.Length > 0)
            {
                segments.Add(NotebookMarkupSegment.Markdown(buffer.ToString()));
                buffer.Clear();
            }

            var payload = text[(index + 2)..closing].Trim();
            if (payload.StartsWith("lottie:", StringComparison.OrdinalIgnoreCase))
            {
                var value = payload["lottie:".Length..].Trim();
                if (string.IsNullOrWhiteSpace(value))
                {
                    diagnostics.Add("Custom lottie block is missing a value. Example: \\{lottie:cover\\}");
                }
                else
                {
                    segments.Add(NotebookMarkupSegment.Lottie(value));
                }
            }
            else
            {
                diagnostics.Add($"Unknown custom block '{payload}'.");
            }

            index = closing + 1;
        }

        if (buffer.Length > 0)
        {
            segments.Add(NotebookMarkupSegment.Markdown(buffer.ToString()));
        }

        var rendered = segments.Select(segment =>
            segment.Type == NotebookMarkupSegmentType.Markdown
                ? segment with { Html = Markdown.ToHtml(segment.Value, Pipeline) }
                : segment).ToList();

        return new NotebookMarkupParseResult(rendered, diagnostics);
    }
}

public record NotebookMarkupParseResult(IReadOnlyList<NotebookMarkupSegment> Segments, IReadOnlyList<string> Diagnostics);

public enum NotebookMarkupSegmentType
{
    Markdown,
    Lottie
}

public record NotebookMarkupSegment(NotebookMarkupSegmentType Type, string Value, string Html)
{
    public static NotebookMarkupSegment Markdown(string value) => new(NotebookMarkupSegmentType.Markdown, value, string.Empty);
    public static NotebookMarkupSegment Lottie(string value) => new(NotebookMarkupSegmentType.Lottie, value, string.Empty);
}
