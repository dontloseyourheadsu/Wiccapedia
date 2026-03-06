using Microsoft.EntityFrameworkCore;
using WiccapediaApp.Models.Users;
using WiccapediaApp.Models.Notebooks;

namespace WiccapediaApi.Data;

public class WiccapediaDbContext : DbContext
{
    public WiccapediaDbContext(DbContextOptions<WiccapediaDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Notebook> Notebooks { get; set; }
    public DbSet<NotebookPage> NotebookPages { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.ExternalId)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasMany(u => u.Notebooks)
            .WithOne(n => n.User)
            .HasForeignKey(n => n.UserId);

        modelBuilder.Entity<Notebook>()
            .HasMany(n => n.Pages)
            .WithOne(p => p.Notebook)
            .HasForeignKey(p => p.NotebookId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<NotebookPage>()
            .HasOne(p => p.PreviousPage)
            .WithMany()
            .HasForeignKey(p => p.PreviousPageId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<NotebookPage>()
            .HasOne(p => p.NextPage)
            .WithMany()
            .HasForeignKey(p => p.NextPageId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<NotebookPage>()
            .HasIndex(p => new { p.NotebookId, p.IsCover })
            .HasFilter("\"IsCover\" = true")
            .IsUnique();
    }
}
