using WiccapediaApp.Models.Covers;

namespace WiccapediaApp.Models.Decorations;

public class Decoration
{
    public int Id { get; set; }
    public DecorationType Type { get; set; }
    public string Value { get; set; } = string.Empty;
    public Cover? Cover { get; set; }
}
