using System;

namespace WiccapediaGrimoire.Utils.Authorization;

using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.WebAssembly.Authentication;

public class CustomAuthorizationMessageHandler : AuthorizationMessageHandler
{
    private readonly IConfiguration _configuration;
    
    public CustomAuthorizationMessageHandler(IConfiguration configuration,
        IAccessTokenProvider provider,
        NavigationManager navigation)
        : base(provider, navigation)
    {
        _configuration = configuration;
        var apiUrl = _configuration["WiccapediaApi:BaseUrl"]!;

        // Configure which URLs require the token
        ConfigureHandler(
            authorizedUrls: [apiUrl], // Your API URL
            scopes: ["openid", "profile"]
        );
    }
}