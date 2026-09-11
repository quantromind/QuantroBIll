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
        var outletId = _currentUser.OutletId;

        var filter = Builders<Category>.Filter.Eq(c => c.IsActive, true);
        if (!string.IsNullOrEmpty(tenantId))
        {
            filter &= Builders<Category>.Filter.Eq(c => c.TenantId, tenantId);
        }

        var categories = await _context.Categories
            .Find(filter)
            .SortBy(c => c.DisplayOrder)
            .ToListAsync();

        return Ok(new { success = true, data = categories });
    }

    [HttpPost("categories")]
    [Authorize(Roles = "SuperAdmin,Admin")]
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
    [Authorize(Roles = "SuperAdmin,Admin")]
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
    [Authorize(Roles = "SuperAdmin,Admin")]
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

        var filter = Builders<MenuItem>.Filter.Eq(m => m.IsActive, true);
        if (!string.IsNullOrEmpty(tenantId))
        {
            filter &= Builders<MenuItem>.Filter.Eq(m => m.TenantId, tenantId);
        }
        if (!string.IsNullOrEmpty(categoryId))
        {
            filter &= Builders<MenuItem>.Filter.Eq(m => m.CategoryId, categoryId);
        }

        var items = await _context.MenuItems.Find(filter).ToListAsync();
        return Ok(new { success = true, data = items });
    }

    [HttpPost("items")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> CreateMenuItem([FromBody] MenuItem item)
    {
        item.TenantId = _currentUser.TenantId ?? string.Empty;
        item.OutletId = _currentUser.OutletId ?? string.Empty;
        item.CreatedAt = DateTime.UtcNow;
        item.IsActive = true;

        await _context.MenuItems.InsertOneAsync(item);
        return Ok(new { success = true, data = item });
    }

    [HttpPut("items/{id}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
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
