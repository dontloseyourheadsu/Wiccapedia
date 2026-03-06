namespace WiccapediaContracts.Notebooks.Responses;

public record NotebookListItemResponse(
    int Id,
    string Title,
    DateTimeOffset UpdatedAtUtc,
    DateTimeOffset CreatedAtUtc,
    string? CoverLottieData,
    int PageCount);
