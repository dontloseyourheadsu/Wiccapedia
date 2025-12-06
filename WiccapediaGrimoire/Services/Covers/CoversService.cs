using System.Net.Http.Json;
using WiccapediaContracts.Covers.Responses;

namespace WiccapediaGrimoire.Services.Covers;

public class CoversService
{
    private readonly HttpClient _httpClient;

    public CoversService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<DefaultCoverResponse?> GetDefaultCoverAsync()
    {
        return await _httpClient.GetFromJsonAsync<DefaultCoverResponse>("api/Covers/default");
    }
}
