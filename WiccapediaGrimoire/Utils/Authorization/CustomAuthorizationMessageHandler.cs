using System.Net.Http.Headers;
using Microsoft.JSInterop;

namespace WiccapediaGrimoire.Utils.Authorization;

public class CustomAuthorizationMessageHandler : DelegatingHandler
{
    private readonly IConfiguration _configuration;
    private readonly IJSRuntime _jsRuntime;
    private readonly string _apiUrl;
    private readonly string _authority;
    private readonly string _clientId;

    public CustomAuthorizationMessageHandler(IConfiguration configuration, IJSRuntime jsRuntime)
    {
        _configuration = configuration;
        _jsRuntime = jsRuntime;
        _apiUrl = _configuration["WiccapediaApi:BaseUrl"] ?? string.Empty;
        _authority = _configuration["Local:Authority"] ?? string.Empty;
        _clientId = _configuration["Local:ClientId"] ?? string.Empty;
    }

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(_apiUrl)
            && request.RequestUri is not null
            && request.RequestUri.ToString().StartsWith(_apiUrl, StringComparison.OrdinalIgnoreCase))
        {
            var idToken = await _jsRuntime.InvokeAsync<string?>(
                "wiccapediaAuth.getIdToken",
                cancellationToken,
                _authority,
                _clientId);

            if (!string.IsNullOrWhiteSpace(idToken))
            {
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", idToken);
            }
        }

        return await base.SendAsync(request, cancellationToken);
    }
}