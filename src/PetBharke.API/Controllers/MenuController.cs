using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using MongoDB.Driver;
using PetBharke.API.Hubs;
using PetBharke.Application.Interfaces;
using PetBharke.Domain.Entities;
using PetBharke.Domain.Enums;

namespace PetBharke.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MenuController : ControllerBase
{
    private readonly IMongoDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public MenuController(IMongoDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var tenantId = _currentUser.TenantId;
        if (string.IsNullOrEmpty(tenantId))
            return Unauthorized(new { success = false, message = "Tenant context required." });
        var outletId = _currentUser.OutletId;

        var filter = Builders<Category>.Filter.Eq(c => c.IsActive, true)
            & Builders<Category>.Filter.Eq(c => c.TenantId, tenantId);

        var categories = await _context.Categories
            .Find(filter)
            .SortBy(c => c.DisplayOrder)
            .ToListAsync();

        return Ok(new { success = true, data = categories });
    }

    [HttpPost("categories")]
    [Authorize(Roles = "SuperAdmin,Admin,Owner,GeneralManager")]
    public async Task<IActionResult> CreateCategory([FromBody] Category category)
    {
        category.TenantId = _currentUser.TenantId ?? string.Empty;
        category.OutletId = _currentUser.OutletId ?? string.Empty;
        category.CreatedAt = DateTime.UtcNow;
        category.IsActive = true;

        await _context.Categories.InsertOneAsync(category);
        return Ok(new { success = true, data = category });
    }

    [HttpPut("categories/{id}")]
    [Authorize(Roles = "SuperAdmin,Admin,Owner,GeneralManager")]
    public async Task<IActionResult> UpdateCategory(string id, [FromBody] Category category)
    {
        category.UpdatedAt = DateTime.UtcNow;
        var result = await _context.Categories.ReplaceOneAsync(
            c => c.Id == id && c.TenantId == _currentUser.TenantId,
            category
        );

        if (result.MatchedCount == 0) return NotFound();
        return Ok(new { success = true, data = category });
    }

    [HttpDelete("categories/{id}")]
    [Authorize(Roles = "SuperAdmin,Admin,Owner,GeneralManager")]
    public async Task<IActionResult> DeleteCategory(string id)
    {
        var result = await _context.Categories.UpdateOneAsync(
            c => c.Id == id && c.TenantId == _currentUser.TenantId,
            Builders<Category>.Update.Set(c => c.IsActive, false).Set(c => c.UpdatedAt, DateTime.UtcNow)
        );

        if (result.MatchedCount == 0) return NotFound();
        return Ok(new { success = true, message = "Category deleted." });
    }

    [HttpGet("items")]
    public async Task<IActionResult> GetMenuItems([FromQuery] string? categoryId)
    {
        var tenantId = _currentUser.TenantId;
        if (string.IsNullOrEmpty(tenantId))
            return Unauthorized(new { success = false, message = "Tenant context required." });

        var filter = Builders<MenuItem>.Filter.Eq(m => m.IsActive, true)
            & Builders<MenuItem>.Filter.Eq(m => m.TenantId, tenantId);
        if (!string.IsNullOrEmpty(categoryId))
        {
            filter &= Builders<MenuItem>.Filter.Eq(m => m.CategoryId, categoryId);
        }

        var items = await _context.MenuItems.Find(filter).ToListAsync();
        var categories = await _context.Categories.Find(c => c.TenantId == tenantId && c.IsActive).ToListAsync();
        var catDict = categories.ToDictionary(c => c.Id, c => c.Name);

        var result = items.Select(m => new
        {
            m.Id,
            m.Name,
            m.CategoryId,
            CategoryName = catDict.TryGetValue(m.CategoryId, out var cName) ? cName : "Main Course",
            Price = m.BasePrice,
            BasePrice = m.BasePrice,
            m.IsVeg,
            m.IsAvailable,
            m.ShortCode,
            m.Description,
            GstRate = m.TaxRatePercentage,
            TaxRatePercentage = m.TaxRatePercentage,
            m.CreatedAt
        });

        return Ok(new { success = true, data = result });
    }

    [HttpPost("items")]
    [Authorize(Roles = "SuperAdmin,Admin,Owner,GeneralManager")]
    public async Task<IActionResult> CreateMenuItem([FromBody] MenuItem item)
    {
        item.TenantId = _currentUser.TenantId ?? string.Empty;
        item.OutletId = _currentUser.OutletId ?? string.Empty;
        item.CreatedAt = DateTime.UtcNow;
        item.IsActive = true;

        await _context.MenuItems.InsertOneAsync(item);
        return Ok(new { success = true, data = item });
    }

    [HttpPost("items/bulk")]
    [Authorize(Roles = "SuperAdmin,Admin,Owner,GeneralManager,Manager")]
    public async Task<IActionResult> BulkUploadMenuItems([FromBody] List<BulkMenuItemDto> items, [FromQuery] bool replaceExisting = false)
    {
        var tenantId = _currentUser.TenantId;
        if (string.IsNullOrEmpty(tenantId))
            return Unauthorized(new { success = false, message = "Tenant context required." });
        var outletId = _currentUser.OutletId ?? string.Empty;

        if (items == null || items.Count == 0)
            return BadRequest(new { success = false, message = "No menu items provided." });

        if (replaceExisting)
        {
            // Soft-deactivate existing items for this tenant
            await _context.MenuItems.UpdateManyAsync(
                m => m.TenantId == tenantId && m.IsActive,
                Builders<MenuItem>.Update.Set(m => m.IsActive, false).Set(m => m.UpdatedAt, DateTime.UtcNow)
            );
        }

        var existingCategories = await _context.Categories
            .Find(c => c.TenantId == tenantId && c.IsActive)
            .ToListAsync();

        var categoryMap = existingCategories.ToDictionary(c => c.Name.Trim().ToLowerInvariant(), c => c.Id);
        var newCategoriesToInsert = new List<Category>();
        var menuItemsToInsert = new List<MenuItem>();

        foreach (var itemDto in items)
        {
            if (string.IsNullOrWhiteSpace(itemDto.Name)) continue;

            var catName = string.IsNullOrWhiteSpace(itemDto.Category) ? "Main Course" : itemDto.Category.Trim();
            var catKey = catName.ToLowerInvariant();

            if (!categoryMap.TryGetValue(catKey, out var categoryId))
            {
                var generatedCatId = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
                var newCat = new Category
                {
                    Id = generatedCatId,
                    Name = catName,
                    TenantId = tenantId,
                    OutletId = outletId,
                    IsActive = true,
                    DisplayOrder = categoryMap.Count + newCategoriesToInsert.Count + 1,
                    CreatedAt = DateTime.UtcNow
                };
                newCategoriesToInsert.Add(newCat);
                categoryId = generatedCatId;
                categoryMap[catKey] = categoryId;
            }

            var shortCode = !string.IsNullOrWhiteSpace(itemDto.ShortCode)
                ? itemDto.ShortCode.Trim().ToUpperInvariant()
                : (itemDto.Name.Length >= 3 ? itemDto.Name.Substring(0, 3).ToUpperInvariant() : itemDto.Name.ToUpperInvariant());

            var menuItem = new MenuItem
            {
                Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
                TenantId = tenantId,
                OutletId = outletId,
                CategoryId = categoryId,
                Name = itemDto.Name.Trim(),
                ShortCode = shortCode,
                Description = itemDto.Description ?? string.Empty,
                BasePrice = itemDto.Price.GetValueOrDefault(0),
                IsVeg = itemDto.IsVeg.GetValueOrDefault(true),
                IsAvailable = itemDto.IsAvailable.GetValueOrDefault(true),
                TaxRatePercentage = itemDto.GstPercent.GetValueOrDefault(5m),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            menuItemsToInsert.Add(menuItem);
        }

        if (newCategoriesToInsert.Count > 0)
        {
            await _context.Categories.InsertManyAsync(newCategoriesToInsert);
        }

        if (menuItemsToInsert.Count > 0)
        {
            await _context.MenuItems.InsertManyAsync(menuItemsToInsert);
        }

        return Ok(new
        {
            success = true,
            message = $"Successfully imported {menuItemsToInsert.Count} dishes.",
            count = menuItemsToInsert.Count,
            data = menuItemsToInsert.Select(m => new
            {
                m.Id,
                m.Name,
                CategoryName = items.FirstOrDefault(i => i.Name == m.Name)?.Category ?? "Main Course",
                Price = m.BasePrice,
                BasePrice = m.BasePrice,
                m.IsVeg,
                m.IsAvailable,
                m.ShortCode,
                GstRate = m.TaxRatePercentage,
                TaxRatePercentage = m.TaxRatePercentage,
                m.Description
            })
        });
    }

    [HttpPut("items/{id}")]
    [Authorize(Roles = "SuperAdmin,Admin,Owner,GeneralManager")]
    public async Task<IActionResult> UpdateMenuItem(string id, [FromBody] MenuItem item)
    {
        item.UpdatedAt = DateTime.UtcNow;
        var result = await _context.MenuItems.ReplaceOneAsync(
            m => m.Id == id && m.TenantId == _currentUser.TenantId,
            item
        );

        if (result.MatchedCount == 0) return NotFound();
        return Ok(new { success = true, data = item });
    }

    [HttpDelete("items/{id}")]
    [Authorize(Roles = "SuperAdmin,Admin,Owner,GeneralManager")]
    public async Task<IActionResult> DeleteMenuItem(string id)
    {
        var result = await _context.MenuItems.UpdateOneAsync(
            m => m.Id == id && m.TenantId == _currentUser.TenantId,
            Builders<MenuItem>.Update.Set(m => m.IsActive, false).Set(m => m.UpdatedAt, DateTime.UtcNow)
        );

        if (result.MatchedCount == 0) return NotFound();
        return Ok(new { success = true, message = "Menu item deleted." });
    }

    [HttpPatch("items/{id}/toggle-availability")]
    public async Task<IActionResult> ToggleItemAvailability(string id)
    {
        var item = await _context.MenuItems
            .Find(m => m.Id == id && m.TenantId == _currentUser.TenantId)
            .FirstOrDefaultAsync();

        if (item == null) return NotFound();

        item.IsAvailable = !item.IsAvailable;
        item.UpdatedAt = DateTime.UtcNow;

        await _context.MenuItems.UpdateOneAsync(
            m => m.Id == id,
            Builders<MenuItem>.Update
                .Set(m => m.IsAvailable, item.IsAvailable)
                .Set(m => m.UpdatedAt, DateTime.UtcNow)
        );

        return Ok(new { success = true, isAvailable = item.IsAvailable });
    }
}

public class BulkMenuItemDto
{
    public string? Name { get; set; }
    public string? Category { get; set; }
    public decimal? Price { get; set; }
    public bool? IsVeg { get; set; }
    public string? ShortCode { get; set; }
    public decimal? GstPercent { get; set; }
    public string? Description { get; set; }
    public bool? IsAvailable { get; set; }
}
