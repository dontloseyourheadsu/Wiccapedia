using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WiccapediaApi.Data;
using WiccapediaApp.Models.Notebooks;
using WiccapediaApp.Models.Users;
using WiccapediaContracts.Notebooks.Requests;
using WiccapediaContracts.Notebooks.Responses;

namespace WiccapediaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotebooksController : ControllerBase
{
    private readonly WiccapediaDbContext _context;

    public NotebooksController(WiccapediaDbContext context)
    {
        _context = context;
    }

    [HttpGet("me")]
    public async Task<ActionResult<NotebookListResponse>> GetMyNotebooks(
        [FromQuery] string? search,
        [FromQuery] string? sortBy,
        [FromQuery] string? direction)
    {
        var user = await GetOrCreateCurrentUserAsync();

        var notebooks = await _context.Notebooks
            .Where(n => n.UserId == user.Id)
            .Include(n => n.Pages)
            .ToListAsync();

        if (notebooks.Count == 0)
        {
            notebooks.Add(await CreateNotebookInternalAsync(user.Id, "Demo Notebook"));
        }

        var filtered = notebooks
            .Where(n => string.IsNullOrWhiteSpace(search)
                || n.Title.Contains(search, StringComparison.OrdinalIgnoreCase));

        var normalizedSortBy = (sortBy ?? "updated").Trim().ToLowerInvariant();
        var normalizedDirection = (direction ?? "desc").Trim().ToLowerInvariant();

        var sorted = (normalizedSortBy, normalizedDirection) switch
        {
            ("name", "asc") => filtered.OrderBy(n => n.Title, StringComparer.OrdinalIgnoreCase),
            ("name", _) => filtered.OrderByDescending(n => n.Title, StringComparer.OrdinalIgnoreCase),
            ("updated", "asc") => filtered.OrderBy(n => n.UpdatedAtUtc),
            _ => filtered.OrderByDescending(n => n.UpdatedAtUtc)
        };

        var result = sorted
            .Select(ToNotebookListItemResponse)
            .ToList();

        return Ok(new NotebookListResponse(result));
    }

    [HttpPost]
    public async Task<ActionResult<NotebookResponse>> CreateNotebook(CreateNotebookRequest request)
    {
        var user = await GetOrCreateCurrentUserAsync();
        var notebook = await CreateNotebookInternalAsync(user.Id, request.Title);

        return CreatedAtAction(nameof(GetNotebook), new { id = notebook.Id }, ToNotebookResponse(notebook));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<NotebookDetailsResponse>> GetNotebook(int id)
    {
        var user = await GetOrCreateCurrentUserAsync();

        var notebook = await _context.Notebooks
            .Include(n => n.Pages)
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == user.Id);

        if (notebook is null)
        {
            return NotFound();
        }

        return Ok(ToNotebookDetailsResponse(notebook));
    }

    [HttpPatch("{id:int}/title")]
    public async Task<ActionResult<NotebookResponse>> UpdateTitle(int id, UpdateNotebookTitleRequest request)
    {
        var user = await GetOrCreateCurrentUserAsync();

        var notebook = await _context.Notebooks
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == user.Id);

        if (notebook is null)
        {
            return NotFound();
        }

        var title = request.Title.Trim();
        if (string.IsNullOrWhiteSpace(title))
        {
            return BadRequest("Title cannot be empty.");
        }

        notebook.Title = title;
        notebook.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(ToNotebookResponse(notebook));
    }

    [HttpPatch("{id:int}/pages/{pageId:int}")]
    public async Task<ActionResult<NotebookPageResponse>> UpdatePage(int id, int pageId, UpdateNotebookPageRequest request)
    {
        var user = await GetOrCreateCurrentUserAsync();

        var notebook = await _context.Notebooks
            .Include(n => n.Pages)
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == user.Id);

        if (notebook is null)
        {
            return NotFound();
        }

        var page = notebook.Pages.FirstOrDefault(p => p.Id == pageId);
        if (page is null)
        {
            return NotFound();
        }

        page.Markdown = request.Markdown;
        page.UpdatedAtUtc = DateTimeOffset.UtcNow;
        notebook.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(ToNotebookPageResponse(page));
    }

    [HttpPost("{id:int}/pages/{pageId:int}/next")]
    public async Task<ActionResult<NotebookPageResponse>> CreateNextPage(int id, int pageId)
    {
        var user = await GetOrCreateCurrentUserAsync();

        var notebook = await _context.Notebooks
            .Include(n => n.Pages)
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == user.Id);

        if (notebook is null)
        {
            return NotFound();
        }

        var currentPage = notebook.Pages.FirstOrDefault(p => p.Id == pageId);
        if (currentPage is null)
        {
            return NotFound();
        }

        var nextPage = currentPage.NextPageId.HasValue
            ? notebook.Pages.FirstOrDefault(p => p.Id == currentPage.NextPageId.Value)
            : null;

        var newPage = new NotebookPage
        {
            NotebookId = notebook.Id,
            Title = $"Page {notebook.Pages.Count + 1}",
            Markdown = "",
            IsCover = false,
            PreviousPageId = currentPage.Id,
            NextPageId = currentPage.NextPageId,
            UpdatedAtUtc = DateTimeOffset.UtcNow
        };

        _context.NotebookPages.Add(newPage);
        await _context.SaveChangesAsync();

        currentPage.NextPageId = newPage.Id;
        currentPage.UpdatedAtUtc = DateTimeOffset.UtcNow;

        if (nextPage is not null)
        {
            nextPage.PreviousPageId = newPage.Id;
            nextPage.UpdatedAtUtc = DateTimeOffset.UtcNow;
        }

        notebook.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(ToNotebookPageResponse(newPage));
    }

    [HttpDelete("{id:int}/pages/{pageId:int}")]
    public async Task<ActionResult<NotebookDetailsResponse>> DeletePage(int id, int pageId)
    {
        var user = await GetOrCreateCurrentUserAsync();

        var notebook = await _context.Notebooks
            .Include(n => n.Pages)
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == user.Id);

        if (notebook is null)
        {
            return NotFound();
        }

        if (notebook.Pages.Count <= 1)
        {
            return BadRequest("A notebook must contain at least one page.");
        }

        var page = notebook.Pages.FirstOrDefault(p => p.Id == pageId);
        if (page is null)
        {
            return NotFound();
        }

        var previous = page.PreviousPageId.HasValue
            ? notebook.Pages.FirstOrDefault(p => p.Id == page.PreviousPageId.Value)
            : null;

        var next = page.NextPageId.HasValue
            ? notebook.Pages.FirstOrDefault(p => p.Id == page.NextPageId.Value)
            : null;

        if (previous is not null)
        {
            previous.NextPageId = next?.Id;
            previous.UpdatedAtUtc = DateTimeOffset.UtcNow;
        }

        if (next is not null)
        {
            next.PreviousPageId = previous?.Id;
            next.UpdatedAtUtc = DateTimeOffset.UtcNow;
        }

        if (page.IsCover)
        {
            var replacement = next ?? previous;
            if (replacement is not null)
            {
                replacement.IsCover = true;
                replacement.PreviousPageId = null;
                replacement.UpdatedAtUtc = DateTimeOffset.UtcNow;
            }
        }

        _context.NotebookPages.Remove(page);
        notebook.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync();

        var refreshedNotebook = await _context.Notebooks
            .Include(n => n.Pages)
            .FirstAsync(n => n.Id == notebook.Id);

        return Ok(ToNotebookDetailsResponse(refreshedNotebook));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteNotebook(int id)
    {
        var user = await GetOrCreateCurrentUserAsync();

        var notebook = await _context.Notebooks
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == user.Id);

        if (notebook is null)
        {
            return NotFound();
        }

        _context.Notebooks.Remove(notebook);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<Notebook> CreateNotebookInternalAsync(int userId, string? rawTitle)
    {
        var title = string.IsNullOrWhiteSpace(rawTitle) ? "Untitled Notebook" : rawTitle.Trim();
        var now = DateTimeOffset.UtcNow;
        var notebook = new Notebook
        {
            UserId = userId,
            Title = title,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
            CoverLottieData = await TryReadDefaultLottieAsync()
        };

        _context.Notebooks.Add(notebook);
        await _context.SaveChangesAsync();

        var coverPage = new NotebookPage
        {
            NotebookId = notebook.Id,
            Title = "Cover",
            IsCover = true,
            PreviousPageId = null,
            NextPageId = null,
            Markdown = $"# {title}\n\nStart writing your first chapter here.\n\n\\{{lottie:cover\\}}",
            UpdatedAtUtc = now
        };

        _context.NotebookPages.Add(coverPage);
        await _context.SaveChangesAsync();

        notebook.Pages = [coverPage];
        return notebook;
    }

    private async Task<User> GetOrCreateCurrentUserAsync()
    {
        var externalId = User.FindFirst("sub")?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.Identity?.Name;

        if (string.IsNullOrWhiteSpace(externalId))
        {
            throw new InvalidOperationException("Unable to resolve user identity from access token.");
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.ExternalId == externalId);
        if (user is not null)
        {
            return user;
        }

        var username = User.FindFirst("name")?.Value
            ?? User.FindFirst(ClaimTypes.Name)?.Value
            ?? User.FindFirst(ClaimTypes.Email)?.Value
            ?? externalId;

        user = new User
        {
            ExternalId = externalId,
            Username = username
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    private static NotebookResponse ToNotebookResponse(Notebook notebook)
        => new(notebook.Id, notebook.Title, notebook.UpdatedAtUtc, notebook.CreatedAtUtc);

    private static NotebookListItemResponse ToNotebookListItemResponse(Notebook notebook)
        => new(
            notebook.Id,
            notebook.Title,
            notebook.UpdatedAtUtc,
            notebook.CreatedAtUtc,
            notebook.CoverLottieData,
            notebook.Pages.Count);

    private static NotebookDetailsResponse ToNotebookDetailsResponse(Notebook notebook)
    {
        var ordered = OrderPages(notebook.Pages)
            .Select(ToNotebookPageResponse)
            .ToList();

        return new NotebookDetailsResponse(
            notebook.Id,
            notebook.Title,
            notebook.UpdatedAtUtc,
            notebook.CreatedAtUtc,
            notebook.CoverLottieData,
            ordered);
    }

    private static NotebookPageResponse ToNotebookPageResponse(NotebookPage page)
        => new(
            page.Id,
            page.NotebookId,
            page.Title,
            page.Markdown,
            page.IsCover,
            page.PreviousPageId,
            page.NextPageId,
            page.UpdatedAtUtc);

    private static List<NotebookPage> OrderPages(IEnumerable<NotebookPage> pages)
    {
        var byId = pages.ToDictionary(p => p.Id);
        var start = pages.FirstOrDefault(p => p.IsCover)
            ?? pages.FirstOrDefault(p => p.PreviousPageId is null)
            ?? pages.FirstOrDefault();

        if (start is null)
        {
            return [];
        }

        var ordered = new List<NotebookPage>();
        var visited = new HashSet<int>();
        var current = start;

        while (current is not null && visited.Add(current.Id))
        {
            ordered.Add(current);
            current = current.NextPageId.HasValue && byId.TryGetValue(current.NextPageId.Value, out var next)
                ? next
                : null;
        }

        if (ordered.Count != byId.Count)
        {
            ordered.AddRange(byId.Values.Where(p => !visited.Contains(p.Id)).OrderBy(p => p.Id));
        }

        return ordered;
    }

    private async Task<string?> TryReadDefaultLottieAsync()
    {
        var path = Path.Combine(Directory.GetCurrentDirectory(), "lottie", "lottie-sample.json");
        if (!System.IO.File.Exists(path))
        {
            return null;
        }

        return await System.IO.File.ReadAllTextAsync(path);
    }
}
