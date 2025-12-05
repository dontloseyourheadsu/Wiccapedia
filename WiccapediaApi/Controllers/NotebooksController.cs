using Microsoft.AspNetCore.Mvc;
using WiccapediaApi.Data;
using WiccapediaApp.Models.Notebooks;
using WiccapediaContracts.Notebooks.Requests;
using WiccapediaContracts.Notebooks.Responses;

namespace WiccapediaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotebooksController : ControllerBase
{
    private readonly WiccapediaDbContext _context;

    public NotebooksController(WiccapediaDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<ActionResult<NotebookResponse>> CreateNotebook(CreateNotebookRequest request)
    {
        var notebook = new Notebook 
        { 
            UserId = request.UserId,
            CoverId = request.CoverId
        };
        _context.Notebooks.Add(notebook);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetNotebook), new { id = notebook.Id }, new NotebookResponse(notebook.Id, notebook.UserId, notebook.CoverId));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<NotebookResponse>> GetNotebook(int id)
    {
        var notebook = await _context.Notebooks.FindAsync(id);
        if (notebook == null) return NotFound();
        return new NotebookResponse(notebook.Id, notebook.UserId, notebook.CoverId);
    }
}
