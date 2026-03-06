namespace WiccapediaContracts.Notebooks.Responses;

public record NotebookResponse(int Id, string Title, DateTimeOffset UpdatedAtUtc, DateTimeOffset CreatedAtUtc);
