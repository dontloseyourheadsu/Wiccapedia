namespace WiccapediaContracts.Templates.Requests;

public record CreatePageTemplateRequest(
    string Name,
    string? Description,
    string Markdown,
    string? Css,
    string? BackgroundType,
    string? BackgroundValue,
    string? Group,
    bool IsShared);
