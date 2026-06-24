using System.Net.Http.Json;
using WiccapediaContracts.Templates.Requests;
using WiccapediaContracts.Templates.Responses;

namespace WiccapediaGrimoire.Services.Templates;

public class TemplatesService
{
    private readonly HttpClient _httpClient;

    public TemplatesService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<List<PageTemplateResponse>?> GetTemplatesAsync(
        string? search = null,
        string? group = null,
        bool? onlyShared = null)
    {
        var uri = "api/templates";
        var queryParams = new List<string>();

        if (!string.IsNullOrWhiteSpace(search))
        {
            queryParams.Add($"search={Uri.EscapeDataString(search)}");
        }
        if (!string.IsNullOrWhiteSpace(group))
        {
            queryParams.Add($"group={Uri.EscapeDataString(group)}");
        }
        if (onlyShared.HasValue)
        {
            queryParams.Add($"onlyShared={onlyShared.Value.ToString().ToLowerInvariant()}");
        }

        if (queryParams.Count > 0)
        {
            uri += "?" + string.Join("&", queryParams);
        }

        return await _httpClient.GetFromJsonAsync<List<PageTemplateResponse>>(uri);
    }

    public async Task<List<string>?> GetTemplateGroupsAsync()
    {
        return await _httpClient.GetFromJsonAsync<List<string>>("api/templates/groups");
    }

    public async Task<PageTemplateResponse?> GetTemplateAsync(int templateId)
    {
        return await _httpClient.GetFromJsonAsync<PageTemplateResponse>($"api/templates/{templateId}");
    }

    public async Task<PageTemplateResponse?> CreateTemplateAsync(CreatePageTemplateRequest request)
    {
        var response = await _httpClient.PostAsJsonAsync("api/templates", request);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<PageTemplateResponse>();
    }

    public async Task<PageTemplateResponse?> UpdateTemplateAsync(int templateId, UpdatePageTemplateRequest request)
    {
        var response = await _httpClient.PutAsJsonAsync($"api/templates/{templateId}", request);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<PageTemplateResponse>();
    }

    public async Task DeleteTemplateAsync(int templateId)
    {
        var response = await _httpClient.DeleteAsync($"api/templates/{templateId}");
        response.EnsureSuccessStatusCode();
    }
}
