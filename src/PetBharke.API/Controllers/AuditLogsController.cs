using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using PetBharke.Application.Interfaces;
using PetBharke.Domain.Entities;

namespace PetBharke.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin")]
public class AuditLogsController : ControllerBase
{
    private readonly IMongoDbContext _context;

    public AuditLogsController(IMongoDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] string? search,
        [FromQuery] string? action,
        [FromQuery] string? targetType,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 15;

        var builder = Builders<AuditLog>.Filter;
        var filter = builder.Empty;

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            filter &= (builder.Regex(a => a.UserName, new MongoDB.Bson.BsonRegularExpression(s, "i")) |
                       builder.Regex(a => a.Action, new MongoDB.Bson.BsonRegularExpression(s, "i")) |
                       builder.Regex(a => a.Details, new MongoDB.Bson.BsonRegularExpression(s, "i")) |
                       builder.Regex(a => a.TargetId, new MongoDB.Bson.BsonRegularExpression(s, "i")));
        }

        if (!string.IsNullOrWhiteSpace(action) && action != "All")
        {
            filter &= builder.Eq(a => a.Action, action.Trim());
        }

        if (!string.IsNullOrWhiteSpace(targetType) && targetType != "All")
        {
            filter &= builder.Eq(a => a.TargetType, targetType.Trim());
        }

        var totalItems = await _context.AuditLogs.CountDocumentsAsync(filter);
        var logs = await _context.AuditLogs.Find(filter)
            .SortByDescending(a => a.Timestamp)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync();

        return Ok(new
        {
            success = true,
            data = logs,
            pagination = new
            {
                currentPage = page,
                pageSize,
                totalItems,
                totalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
            }
        });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetAuditStats()
    {
        var total = await _context.AuditLogs.CountDocumentsAsync(_ => true);
        var todayStart = DateTime.UtcNow.Date;
        var todayCount = await _context.AuditLogs.CountDocumentsAsync(a => a.Timestamp >= todayStart);

        var securityActions = new[] { "ImpersonateTenant", "ToggleTenantStatus", "SuspendTenant", "DeleteTenant", "CreateUser", "UpdateUserRole" };
        var securityCount = await _context.AuditLogs.CountDocumentsAsync(a => securityActions.Contains(a.Action));

        var configActions = new[] { "UpdateTenantFeatures", "UpdatePlan", "CreatePlan", "UpdateSettings" };
        var configCount = await _context.AuditLogs.CountDocumentsAsync(a => configActions.Contains(a.Action));

        return Ok(new
        {
            success = true,
            data = new
            {
                totalEvents = total,
                eventsToday = todayCount,
                securityActions = securityCount,
                configChanges = configCount
            }
        });
    }
}
