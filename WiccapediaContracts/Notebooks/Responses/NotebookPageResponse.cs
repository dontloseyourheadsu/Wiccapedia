namespace WiccapediaContracts.Notebooks.Responses;

public record NotebookPageResponse(
    int Id,
    int NotebookId,
    string Title,
    string Markdown,
    bool IsCover,
    int? PreviousPageId,
    int? NextPageId,
    DateTimeOffset UpdatedAtUtc);
