using MongoDB.Driver;
using PetBharke.Domain.Entities;

namespace PetBharke.Application.Interfaces;

public interface IMongoDbContext
{
    IMongoDatabase Database { get; }
    IMongoCollection<Tenant> Tenants { get; }
    IMongoCollection<Outlet> Outlets { get; }
    IMongoCollection<User> Users { get; }
    IMongoCollection<Category> Categories { get; }
    IMongoCollection<MenuItem> MenuItems { get; }
    IMongoCollection<Order> Orders { get; }
    IMongoCollection<Customer> Customers { get; }
    IMongoCollection<RestaurantTable> Tables { get; }
    IMongoCollection<InventoryItem> Inventory { get; }
    IMongoCollection<Expense> Expenses { get; }
    IMongoCollection<CashFlowEntry> CashFlowEntries { get; }
    IMongoCollection<Discount> Discounts { get; }
    IMongoCollection<Feedback> Feedbacks { get; }
    IMongoCollection<AuditLog> AuditLogs { get; }

    Task<IClientSessionHandle> StartSessionAsync(CancellationToken cancellationToken = default);
}

public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(string id, string? tenantId = null, string? outletId = null, CancellationToken cancellationToken = default);
    Task<List<T>> GetAllAsync(string? tenantId = null, string? outletId = null, CancellationToken cancellationToken = default);
    Task<T> CreateAsync(T entity, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(string id, T entity, string? tenantId = null, string? outletId = null, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(string id, string? tenantId = null, string? outletId = null, CancellationToken cancellationToken = default);
}

public interface IJwtService
{
    string GenerateAccessToken(User user, string tenantId, string? outletId, string? outletName, string? tenantName);
    string GenerateRefreshToken();
    (string? UserId, string? TenantId, string? OutletId, string? Role) ValidateToken(string token);
}

public interface IPasswordHasher
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string passwordHash);
}

public interface ICurrentUserService
{
    string? UserId { get; }
    string? Username { get; }
    string? TenantId { get; }
    string? OutletId { get; }
    string? Role { get; }
    bool IsAuthenticated { get; }
}
