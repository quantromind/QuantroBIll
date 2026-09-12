using MongoDB.Bson;
using MongoDB.Driver;
using PetBharke.Application.Interfaces;
using PetBharke.Domain.Common;

namespace PetBharke.Infrastructure.Repositories;

public class MongoRepository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly IMongoCollection<T> _collection;

    public MongoRepository(IMongoDbContext context, string collectionName)
    {
        _collection = context.Database.GetCollection<T>(collectionName);
    }

    public async Task<T?> GetByIdAsync(string id, string? tenantId = null, string? outletId = null, CancellationToken cancellationToken = default)
    {
        var builder = Builders<T>.Filter;
        var filter = builder.Eq(x => x.Id, id);

        if (string.IsNullOrEmpty(tenantId))
            throw new ArgumentException("tenantId is required for data isolation.", nameof(tenantId));
        filter &= builder.Eq(x => x.TenantId, tenantId);

        if (!string.IsNullOrEmpty(outletId))
        {
            filter &= builder.Eq(x => x.OutletId, outletId);
        }

        return await _collection.Find(filter).FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<List<T>> GetAllAsync(string? tenantId = null, string? outletId = null, CancellationToken cancellationToken = default)
    {
        var builder = Builders<T>.Filter;
        var filter = builder.Eq(x => x.IsActive, true);

        if (string.IsNullOrEmpty(tenantId))
            throw new ArgumentException("tenantId is required for data isolation.", nameof(tenantId));
        filter &= builder.Eq(x => x.TenantId, tenantId);

        if (!string.IsNullOrEmpty(outletId))
        {
            filter &= builder.Eq(x => x.OutletId, outletId);
        }

        return await _collection.Find(filter).ToListAsync(cancellationToken);
    }

    public async Task<T> CreateAsync(T entity, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(entity.TenantId))
            throw new ArgumentException("tenantId is required for data isolation.", nameof(entity));
        entity.CreatedAt = DateTime.UtcNow;
        entity.IsActive = true;
        await _collection.InsertOneAsync(entity, cancellationToken: cancellationToken);
        return entity;
    }

    public async Task<bool> UpdateAsync(string id, T entity, string? tenantId = null, string? outletId = null, CancellationToken cancellationToken = default)
    {
        entity.UpdatedAt = DateTime.UtcNow;
        var builder = Builders<T>.Filter;
        var filter = builder.Eq(x => x.Id, id);

        if (string.IsNullOrEmpty(tenantId))
            throw new ArgumentException("tenantId is required for data isolation.", nameof(tenantId));
        filter &= builder.Eq(x => x.TenantId, tenantId);

        if (!string.IsNullOrEmpty(outletId))
        {
            filter &= builder.Eq(x => x.OutletId, outletId);
        }

        var result = await _collection.ReplaceOneAsync(filter, entity, cancellationToken: cancellationToken);
        return result.ModifiedCount > 0;
    }

    public async Task<bool> DeleteAsync(string id, string? tenantId = null, string? outletId = null, CancellationToken cancellationToken = default)
    {
        var builder = Builders<T>.Filter;
        var filter = builder.Eq(x => x.Id, id);

        if (string.IsNullOrEmpty(tenantId))
            throw new ArgumentException("tenantId is required for data isolation.", nameof(tenantId));
        filter &= builder.Eq(x => x.TenantId, tenantId);

        if (!string.IsNullOrEmpty(outletId))
        {
            filter &= builder.Eq(x => x.OutletId, outletId);
        }

        // Soft delete
        var update = Builders<T>.Update
            .Set(x => x.IsActive, false)
            .Set(x => x.UpdatedAt, DateTime.UtcNow);

        var result = await _collection.UpdateOneAsync(filter, update, cancellationToken: cancellationToken);
        return result.ModifiedCount > 0;
    }
}
