using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WiccapediaApi.Migrations
{
    /// <inheritdoc />
    public partial class AddBackgroundDecorationsToPageAndTemplate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BackgroundType",
                table: "PageTemplates",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BackgroundValue",
                table: "PageTemplates",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BackgroundType",
                table: "NotebookPages",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BackgroundValue",
                table: "NotebookPages",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BackgroundType",
                table: "PageTemplates");

            migrationBuilder.DropColumn(
                name: "BackgroundValue",
                table: "PageTemplates");

            migrationBuilder.DropColumn(
                name: "BackgroundType",
                table: "NotebookPages");

            migrationBuilder.DropColumn(
                name: "BackgroundValue",
                table: "NotebookPages");
        }
    }
}
