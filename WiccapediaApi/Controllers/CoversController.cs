using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WiccapediaApi.Data;
using WiccapediaApp.Models.Covers;
using WiccapediaContracts.Covers.Requests;
using WiccapediaContracts.Covers.Responses;

namespace WiccapediaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CoversController : ControllerBase
{
    private readonly WiccapediaDbContext _context;

    public CoversController(WiccapediaDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<ActionResult<CoverResponse>> CreateCover(CreateCoverRequest request)
    {
        var cover = new Cover
        {
            Title = request.Title,
            DecorationId = request.DecorationId
        };
        _context.Covers.Add(cover);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetCover), new { id = cover.Id }, new CoverResponse(cover.Id, cover.Title, cover.DecorationId));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CoverResponse>> GetCover(int id)
    {
        var cover = await _context.Covers.FindAsync(id);
        if (cover == null) return NotFound();
        return new CoverResponse(cover.Id, cover.Title, cover.DecorationId);
    }

    [HttpGet("default")]
    public async Task<ActionResult<DefaultCoverResponse>> GetDefault()
    {
        var path = Path.Combine(Directory.GetCurrentDirectory(), "lottie", "lottie-sample.json");
        if (!System.IO.File.Exists(path))
        {
            return NotFound("Default lottie file not found.");
        }

        var json = await System.IO.File.ReadAllTextAsync(path);
        return new DefaultCoverResponse("Default Cover", json);
    }
}
