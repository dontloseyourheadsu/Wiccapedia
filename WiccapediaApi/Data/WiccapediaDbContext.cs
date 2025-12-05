using Microsoft.EntityFrameworkCore;
using WiccapediaApp.Models.Users;
using WiccapediaApp.Models.Notebooks;
using WiccapediaApp.Models.Covers;
using WiccapediaApp.Models.Decorations;

namespace WiccapediaApi.Data;

public class WiccapediaDbContext : DbContext
{
    public WiccapediaDbContext(DbContextOptions<WiccapediaDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Notebook> Notebooks { get; set; }
    public DbSet<Cover> Covers { get; set; }
    public DbSet<Decoration> Decorations { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .HasMany(u => u.Notebooks)
            .WithOne(n => n.User)
            .HasForeignKey(n => n.UserId);

        modelBuilder.Entity<Notebook>()
            .HasOne(n => n.Cover)
            .WithOne(c => c.Notebook)
            .HasForeignKey<Notebook>(n => n.CoverId);

        modelBuilder.Entity<Cover>()
            .HasOne(c => c.Decoration)
            .WithOne(d => d.Cover)
            .HasForeignKey<Cover>(c => c.DecorationId);
    }
}
