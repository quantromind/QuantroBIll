using System;
using System.Threading.Tasks;
using MongoDB.Driver;
using PetBharke.Domain.Entities;
using Xunit;
using Xunit.Abstractions;

namespace PetBharke.IntegrationTests;

public class FindBiryaniOutlet
{
    private readonly ITestOutputHelper _output;

    public FindBiryaniOutlet(ITestOutputHelper output)
    {
        _output = output;
    }

    [Fact]
    public async Task PrintBiryaniOutletAndUsers()
    {
        var connStr = "mongodb+srv://prathameshsm0425:prathamesh123@cluster0.atbnfrf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
        var client = new MongoClient(connStr);
        var db = client.GetDatabase("petbharke");

        var tenantsColl = db.GetCollection<Tenant>("tenants");
        var outletsColl = db.GetCollection<Outlet>("outlets");
        var usersColl = db.GetCollection<User>("users");

        var tenants = await tenantsColl.Find(_ => true).ToListAsync();
        _output.WriteLine("=== ALL TENANTS ===");
        foreach (var t in tenants)
        {
            _output.WriteLine($"Tenant: Id={t.Id}, Name={t.BusinessName}, Email={t.OwnerEmail}");
        }

        var outlets = await outletsColl.Find(_ => true).ToListAsync();
        _output.WriteLine("\n=== ALL OUTLETS ===");
        foreach (var o in outlets)
        {
            _output.WriteLine($"Outlet: Id={o.Id}, TenantId={o.TenantId}, Name={o.Name}, Code={o.Code}");
        }

        var users = await usersColl.Find(_ => true).ToListAsync();
        _output.WriteLine("\n=== ALL USERS ===");
        foreach (var u in users)
        {
            _output.WriteLine($"User: Id={u.Id}, TenantId={u.TenantId}, Role={u.Role}, Username={u.Username}, FullName={u.FullName}, Pin={u.Pin}");
        }
    }

    [Fact]
    public async Task TestPinLoginAndCreateOrder()
    {
        using var http = new System.Net.Http.HttpClient();
        http.BaseAddress = new Uri("http://localhost:5000/api/");

        // 1. Pin Login
        var loginPayload = new { outletId = "6aa6e78ef974ff46050b72eb", pin = "6263" };
        var loginRes = await http.PostAsync("auth/pin-login", new System.Net.Http.StringContent(
            System.Text.Json.JsonSerializer.Serialize(loginPayload),
            System.Text.Encoding.UTF8,
            "application/json"
        ));

        var loginBody = await loginRes.Content.ReadAsStringAsync();
        _output.WriteLine($"Login status: {loginRes.StatusCode}");
        _output.WriteLine($"Login response: {loginBody}");
        Assert.True(loginRes.IsSuccessStatusCode, $"Login failed: {loginBody}");

        using var doc = System.Text.Json.JsonDocument.Parse(loginBody);
        var token = doc.RootElement.GetProperty("data").GetProperty("accessToken").GetString();
        var tenantId = doc.RootElement.GetProperty("data").GetProperty("tenant").GetProperty("id").GetString();
        var outletId = doc.RootElement.GetProperty("data").GetProperty("activeOutlet").GetProperty("id").GetString();

        // 2. Create Order
        http.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        http.DefaultRequestHeaders.Add("X-Tenant-Id", tenantId);
        http.DefaultRequestHeaders.Add("X-Outlet-Id", outletId);

        var orderPayload = new
        {
            orderType = 1,
            tableNumber = "T-12",
            items = new[]
            {
                new
                {
                    menuItemId = "test-item-1",
                    name = "Paneer Butter Masala",
                    quantity = 1,
                    unitPrice = 240,
                    totalPrice = 240,
                    isVeg = true,
                    itemNote = ""
                }
            },
            orderNotes = ""
        };

        var orderRes = await http.PostAsync("orders", new System.Net.Http.StringContent(
            System.Text.Json.JsonSerializer.Serialize(orderPayload),
            System.Text.Encoding.UTF8,
            "application/json"
        ));

        var orderBody = await orderRes.Content.ReadAsStringAsync();
        _output.WriteLine($"Order status: {orderRes.StatusCode}");
        _output.WriteLine($"Order response: {orderBody}");
        Assert.True(orderRes.IsSuccessStatusCode, $"Create order failed: {orderBody}");
    }
}
