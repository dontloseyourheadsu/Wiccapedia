namespace WiccapediaApp.Models.Notebooks;

public class NotebookPage
{
    public int Id { get; set; }
    public int NotebookId { get; set; }
    public Notebook? Notebook { get; set; }
    public string Title { get; set; } = "Page";
    public string Markdown { get; set; } = "";
    public bool IsCover { get; set; }
    public int? PreviousPageId { get; set; }
    public NotebookPage? PreviousPage { get; set; }
    public int? NextPageId { get; set; }
    public NotebookPage? NextPage { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
