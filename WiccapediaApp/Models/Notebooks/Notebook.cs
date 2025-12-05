using WiccapediaApp.Models.Users;
using WiccapediaApp.Models.Covers;

namespace WiccapediaApp.Models.Notebooks;

public class Notebook
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public int CoverId { get; set; }
    public Cover? Cover { get; set; }
}
