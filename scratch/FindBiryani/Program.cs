using System;
using System.Threading.Tasks;
using MongoDB.Bson;
using MongoDB.Driver;

class Program
{
    static async Task Main()
    {
        var connStr = "mongodb+srv://prathameshsm0425:prathamesh123@cluster0.atbnfrf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
        var client = new MongoClient(connStr);
        var db = client.GetDatabase("petbharke");

        var tenantsColl = db.GetCollection<BsonDocument>("tenants");
        var outletsColl = db.GetCollection<BsonDocument>("outlets");
        var usersColl = db.GetCollection<BsonDocument>("users");

        Console.WriteLine("=== TENANTS ===");
        var tenants = await tenantsColl.Find(new BsonDocument()).ToListAsync();
        foreach (var t in tenants)
        {
            Console.WriteLine($"Tenant: {t.GetValue("_id", "")} | {t.GetValue("businessName", "")} | {t.GetValue("ownerEmail", "")}");
        }

        Console.WriteLine("\n=== OUTLETS ===");
        var outlets = await outletsColl.Find(new BsonDocument()).ToListAsync();
        foreach (var o in outlets)
        {
            Console.WriteLine($"Outlet: Id={o.GetValue("_id", "")} | TenantId={o.GetValue("tenantId", "")} | Name={o.GetValue("name", "")} | Code={o.GetValue("code", "")}");
        }

        Console.WriteLine("\n=== USERS ===");
        var users = await usersColl.Find(new BsonDocument()).ToListAsync();
        foreach (var u in users)
        {
            Console.WriteLine($"User: Id={u.GetValue("_id", "")} | TenantId={u.GetValue("tenantId", "")} | Role={u.GetValue("role", "")} | Username={u.GetValue("username", "")} | Name={u.GetValue("fullName", "")} | Pin={u.GetValue("pin", "")}");
        }
    }
}
