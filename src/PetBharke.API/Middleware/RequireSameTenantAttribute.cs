using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using PetBharke.Application.Interfaces;
using PetBharke.Domain.Enums;

namespace PetBharke.API.Middleware;

/// <summary>
/// Action filter that validates the {id} (or {tenantId}) route parameter matches the
/// current JWT user's TenantId. SuperAdmin is exempt.
/// Usage: [RequireSameTenant] on controller actions that take a tenant ID from the URL.
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = false)]
public class RequireSameTenantAttribute : TypeFilterAttribute
{
    public RequireSameTenantAttribute() : base(typeof(RequireSameTenantFilter))
    {
    }
}

public class RequireSameTenantFilter : IAsyncActionFilter
{
    private readonly ICurrentUserService _currentUserService;

    public RequireSameTenantFilter(ICurrentUserService currentUserService)
    {
        _currentUserService = currentUserService;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        // SuperAdmin bypasses tenant checks
        if (_currentUserService.Role == nameof(UserRole.SuperAdmin))
        {
            await next();
            return;
        }

        // Try to find tenantId from route values: look for "id" or "tenantId"
        string? routeTenantId = null;
        if (context.ActionArguments.TryGetValue("id", out var idVal))
        {
            routeTenantId = idVal?.ToString();
        }
        else if (context.ActionArguments.TryGetValue("tenantId", out var tenantVal))
        {
            routeTenantId = tenantVal?.ToString();
        }

        if (!string.IsNullOrEmpty(routeTenantId))
        {
            var userTenantId = _currentUserService.TenantId;
            if (string.IsNullOrEmpty(userTenantId) || userTenantId != routeTenantId)
            {
                context.Result = new ObjectResult(new
                {
                    success = false,
                    message = "Access denied: tenant mismatch."
                })
                {
                    StatusCode = 403
                };
                return;
            }
        }

        await next();
    }
}
