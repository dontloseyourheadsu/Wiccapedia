using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace WiccapediaApi.Migrations
{
    /// <inheritdoc />
    public partial class NotebookDomainRefactor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Notebooks_Covers_CoverId",
                table: "Notebooks");

            migrationBuilder.DropTable(
                name: "Covers");

            migrationBuilder.DropTable(
                name: "Decorations");

            migrationBuilder.DropIndex(
                name: "IX_Notebooks_CoverId",
                table: "Notebooks");

            migrationBuilder.DropColumn(
                name: "CoverId",
                table: "Notebooks");

            migrationBuilder.AddColumn<string>(
                name: "ExternalId",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CoverLottieData",
                table: "Notebooks",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "CreatedAtUtc",
                table: "Notebooks",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "Notebooks",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "UpdatedAtUtc",
                table: "Notebooks",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.CreateTable(
                name: "NotebookPages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    NotebookId = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Markdown = table.Column<string>(type: "text", nullable: false),
                    IsCover = table.Column<bool>(type: "boolean", nullable: false),
                    PreviousPageId = table.Column<int>(type: "integer", nullable: true),
                    NextPageId = table.Column<int>(type: "integer", nullable: true),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotebookPages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NotebookPages_NotebookPages_NextPageId",
                        column: x => x.NextPageId,
                        principalTable: "NotebookPages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_NotebookPages_NotebookPages_PreviousPageId",
                        column: x => x.PreviousPageId,
                        principalTable: "NotebookPages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_NotebookPages_Notebooks_NotebookId",
                        column: x => x.NotebookId,
                        principalTable: "Notebooks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_ExternalId",
                table: "Users",
                column: "ExternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NotebookPages_NextPageId",
                table: "NotebookPages",
                column: "NextPageId");

            migrationBuilder.CreateIndex(
                name: "IX_NotebookPages_NotebookId_IsCover",
                table: "NotebookPages",
                columns: new[] { "NotebookId", "IsCover" },
                unique: true,
                filter: "\"IsCover\" = true");

            migrationBuilder.CreateIndex(
                name: "IX_NotebookPages_PreviousPageId",
                table: "NotebookPages",
                column: "PreviousPageId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NotebookPages");

            migrationBuilder.DropIndex(
                name: "IX_Users_ExternalId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ExternalId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CoverLottieData",
                table: "Notebooks");

            migrationBuilder.DropColumn(
                name: "CreatedAtUtc",
                table: "Notebooks");

            migrationBuilder.DropColumn(
                name: "Title",
                table: "Notebooks");

            migrationBuilder.DropColumn(
                name: "UpdatedAtUtc",
                table: "Notebooks");

            migrationBuilder.AddColumn<int>(
                name: "CoverId",
                table: "Notebooks",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Decorations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Value = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Decorations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Covers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DecorationId = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Covers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Covers_Decorations_DecorationId",
                        column: x => x.DecorationId,
                        principalTable: "Decorations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Notebooks_CoverId",
                table: "Notebooks",
                column: "CoverId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Covers_DecorationId",
                table: "Covers",
                column: "DecorationId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Notebooks_Covers_CoverId",
                table: "Notebooks",
                column: "CoverId",
                principalTable: "Covers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
