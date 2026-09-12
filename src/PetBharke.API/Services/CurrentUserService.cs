using System.Security.Claims;
using PetBharke.Application.Interfaces;

namespace PetBharke.API.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string? UserId => _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value 
        ?? _httpContextAccessor.HttpContext?.User?.FindFirst("sub")?.Value;

    public string? Username => _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Name)?.Value
        ?? _httpContextAccessor.HttpContext?.User?.FindFirst("unique_name")?.Value;

    public string? TenantId => _httpContextAccessor.HttpContext?.User?.FindFirst("tenantId")?.Value;

    public string? OutletId => _httpContextAccessor.HttpContext?.User?.FindFirst("outletId")?.Value;

    public string? Role => _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Role)?.Value;

    public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;
}
