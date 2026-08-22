using DepositoApi.Services;

var builder = WebApplication.CreateBuilder(args);

// Troque para false quando o Firebird real estiver configurado no appsettings.json
var usarDadosFicticios = builder.Configuration.GetValue<bool>("UsarDadosFicticios", true);

if (usarDadosFicticios)
{
    builder.Services.AddSingleton<IOcupacaoService, OcupacaoServiceMock>();
}
else
{
    builder.Services.AddScoped<IOcupacaoService, OcupacaoService>();
}

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5000" };

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthorization();
app.MapControllers();

app.Run();
