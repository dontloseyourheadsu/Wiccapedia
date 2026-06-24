using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace WiccapediaApi.Migrations
{
    /// <inheritdoc />
    public partial class AddPageTemplatesAndPageCss : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Css",
                table: "NotebookPages",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PageTemplates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Markdown = table.Column<string>(type: "text", nullable: false),
                    Css = table.Column<string>(type: "text", nullable: true),
                    Group = table.Column<string>(type: "text", nullable: true),
                    IsShared = table.Column<bool>(type: "boolean", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PageTemplates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PageTemplates_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PageTemplates_UserId",
                table: "PageTemplates",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PageTemplates");

            migrationBuilder.DropColumn(
                name: "Css",
                table: "NotebookPages");
        }
    }
}
