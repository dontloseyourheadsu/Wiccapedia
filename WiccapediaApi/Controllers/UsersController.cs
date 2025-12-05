using Microsoft.AspNetCore.Mvc;
using WiccapediaApi.Data;
using WiccapediaApp.Models.Users;
using WiccapediaContracts.Users.Requests;
using WiccapediaContracts.Users.Responses;

namespace WiccapediaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly WiccapediaDbContext _context;

    public UsersController(WiccapediaDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<ActionResult<UserResponse>> CreateUser(CreateUserRequest request)
    {
        var user = new User { Username = request.Username };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, new UserResponse(user.Id, user.Username));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserResponse>> GetUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();
        return new UserResponse(user.Id, user.Username);
    }
}
