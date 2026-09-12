using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using PetBharke.Application.Interfaces;
using PetBharke.Domain.Entities;

namespace PetBharke.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,Owner,Manager")]
public class InventoryController : ControllerBase
{
    private readonly IMongoDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public InventoryController(IMongoDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> GetInventory()
    {
        var tenantId = _currentUser.TenantId ?? string.Empty;
        var outletId = _currentUser.OutletId ?? string.Empty;
        if (string.IsNullOrEmpty(tenantId))
            return Unauthorized(new { success = false, message = "Tenant context required." });

        var filter = Builders<InventoryItem>.Filter.Eq(i => i.IsActive, true)
            & Builders<InventoryItem>.Filter.Eq(i => i.TenantId, tenantId);

        var items = await _context.Inventory
            .Find(filter)
            .SortBy(i => i.Category)
            .ThenBy(i => i.Name)
            .ToListAsync();

        return Ok(new { success = true, data = items });
    }

    [HttpPost("load-stock")]
    [Authorize(Roles = "SuperAdmin,Owner,Manager")]
    public async Task<IActionResult> LoadStock([FromBody] LoadStockRequest request)
    {
        var tenantId = _currentUser.TenantId;
        if (string.IsNullOrEmpty(tenantId))
            return Unauthorized(new { success = false, message = "Tenant context required." });

        var filter = Builders<InventoryItem>.Filter.Eq(i => i.Id, request.ItemId)
            & Builders<InventoryItem>.Filter.Eq(i => i.TenantId, tenantId);

        var update = Builders<InventoryItem>.Update
            .Inc(i => i.CurrentStock, request.AddedStock)
            .Set(i => i.UpdatedAt, DateTime.UtcNow);

        if (request.CostPerUnit.HasValue && request.CostPerUnit.Value > 0)
        {
            update = update.Set(i => i.CostPerUnit, request.CostPerUnit.Value);
        }
        if (!string.IsNullOrEmpty(request.SupplierName))
        {
            update = update.Set(i => i.SupplierName, request.SupplierName);
        }

        var result = await _context.Inventory.UpdateOneAsync(filter, update);
        if (result.MatchedCount == 0)
        {
            return NotFound(new { success = false, message = "Inventory item not found." });
        }

        return Ok(new { success = true, message = "Stock replenished successfully." });
    }

    [HttpPost("deduct")]
    public async Task<IActionResult> DeductInventory([FromBody] List<StockDeductionItem> deductions)
    {
        var tenantId = _currentUser.TenantId;
        if (string.IsNullOrEmpty(tenantId))
            return Unauthorized(new { success = false, message = "Tenant context required." });
        if (deductions == null || deductions.Count == 0)
        {
            return BadRequest(new { success = false, message = "No deduction items provided." });
        }

        foreach (var item in deductions)
        {
            var filter = Builders<InventoryItem>.Filter.Regex(i => i.Name, new MongoDB.Bson.BsonRegularExpression(item.ItemName, "i"))
                & Builders<InventoryItem>.Filter.Eq(i => i.TenantId, tenantId);

            var update = Builders<InventoryItem>.Update
                .Inc(i => i.CurrentStock, -Math.Abs(item.Quantity))
                .Set(i => i.UpdatedAt, DateTime.UtcNow);

            await _context.Inventory.UpdateOneAsync(filter, update);
        }

        return Ok(new { success = true, message = "Inventory auto-depleted successfully." });
    }
}

public class LoadStockRequest
{
    public string ItemId { get; set; } = string.Empty;
    public decimal AddedStock { get; set; }
    public decimal? CostPerUnit { get; set; }
    public string? SupplierName { get; set; }
}

public class StockDeductionItem
{
    public string ItemName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
}
