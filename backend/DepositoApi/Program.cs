using System.Text;
using DepositoApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Troque para false quando o Firebird real estiver configurado no appsettings.json
var usarDadosFicticios = builder.Configuration.GetValue<bool>("UsarDadosFicticios", true);

if (usarDadosFicticios)
{
    builder.Services.AddSingleton<IOcupacaoService, OcupacaoServiceMock>();
    builder.Services.AddSingleton<IPendenciaService, PendenciaServiceMock>();
    builder.Services.AddSingleton<IVendaService, VendaServiceMock>();
    builder.Services.AddSingleton<IFinanceiroService, FinanceiroServiceMock>();
    builder.Services.AddSingleton<ICompraService, CompraServiceMock>();
    builder.Services.AddSingleton<IFiscalService, FiscalServiceMock>();
    builder.Services.AddSingleton<IProdutoService, ProdutoServiceMock>();
}
else
{
    builder.Services.AddScoped<IOcupacaoService, OcupacaoService>();
    builder.Services.AddScoped<IPendenciaService, PendenciaService>();
    builder.Services.AddScoped<IVendaService, VendaService>();
    builder.Services.AddScoped<IFinanceiroService, FinanceiroService>();
    builder.Services.AddScoped<ICompraService, CompraService>();
    builder.Services.AddScoped<IFiscalService, FiscalService>();
    builder.Services.AddScoped<IProdutoService, ProdutoService>();
}

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton<ITenantService, TenantService>();
builder.Services.AddScoped<ITenantContext, TenantContext>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// --- Autenticação JWT ---
var chaveSecreta = builder.Configuration["Jwt:SecretKey"];
if (string.IsNullOrWhiteSpace(chaveSecreta) || Encoding.UTF8.GetByteCount(chaveSecreta) < 32)
{
    throw new InvalidOperationException("Configure Jwt:SecretKey com pelo menos 32 bytes usando um segredo fora dos arquivos versionados.");
}

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(chaveSecreta)),
        };
    });

builder.Services.AddAuthorization();

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
if (builder.Environment.IsDevelopment() && allowedOrigins.Length == 0)
{
    allowedOrigins = new[] { "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5181", "http://127.0.0.1:5181" };
}

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
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok" })).AllowAnonymous();

app.Run();
