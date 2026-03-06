using System.Net.Http.Json;
using WiccapediaContracts.Notebooks.Requests;
using WiccapediaContracts.Notebooks.Responses;

namespace WiccapediaGrimoire.Services.Notebooks;

public class NotebooksService
{
    private readonly HttpClient _httpClient;

    public NotebooksService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<NotebookListResponse?> GetMyNotebooksAsync(string? search, string sortBy, string direction)
    {
        var uri = $"api/notebooks/me?sortBy={Uri.EscapeDataString(sortBy)}&direction={Uri.EscapeDataString(direction)}";
        if (!string.IsNullOrWhiteSpace(search))
        {
            uri += $"&search={Uri.EscapeDataString(search)}";
        }

        return await _httpClient.GetFromJsonAsync<NotebookListResponse>(uri);
    }

    public async Task<NotebookResponse?> CreateNotebookAsync(string? title)
    {
        var response = await _httpClient.PostAsJsonAsync("api/notebooks", new CreateNotebookRequest(title));
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<NotebookResponse>();
    }

    public async Task<NotebookDetailsResponse?> GetNotebookAsync(int notebookId)
        => await _httpClient.GetFromJsonAsync<NotebookDetailsResponse>($"api/notebooks/{notebookId}");

    public async Task<NotebookResponse?> UpdateNotebookTitleAsync(int notebookId, string title)
    {
        var response = await _httpClient.PatchAsJsonAsync($"api/notebooks/{notebookId}/title", new UpdateNotebookTitleRequest(title));
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<NotebookResponse>();
    }

    public async Task<NotebookPageResponse?> UpdatePageAsync(int notebookId, int pageId, string markdown)
    {
        var response = await _httpClient.PatchAsJsonAsync(
            $"api/notebooks/{notebookId}/pages/{pageId}",
            new UpdateNotebookPageRequest(markdown));
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<NotebookPageResponse>();
    }

    public async Task<NotebookPageResponse?> CreateNextPageAsync(int notebookId, int pageId)
    {
        var response = await _httpClient.PostAsync($"api/notebooks/{notebookId}/pages/{pageId}/next", null);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<NotebookPageResponse>();
    }

    public async Task<NotebookDetailsResponse?> DeletePageAsync(int notebookId, int pageId)
    {
        var response = await _httpClient.DeleteAsync($"api/notebooks/{notebookId}/pages/{pageId}");
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<NotebookDetailsResponse>();
    }

    public async Task DeleteNotebookAsync(int notebookId)
    {
        var response = await _httpClient.DeleteAsync($"api/notebooks/{notebookId}");
        response.EnsureSuccessStatusCode();
    }
}
