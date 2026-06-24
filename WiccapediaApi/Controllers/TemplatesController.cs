using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WiccapediaApi.Data;
using WiccapediaApp.Models.Templates;
using WiccapediaApp.Models.Users;
using WiccapediaContracts.Templates.Requests;
using WiccapediaContracts.Templates.Responses;

namespace WiccapediaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TemplatesController : ControllerBase
{
    private readonly WiccapediaDbContext _context;

    public TemplatesController(WiccapediaDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<PageTemplateResponse>>> GetTemplates(
        [FromQuery] string? search,
        [FromQuery] string? group,
        [FromQuery] bool? onlyShared)
    {
        var user = await GetOrCreateCurrentUserAsync();

        var query = _context.PageTemplates
            .Include(t => t.User)
            .AsQueryable();

        // Security check: user can see their own templates or shared templates
        query = query.Where(t => t.UserId == user.Id || t.IsShared);

        if (onlyShared == true)
        {
            query = query.Where(t => t.IsShared && t.UserId != user.Id);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.Trim().ToLower();
            query = query.Where(t => t.Name.ToLower().Contains(searchLower)
                || (t.Description != null && t.Description.ToLower().Contains(searchLower)));
        }

        if (!string.IsNullOrWhiteSpace(group))
        {
            var groupTrim = group.Trim();
            query = query.Where(t => t.Group != null && t.Group == groupTrim);
        }

        var templates = await query
            .OrderByDescending(t => t.UpdatedAtUtc)
            .ToListAsync();

        var response = templates.Select(ToResponse).ToList();
        return Ok(response);
    }

    [HttpGet("groups")]
    public async Task<ActionResult<List<string>>> GetTemplateGroups()
    {
        var user = await GetOrCreateCurrentUserAsync();

        var groups = await _context.PageTemplates
            .Where(t => (t.UserId == user.Id || t.IsShared) && t.Group != null && t.Group != "")
            .Select(t => t.Group!)
            .Distinct()
            .OrderBy(g => g)
            .ToListAsync();

        return Ok(groups);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PageTemplateResponse>> GetTemplate(int id)
    {
        var user = await GetOrCreateCurrentUserAsync();

        var template = await _context.PageTemplates
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Id == id && (t.UserId == user.Id || t.IsShared));

        if (template is null)
        {
            return NotFound();
        }

        return Ok(ToResponse(template));
    }

    [HttpPost]
    public async Task<ActionResult<PageTemplateResponse>> CreateTemplate(CreatePageTemplateRequest request)
    {
        var user = await GetOrCreateCurrentUserAsync();

        var now = DateTimeOffset.UtcNow;
        var template = new PageTemplate
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            Markdown = request.Markdown,
            Css = request.Css,
            Group = request.Group?.Trim(),
            IsShared = request.IsShared,
            UserId = user.Id,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };

        _context.PageTemplates.Add(template);
        await _context.SaveChangesAsync();

        // Reload to get Creator User info
        var reloaded = await _context.PageTemplates
            .Include(t => t.User)
            .FirstAsync(t => t.Id == template.Id);

        return CreatedAtAction(nameof(GetTemplate), new { id = template.Id }, ToResponse(reloaded));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<PageTemplateResponse>> UpdateTemplate(int id, UpdatePageTemplateRequest request)
    {
        var user = await GetOrCreateCurrentUserAsync();

        var template = await _context.PageTemplates
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == user.Id);

        if (template is null)
        {
            return NotFound(); // or Forbid if it exists but belongs to someone else
        }

        template.Name = request.Name.Trim();
        template.Description = request.Description?.Trim();
        template.Markdown = request.Markdown;
        template.Css = request.Css;
        template.Group = request.Group?.Trim();
        template.IsShared = request.IsShared;
        template.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(ToResponse(template));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteTemplate(int id)
    {
        var user = await GetOrCreateCurrentUserAsync();

        var template = await _context.PageTemplates
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == user.Id);

        if (template is null)
        {
            return NotFound();
        }

        _context.PageTemplates.Remove(template);
        await _context.SaveChangesAsync();

        return NoContent();
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

    private static PageTemplateResponse ToResponse(PageTemplate template)
        => new(
            template.Id,
            template.Name,
            template.Description,
            template.Markdown,
            template.Css,
            template.Group,
            template.IsShared,
            template.UserId,
            template.User?.Username ?? "Unknown",
            template.CreatedAtUtc,
            template.UpdatedAtUtc);
}
