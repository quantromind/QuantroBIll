using MongoDB.Driver;
using PetBharke.Application.Interfaces;
using PetBharke.Domain.Entities;
using PetBharke.Domain.Enums;

namespace PetBharke.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedDatabaseAsync(IMongoDbContext context, IPasswordHasher hasher)
    {
        // 1. Clean legacy demo/dummy tenants & unattached data if present
        await PurgeLegacyDummyDataAsync(context);

        // 2. Ensure SuperAdmin exists and is up to date
        var superAdmin = await context.Users
            .Find(u => u.Role == UserRole.SuperAdmin || u.Email.ToLower() == "admin@quantromind.com")
            .FirstOrDefaultAsync();

        if (superAdmin == null)
        {
            superAdmin = new User
            {
                Username = "superadmin",
                Email = "admin@quantromind.com",
                FullName = "Platform Super Admin",
                Phone = "+91 99999 99999",
                PasswordHash = hasher.HashPassword("Quantromind@#9100"),
                Role = UserRole.SuperAdmin,
                Permissions = new List<string> { "all", "superadmin" },
                IsActive = true,
                MustChangePassword = false,
                CreatedAt = DateTime.UtcNow
            };
            await context.Users.InsertOneAsync(superAdmin);
            Console.WriteLine("--> [QuantroBill] SuperAdmin created: admin@quantromind.com / Quantromind@#9100");
        }
        else
        {
            // Keep SuperAdmin credentials synchronized and verified
            var update = Builders<User>.Update
                .Set(u => u.Email, "admin@quantromind.com")
                .Set(u => u.Username, "superadmin")
                .Set(u => u.PasswordHash, hasher.HashPassword("Quantromind@#9100"))
                .Set(u => u.Role, UserRole.SuperAdmin)
                .Set(u => u.IsActive, true)
                .Set(u => u.MustChangePassword, false);

            await context.Users.UpdateOneAsync(u => u.Id == superAdmin.Id, update);
            Console.WriteLine("--> [QuantroBill] SuperAdmin synchronized: admin@quantromind.com / Quantromind@#9100");
        }
    }

    private static async Task PurgeLegacyDummyDataAsync(IMongoDbContext context)
    {
        try
        {
            // Remove dummy sample tenants and old demo accounts
            var dummyEmails = new[]
            {
                "owner@magicbottle.com",
                "ajay@magicbottle.com",
                "sourabh@gmail.com",
                "biller@jaymalhar.com",
                "manager@jaymalhar.com",
                "waiter@jaymalhar.com",
                "chef@jaymalhar.com",
                "admin@petbharke.com",
                "admin@quantrobill.com",
                "superadmin@quantrobill.com"
            };

            // Remove legacy sample users
            await context.Users.DeleteManyAsync(u => 
                dummyEmails.Contains(u.Email.ToLower()) || 
                (u.Role != UserRole.SuperAdmin && u.Email.ToLower() != "admin@quantromind.com" && string.IsNullOrEmpty(u.TenantId)));

            // Remove sample dummy tenants
            await context.Tenants.DeleteManyAsync(t => 
                t.OwnerEmail.ToLower() == "owner@magicbottle.com" || 
                t.OwnerEmail.ToLower() == "sourabh@gmail.com" ||
                t.BusinessName.Contains("The Magic Bottle") ||
                t.BusinessName.Contains("Jay Malhar"));

            // Remove sample dummy outlets
            await context.Outlets.DeleteManyAsync(o => 
                o.Code == "R443077" || 
                o.Name.Contains("The Magic Bottle") ||
                o.Name.Contains("Jay Malhar"));
        }
        catch (Exception ex)
        {
            Console.WriteLine($"--> [QuantroBill] Note during purge: {ex.Message}");
        }
    }

    /// <summary>
    /// Complete database reset helper: drops all collections and seeds fresh SuperAdmin.
    /// </summary>
    public static async Task ResetAllCollectionsAsync(IMongoDbContext context, IPasswordHasher hasher)
    {
        var db = context.Database;
        var collections = new[]
        {
            "tenants", "outlets", "categories", "menuItems", "orders",
            "tables", "customers", "inventory", "expenses", "cashFlowEntries",
            "discounts", "feedbacks"
        };

        foreach (var col in collections)
        {
            try
            {
                await db.DropCollectionAsync(col);
            }
            catch {}
        }

        // Clear all users except fresh SuperAdmin
        try
        {
            await db.DropCollectionAsync("users");
        }
        catch {}

        await SeedDatabaseAsync(context, hasher);
        Console.WriteLine("--> [QuantroBill] All collections reset. SuperAdmin ready.");
    }
}
