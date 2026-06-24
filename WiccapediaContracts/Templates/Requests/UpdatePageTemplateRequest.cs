namespace WiccapediaContracts.Templates.Requests;

public record UpdatePageTemplateRequest(
    string Name,
    string? Description,
    string Markdown,
    string? Css,
    string? Group,
    bool IsShared);
