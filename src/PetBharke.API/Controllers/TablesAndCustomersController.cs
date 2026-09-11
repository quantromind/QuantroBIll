using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using MongoDB.Driver;
using PetBharke.API.Hubs;
using PetBharke.Application.Interfaces;
using PetBharke.Domain.Entities;

namespace PetBharke.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TablesController : ControllerBase
{
    private readonly IMongoDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IHubContext<OrderHub> _orderHub;

    public TablesController(
        IMongoDbContext context,
        ICurrentUserService currentUser,
        IHubContext<OrderHub> orderHub)
    {
        _context = context;
        _currentUser = currentUser;
        _orderHub = orderHub;
    }

    [HttpGet]
    public async Task<IActionResult> GetTables()
    {
        var tenantId = _currentUser.TenantId;
        var tables = await _context.Tables
            .Find(t => t.TenantId == tenantId && t.IsActive)
            .SortBy(t => t.TableNumber)
            .ToListAsync();

        return Ok(new { success = true, data = tables });
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> CreateTable([FromBody] RestaurantTable table)
    {
        table.TenantId = _currentUser.TenantId ?? string.Empty;
        table.OutletId = _currentUser.OutletId ?? string.Empty;
        table.CreatedAt = DateTime.UtcNow;
        table.IsActive = true;

        await _context.Tables.InsertOneAsync(table);
        return Ok(new { success = true, data = table });
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateTableStatus(string id, [FromBody] TableStatusRequest request)
    {
        var table = await _context.Tables
            .Find(t => t.Id == id && t.TenantId == _currentUser.TenantId)
            .FirstOrDefaultAsync();

        if (table == null) return NotFound();

        await _context.Tables.UpdateOneAsync(
            t => t.Id == id,
            Builders<RestaurantTable>.Update
                .Set(t => t.IsOccupied, request.IsOccupied)
                .Set(t => t.CurrentOrderId, request.CurrentOrderId)
                .Set(t => t.UpdatedAt, DateTime.UtcNow)
        );

        var groupName = $"outlet_{table.TenantId}_{table.OutletId}";
        await _orderHub.Clients.Group(groupName).SendAsync("TableStatusChanged", new
        {
            tableId = table.Id,
            tableNumber = table.TableNumber,
            isOccupied = request.IsOccupied,
            currentOrderId = request.CurrentOrderId
        });

        return Ok(new { success = true, message = "Table status updated." });
    }

    [HttpPost("{tableNumber}/vacate")]
    public async Task<IActionResult> VacateTable(string tableNumber)
    {
        var tenantId = _currentUser.TenantId;
        var outletId = _currentUser.OutletId ?? string.Empty;
        var table = await _context.Tables
            .Find(t => t.TenantId == tenantId && t.TableNumber.ToLower() == tableNumber.ToLower())
            .FirstOrDefaultAsync();

        if (table != null)
        {
            await _context.Tables.UpdateOneAsync(
                t => t.Id == table.Id,
                Builders<RestaurantTable>.Update
                    .Set(t => t.IsOccupied, false)
                    .Set(t => t.CurrentOrderId, null)
                    .Set(t => t.UpdatedAt, DateTime.UtcNow)
            );
        }

        var groupName = $"outlet_{tenantId}_{outletId}";
        await _orderHub.Clients.Group(groupName).SendAsync("TableStatusChanged", new
        {
            tableNumber = tableNumber,
            isOccupied = false,
            currentOrderId = (string?)null,
            orderTotal = 0m
        });

        return Ok(new { success = true, message = $"Table {tableNumber} vacated." });
    }

    [HttpPost("shift")]
    public async Task<IActionResult> ShiftTable([FromBody] ShiftTableRequest req)
    {
        var tenantId = _currentUser.TenantId;
        var outletId = _currentUser.OutletId ?? string.Empty;

        var fromTable = await _context.Tables
            .Find(t => t.TenantId == tenantId && t.TableNumber.ToLower() == req.FromTableNumber.ToLower())
            .FirstOrDefaultAsync();
        var toTable = await _context.Tables
            .Find(t => t.TenantId == tenantId && t.TableNumber.ToLower() == req.ToTableNumber.ToLower())
            .FirstOrDefaultAsync();

        if (fromTable != null && toTable != null)
        {
            var currentOrderId = fromTable.CurrentOrderId;
            await _context.Tables.UpdateOneAsync(
                t => t.Id == fromTable.Id,
                Builders<RestaurantTable>.Update.Set(t => t.IsOccupied, false).Set(t => t.CurrentOrderId, null).Set(t => t.UpdatedAt, DateTime.UtcNow)
            );
            await _context.Tables.UpdateOneAsync(
                t => t.Id == toTable.Id,
                Builders<RestaurantTable>.Update.Set(t => t.IsOccupied, true).Set(t => t.CurrentOrderId, currentOrderId).Set(t => t.UpdatedAt, DateTime.UtcNow)
            );

            if (!string.IsNullOrEmpty(currentOrderId))
            {
                await _context.Orders.UpdateOneAsync(
                    o => o.Id == currentOrderId,
                    Builders<Order>.Update.Set(o => o.TableNumber, req.ToTableNumber).Set(o => o.UpdatedAt, DateTime.UtcNow)
                );
            }
        }

        var groupName = $"outlet_{tenantId}_{outletId}";
        await _orderHub.Clients.Group(groupName).SendAsync("TableStatusChanged", new
        {
            tableNumber = req.FromTableNumber,
            isOccupied = false,
            currentOrderId = (string?)null
        });
        await _orderHub.Clients.Group(groupName).SendAsync("TableStatusChanged", new
        {
            tableNumber = req.ToTableNumber,
            isOccupied = true,
            currentOrderId = fromTable?.CurrentOrderId
        });

        return Ok(new { success = true, message = $"Table shifted from {req.FromTableNumber} to {req.ToTableNumber}." });
    }

    [HttpPost("merge")]
    public async Task<IActionResult> MergeTables([FromBody] MergeTablesRequest req)
    {
        var tenantId = _currentUser.TenantId;
        var outletId = _currentUser.OutletId ?? string.Empty;

        var sourceTable = await _context.Tables
            .Find(t => t.TenantId == tenantId && t.TableNumber.ToLower() == req.SourceTableNumber.ToLower())
            .FirstOrDefaultAsync();
        var targetTable = await _context.Tables
            .Find(t => t.TenantId == tenantId && t.TableNumber.ToLower() == req.TargetTableNumber.ToLower())
            .FirstOrDefaultAsync();

        if (sourceTable != null && targetTable != null)
        {
            await _context.Tables.UpdateOneAsync(
                t => t.Id == sourceTable.Id,
                Builders<RestaurantTable>.Update.Set(t => t.IsOccupied, false).Set(t => t.CurrentOrderId, null).Set(t => t.UpdatedAt, DateTime.UtcNow)
            );
            await _context.Tables.UpdateOneAsync(
                t => t.Id == targetTable.Id,
                Builders<RestaurantTable>.Update.Set(t => t.IsOccupied, true).Set(t => t.UpdatedAt, DateTime.UtcNow)
            );
        }

        var groupName = $"outlet_{tenantId}_{outletId}";
        await _orderHub.Clients.Group(groupName).SendAsync("TableStatusChanged", new
        {
            tableNumber = req.SourceTableNumber,
            isOccupied = false,
            currentOrderId = (string?)null
        });
        await _orderHub.Clients.Group(groupName).SendAsync("TableStatusChanged", new
        {
            tableNumber = req.TargetTableNumber,
            isOccupied = true
        });

        return Ok(new { success = true, message = $"Tables merged from {req.SourceTableNumber} into {req.TargetTableNumber}." });
    }
}

public class TableStatusRequest
{
    public bool IsOccupied { get; set; }
    public string? CurrentOrderId { get; set; }
}

public class ShiftTableRequest
{
    public string FromTableNumber { get; set; } = string.Empty;
    public string ToTableNumber { get; set; } = string.Empty;
}

public class MergeTablesRequest
{
    public string SourceTableNumber { get; set; } = string.Empty;
    public string TargetTableNumber { get; set; } = string.Empty;
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly IMongoDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public CustomersController(IMongoDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> GetCustomers([FromQuery] string? search)
    {
        var tenantId = _currentUser.TenantId;
        var builder = Builders<Customer>.Filter;
        var filter = builder.Eq(c => c.IsActive, true);

        if (!string.IsNullOrEmpty(tenantId)) filter &= builder.Eq(c => c.TenantId, tenantId);
        if (!string.IsNullOrEmpty(search))
        {
            filter &= builder.Or(
                builder.Regex(c => c.Phone, new MongoDB.Bson.BsonRegularExpression(search, "i")),
                builder.Regex(c => c.Name, new MongoDB.Bson.BsonRegularExpression(search, "i"))
            );
        }

        var customers = await _context.Customers.Find(filter).Limit(20).ToListAsync();
        return Ok(new { success = true, data = customers });
    }

    [HttpPost]
    public async Task<IActionResult> CreateOrUpdateCustomer([FromBody] Customer customer)
    {
        var tenantId = _currentUser.TenantId ?? string.Empty;
        var existing = await _context.Customers
            .Find(c => c.TenantId == tenantId && c.Phone == customer.Phone)
            .FirstOrDefaultAsync();

        if (existing != null)
        {
            existing.Name = customer.Name;
            existing.Email = customer.Email ?? existing.Email;
            existing.Address = customer.Address ?? existing.Address;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.Customers.ReplaceOneAsync(c => c.Id == existing.Id, existing);
            return Ok(new { success = true, data = existing });
        }

        customer.TenantId = tenantId;
        customer.OutletId = _currentUser.OutletId ?? string.Empty;
        customer.CreatedAt = DateTime.UtcNow;
        customer.IsActive = true;

        await _context.Customers.InsertOneAsync(customer);
        return Ok(new { success = true, data = customer });
    }
}
