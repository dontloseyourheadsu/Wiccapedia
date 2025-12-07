using Microsoft.Extensions.Hosting;

var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddPostgres("postgres")
    .WithDataVolume()
    .WithInitFiles("../init-scripts");

var db = postgres.AddDatabase("WiccapediaDb");

var api = builder.AddProject<Projects.WiccapediaApi>("wiccapediaapi")
    .WithReference(db, "DefaultConnection");

builder.AddProject<Projects.WiccapediaGrimoire>("wiccapediagrimoire")
    .WithReference(api)
    .WithEnvironment("WiccapediaApi__BaseUrl", api.GetEndpoint("https"));

builder.Build().Run();
