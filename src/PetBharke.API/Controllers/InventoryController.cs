using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using PetBharke.Application.Interfaces;
using PetBharke.Domain.Entities;

namespace PetBharke.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
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

        var filter = Builders<InventoryItem>.Filter.Eq(i => i.IsActive, true);
        if (!string.IsNullOrEmpty(tenantId))
        {
            filter &= Builders<InventoryItem>.Filter.Eq(i => i.TenantId, tenantId);
        }

        var items = await _context.Inventory
            .Find(filter)
            .SortBy(i => i.Category)
            .ThenBy(i => i.Name)
            .ToListAsync();

        // Seed default inventory items if empty for this tenant
        if (items.Count == 0 && !string.IsNullOrEmpty(tenantId))
        {
            var defaultStock = new List<InventoryItem>
            {
                new() { TenantId = tenantId, OutletId = outletId, Name = "Fresh Malai Paneer", Category = "Dairy", Unit = "kg", CurrentStock = 18.5m, MinimumStockAlert = 5.0m, CostPerUnit = 320, SupplierName = "Mother Dairy Pune" },
                new() { TenantId = tenantId, OutletId = outletId, Name = "Cooking Cream (Amul 1L)", Category = "Dairy", Unit = "litre", CurrentStock = 12.0m, MinimumStockAlert = 3.0m, CostPerUnit = 210, SupplierName = "Amul Distributor" },
                new() { TenantId = tenantId, OutletId = outletId, Name = "Table Butter (Amul 500g)", Category = "Dairy", Unit = "kg", CurrentStock = 15.0m, MinimumStockAlert = 4.0m, CostPerUnit = 275, SupplierName = "Amul Distributor" },
                new() { TenantId = tenantId, OutletId = outletId, Name = "Basmati Biryani Rice", Category = "Grains", Unit = "kg", CurrentStock = 45.0m, MinimumStockAlert = 15.0m, CostPerUnit = 110, SupplierName = "Kohinoor Traders" },
                new() { TenantId = tenantId, OutletId = outletId, Name = "Refined Maida Flour", Category = "Grains", Unit = "kg", CurrentStock = 30.0m, MinimumStockAlert = 10.0m, CostPerUnit = 42, SupplierName = "Mahalaxmi Mills" },
                new() { TenantId = tenantId, OutletId = outletId, Name = "Fresh Chicken (Boneless)", Category = "Poultry", Unit = "kg", CurrentStock = 14.0m, MinimumStockAlert = 6.0m, CostPerUnit = 260, SupplierName = "Venky's Farms" },
                new() { TenantId = tenantId, OutletId = outletId, Name = "Tomato Puree & Gravy Base", Category = "Produce", Unit = "kg", CurrentStock = 22.0m, MinimumStockAlert = 8.0m, CostPerUnit = 65, SupplierName = "Mandi Wholesale" },
                new() { TenantId = tenantId, OutletId = outletId, Name = "Refined Sunflower Oil", Category = "Oils", Unit = "litre", CurrentStock = 35.0m, MinimumStockAlert = 10.0m, CostPerUnit = 135, SupplierName = "Fortune Oil Depot" },
                new() { TenantId = tenantId, OutletId = outletId, Name = "Thums Up Glass Bottles (300ml)", Category = "Beverages", Unit = "pcs", CurrentStock = 72.0m, MinimumStockAlert = 24.0m, CostPerUnit = 16, SupplierName = "Hindustan Coca-Cola" }
            };

            await _context.Inventory.InsertManyAsync(defaultStock);
            items = defaultStock;
        }

        return Ok(new { success = true, data = items });
    }

    [HttpPost("load-stock")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> LoadStock([FromBody] LoadStockRequest request)
    {
        var tenantId = _currentUser.TenantId;
        var filter = Builders<InventoryItem>.Filter.Eq(i => i.Id, request.ItemId);
        if (!string.IsNullOrEmpty(tenantId))
        {
            filter &= Builders<InventoryItem>.Filter.Eq(i => i.TenantId, tenantId);
        }

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
        if (deductions == null || deductions.Count == 0)
        {
            return BadRequest(new { success = false, message = "No deduction items provided." });
        }

        foreach (var item in deductions)
        {
            var filter = Builders<InventoryItem>.Filter.Regex(i => i.Name, new MongoDB.Bson.BsonRegularExpression(item.ItemName, "i"));
            if (!string.IsNullOrEmpty(tenantId))
            {
                filter &= Builders<InventoryItem>.Filter.Eq(i => i.TenantId, tenantId);
            }

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
