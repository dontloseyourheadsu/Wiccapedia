namespace WiccapediaContracts.Templates.Requests;

public record CreatePageTemplateRequest(
    string Name,
    string? Description,
    string Markdown,
    string? Css,
    string? Group,
    bool IsShared);
