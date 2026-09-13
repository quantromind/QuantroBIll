using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using PetBharke.Application.Interfaces;
using PetBharke.Domain.Entities;
using PetBharke.Domain.Enums;

namespace PetBharke.IntegrationTests;

/// <summary>
/// Cross-tenant access tests — the single highest-value test suite for a multi-tenant SaaS.
/// Creates two tenants, seeds data for each, authenticates as Tenant A, and asserts
/// every major endpoint returns 403/404 for Tenant B's resource IDs.
/// 
/// PREREQUISITES:
/// These tests require a live MongoDB connection configured via user-secrets or env vars.
/// The tests use a dedicated test database ("petbharke_test") that is cleaned up after each run.
/// Set the following user-secret or env var before running:
///   MongoDB:ConnectionString = <your-mongo-connection-string>
///   MongoDB:DatabaseName = petbharke_test
/// </summary>
public class CrossTenantAccessTests : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private IMongoDbContext _dbContext = null!;
    private IPasswordHasher _hasher = null!;

    // Tenant A
    private string _tenantAId = string.Empty;
    private string _outletAId = string.Empty;
    private string _userAId = string.Empty;
    private string _categoryAId = string.Empty;
    private string _menuItemAId = string.Empty;
    private string _orderAId = string.Empty;
    private string _tableAId = string.Empty;
    private string _tokenA = string.Empty;

    // Tenant B
    private string _tenantBId = string.Empty;
    private string _outletBId = string.Empty;
    private string _userBId = string.Empty;
    private string _categoryBId = string.Empty;
    private string _menuItemBId = string.Empty;
    private string _orderBId = string.Empty;
    private string _tableBId = string.Empty;
    private string _tokenB = string.Empty;

    public CrossTenantAccessTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Override database name to use a test database
                // The connection string comes from user-secrets or env vars
            });
            builder.UseSetting("MongoDB:DatabaseName", "petbharke_test");
            builder.UseSetting("FORCE_SEED", "false"); // Don't run default seeder
            builder.UseSetting("Swagger:Enabled", "false");
        });
        _client = _factory.CreateClient();
    }

    public async Task InitializeAsync()
    {
        using var scope = _factory.Services.CreateScope();
        _dbContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
        _hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        // Clean test database
        await _dbContext.Database.Client.DropDatabaseAsync(_dbContext.Database.DatabaseNamespace.DatabaseName, CancellationToken.None);

        // Seed Tenant A
        var tenantA = new Tenant
        {
            BusinessName = "Test Restaurant A",
            OwnerEmail = "ownerA@test.com",
            OwnerPhone = "1111111111",
            BusinessType = BusinessType.Restaurant,
            SubscriptionPlan = SubscriptionPlan.Enterprise,
            SubscriptionExpiresAt = DateTime.UtcNow.AddYears(1),
            MaxOutlets = 5,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        await _dbContext.Tenants.InsertOneAsync(tenantA);
        _tenantAId = tenantA.Id;

        var outletA = new Outlet
        {
            TenantId = _tenantAId,
            Name = "Outlet A",
            Code = "OA-001",
            BusinessType = BusinessType.Restaurant,
            IsActive = true,
            IsOpen = true,
            CreatedAt = DateTime.UtcNow
        };
        await _dbContext.Outlets.InsertOneAsync(outletA);
        _outletAId = outletA.Id;

        var userA = new User
        {
            TenantId = _tenantAId,
            OutletId = _outletAId,
            Username = "ownerA",
            Email = "ownerA@test.com",
            FullName = "Owner A",
            Phone = "1111111111",
            PasswordHash = _hasher.HashPassword("TestPass@123"),
            Role = UserRole.Owner,
            Permissions = new List<string> { "all" },
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        await _dbContext.Users.InsertOneAsync(userA);
        _userAId = userA.Id;

        var catA = new Category
        {
            TenantId = _tenantAId,
            OutletId = _outletAId,
            Name = "Category A",
            DisplayOrder = 1
        };
        await _dbContext.Categories.InsertOneAsync(catA);
        _categoryAId = catA.Id;

        var menuA = new MenuItem
        {
            TenantId = _tenantAId,
            OutletId = _outletAId,
            CategoryId = _categoryAId,
            Name = "Menu Item A",
            BasePrice = 100,
            IsVeg = true,
            IsAvailable = true
        };
        await _dbContext.MenuItems.InsertOneAsync(menuA);
        _menuItemAId = menuA.Id;

        var tableA = new RestaurantTable
        {
            TenantId = _tenantAId,
            OutletId = _outletAId,
            TableNumber = "TA-1",
            Section = "Main",
            SeatingCapacity = 4
        };
        await _dbContext.Tables.InsertOneAsync(tableA);
        _tableAId = tableA.Id;

        var orderA = new Order
        {
            TenantId = _tenantAId,
            OutletId = _outletAId,
            BillNumber = "TEST-A-001",
            OrderType = OrderType.DineIn,
            Status = OrderStatus.KotCreated,
            TotalAmount = 100,
            SubTotal = 100,
            Items = new List<OrderItem>
            {
                new() { Name = "Menu Item A", Quantity = 1, UnitPrice = 100, TotalPrice = 100 }
            }
        };
        await _dbContext.Orders.InsertOneAsync(orderA);
        _orderAId = orderA.Id;

        // Seed Tenant B
        var tenantB = new Tenant
        {
            BusinessName = "Test Restaurant B",
            OwnerEmail = "ownerB@test.com",
            OwnerPhone = "2222222222",
            BusinessType = BusinessType.Cafe,
            SubscriptionPlan = SubscriptionPlan.Standard,
            SubscriptionExpiresAt = DateTime.UtcNow.AddYears(1),
            MaxOutlets = 3,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        await _dbContext.Tenants.InsertOneAsync(tenantB);
        _tenantBId = tenantB.Id;

        var outletB = new Outlet
        {
            TenantId = _tenantBId,
            Name = "Outlet B",
            Code = "OB-001",
            BusinessType = BusinessType.Cafe,
            IsActive = true,
            IsOpen = true,
            CreatedAt = DateTime.UtcNow
        };
        await _dbContext.Outlets.InsertOneAsync(outletB);
        _outletBId = outletB.Id;

        var userB = new User
        {
            TenantId = _tenantBId,
            OutletId = _outletBId,
            Username = "ownerB",
            Email = "ownerB@test.com",
            FullName = "Owner B",
            Phone = "2222222222",
            PasswordHash = _hasher.HashPassword("TestPass@123"),
            Role = UserRole.Owner,
            Permissions = new List<string> { "all" },
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        await _dbContext.Users.InsertOneAsync(userB);
        _userBId = userB.Id;

        var catB = new Category
        {
            TenantId = _tenantBId,
            OutletId = _outletBId,
            Name = "Category B",
            DisplayOrder = 1
        };
        await _dbContext.Categories.InsertOneAsync(catB);
        _categoryBId = catB.Id;

        var menuB = new MenuItem
        {
            TenantId = _tenantBId,
            OutletId = _outletBId,
            CategoryId = _categoryBId,
            Name = "Menu Item B",
            BasePrice = 200,
            IsVeg = false,
            IsAvailable = true
        };
        await _dbContext.MenuItems.InsertOneAsync(menuB);
        _menuItemBId = menuB.Id;

        var tableB = new RestaurantTable
        {
            TenantId = _tenantBId,
            OutletId = _outletBId,
            TableNumber = "TB-1",
            Section = "Main",
            SeatingCapacity = 2
        };
        await _dbContext.Tables.InsertOneAsync(tableB);
        _tableBId = tableB.Id;

        var orderB = new Order
        {
            TenantId = _tenantBId,
            OutletId = _outletBId,
            BillNumber = "TEST-B-001",
            OrderType = OrderType.TakeAway,
            Status = OrderStatus.KotCreated,
            TotalAmount = 200,
            SubTotal = 200,
            Items = new List<OrderItem>
            {
                new() { Name = "Menu Item B", Quantity = 1, UnitPrice = 200, TotalPrice = 200 }
            }
        };
        await _dbContext.Orders.InsertOneAsync(orderB);
        _orderBId = orderB.Id;

        // Generate JWT tokens for each tenant
        var jwtService = scope.ServiceProvider.GetRequiredService<IJwtService>();
        _tokenA = jwtService.GenerateAccessToken(userA, _tenantAId, _outletAId, "Outlet A", "Test Restaurant A");
        _tokenB = jwtService.GenerateAccessToken(userB, _tenantBId, _outletBId, "Outlet B", "Test Restaurant B");
    }

    public async Task DisposeAsync()
    {
        // Clean up test database
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
        await db.Database.Client.DropDatabaseAsync("petbharke_test");
    }

    private HttpRequestMessage AuthenticatedGet(string url, string token)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return request;
    }

    private HttpRequestMessage AuthenticatedDelete(string url, string token)
    {
        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return request;
    }

    // ========================================================================
    // TENANT CONTROLLER: Cross-tenant access via [RequireSameTenant]
    // ========================================================================

    [Fact]
    public async Task GetTenantById_AsTenantA_ForTenantB_Returns403()
    {
        var response = await _client.SendAsync(AuthenticatedGet($"/api/tenants/{_tenantBId}", _tokenA));
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetTenantOutlets_AsTenantA_ForTenantB_Returns403()
    {
        var response = await _client.SendAsync(AuthenticatedGet($"/api/tenants/{_tenantBId}/outlets", _tokenA));
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetTenantUsers_AsTenantA_ForTenantB_Returns403()
    {
        var response = await _client.SendAsync(AuthenticatedGet($"/api/tenants/{_tenantBId}/users", _tokenA));
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // ========================================================================
    // OWN TENANT: Verify access to own tenant data works
    // ========================================================================

    [Fact]
    public async Task GetTenantById_AsTenantA_ForTenantA_Returns200()
    {
        var response = await _client.SendAsync(AuthenticatedGet($"/api/tenants/{_tenantAId}", _tokenA));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetTenantOutlets_AsTenantA_ForTenantA_Returns200()
    {
        var response = await _client.SendAsync(AuthenticatedGet($"/api/tenants/{_tenantAId}/outlets", _tokenA));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ========================================================================
    // MENU CONTROLLER: Items are scoped by TenantId from JWT
    // ========================================================================

    [Fact]
    public async Task GetMenuCategories_AsTenantA_ReturnsOnlyTenantAData()
    {
        var response = await _client.SendAsync(AuthenticatedGet("/api/menu/categories", _tokenA));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("Category A", content);
        Assert.DoesNotContain("Category B", content);
    }

    [Fact]
    public async Task GetMenuItems_AsTenantA_ReturnsOnlyTenantAItems()
    {
        var response = await _client.SendAsync(AuthenticatedGet("/api/menu/items", _tokenA));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("Menu Item A", content);
        Assert.DoesNotContain("Menu Item B", content);
    }

    // ========================================================================
    // ORDERS CONTROLLER: Orders are scoped by TenantId from JWT
    // ========================================================================

    [Fact]
    public async Task GetOrders_AsTenantA_ReturnsOnlyTenantAOrders()
    {
        var response = await _client.SendAsync(AuthenticatedGet("/api/orders", _tokenA));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("TEST-A-001", content);
        Assert.DoesNotContain("TEST-B-001", content);
    }

    [Fact]
    public async Task GetOrderById_AsTenantA_ForTenantBOrder_Returns404()
    {
        var response = await _client.SendAsync(AuthenticatedGet($"/api/orders/{_orderBId}", _tokenA));
        // Should return 404 because the order is scoped to Tenant B and won't be found for Tenant A
        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 404 or 403, got {response.StatusCode}");
    }

    // ========================================================================
    // TABLES CONTROLLER: Tables are scoped by TenantId from JWT
    // ========================================================================

    [Fact]
    public async Task GetTables_AsTenantA_ReturnsOnlyTenantATables()
    {
        var response = await _client.SendAsync(AuthenticatedGet("/api/tables", _tokenA));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("TA-1", content);
        Assert.DoesNotContain("TB-1", content);
    }

    // ========================================================================
    // OUTLETS CONTROLLER: Outlets are scoped by TenantId from JWT
    // ========================================================================

    [Fact]
    public async Task GetOutlets_AsTenantA_ReturnsOnlyTenantAOutlets()
    {
        var response = await _client.SendAsync(AuthenticatedGet("/api/outlets", _tokenA));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("Outlet A", content);
        Assert.DoesNotContain("Outlet B", content);
    }

    [Fact]
    public async Task GetOutletById_AsTenantA_ForTenantBOutlet_Returns404()
    {
        var response = await _client.SendAsync(AuthenticatedGet($"/api/outlets/{_outletBId}", _tokenA));
        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 404 or 403, got {response.StatusCode}");
    }

    // ========================================================================
    // SYMMETRIC: Verify Tenant B also can't see Tenant A data
    // ========================================================================

    [Fact]
    public async Task GetTenantById_AsTenantB_ForTenantA_Returns403()
    {
        var response = await _client.SendAsync(AuthenticatedGet($"/api/tenants/{_tenantAId}", _tokenB));
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetMenuCategories_AsTenantB_ReturnsOnlyTenantBData()
    {
        var response = await _client.SendAsync(AuthenticatedGet("/api/menu/categories", _tokenB));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("Category B", content);
        Assert.DoesNotContain("Category A", content);
    }

    [Fact]
    public async Task GetOrders_AsTenantB_ReturnsOnlyTenantBOrders()
    {
        var response = await _client.SendAsync(AuthenticatedGet("/api/orders", _tokenB));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("TEST-B-001", content);
        Assert.DoesNotContain("TEST-A-001", content);
    }
}
