namespace WiccapediaContracts.Notebooks.Requests;

public record UpdateNotebookPageRequest(string Markdown, string? Css = null);
