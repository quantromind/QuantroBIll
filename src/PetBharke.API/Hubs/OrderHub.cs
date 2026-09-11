using Microsoft.AspNetCore.SignalR;

namespace PetBharke.API.Hubs;

public class OrderHub : Hub
{
    public async Task JoinOutletGroup(string tenantId, string outletId)
    {
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
        var groupName = $"outlet_{tenantId}_{outletId}";
        await Clients.Group(groupName).SendAsync("TableStatusChanged", tableStatusData);
    }

    public async Task BroadcastKOTReceived(string tenantId, string outletId, object kotData)
    {
        var kdsGroup = $"kds_{tenantId}_{outletId}";
        var outletGroup = $"outlet_{tenantId}_{outletId}";
        await Clients.Group(kdsGroup).SendAsync("NewKOTReceived", kotData);
        await Clients.Group(outletGroup).SendAsync("NewKOTReceived", kotData);
    }
}
