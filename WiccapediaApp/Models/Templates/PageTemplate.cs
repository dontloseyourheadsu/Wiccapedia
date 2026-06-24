using WiccapediaApp.Models.Users;

namespace WiccapediaApp.Models.Templates;

public class PageTemplate
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Markdown { get; set; } = string.Empty;
    public string? Css { get; set; }
    public string? BackgroundType { get; set; } = "none";
    public string? BackgroundValue { get; set; }
    public string? Group { get; set; }
    public bool IsShared { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
