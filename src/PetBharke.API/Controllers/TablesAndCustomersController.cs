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
    [Authorize(Roles = "SuperAdmin,Owner,Manager")]
    public async Task<IActionResult> CreateTable([FromBody] RestaurantTable table)
    {
        var tenantId = _currentUser.TenantId ?? string.Empty;
        var outletId = _currentUser.OutletId ?? string.Empty;

        if (string.IsNullOrEmpty(table.Id))
        {
            table.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
        }

        table.TenantId = tenantId;
        table.OutletId = outletId;
        table.CreatedAt = DateTime.UtcNow;
        table.IsActive = true;
        table.TableNumber = table.TableNumber?.Trim().ToUpper() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(table.TableNumber))
        {
            return BadRequest(new { success = false, message = "Table number cannot be empty." });
        }

        // Check if tableNumber already exists for this tenant
        var exists = await _context.Tables
            .Find(t => t.TenantId == tenantId && t.IsActive && t.TableNumber == table.TableNumber)
            .AnyAsync();

        if (exists)
        {
            return BadRequest(new { success = false, message = $"Table '{table.TableNumber}' already exists." });
        }

        await _context.Tables.InsertOneAsync(table);

        var groupName = $"outlet_{tenantId}_{outletId}";
        await _orderHub.Clients.Group(groupName).SendAsync("TableListChanged", new { action = "created", tableId = table.Id });

        return Ok(new { success = true, data = table });
    }

    [HttpPost("bulk")]
    [Authorize(Roles = "SuperAdmin,Owner,Manager")]
    public async Task<IActionResult> BulkCreateTables([FromBody] BulkTableCreateRequest req)
    {
        var tenantId = _currentUser.TenantId ?? string.Empty;
        var outletId = _currentUser.OutletId ?? string.Empty;

        if (req.StartNumber <= 0 || req.EndNumber < req.StartNumber)
        {
            return BadRequest(new { success = false, message = "Invalid start or end number range." });
        }

        if (req.EndNumber - req.StartNumber > 100)
        {
            return BadRequest(new { success = false, message = "Cannot generate more than 100 tables in a single batch." });
        }

        var existingTables = await _context.Tables
            .Find(t => t.TenantId == tenantId && t.IsActive)
            .ToListAsync();
        var existingNumbers = new HashSet<string>(existingTables.Select(t => t.TableNumber.ToUpper()));

        var prefix = string.IsNullOrWhiteSpace(req.Prefix) ? "T-" : req.Prefix.Trim();
        var section = string.IsNullOrWhiteSpace(req.Section) ? "Main Hall" : req.Section.Trim();
        var capacity = req.Capacity > 0 ? req.Capacity : 4;

        var newTables = new List<RestaurantTable>();
        for (int i = req.StartNumber; i <= req.EndNumber; i++)
        {
            var tableNum = $"{prefix}{i}".ToUpper();
            if (existingNumbers.Contains(tableNum)) continue;

            newTables.Add(new RestaurantTable
            {
                Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
                TenantId = tenantId,
                OutletId = outletId,
                TableNumber = tableNum,
                Section = section,
                SeatingCapacity = capacity,
                IsOccupied = false,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }

        if (newTables.Count > 0)
        {
            await _context.Tables.InsertManyAsync(newTables);
            var groupName = $"outlet_{tenantId}_{outletId}";
            await _orderHub.Clients.Group(groupName).SendAsync("TableListChanged", new { action = "bulk_created", count = newTables.Count });
        }

        return Ok(new { success = true, message = $"Generated {newTables.Count} tables successfully.", data = newTables });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "SuperAdmin,Owner,Manager")]
    public async Task<IActionResult> UpdateTable(string id, [FromBody] UpdateTableRequest req)
    {
        var tenantId = _currentUser.TenantId ?? string.Empty;
        var outletId = _currentUser.OutletId ?? string.Empty;

        var table = await _context.Tables
            .Find(t => t.Id == id && t.TenantId == tenantId && t.IsActive)
            .FirstOrDefaultAsync();

        if (table == null) return NotFound(new { success = false, message = "Table not found." });

        var updateBuilder = Builders<RestaurantTable>.Update
            .Set(t => t.UpdatedAt, DateTime.UtcNow);

        if (!string.IsNullOrWhiteSpace(req.TableNumber))
        {
            var newTableNum = req.TableNumber.Trim().ToUpper();
            if (newTableNum != table.TableNumber.ToUpper())
            {
                var duplicate = await _context.Tables
                    .Find(t => t.TenantId == tenantId && t.IsActive && t.Id != id && t.TableNumber == newTableNum)
                    .AnyAsync();
                if (duplicate)
                {
                    return BadRequest(new { success = false, message = $"Table '{newTableNum}' already exists." });
                }
            }
            updateBuilder = updateBuilder.Set(t => t.TableNumber, newTableNum);
        }

        if (!string.IsNullOrWhiteSpace(req.Section))
        {
            updateBuilder = updateBuilder.Set(t => t.Section, req.Section.Trim());
        }

        if (req.SeatingCapacity > 0)
        {
            updateBuilder = updateBuilder.Set(t => t.SeatingCapacity, req.SeatingCapacity);
        }

        await _context.Tables.UpdateOneAsync(t => t.Id == id, updateBuilder);

        var groupName = $"outlet_{tenantId}_{outletId}";
        await _orderHub.Clients.Group(groupName).SendAsync("TableListChanged", new { action = "updated", tableId = id });

        return Ok(new { success = true, message = "Table updated successfully." });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "SuperAdmin,Owner,Manager")]
    public async Task<IActionResult> DeleteTable(string id)
    {
        var tenantId = _currentUser.TenantId ?? string.Empty;
        var outletId = _currentUser.OutletId ?? string.Empty;

        var table = await _context.Tables
            .Find(t => t.Id == id && t.TenantId == tenantId && t.IsActive)
            .FirstOrDefaultAsync();

        if (table == null) return NotFound(new { success = false, message = "Table not found." });

        if (table.IsOccupied)
        {
            return BadRequest(new { success = false, message = $"Cannot delete table {table.TableNumber} while it is currently occupied. Please vacate the table first." });
        }

        await _context.Tables.UpdateOneAsync(
            t => t.Id == id,
            Builders<RestaurantTable>.Update
                .Set(t => t.IsActive, false)
                .Set(t => t.UpdatedAt, DateTime.UtcNow)
        );

        var groupName = $"outlet_{tenantId}_{outletId}";
        await _orderHub.Clients.Group(groupName).SendAsync("TableListChanged", new { action = "deleted", tableId = id, tableNumber = table.TableNumber });

        return Ok(new { success = true, message = $"Table {table.TableNumber} deleted successfully." });
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
        var kdsGroupName = $"kds_{tenantId}_{outletId}";

        await _orderHub.Clients.Group(groupName).SendAsync("TableStatusChanged", new
        {
            tableNumber = tableNumber,
            isOccupied = false,
            currentOrderId = (string?)null,
            orderTotal = 0m
        });

        // Broadcast to KDS and Outlet groups that table orders are completed/settled
        await _orderHub.Clients.Group(kdsGroupName).SendAsync("ReceiveOrderUpdate", new
        {
            tableNumber = tableNumber,
            status = 5
        });
        await _orderHub.Clients.Group(groupName).SendAsync("ReceiveOrderUpdate", new
        {
            tableNumber = tableNumber,
            status = 5
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

public class BulkTableCreateRequest
{
    public string Prefix { get; set; } = "T-";
    public int StartNumber { get; set; } = 1;
    public int EndNumber { get; set; } = 10;
    public string Section { get; set; } = "Main Hall";
    public int Capacity { get; set; } = 4;
}

public class UpdateTableRequest
{
    public string? TableNumber { get; set; }
    public string? Section { get; set; }
    public int SeatingCapacity { get; set; }
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
        if (string.IsNullOrEmpty(tenantId))
            return Unauthorized(new { success = false, message = "Tenant context required." });

        var builder = Builders<Customer>.Filter;
        var filter = builder.Eq(c => c.IsActive, true)
            & builder.Eq(c => c.TenantId, tenantId);

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
