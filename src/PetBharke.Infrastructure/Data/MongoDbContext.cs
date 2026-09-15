using Microsoft.Extensions.Configuration;
using MongoDB.Driver;
using PetBharke.Application.Interfaces;
using PetBharke.Domain.Entities;

namespace PetBharke.Infrastructure.Data;

public class MongoDbContext : IMongoDbContext
{
    private readonly IMongoDatabase _database;
    private readonly IMongoClient _client;

    public MongoDbContext(IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("MongoDb") 
            ?? configuration["MongoDB:ConnectionString"] 
            ?? throw new InvalidOperationException("MongoDB connection string must be configured via ConnectionStrings:MongoDb or MongoDB:ConnectionString.");
            
        var databaseName = configuration["MongoDB:DatabaseName"] ?? "petbharke";

        var settings = MongoClientSettings.FromConnectionString(connectionString);
        settings.ServerApi = new ServerApi(ServerApiVersion.V1);
        
        _client = new MongoClient(settings);
        _database = _client.GetDatabase(databaseName);

        // Ensure indexes in background
        Task.Run(CreateIndexesAsync);
    }

    public IMongoDatabase Database => _database;

    public IMongoCollection<Tenant> Tenants => _database.GetCollection<Tenant>("tenants");
    public IMongoCollection<Outlet> Outlets => _database.GetCollection<Outlet>("outlets");
    public IMongoCollection<User> Users => _database.GetCollection<User>("users");
    public IMongoCollection<Category> Categories => _database.GetCollection<Category>("categories");
    public IMongoCollection<MenuItem> MenuItems => _database.GetCollection<MenuItem>("menuItems");
    public IMongoCollection<Order> Orders => _database.GetCollection<Order>("orders");
    public IMongoCollection<Customer> Customers => _database.GetCollection<Customer>("customers");
    public IMongoCollection<RestaurantTable> Tables => _database.GetCollection<RestaurantTable>("tables");
    public IMongoCollection<InventoryItem> Inventory => _database.GetCollection<InventoryItem>("inventory");
    public IMongoCollection<Expense> Expenses => _database.GetCollection<Expense>("expenses");
    public IMongoCollection<CashFlowEntry> CashFlowEntries => _database.GetCollection<CashFlowEntry>("cashFlowEntries");
    public IMongoCollection<Discount> Discounts => _database.GetCollection<Discount>("discounts");
    public IMongoCollection<Feedback> Feedbacks => _database.GetCollection<Feedback>("feedbacks");
    public IMongoCollection<AuditLog> AuditLogs => _database.GetCollection<AuditLog>("auditLogs");
    public IMongoCollection<Plan> Plans => _database.GetCollection<Plan>("plans");
    public IMongoCollection<SubscriptionInvoice> SubscriptionInvoices => _database.GetCollection<SubscriptionInvoice>("subscriptionInvoices");
    public IMongoCollection<Announcement> Announcements => _database.GetCollection<Announcement>("announcements");
    public IMongoCollection<PlatformCoupon> PlatformCoupons => _database.GetCollection<PlatformCoupon>("platformCoupons");
    public IMongoCollection<PlatformSetting> PlatformSettings => _database.GetCollection<PlatformSetting>("platformSettings");

    public Task<IClientSessionHandle> StartSessionAsync(CancellationToken cancellationToken = default)
    {
        return _client.StartSessionAsync(cancellationToken: cancellationToken);
    }

    private async Task CreateIndexesAsync()
    {
        try
        {
            // Drop any legacy incompatible indexes if needed
            try
            {
                var userIndexes = await Users.Indexes.ListAsync();
                var indexDocs = await userIndexes.ToListAsync();
                foreach (var idx in indexDocs)
                {
                    var name = idx.GetValue("name", "").AsString;
                    if (name.StartsWith("Email_") && name != "email_1")
                    {
                        try { await Users.Indexes.DropOneAsync(name); } catch { }
                    }
                }
            }
            catch { }

            // Users
            var userEmailIndex = new CreateIndexModel<User>(
                Builders<User>.IndexKeys.Ascending(u => u.Email),
                new CreateIndexOptions { Sparse = true });
            await Users.Indexes.CreateOneAsync(userEmailIndex);

            var userIndex = new CreateIndexModel<User>(
                Builders<User>.IndexKeys.Ascending(u => u.TenantId).Ascending(u => u.Username),
                new CreateIndexOptions { Sparse = true });
            await Users.Indexes.CreateOneAsync(userIndex);

            // Outlets
            var outletIndex = new CreateIndexModel<Outlet>(
                Builders<Outlet>.IndexKeys.Ascending(o => o.TenantId).Ascending(o => o.Code),
                new CreateIndexOptions { Sparse = true });
            await Outlets.Indexes.CreateOneAsync(outletIndex);

            // Categories
            var catIndex = new CreateIndexModel<Category>(
                Builders<Category>.IndexKeys.Ascending(c => c.TenantId).Ascending(c => c.OutletId).Ascending(c => c.DisplayOrder),
                new CreateIndexOptions { Sparse = true });
            await Categories.Indexes.CreateOneAsync(catIndex);

            // MenuItems
            var itemIndex = new CreateIndexModel<MenuItem>(
                Builders<MenuItem>.IndexKeys.Ascending(m => m.TenantId).Ascending(m => m.OutletId).Ascending(m => m.CategoryId),
                new CreateIndexOptions { Sparse = true });
            await MenuItems.Indexes.CreateOneAsync(itemIndex);

            // Orders
            var orderIndex = new CreateIndexModel<Order>(
                Builders<Order>.IndexKeys.Ascending(o => o.TenantId).Ascending(o => o.OutletId).Descending(o => o.PlacedAt),
                new CreateIndexOptions { Sparse = true });
            await Orders.Indexes.CreateOneAsync(orderIndex);

            // AuditLogs
            var auditIndex = new CreateIndexModel<AuditLog>(
                Builders<AuditLog>.IndexKeys.Descending(a => a.Timestamp).Ascending(a => a.Action));
            await AuditLogs.Indexes.CreateOneAsync(auditIndex);

            // Plans
            var planIndex = new CreateIndexModel<Plan>(
                Builders<Plan>.IndexKeys.Ascending(p => p.Code),
                new CreateIndexOptions { Unique = true, Sparse = true });
            await Plans.Indexes.CreateOneAsync(planIndex);

            // SubscriptionInvoices
            var invoiceIndex = new CreateIndexModel<SubscriptionInvoice>(
                Builders<SubscriptionInvoice>.IndexKeys.Ascending(i => i.InvoiceNumber),
                new CreateIndexOptions { Unique = true, Sparse = true });
            await SubscriptionInvoices.Indexes.CreateOneAsync(invoiceIndex);

            // Coupons
            var couponIndex = new CreateIndexModel<PlatformCoupon>(
                Builders<PlatformCoupon>.IndexKeys.Ascending(c => c.Code),
                new CreateIndexOptions { Unique = true, Sparse = true });
            await PlatformCoupons.Indexes.CreateOneAsync(couponIndex);
        }
        catch
        {
            // Ignore index setup exceptions
        }
    }
}
