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
    private readonly IPasswordHasher _passwordHasher;

    public TenantsController(IMongoDbContext context, ICurrentUserService currentUserService, IPasswordHasher passwordHasher)
    {
        _context = context;
        _currentUserService = currentUserService;
        _passwordHasher = passwordHasher;
    }

    [HttpGet]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> GetAllTenants()
    {
        var tenants = await _context.Tenants.Find(_ => true).ToListAsync();
        var allOutlets = await _context.Outlets.Find(o => o.IsActive).ToListAsync();

        var result = tenants.Select(t => new
        {
            t.Id,
            t.BusinessName,
            t.LegalName,
            t.OwnerEmail,
            t.OwnerPhone,
            t.City,
            t.State,
            t.GSTIN,
            t.SubscriptionPlan,
            t.BusinessType,
            t.SubscriptionExpiresAt,
            t.MaxOutlets,
            t.IsActive,
            t.Features,
            t.CreatedAt,
            t.UpdatedAt,
            Outlets = allOutlets.Where(o => o.TenantId == t.Id).Select(o => new
            {
                o.Id,
                o.Name,
                o.Code,
                o.City,
                o.Address,
                o.Phone,
                o.GSTIN,
                o.IsOpen,
                o.IsActive,
                o.CreatedAt
            }).ToList()
        });

        return Ok(new { success = true, data = result });
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
            LegalName = string.IsNullOrWhiteSpace(request.LegalName) ? request.BusinessName : request.LegalName,
            OwnerEmail = request.OwnerEmail.ToLower(),
            OwnerPhone = request.OwnerPhone,
            City = request.City ?? "Pune",
            State = request.State ?? "Maharashtra",
            GSTIN = request.GSTIN ?? string.Empty,
            BusinessType = request.BusinessType,
            SubscriptionPlan = request.SubscriptionPlan,
            SubscriptionExpiresAt = DateTime.UtcNow.AddMonths(request.SubscriptionMonths > 0 ? request.SubscriptionMonths : 12),
            MaxOutlets = request.MaxOutlets > 0 ? request.MaxOutlets : 3,
            IsActive = true,
            Features = request.Features ?? new Dictionary<string, bool>
            {
                { "enableKds", true },
                { "enableWaiterApp", true },
                { "enableAggregators", true },
                { "enableRecipeInventory", true },
                { "enableKhataBook", false }
            },
            CreatedAt = DateTime.UtcNow
        };

        await _context.Tenants.InsertOneAsync(tenant);

        var initialOutlet = new Outlet
        {
            TenantId = tenant.Id,
            Name = string.IsNullOrWhiteSpace(request.InitialOutletName) ? $"{request.BusinessName} (Main Branch)" : request.InitialOutletName,
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

        // Check or create owner user
        var existingUser = await _context.Users.Find(u => u.Email == request.OwnerEmail.ToLower()).FirstOrDefaultAsync();
        User? ownerUser = null;
        if (existingUser == null)
        {
            var rawPassword = string.IsNullOrWhiteSpace(request.InitialPassword) ? "Password@123" : request.InitialPassword;
            ownerUser = new User
            {
                TenantId = tenant.Id,
                OutletId = initialOutlet.Id,
                Username = request.OwnerEmail.Split('@')[0],
                Email = request.OwnerEmail.ToLower(),
                FullName = string.IsNullOrWhiteSpace(request.OwnerName) ? request.BusinessName + " Owner" : request.OwnerName,
                Phone = request.OwnerPhone,
                PasswordHash = _passwordHasher.HashPassword(rawPassword),
                Role = UserRole.Admin,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            await _context.Users.InsertOneAsync(ownerUser);
        }

        return Ok(new
        {
            success = true,
            data = tenant,
            outlet = initialOutlet,
            userCreated = ownerUser != null,
            ownerEmail = request.OwnerEmail,
            message = "Restaurant tenant and initial outlet branch created successfully."
        });
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> ToggleTenantStatus(string id, [FromBody] ToggleStatusDto request)
    {
        var result = await _context.Tenants.UpdateOneAsync(
            t => t.Id == id,
            Builders<Tenant>.Update.Set(t => t.IsActive, request.IsActive).Set(t => t.UpdatedAt, DateTime.UtcNow)
        );
        if (result.MatchedCount == 0) return NotFound(new { success = false, message = "Tenant not found." });
        return Ok(new { success = true, message = "Tenant status updated successfully." });
    }

    [HttpPatch("{id}/plan")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> UpdateTenantPlan(string id, [FromBody] UpdatePlanDto request)
    {
        var tenant = await _context.Tenants.Find(t => t.Id == id).FirstOrDefaultAsync();
        if (tenant == null) return NotFound(new { success = false, message = "Tenant not found." });

        var update = Builders<Tenant>.Update
            .Set(t => t.SubscriptionPlan, request.SubscriptionPlan)
            .Set(t => t.MaxOutlets, request.MaxOutlets > 0 ? request.MaxOutlets : tenant.MaxOutlets)
            .Set(t => t.UpdatedAt, DateTime.UtcNow);

        if (request.ExtendMonths > 0)
        {
            var baseDate = tenant.SubscriptionExpiresAt ?? DateTime.UtcNow;
            if (baseDate < DateTime.UtcNow) baseDate = DateTime.UtcNow;
            update = update.Set(t => t.SubscriptionExpiresAt, baseDate.AddMonths(request.ExtendMonths));
        }

        await _context.Tenants.UpdateOneAsync(t => t.Id == id, update);
        return Ok(new { success = true, message = "Tenant plan updated successfully." });
    }

    [HttpPatch("{id}/features")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> UpdateTenantFeatures(string id, [FromBody] Dictionary<string, bool> features)
    {
        var result = await _context.Tenants.UpdateOneAsync(
            t => t.Id == id,
            Builders<Tenant>.Update.Set(t => t.Features, features).Set(t => t.UpdatedAt, DateTime.UtcNow)
        );
        if (result.MatchedCount == 0) return NotFound(new { success = false, message = "Tenant not found." });
        return Ok(new { success = true, message = "Tenant feature toggles updated." });
    }

    [HttpPost("{id}/outlets")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> AddTenantOutlet(string id, [FromBody] CreateOutletDto request)
    {
        var tenant = await _context.Tenants.Find(t => t.Id == id).FirstOrDefaultAsync();
        if (tenant == null) return NotFound(new { success = false, message = "Tenant not found." });

        var count = await _context.Outlets.CountDocumentsAsync(o => o.TenantId == id && o.IsActive);
        if (count >= tenant.MaxOutlets)
        {
            return BadRequest(new { success = false, message = $"Outlet limit reached ({count}/{tenant.MaxOutlets}). Upgrade plan to add more outlets." });
        }

        var outlet = new Outlet
        {
            TenantId = id,
            Name = request.Name,
            BusinessType = tenant.BusinessType,
            Code = $"OUT-{new Random().Next(100000, 999999)}",
            Address = request.Address ?? string.Empty,
            City = request.City ?? tenant.City,
            Phone = request.Phone ?? tenant.OwnerPhone,
            GSTIN = request.GSTIN ?? tenant.GSTIN,
            IsOpen = true,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        await _context.Outlets.InsertOneAsync(outlet);
        return Ok(new { success = true, data = outlet });
    }
}

public class CreateTenantDto
{
    public string BusinessName { get; set; } = string.Empty;
    public string? LegalName { get; set; }
    public string? OwnerName { get; set; }
    public string OwnerEmail { get; set; } = string.Empty;
    public string OwnerPhone { get; set; } = string.Empty;
    public string? InitialPassword { get; set; }
    public BusinessType BusinessType { get; set; } = BusinessType.Cafe;
    public SubscriptionPlan SubscriptionPlan { get; set; } = SubscriptionPlan.Standard;
    public int SubscriptionMonths { get; set; } = 12;
    public int MaxOutlets { get; set; } = 3;
    public string? InitialOutletName { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? GSTIN { get; set; }
    public Dictionary<string, bool>? Features { get; set; }
}

public class UpdatePlanDto
{
    public SubscriptionPlan SubscriptionPlan { get; set; } = SubscriptionPlan.Standard;
    public int MaxOutlets { get; set; } = 3;
    public int ExtendMonths { get; set; } = 0;
}

public class CreateOutletDto
{
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Phone { get; set; }
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
