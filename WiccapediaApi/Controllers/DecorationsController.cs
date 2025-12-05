using Microsoft.AspNetCore.Mvc;
using WiccapediaApi.Data;
using WiccapediaApp.Models.Decorations;
using WiccapediaContracts.Decorations.Requests;
using WiccapediaContracts.Decorations.Responses;

namespace WiccapediaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DecorationsController : ControllerBase
{
    private readonly WiccapediaDbContext _context;

    public DecorationsController(WiccapediaDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<ActionResult<DecorationResponse>> CreateDecoration(CreateDecorationRequest request)
    {
        var modelType = (WiccapediaApp.Models.Decorations.DecorationType)(int)request.Type;

        var decoration = new Decoration
        {
            Type = modelType,
            Value = request.Value
        };
        _context.Decorations.Add(decoration);
        await _context.SaveChangesAsync();

        var responseType = (WiccapediaContracts.Decorations.DecorationType)(int)decoration.Type;

        return CreatedAtAction(nameof(GetDecoration), new { id = decoration.Id }, new DecorationResponse(decoration.Id, responseType, decoration.Value));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DecorationResponse>> GetDecoration(int id)
    {
        var decoration = await _context.Decorations.FindAsync(id);
        if (decoration == null) return NotFound();

        var responseType = (WiccapediaContracts.Decorations.DecorationType)(int)decoration.Type;
        return new DecorationResponse(decoration.Id, responseType, decoration.Value);
    }
}
