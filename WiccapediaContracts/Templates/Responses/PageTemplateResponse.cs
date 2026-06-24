namespace WiccapediaContracts.Templates.Responses;

public record PageTemplateResponse(
    int Id,
    string Name,
    string? Description,
    string Markdown,
    string? Css,
    string? Group,
    bool IsShared,
    int UserId,
    string CreatorName,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc);
