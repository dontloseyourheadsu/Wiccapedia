using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WiccapediaContracts.Covers.Responses;

namespace WiccapediaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LottieController : ControllerBase
{
    [HttpGet("default")]
    [AllowAnonymous]
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
