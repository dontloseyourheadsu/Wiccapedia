namespace WiccapediaContracts.Notebooks.Responses;

public record NotebookDetailsResponse(
    int Id,
    string Title,
    DateTimeOffset UpdatedAtUtc,
    DateTimeOffset CreatedAtUtc,
    string? CoverLottieData,
    IReadOnlyList<NotebookPageResponse> Pages);
