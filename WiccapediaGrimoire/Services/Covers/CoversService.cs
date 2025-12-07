using System.Net.Http.Json;
using WiccapediaContracts.Covers.Responses;

namespace WiccapediaGrimoire.Services.Covers;

public class CoversService
{
    private readonly HttpClient _httpClient;
    private readonly IHttpClientFactory _httpClientFactory;

    public CoversService(HttpClient httpClient, IHttpClientFactory httpClientFactory)
    {
        _httpClient = httpClient;
        _httpClientFactory = httpClientFactory;
    }

    public async Task<DefaultCoverResponse?> GetDefaultCoverAsync()
    {
        var client = _httpClientFactory.CreateClient("WiccapediaApi.Public");
        return await client.GetFromJsonAsync<DefaultCoverResponse>("api/Covers/default");
    }
}
