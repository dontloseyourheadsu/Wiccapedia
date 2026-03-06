using WiccapediaApp.Models.Users;

namespace WiccapediaApp.Models.Notebooks;

public class Notebook
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public string Title { get; set; } = "Untitled Notebook";
    public string? CoverLottieData { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public List<NotebookPage> Pages { get; set; } = [];
}
