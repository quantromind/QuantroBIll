using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace PetBharke.API.Hubs;

public class OrderHub : Hub
{
    private string? GetUserTenantId() => Context.User?.FindFirst("tenantId")?.Value;

    public async Task JoinOutletGroup(string tenantId, string outletId)
    {
        var userTenantId = GetUserTenantId();
        if (string.IsNullOrEmpty(userTenantId) || userTenantId != tenantId)
        {
            await Clients.Caller.SendAsync("Error", "Access denied: tenant mismatch.");
            return;
        }
        var groupName = $"outlet_{tenantId}_{outletId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
    }

    public async Task LeaveOutletGroup(string tenantId, string outletId)
    {
        var groupName = $"outlet_{tenantId}_{outletId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
    }

    public async Task JoinKitchenGroup(string tenantId, string outletId)
    {
        var userTenantId = GetUserTenantId();
        if (string.IsNullOrEmpty(userTenantId) || userTenantId != tenantId)
        {
            await Clients.Caller.SendAsync("Error", "Access denied: tenant mismatch.");
            return;
        }
        var groupName = $"kds_{tenantId}_{outletId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
    }

    public async Task LeaveKitchenGroup(string tenantId, string outletId)
    {
        var groupName = $"kds_{tenantId}_{outletId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
    }

    public async Task BroadcastTableStatus(string tenantId, string outletId, object tableStatusData)
    {
        var userTenantId = GetUserTenantId();
        if (string.IsNullOrEmpty(userTenantId) || userTenantId != tenantId)
        {
            await Clients.Caller.SendAsync("Error", "Access denied: tenant mismatch.");
            return;
        }
        var groupName = $"outlet_{tenantId}_{outletId}";
        await Clients.Group(groupName).SendAsync("TableStatusChanged", tableStatusData);
    }

    public async Task BroadcastKOTReceived(string tenantId, string outletId, object kotData)
    {
        var userTenantId = GetUserTenantId();
        if (string.IsNullOrEmpty(userTenantId) || userTenantId != tenantId)
        {
            await Clients.Caller.SendAsync("Error", "Access denied: tenant mismatch.");
            return;
        }
        var kdsGroup = $"kds_{tenantId}_{outletId}";
        var outletGroup = $"outlet_{tenantId}_{outletId}";
        await Clients.Group(kdsGroup).SendAsync("NewKOTReceived", kotData);
        await Clients.Group(outletGroup).SendAsync("NewKOTReceived", kotData);
    }
}
