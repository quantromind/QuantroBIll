using Microsoft.AspNetCore.Http;
using MongoDB.Driver;
using PetBharke.Application.Interfaces;
using PetBharke.Domain.Entities;

namespace PetBharke.API.Services;

public class AuditLogService : IAuditLogService
{
    private readonly IMongoDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditLogService(
        IMongoDbContext context,
        ICurrentUserService currentUserService,
        IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _currentUserService = currentUserService;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task LogAsync(
        string action,
        string details,
        string? targetId = null,
        string? targetType = null,
        string? tenantId = null,
        string? changesJson = null,
        string status = "Success",
        string? ipAddress = null)
    {
        try
        {
            var resolvedIp = ipAddress;
            if (string.IsNullOrEmpty(resolvedIp))
            {
                var httpContext = _httpContextAccessor.HttpContext;
                resolvedIp = httpContext?.Connection?.RemoteIpAddress?.ToString()
                    ?? httpContext?.Request?.Headers["X-Forwarded-For"].FirstOrDefault()
                    ?? "127.0.0.1";
            }

            var resolvedTenantId = tenantId ?? _currentUserService.TenantId ?? "Platform";
            var resolvedUserId = _currentUserService.UserId ?? "system";
            var resolvedUserName = _currentUserService.Username ?? "SuperAdmin";

            var log = new AuditLog
            {
                TenantId = resolvedTenantId,
                UserId = resolvedUserId,
                UserName = resolvedUserName,
                ActorEmail = resolvedUserName.Contains("@") ? resolvedUserName : $"{resolvedUserName}@quantromind.com",
                Action = action,
                TargetId = targetId,
                TargetType = targetType,
                Details = details,
                ChangesJson = changesJson,
                IpAddress = resolvedIp,
                Status = status,
                Timestamp = DateTime.UtcNow
            };

            await _context.AuditLogs.InsertOneAsync(log);
        }
        catch (Exception ex)
        {
            // Logging failure should never crash the main operation
            Console.WriteLine($"--> [AuditLogService Error]: {ex.Message}");
        }
    }
}
