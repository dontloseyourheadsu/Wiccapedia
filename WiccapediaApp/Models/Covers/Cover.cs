using WiccapediaApp.Models.Decorations;
using WiccapediaApp.Models.Notebooks;

namespace WiccapediaApp.Models.Covers;

public class Cover
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int DecorationId { get; set; }
    public Decoration? Decoration { get; set; }
    public Notebook? Notebook { get; set; }
}
