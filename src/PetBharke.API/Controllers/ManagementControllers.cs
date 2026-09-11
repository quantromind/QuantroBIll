using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using PetBharke.Application.Interfaces;
using PetBharke.Domain.Entities;
using PetBharke.Domain.Enums;

namespace PetBharke.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TenantsController : ControllerBase
{
    private readonly IMongoDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public TenantsController(IMongoDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> GetAllTenants()
    {
        var tenants = await _context.Tenants.Find(_ => true).ToListAsync();
        return Ok(new { success = true, data = tenants });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTenantById(string id)
    {
        if (_currentUserService.Role != nameof(UserRole.SuperAdmin) && _currentUserService.TenantId != id)
        {
            return Forbid();
        }

        var tenant = await _context.Tenants.Find(t => t.Id == id).FirstOrDefaultAsync();
        if (tenant == null)
            return NotFound(new { success = false, message = "Tenant not found." });

        return Ok(new { success = true, data = tenant });
    }

    [HttpGet("{id}/outlets")]
    public async Task<IActionResult> GetTenantOutlets(string id)
    {
        if (_currentUserService.Role != nameof(UserRole.SuperAdmin) && _currentUserService.TenantId != id)
        {
            return Forbid();
        }

        var outlets = await _context.Outlets.Find(o => o.TenantId == id && o.IsActive).ToListAsync();
        return Ok(new { success = true, data = outlets });
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> CreateTenant([FromBody] CreateTenantDto request)
    {
        var tenant = new Tenant
        {
            BusinessName = request.BusinessName,
            OwnerEmail = request.OwnerEmail,
            OwnerPhone = request.OwnerPhone,
            BusinessType = request.BusinessType,
            SubscriptionPlan = request.SubscriptionPlan,
            SubscriptionExpiresAt = DateTime.UtcNow.AddMonths(request.SubscriptionMonths > 0 ? request.SubscriptionMonths : 12),
            MaxOutlets = request.MaxOutlets > 0 ? request.MaxOutlets : 5,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Tenants.InsertOneAsync(tenant);

        var initialOutlet = new Outlet
        {
            TenantId = tenant.Id,
            Name = $"{request.BusinessName} (Main Branch)",
            BusinessType = request.BusinessType,
            Code = $"OUT-{new Random().Next(100000, 999999)}",
            Address = request.Address ?? "Main Market",
            City = request.City ?? "Pune",
            Phone = request.OwnerPhone,
            GSTIN = request.GSTIN ?? string.Empty,
            IsOpen = true,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        await _context.Outlets.InsertOneAsync(initialOutlet);

        return Ok(new { success = true, data = tenant, outlet = initialOutlet });
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> ToggleTenantStatus(string id, [FromBody] ToggleStatusDto request)
    {
        var result = await _context.Tenants.UpdateOneAsync(
            t => t.Id == id,
            Builders<Tenant>.Update.Set(t => t.IsActive, request.IsActive).Set(t => t.UpdatedAt, DateTime.UtcNow)
        );
        if (result.MatchedCount == 0) return NotFound();
        return Ok(new { success = true, message = "Tenant status updated." });
    }
}

public class CreateTenantDto
{
    public string BusinessName { get; set; } = string.Empty;
    public string OwnerEmail { get; set; } = string.Empty;
    public string OwnerPhone { get; set; } = string.Empty;
    public BusinessType BusinessType { get; set; } = BusinessType.Restaurant;
    public SubscriptionPlan SubscriptionPlan { get; set; } = SubscriptionPlan.Enterprise;
    public int SubscriptionMonths { get; set; } = 12;
    public int MaxOutlets { get; set; } = 5;
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? GSTIN { get; set; }
}

public class ToggleStatusDto
{
    public bool IsActive { get; set; }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OutletsController : ControllerBase
{
    private readonly IMongoDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public OutletsController(IMongoDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<IActionResult> GetOutlets()
    {
        var tenantId = _currentUserService.TenantId;
        if (string.IsNullOrEmpty(tenantId))
        {
            return BadRequest(new { success = false, message = "Tenant context required." });
        }

        var outlets = await _context.Outlets.Find(o => o.TenantId == tenantId && o.IsActive).ToListAsync();
        return Ok(new { success = true, data = outlets });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetOutletById(string id)
    {
        var tenantId = _currentUserService.TenantId;
        var outlet = await _context.Outlets.Find(o => o.Id == id && (string.IsNullOrEmpty(tenantId) || o.TenantId == tenantId)).FirstOrDefaultAsync();
        if (outlet == null)
            return NotFound(new { success = false, message = "Outlet not found." });

        return Ok(new { success = true, data = outlet });
    }

    [HttpPut("{id}/tax-settings")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> UpdateTaxSettings(string id, [FromBody] OutletTaxSettings settings)
    {
        var tenantId = _currentUserService.TenantId;
        var update = Builders<Outlet>.Update
            .Set(o => o.TaxSettings, settings)
            .Set(o => o.UpdatedAt, DateTime.UtcNow);

        var result = await _context.Outlets.UpdateOneAsync(
            o => o.Id == id && (string.IsNullOrEmpty(tenantId) || o.TenantId == tenantId),
            update);

        if (result.MatchedCount == 0)
            return NotFound(new { success = false, message = "Outlet not found." });

        return Ok(new { success = true, message = "Tax settings updated successfully." });
    }

    [HttpPut("{id}/printer-settings")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> UpdatePrinterSettings(string id, [FromBody] OutletPrinterSettings settings)
    {
        var tenantId = _currentUserService.TenantId;
        var update = Builders<Outlet>.Update
            .Set(o => o.PrinterSettings, settings)
            .Set(o => o.UpdatedAt, DateTime.UtcNow);

        var result = await _context.Outlets.UpdateOneAsync(
            o => o.Id == id && (string.IsNullOrEmpty(tenantId) || o.TenantId == tenantId),
            update);

        if (result.MatchedCount == 0)
            return NotFound(new { success = false, message = "Outlet not found." });

        return Ok(new { success = true, message = "Printer settings updated successfully." });
    }
}

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly IMongoDbContext _context;

    public HealthController(IMongoDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> CheckHealth()
    {
        try
        {
            var isAlive = await _context.Database.RunCommandAsync((Command<MongoDB.Bson.BsonDocument>)"{ping:1}");
            return Ok(new
            {
                status = "Healthy",
                service = "PetBharke Platform API",
                database = "MongoDB Atlas connected",
                serverTime = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                status = "Unhealthy",
                error = ex.Message,
                serverTime = DateTime.UtcNow
            });
        }
    }
}
