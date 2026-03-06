namespace WiccapediaContracts.Notebooks.Responses;

public record NotebookListResponse(IReadOnlyList<NotebookListItemResponse> Notebooks);
