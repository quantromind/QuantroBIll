using System.Text;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using PetBharke.API.Hubs;
using PetBharke.API.Middleware;
using PetBharke.API.Services;
using PetBharke.Application.Interfaces;
using PetBharke.Application.Validators;
using PetBharke.Domain.Common;
using PetBharke.Domain.Entities;
using PetBharke.Infrastructure.Data;
using PetBharke.Infrastructure.Repositories;
using PetBharke.Infrastructure.Security;
using PetBharke.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Add Services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHttpContextAccessor();

// 2. Swagger / OpenAPI Configuration with Bearer Auth
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "QuantroBill Restaurant SaaS API",
        Version = "v1",
        Description = "Enterprise multi-tenant POS & Restaurant Management platform (Petpooja functional equivalent)"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your valid JWT access token. Example: Bearer {token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// 3. Database & Core Infrastructure DI
builder.Services.AddSingleton<IMongoDbContext, MongoDbContext>();
builder.Services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();
builder.Services.AddSingleton<IJwtService, JwtService>();
builder.Services.AddSingleton<IPinRateLimiter, PinRateLimiter>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IAuthService, AuthService>();

// Register generic repositories
builder.Services.AddScoped<IRepository<Category>>(sp => 
    new MongoRepository<Category>(sp.GetRequiredService<IMongoDbContext>(), "categories"));
builder.Services.AddScoped<IRepository<MenuItem>>(sp => 
    new MongoRepository<MenuItem>(sp.GetRequiredService<IMongoDbContext>(), "menuItems"));
builder.Services.AddScoped<IRepository<Order>>(sp => 
    new MongoRepository<Order>(sp.GetRequiredService<IMongoDbContext>(), "orders"));
builder.Services.AddScoped<IRepository<Customer>>(sp => 
    new MongoRepository<Customer>(sp.GetRequiredService<IMongoDbContext>(), "customers"));
builder.Services.AddScoped<IRepository<RestaurantTable>>(sp => 
    new MongoRepository<RestaurantTable>(sp.GetRequiredService<IMongoDbContext>(), "tables"));
builder.Services.AddScoped<IRepository<InventoryItem>>(sp => 
    new MongoRepository<InventoryItem>(sp.GetRequiredService<IMongoDbContext>(), "inventory"));
builder.Services.AddScoped<IRepository<Expense>>(sp => 
    new MongoRepository<Expense>(sp.GetRequiredService<IMongoDbContext>(), "expenses"));
builder.Services.AddScoped<IRepository<CashFlowEntry>>(sp => 
    new MongoRepository<CashFlowEntry>(sp.GetRequiredService<IMongoDbContext>(), "cashFlowEntries"));
builder.Services.AddScoped<IRepository<Discount>>(sp => 
    new MongoRepository<Discount>(sp.GetRequiredService<IMongoDbContext>(), "discounts"));
builder.Services.AddScoped<IRepository<Feedback>>(sp => 
    new MongoRepository<Feedback>(sp.GetRequiredService<IMongoDbContext>(), "feedbacks"));

// 4. FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();

// 5. SignalR
builder.Services.AddSignalR();

// 6. Authentication & JWT Bearer
var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT signing key (Jwt:Key) must be configured.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "PetBharkeAPI";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "PetBharkeClient";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ClockSkew = TimeSpan.Zero
    };

    // Support token for SignalR Hub WebSockets
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// 7. CORS — read allowed origins from configuration, allow localhost in Development
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? new[] { "http://localhost:5173" };
builder.Services.AddCors(options =>
{
    options.AddPolicy("PetBharkeCors", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
        {
            if (string.IsNullOrEmpty(origin)) return false;
            if (allowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase)) return true;
            if (builder.Environment.IsDevelopment() && Uri.TryCreate(origin, UriKind.Absolute, out var uri) && (uri.Host == "localhost" || uri.Host == "127.0.0.1"))
                return true;
            return false;
        })
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

var app = builder.Build();

// 8. Seed Database on Startup (gated in production — requires FORCE_SEED=true)
var shouldSeed = app.Environment.IsDevelopment() ||
    string.Equals(builder.Configuration["FORCE_SEED"], "true", StringComparison.OrdinalIgnoreCase);

if (shouldSeed)
{
    using var scope = app.Services.CreateScope();
    try
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        await DbSeeder.SeedDatabaseAsync(dbContext, hasher);
        Console.WriteLine("--> [QuantroBill] MongoDB Connected & Seeded Successfully.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"--> [QuantroBill] Error during DB Seeding: {ex.Message}");
    }
}
else
{
    Console.WriteLine("--> [QuantroBill] Skipping DB seed in production. Set FORCE_SEED=true to seed.");
}

// 9. HTTP Pipeline Middleware
app.UseMiddleware<GlobalExceptionMiddleware>();

var swaggerEnabled = app.Environment.IsDevelopment() ||
    string.Equals(builder.Configuration["Swagger:Enabled"], "true", StringComparison.OrdinalIgnoreCase);

if (swaggerEnabled)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "QuantroBill API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseCors("PetBharkeCors");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<OrderHub>("/hubs/order");

app.Run();

// Make Program accessible to integration tests via WebApplicationFactory<Program>
public partial class Program { }
