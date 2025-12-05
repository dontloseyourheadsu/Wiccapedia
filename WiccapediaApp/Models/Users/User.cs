using WiccapediaApp.Models.Notebooks;

namespace WiccapediaApp.Models.Users;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public List<Notebook> Notebooks { get; set; } = new();
}
