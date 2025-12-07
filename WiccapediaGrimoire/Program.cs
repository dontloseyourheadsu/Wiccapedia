using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using WiccapediaGrimoire;
using WiccapediaGrimoire.Services.Covers;
using WiccapediaGrimoire.Utils.Authorization;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });

// 1. Register the Handler
builder.Services.AddScoped<CustomAuthorizationMessageHandler>();

// 2. Register the Service AND the Client together
builder.Services.AddHttpClient("WiccapediaApi.Public", client =>
    {
        client.BaseAddress = new Uri(builder.Configuration["WiccapediaApi:BaseUrl"]!);
    });

builder.Services.AddHttpClient<CoversService>(client =>
    {
        client.BaseAddress = new Uri(builder.Configuration["WiccapediaApi:BaseUrl"]!);
    })
    .AddHttpMessageHandler<CustomAuthorizationMessageHandler>();

// 3. Auth Configuration
builder.Services.AddOidcAuthentication(options =>
{
    builder.Configuration.Bind("Local", options.ProviderOptions);
});

await builder.Build().RunAsync();