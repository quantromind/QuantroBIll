using MongoDB.Driver;
using PetBharke.Application.Interfaces;
using PetBharke.Domain.Entities;
using PetBharke.Domain.Enums;

namespace PetBharke.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedDatabaseAsync(IMongoDbContext context, IPasswordHasher hasher)
    {
        // 1. Seed Super Admin
        var superAdmin = await context.Users
            .Find(u => u.Role == UserRole.SuperAdmin)
            .FirstOrDefaultAsync();

        if (superAdmin == null)
        {
            superAdmin = new User
            {
                Username = "superadmin",
                Email = "admin@quantrobill.com",
                FullName = "Platform Super Admin",
                Phone = "9999999999",
                PasswordHash = hasher.HashPassword("Admin@123"),
                Role = UserRole.SuperAdmin,
                Permissions = new List<string> { "all", "superadmin" },
                IsActive = true,
                MustChangePassword = true,
                CreatedAt = DateTime.UtcNow
            };
            await context.Users.InsertOneAsync(superAdmin);
        }
        else if (superAdmin.Email == "admin@petbharke.com")
        {
            await context.Users.UpdateOneAsync(
                u => u.Id == superAdmin.Id,
                Builders<User>.Update.Set(u => u.Email, "admin@quantrobill.com")
            );
        }

        // 2. Check if Sample Tenant exists
        var sampleTenant = await context.Tenants
            .Find(t => t.OwnerEmail == "owner@magicbottle.com")
            .FirstOrDefaultAsync();

        if (sampleTenant == null)
        {
            sampleTenant = new Tenant
            {
                BusinessName = "The Magic Bottle - Milkshakes And Snacks",
                OwnerEmail = "owner@magicbottle.com",
                OwnerPhone = "07969223344",
                BusinessType = BusinessType.Cafe,
                SubscriptionPlan = SubscriptionPlan.Premium,
                SubscriptionExpiresAt = DateTime.UtcNow.AddYears(1),
                MaxOutlets = 10,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            await context.Tenants.InsertOneAsync(sampleTenant);
        }

        // 3. Sample Outlet
        var sampleOutlet = await context.Outlets
            .Find(o => o.TenantId == sampleTenant.Id && o.Code == "R443077")
            .FirstOrDefaultAsync();

        if (sampleOutlet == null)
        {
            sampleOutlet = new Outlet
            {
                TenantId = sampleTenant.Id,
                Name = "The Magic Bottle - Milkshakes And Snacks Wakad",
                BusinessType = BusinessType.Cafe,
                Code = "R443077",
                Address = "Shop 4, Datta Mandir Road, Wakad, Pune, Maharashtra 411057",
                City = "Pune",
                Phone = "07969223344",
                GSTIN = "27AABCU9603R1ZM",
                FSSAI = "11521034000123",
                Currency = "INR",
                IsOpen = true,
                IsActive = true,
                TaxSettings = new OutletTaxSettings
                {
                    CgstPercentage = 2.5m,
                    SgstPercentage = 2.5m,
                    IsGstInclusive = false,
                    ServiceChargePercentage = 0.0m
                },
                PrinterSettings = new OutletPrinterSettings
                {
                    PrinterType = "Thermal80mm",
                    HeaderText = "The Magic Bottle - Milkshakes & Snacks\nWakad, Pune - 411057",
                    FooterText = "Thank you! Visit again\nFSSAI: 11521034000123",
                    AutoPrintBill = true,
                    AutoPrintKOT = true
                },
                CreatedAt = DateTime.UtcNow
            };
            await context.Outlets.InsertOneAsync(sampleOutlet);
        }

        // 3B. Seed Dedicated Restaurant Client (Spice Garden Fine Dine & Grill)
        var restTenant = await context.Tenants
            .Find(t => t.OwnerEmail == "owner@spicegarden.com")
            .FirstOrDefaultAsync();

        if (restTenant == null)
        {
            restTenant = new Tenant
            {
                BusinessName = "Spice Garden - Fine Dine & Bar",
                OwnerEmail = "owner@spicegarden.com",
                OwnerPhone = "09822334455",
                BusinessType = BusinessType.Restaurant,
                SubscriptionPlan = SubscriptionPlan.Enterprise,
                SubscriptionExpiresAt = DateTime.UtcNow.AddYears(1),
                MaxOutlets = 10,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            await context.Tenants.InsertOneAsync(restTenant);
        }

        var restOutlet = await context.Outlets
            .Find(o => o.TenantId == restTenant.Id && o.Code == "R889021")
            .FirstOrDefaultAsync();

        if (restOutlet == null)
        {
            restOutlet = new Outlet
            {
                TenantId = restTenant.Id,
                Name = "Spice Garden - Baner High Street",
                BusinessType = BusinessType.Restaurant,
                Code = "R889021",
                Address = "Plot 12, Baner High Street, Pune, Maharashtra 411045",
                City = "Pune",
                Phone = "09822334455",
                GSTIN = "27AABCS4455M1ZP",
                FSSAI = "11522045000789",
                Currency = "INR",
                IsOpen = true,
                IsActive = true,
                TaxSettings = new OutletTaxSettings
                {
                    CgstPercentage = 2.5m,
                    SgstPercentage = 2.5m,
                    IsGstInclusive = false,
                    ServiceChargePercentage = 5.0m
                },
                PrinterSettings = new OutletPrinterSettings
                {
                    PrinterType = "Thermal80mm",
                    HeaderText = "Spice Garden - Fine Dine & Bar\nBaner, Pune - 411045",
                    FooterText = "Thank you for dining with us!\nFSSAI: 11522045000789",
                    AutoPrintBill = true,
                    AutoPrintKOT = true
                },
                CreatedAt = DateTime.UtcNow
            };
            await context.Outlets.InsertOneAsync(restOutlet);

            // Seed Restaurant Users
            await context.Users.InsertOneAsync(new User
            {
                TenantId = restTenant.Id,
                OutletId = restOutlet.Id,
                Username = "restbiller",
                Email = "biller@spicegarden.com",
                FullName = "Captain & Cashier",
                Phone = "9822001122",
                Pin = "4321",
                PasswordHash = hasher.HashPassword("Biller@123"),
                Role = UserRole.Cashier,
                AssignedOutletIds = new List<string> { restOutlet.Id },
                Permissions = new List<string> { "pos.bill", "pos.kot", "pos.view", "tables.manage" },
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });

            await context.Users.InsertOneAsync(new User
            {
                TenantId = restTenant.Id,
                OutletId = restOutlet.Id,
                Username = "restowner",
                Email = "owner@spicegarden.com",
                FullName = "Restaurant Director",
                Phone = "9822003344",
                PasswordHash = hasher.HashPassword("Owner@123"),
                Role = UserRole.Owner,
                AssignedOutletIds = new List<string> { restOutlet.Id },
                Permissions = new List<string> { "all" },
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });

            // Seed Restaurant Tables
            var restTables = new List<RestaurantTable>
            {
                new() { TenantId = restTenant.Id, OutletId = restOutlet.Id, TableNumber = "T-1", Section = "Main Dining Hall", SeatingCapacity = 4, IsOccupied = false },
                new() { TenantId = restTenant.Id, OutletId = restOutlet.Id, TableNumber = "T-2", Section = "Main Dining Hall", SeatingCapacity = 4, IsOccupied = true, CurrentOrderId = "ord-r1" },
                new() { TenantId = restTenant.Id, OutletId = restOutlet.Id, TableNumber = "T-3", Section = "Main Dining Hall", SeatingCapacity = 2, IsOccupied = false },
                new() { TenantId = restTenant.Id, OutletId = restOutlet.Id, TableNumber = "T-4", Section = "AC Family Lounge", SeatingCapacity = 6, IsOccupied = true, CurrentOrderId = "ord-r2" },
                new() { TenantId = restTenant.Id, OutletId = restOutlet.Id, TableNumber = "T-5", Section = "AC Family Lounge", SeatingCapacity = 6, IsOccupied = false },
                new() { TenantId = restTenant.Id, OutletId = restOutlet.Id, TableNumber = "T-6", Section = "Rooftop Garden Patio", SeatingCapacity = 4, IsOccupied = false },
                new() { TenantId = restTenant.Id, OutletId = restOutlet.Id, TableNumber = "T-7", Section = "Rooftop Garden Patio", SeatingCapacity = 8, IsOccupied = true, CurrentOrderId = "ord-r3" },
                new() { TenantId = restTenant.Id, OutletId = restOutlet.Id, TableNumber = "VIP-1", Section = "Private Dining Room (PDR)", SeatingCapacity = 12, IsOccupied = false }
            };
            await context.Tables.InsertManyAsync(restTables);

            // Seed Restaurant Categories & Menu Items
            var catStarters = new Category { TenantId = restTenant.Id, OutletId = restOutlet.Id, Name = "Starters & Tandoor Appetizers", Description = "Tandoori Kebabs and Crispy Starters", DisplayOrder = 1 };
            var catMains = new Category { TenantId = restTenant.Id, OutletId = restOutlet.Id, Name = "Main Course & Royal Gravies", Description = "Paneer, Chicken & Mutton Gravies", DisplayOrder = 2 };
            var catBiryani = new Category { TenantId = restTenant.Id, OutletId = restOutlet.Id, Name = "Dum Biryani & Artisan Breads", Description = "Hyderabadi Dum Biryani and Butter Naan", DisplayOrder = 3 };
            var catBar = new Category { TenantId = restTenant.Id, OutletId = restOutlet.Id, Name = "Signature Mocktails & Bar", Description = "Craft Coolers and Beverages", DisplayOrder = 4 };
            await context.Categories.InsertManyAsync(new[] { catStarters, catMains, catBiryani, catBar });

            var restMenuItems = new List<MenuItem>
            {
                new() { TenantId = restTenant.Id, OutletId = restOutlet.Id, CategoryId = catStarters.Id, Name = "Paneer Tikka Angaarey", BasePrice = 280, IsVeg = true, IsAvailable = true },
                new() { TenantId = restTenant.Id, OutletId = restOutlet.Id, CategoryId = catStarters.Id, Name = "Murgh Malai Tikka (6 Pcs)", BasePrice = 340, IsVeg = false, IsAvailable = true },
                new() { TenantId = restTenant.Id, OutletId = restOutlet.Id, CategoryId = catStarters.Id, Name = "Crispy Corn & Water Chestnut", BasePrice = 240, IsVeg = true, IsAvailable = true },
                new() { TenantId = restTenant.Id, OutletId = restOutlet.Id, CategoryId = catMains.Id, Name = "Butter Chicken (Boneless)", BasePrice = 380, IsVeg = false, IsAvailable = true },
                new() { TenantId = restTenant.Id, OutletId = restOutlet.Id, CategoryId = catMains.Id, Name = "Paneer Lababdar", BasePrice = 320, IsVeg = true, IsAvailable = true },
                new() { TenantId = restTenant.Id, OutletId = restOutlet.Id, CategoryId = catMains.Id, Name = "Dal Makhani Handi", BasePrice = 260, IsVeg = true, IsAvailable = true },
                new() { TenantId = restTenant.Id, OutletId = restOutlet.Id, CategoryId = catBiryani.Id, Name = "Dum Chicken Biryani Pot", BasePrice = 360, IsVeg = false, IsAvailable = true },
                new() { TenantId = restTenant.Id, OutletId = restOutlet.Id, CategoryId = catBiryani.Id, Name = "Butter Garlic Naan", BasePrice = 60, IsVeg = true, IsAvailable = true },
                new() { TenantId = restTenant.Id, OutletId = restOutlet.Id, CategoryId = catBar.Id, Name = "Spiced Jamun Mocktail", BasePrice = 160, IsVeg = true, IsAvailable = true },
                new() { TenantId = restTenant.Id, OutletId = restOutlet.Id, CategoryId = catBar.Id, Name = "Virgin Mojito Mint Cooler", BasePrice = 140, IsVeg = true, IsAvailable = true }
            };
            await context.MenuItems.InsertManyAsync(restMenuItems);
        }

        // 4. Seed Users for this Outlet
        var existingOwner = await context.Users.Find(u => u.Email == "owner@magicbottle.com").FirstOrDefaultAsync();
        if (existingOwner == null)
        {
            await context.Users.InsertOneAsync(new User
            {
                TenantId = sampleTenant.Id,
                OutletId = sampleOutlet.Id,
                Username = "magicowner",
                Email = "owner@magicbottle.com",
                FullName = "Restaurant Owner",
                Phone = "9876543210",
                PasswordHash = hasher.HashPassword("Owner@123"),
                Role = UserRole.Owner,
                AssignedOutletIds = new List<string> { sampleOutlet.Id },
                Permissions = new List<string> { "all" },
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }

        var existingBiller = await context.Users.Find(u => u.Username == "biller").FirstOrDefaultAsync();
        if (existingBiller == null)
        {
            await context.Users.InsertOneAsync(new User
            {
                TenantId = sampleTenant.Id,
                OutletId = sampleOutlet.Id,
                Username = "biller",
                Email = "biller@magicbottle.com",
                FullName = "biller",
                Phone = "9876543211",
                Pin = "1234",
                PasswordHash = hasher.HashPassword("Biller@123"),
                Role = UserRole.Cashier,
                AssignedOutletIds = new List<string> { sampleOutlet.Id },
                Permissions = new List<string> { "pos.bill", "pos.kot", "pos.view" },
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }

        var existingKitchen = await context.Users.Find(u => u.Email == "kitchen@magicbottle.com").FirstOrDefaultAsync();
        if (existingKitchen == null)
        {
            await context.Users.InsertOneAsync(new User
            {
                TenantId = sampleTenant.Id,
                OutletId = sampleOutlet.Id,
                Username = "kitchen",
                Email = "kitchen@magicbottle.com",
                FullName = "Kitchen Staff",
                Phone = "9876543212",
                PasswordHash = hasher.HashPassword("Kitchen@123"),
                Role = UserRole.KitchenStaff,
                AssignedOutletIds = new List<string> { sampleOutlet.Id },
                Permissions = new List<string> { "kds.view", "kds.update" },
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }

        var existingRider = await context.Users.Find(u => u.Email == "rider@magicbottle.com").FirstOrDefaultAsync();
        if (existingRider == null)
        {
            await context.Users.InsertOneAsync(new User
            {
                TenantId = sampleTenant.Id,
                OutletId = sampleOutlet.Id,
                Username = "rider",
                Email = "rider@magicbottle.com",
                FullName = "Ramesh Delivery Rider",
                Phone = "9876543213",
                PasswordHash = hasher.HashPassword("Rider@123"),
                Role = UserRole.DeliveryBoy,
                AssignedOutletIds = new List<string> { sampleOutlet.Id },
                Permissions = new List<string> { "delivery.view", "delivery.update" },
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }

        var existingWaiter = await context.Users.Find(u => u.Username == "waiter").FirstOrDefaultAsync();
        if (existingWaiter == null)
        {
            await context.Users.InsertOneAsync(new User
            {
                TenantId = sampleTenant.Id,
                OutletId = sampleOutlet.Id,
                Username = "waiter",
                Email = "waiter@magicbottle.com",
                FullName = "Ramesh Waiter",
                Phone = "9876543214",
                PasswordHash = hasher.HashPassword("Waiter@123"),
                Role = UserRole.Waiter,
                AssignedOutletIds = new List<string> { sampleOutlet.Id },
                Permissions = new List<string> { "pos.view", "pos.kot" },
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }

        var existingManager = await context.Users.Find(u => u.Username == "manager").FirstOrDefaultAsync();
        if (existingManager == null)
        {
            await context.Users.InsertOneAsync(new User
            {
                TenantId = sampleTenant.Id,
                OutletId = sampleOutlet.Id,
                Username = "manager",
                Email = "manager@magicbottle.com",
                FullName = "Store General Manager",
                Phone = "9876543215",
                PasswordHash = hasher.HashPassword("Manager@123"),
                Role = UserRole.Manager,
                AssignedOutletIds = new List<string> { sampleOutlet.Id },
                Permissions = new List<string> { "all" },
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }

        // 5. Seed Categories
        var countCategories = await context.Categories.CountDocumentsAsync(c => c.TenantId == sampleTenant.Id);
        if (countCategories == 0)
        {
            var categories = new List<Category>
            {
                new() { TenantId = sampleTenant.Id, OutletId = sampleOutlet.Id, Name = "Thick Shakes & Cold Coffee", Description = "Signature Thick Shakes & Brewed Cold Coffee", DisplayOrder = 1 },
                new() { TenantId = sampleTenant.Id, OutletId = sampleOutlet.Id, Name = "Sandwiches & Toasties", Description = "Grilled & Jumbo Stuffed Sandwiches", DisplayOrder = 2 },
                new() { TenantId = sampleTenant.Id, OutletId = sampleOutlet.Id, Name = "Wraps & Rolls", Description = "Crispy Paneer & Veggies wrapped in Tortilla", DisplayOrder = 3 },
                new() { TenantId = sampleTenant.Id, OutletId = sampleOutlet.Id, Name = "Burgers & Sliders", Description = "Crunchy Veg & Cheese Burst Burgers", DisplayOrder = 4 },
                new() { TenantId = sampleTenant.Id, OutletId = sampleOutlet.Id, Name = "Fries & Quick Bites", Description = "Peri Peri Fries, Nuggets & Munchies", DisplayOrder = 5 },
                new() { TenantId = sampleTenant.Id, OutletId = sampleOutlet.Id, Name = "Pizzas & Garlic Breads", Description = "Cheesy Artisan Thin Crust Pizzas", DisplayOrder = 6 },
                new() { TenantId = sampleTenant.Id, OutletId = sampleOutlet.Id, Name = "Power Meal Combos", Description = "Value Super Combos with Beverages", DisplayOrder = 7 },
                new() { TenantId = sampleTenant.Id, OutletId = sampleOutlet.Id, Name = "Hot Brews & Chai", Description = "Fresh Espresso, Latte & Special Chai", DisplayOrder = 8 },
                new() { TenantId = sampleTenant.Id, OutletId = sampleOutlet.Id, Name = "Chinese Bowls & Noodles", Description = "Wok tossed Hakka Noodles & Rice", DisplayOrder = 9 },
                new() { TenantId = sampleTenant.Id, OutletId = sampleOutlet.Id, Name = "Desserts & Ice Creams", Description = "Sizzling Brownies & Sundaes", DisplayOrder = 10 }
            };
            await context.Categories.InsertManyAsync(categories);

            // Fetch the first category to attach sample items
            var firstCat = categories[0];

            var menuItems = new List<MenuItem>
            {
                new() { TenantId = sampleTenant.Id, OutletId = sampleOutlet.Id, CategoryId = firstCat.Id, Name = "Alphonso Mango Shake", ShortCode = "AMS", BasePrice = 180, IsVeg = true, IsAvailable = true, Description = "Pure Ratnagiri Alphonso mango pulp churned with rich milk and ice cream" },
                new() { TenantId = sampleTenant.Id, OutletId = sampleOutlet.Id, CategoryId = firstCat.Id, Name = "Choco Belgian Shake", ShortCode = "CBS", BasePrice = 190, IsVeg = true, IsAvailable = true, Description = "Dark Belgian chocolate blended thick with chocolate chunks" },
                new() { TenantId = sampleTenant.Id, OutletId = sampleOutlet.Id, CategoryId = firstCat.Id, Name = "Cold Coffee Classic", ShortCode = "CCC", BasePrice = 140, IsVeg = true, IsAvailable = true, Description = "Smooth, strong iced brewed espresso blend" },
                new() { TenantId = sampleTenant.Id, OutletId = sampleOutlet.Id, CategoryId = firstCat.Id, Name = "Cold Coffee Ice Cream Float", ShortCode = "CCF", BasePrice = 160, IsVeg = true, IsAvailable = true, Description = "Cold coffee crowned with a generous scoop of vanilla ice cream" },
                new() { TenantId = sampleTenant.Id, OutletId = sampleOutlet.Id, CategoryId = firstCat.Id, Name = "Irish Style Cold Coffee", ShortCode = "ICC", BasePrice = 170, IsVeg = true, IsAvailable = true, Description = "Rich espresso with Irish cream flavor notes" },
                new() { TenantId = sampleTenant.Id, OutletId = sampleOutlet.Id, CategoryId = firstCat.Id, Name = "Kesar Badam Pista Milkshake - NEW", ShortCode = "KBP", BasePrice = 210, IsVeg = true, IsAvailable = true, Description = "Royal saffron with roasted almonds and crushed pistachios" },
                new() { TenantId = sampleTenant.Id, OutletId = sampleOutlet.Id, CategoryId = firstCat.Id, Name = "Kitkat Shake", ShortCode = "KKS", BasePrice = 190, IsVeg = true, IsAvailable = true, Description = "Crisp KitKat wafers blended with velvety chocolate cream" },
                new() { TenantId = sampleTenant.Id, OutletId = sampleOutlet.Id, CategoryId = firstCat.Id, Name = "Oreo Thick Shake (Most Loved)", ShortCode = "OTS", BasePrice = 190, IsVeg = true, IsAvailable = true, Description = "Crunchy Oreo cookies crushed into a creamy thick shake" },
                new() { TenantId = sampleTenant.Id, OutletId = sampleOutlet.Id, CategoryId = firstCat.Id, Name = "Strawberry Shake", ShortCode = "SBS", BasePrice = 160, IsVeg = true, IsAvailable = true, Description = "Fresh Mahabaleshwar strawberries blended creamy and sweet" },
                new() { TenantId = sampleTenant.Id, OutletId = sampleOutlet.Id, CategoryId = firstCat.Id, Name = "Vanilla Classic", ShortCode = "VCS", BasePrice = 130, IsVeg = true, IsAvailable = true, Description = "Classic Madagascar vanilla bean extract with thick milk" }
            };
            await context.MenuItems.InsertManyAsync(menuItems);
        }

        // 6. Seed Sample Tables
        var tableCount = await context.Tables.CountDocumentsAsync(t => t.TenantId == sampleTenant.Id);
        if (tableCount == 0)
        {
            var tables = new List<RestaurantTable>
            {
                new() { TenantId = sampleTenant.Id, OutletId = sampleOutlet.Id, TableNumber = "T-1", Section = "Main Hall", SeatingCapacity = 4 },
                new() { TenantId = sampleTenant.Id, OutletId = sampleOutlet.Id, TableNumber = "T-2", Section = "Main Hall", SeatingCapacity = 2 },
                new() { TenantId = sampleTenant.Id, OutletId = sampleOutlet.Id, TableNumber = "T-3", Section = "Main Hall", SeatingCapacity = 4 },
                new() { TenantId = sampleTenant.Id, OutletId = sampleOutlet.Id, TableNumber = "T-4", Section = "AC Section", SeatingCapacity = 6 },
                new() { TenantId = sampleTenant.Id, OutletId = sampleOutlet.Id, TableNumber = "T-5", Section = "AC Section", SeatingCapacity = 4 },
                new() { TenantId = sampleTenant.Id, OutletId = sampleOutlet.Id, TableNumber = "T-6", Section = "Outdoor / Patio", SeatingCapacity = 2 },
                new() { TenantId = sampleTenant.Id, OutletId = sampleOutlet.Id, TableNumber = "T-7", Section = "Outdoor / Patio", SeatingCapacity = 4 },
                new() { TenantId = sampleTenant.Id, OutletId = sampleOutlet.Id, TableNumber = "T-8", Section = "First Floor", SeatingCapacity = 8 }
            };
            await context.Tables.InsertManyAsync(tables);
        }

        // 7. Seed Sample Aggregator Online Orders matching screenshot #1
        var ordersCount = await context.Orders.CountDocumentsAsync(o => o.TenantId == sampleTenant.Id);
        if (ordersCount == 0)
        {
            var sampleOrders = new List<Order>
            {
                new()
                {
                    TenantId = sampleTenant.Id,
                    OutletId = sampleOutlet.Id,
                    BillNumber = "74",
                    KotNumber = "KOT-174",
                    ExternalOrderId = "8242905005",
                    Otp = "6664",
                    CustomerName = "Neha Date",
                    CustomerPhone = "9822001122",
                    OrderType = OrderType.Delivery,
                    Status = OrderStatus.FoodReady,
                    AggregatorSource = AggregatorSource.Zomato,
                    DeliveryInstructions = "Ring doorbell twice, leave at door",
                    TotalAmount = 129.50m,
                    SubTotal = 120.00m,
                    CgstAmount = 3.00m,
                    SgstAmount = 3.00m,
                    RoundOff = 3.50m,
                    PlacedAt = DateTime.UtcNow.Date.AddHours(18).AddMinutes(23),
                    AcceptedAt = DateTime.UtcNow.Date.AddHours(18).AddMinutes(25),
                    FoodReadyAt = DateTime.UtcNow.Date.AddHours(18).AddMinutes(40),
                    Payments = new List<OrderPayment> { new() { Mode = PaymentMode.Online, Amount = 129.50m } },
                    Items = new List<OrderItem>
                    {
                        new() { Name = "Vanilla Classic", Quantity = 1, UnitPrice = 120, TotalPrice = 120 }
                    }
                },
                new()
                {
                    TenantId = sampleTenant.Id,
                    OutletId = sampleOutlet.Id,
                    BillNumber = "73",
                    KotNumber = "KOT-173",
                    ExternalOrderId = "8252086938",
                    Otp = "4841",
                    CustomerName = "Pushpak",
                    CustomerPhone = "9822003344",
                    OrderType = OrderType.Delivery,
                    Status = OrderStatus.FoodReady,
                    AggregatorSource = AggregatorSource.Zomato,
                    DeliveryInstructions = "Less spicy please",
                    TotalAmount = 159.00m,
                    SubTotal = 150.00m,
                    CgstAmount = 3.75m,
                    SgstAmount = 3.75m,
                    RoundOff = 1.50m,
                    PlacedAt = DateTime.UtcNow.Date.AddHours(17).AddMinutes(49),
                    AcceptedAt = DateTime.UtcNow.Date.AddHours(17).AddMinutes(51),
                    FoodReadyAt = DateTime.UtcNow.Date.AddHours(18).AddMinutes(05),
                    Payments = new List<OrderPayment> { new() { Mode = PaymentMode.Online, Amount = 159.00m } },
                    Items = new List<OrderItem>
                    {
                        new() { Name = "Cold Coffee Ice Cream Float", Quantity = 1, UnitPrice = 150, TotalPrice = 150 }
                    }
                },
                new()
                {
                    TenantId = sampleTenant.Id,
                    OutletId = sampleOutlet.Id,
                    BillNumber = "72",
                    KotNumber = "KOT-172",
                    ExternalOrderId = "8250763236",
                    Otp = "8649",
                    CustomerName = "Akshay",
                    CustomerPhone = "9822005566",
                    OrderType = OrderType.Delivery,
                    Status = OrderStatus.FoodReady,
                    AggregatorSource = AggregatorSource.Zomato,
                    TotalAmount = 129.50m,
                    SubTotal = 120.00m,
                    CgstAmount = 3.00m,
                    SgstAmount = 3.00m,
                    RoundOff = 3.50m,
                    PlacedAt = DateTime.UtcNow.Date.AddHours(17).AddMinutes(46),
                    AcceptedAt = DateTime.UtcNow.Date.AddHours(17).AddMinutes(48),
                    FoodReadyAt = DateTime.UtcNow.Date.AddHours(18).AddMinutes(02),
                    Payments = new List<OrderPayment> { new() { Mode = PaymentMode.Online, Amount = 129.50m } },
                    Items = new List<OrderItem>
                    {
                        new() { Name = "Strawberry Shake", Quantity = 1, UnitPrice = 120, TotalPrice = 120 }
                    }
                },
                new()
                {
                    TenantId = sampleTenant.Id,
                    OutletId = sampleOutlet.Id,
                    BillNumber = "70",
                    KotNumber = "KOT-170",
                    ExternalOrderId = "8252220087",
                    Otp = "3261",
                    CustomerName = "Ashish Verma",
                    CustomerPhone = "9822007788",
                    OrderType = OrderType.Delivery,
                    Status = OrderStatus.FoodReady,
                    AggregatorSource = AggregatorSource.Zomato,
                    TotalAmount = 468.00m,
                    SubTotal = 440.00m,
                    CgstAmount = 11.00m,
                    SgstAmount = 11.00m,
                    RoundOff = 6.00m,
                    PlacedAt = DateTime.UtcNow.Date.AddHours(13).AddMinutes(15),
                    AcceptedAt = DateTime.UtcNow.Date.AddHours(13).AddMinutes(17),
                    FoodReadyAt = DateTime.UtcNow.Date.AddHours(13).AddMinutes(35),
                    Payments = new List<OrderPayment> { new() { Mode = PaymentMode.Online, Amount = 468.00m } },
                    Items = new List<OrderItem>
                    {
                        new() { Name = "Choco Belgian Shake", Quantity = 1, UnitPrice = 190, TotalPrice = 190 },
                        new() { Name = "Kesar Badam Pista Milkshake - NEW", Quantity = 1, UnitPrice = 210, TotalPrice = 210 }
                    }
                }
            };
            await context.Orders.InsertManyAsync(sampleOrders);
        }

        // 6. Seed Jay Malhar Restaurant for Sourabh Dhangar
        var jmTenant = await context.Tenants.Find(t => t.OwnerEmail == "sourabh@gmail.com" || t.BusinessName == "Jay Malhar").FirstOrDefaultAsync();
        if (jmTenant == null)
        {
            jmTenant = new Tenant
            {
                BusinessName = "Jay Malhar",
                OwnerEmail = "sourabh@gmail.com",
                OwnerPhone = "9876543210",
                BusinessType = BusinessType.Restaurant,
                SubscriptionPlan = SubscriptionPlan.Enterprise,
                SubscriptionExpiresAt = DateTime.UtcNow.AddYears(2),
                MaxOutlets = 5,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            await context.Tenants.InsertOneAsync(jmTenant);
        }

        var jmOutlet = await context.Outlets.Find(o => o.TenantId == jmTenant.Id).FirstOrDefaultAsync();
        if (jmOutlet == null)
        {
            jmOutlet = new Outlet
            {
                TenantId = jmTenant.Id,
                Name = "Jay Malhar - Main Branch",
                BusinessType = BusinessType.Restaurant,
                Code = "JM-01",
                Address = "Commercial High Street, Pune, Maharashtra 411045",
                City = "Pune",
                Phone = "9876543210",
                GSTIN = "27AABCJ1234M1ZP",
                FSSAI = "11522045000999",
                Currency = "INR",
                IsOpen = true,
                IsActive = true,
                TaxSettings = new OutletTaxSettings
                {
                    CgstPercentage = 2.5m,
                    SgstPercentage = 2.5m,
                    IsGstInclusive = false,
                    ServiceChargePercentage = 0.0m
                },
                PrinterSettings = new OutletPrinterSettings
                {
                    PrinterType = "Thermal80mm",
                    HeaderText = "Jay Malhar Restaurant\nPune - 411045",
                    FooterText = "Thank you! Visit again\nFSSAI: 11522045000999",
                    AutoPrintBill = true,
                    AutoPrintKOT = true
                },
                CreatedAt = DateTime.UtcNow
            };
            await context.Outlets.InsertOneAsync(jmOutlet);
        }
        else
        {
            var updateOutlet = Builders<Outlet>.Update
                .Set(o => o.Code, "JM-01")
                .Set(o => o.IsActive, true);
            await context.Outlets.UpdateOneAsync(o => o.Id == jmOutlet.Id, updateOutlet);
        }

        var existingSourabh = await context.Users.Find(u => u.Email == "sourabh@gmail.com" || u.Username == "sourabh").FirstOrDefaultAsync();
        if (existingSourabh == null)
        {
            await context.Users.InsertOneAsync(new User
            {
                TenantId = jmTenant.Id,
                OutletId = jmOutlet.Id,
                Username = "sourabh",
                Email = "sourabh@gmail.com",
                FullName = "Sourabh Dhangar",
                Phone = "9876543210",
                Pin = "1234",
                PasswordHash = hasher.HashPassword("Owner@123"),
                Role = UserRole.Owner,
                AssignedOutletIds = new List<string> { jmOutlet.Id },
                Permissions = new List<string> { "all" },
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            var update = Builders<User>.Update
                .Set(u => u.TenantId, jmTenant.Id)
                .Set(u => u.OutletId, jmOutlet.Id)
                .Set(u => u.Role, UserRole.Owner)
                .Set(u => u.Pin, "1234")
                .Set(u => u.PasswordHash, hasher.HashPassword("Owner@123"))
                .Set(u => u.IsActive, true);
            await context.Users.UpdateOneAsync(u => u.Id == existingSourabh.Id, update);
        }

        var existingJmWaiter = await context.Users.Find(u => u.Username == "jmwaiter" || u.Email == "waiter@jaymalhar.com").FirstOrDefaultAsync();
        if (existingJmWaiter == null)
        {
            await context.Users.InsertOneAsync(new User
            {
                TenantId = jmTenant.Id,
                OutletId = jmOutlet.Id,
                Username = "jmwaiter",
                Email = "waiter@jaymalhar.com",
                FullName = "Sunil (Waiter)",
                Phone = "9876543219",
                Pin = "5555",
                PasswordHash = hasher.HashPassword("Waiter@123"),
                Role = UserRole.Cashier,
                AssignedOutletIds = new List<string> { jmOutlet.Id },
                Permissions = new List<string> { "pos.bill", "pos.kot", "pos.view", "tables.manage" },
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            var update = Builders<User>.Update
                .Set(u => u.TenantId, jmTenant.Id)
                .Set(u => u.OutletId, jmOutlet.Id)
                .Set(u => u.Pin, "5555")
                .Set(u => u.IsActive, true);
            await context.Users.UpdateOneAsync(u => u.Id == existingJmWaiter.Id, update);
        }

        var countJmTables = await context.Tables.CountDocumentsAsync(t => t.TenantId == jmTenant.Id);
        if (countJmTables == 0)
        {
            var jmTables = new List<RestaurantTable>
            {
                new() { TenantId = jmTenant.Id, OutletId = jmOutlet.Id, TableNumber = "T-1", Section = "Main Dining", SeatingCapacity = 4, IsOccupied = false },
                new() { TenantId = jmTenant.Id, OutletId = jmOutlet.Id, TableNumber = "T-2", Section = "Main Dining", SeatingCapacity = 4, IsOccupied = false },
                new() { TenantId = jmTenant.Id, OutletId = jmOutlet.Id, TableNumber = "T-3", Section = "Main Dining", SeatingCapacity = 2, IsOccupied = false },
                new() { TenantId = jmTenant.Id, OutletId = jmOutlet.Id, TableNumber = "T-4", Section = "Family Section", SeatingCapacity = 6, IsOccupied = false },
                new() { TenantId = jmTenant.Id, OutletId = jmOutlet.Id, TableNumber = "T-5", Section = "Family Section", SeatingCapacity = 6, IsOccupied = false },
                new() { TenantId = jmTenant.Id, OutletId = jmOutlet.Id, TableNumber = "VIP-1", Section = "AC Lounge", SeatingCapacity = 8, IsOccupied = false }
            };
            await context.Tables.InsertManyAsync(jmTables);
        }

        var countJmCategories = await context.Categories.CountDocumentsAsync(c => c.TenantId == jmTenant.Id);
        if (countJmCategories == 0)
        {
            var catStarters = new Category { TenantId = jmTenant.Id, OutletId = jmOutlet.Id, Name = "Starters & Snacks", Description = "Crispy starters", DisplayOrder = 1 };
            var catMains = new Category { TenantId = jmTenant.Id, OutletId = jmOutlet.Id, Name = "Main Course & Thali", Description = "Special Malhar Thali & Gravies", DisplayOrder = 2 };
            var catBreads = new Category { TenantId = jmTenant.Id, OutletId = jmOutlet.Id, Name = "Bhakri & Breads", Description = "Jowar & Bajra Bhakri", DisplayOrder = 3 };
            await context.Categories.InsertManyAsync(new[] { catStarters, catMains, catBreads });

            var jmItems = new List<MenuItem>
            {
                new() { TenantId = jmTenant.Id, OutletId = jmOutlet.Id, CategoryId = catStarters.Id, Name = "Chicken Sukka Special", BasePrice = 260, IsVeg = false, IsAvailable = true },
                new() { TenantId = jmTenant.Id, OutletId = jmOutlet.Id, CategoryId = catStarters.Id, Name = "Mutton Sukka Masala", BasePrice = 340, IsVeg = false, IsAvailable = true },
                new() { TenantId = jmTenant.Id, OutletId = jmOutlet.Id, CategoryId = catMains.Id, Name = "Special Malhar Chicken Thali", BasePrice = 320, IsVeg = false, IsAvailable = true },
                new() { TenantId = jmTenant.Id, OutletId = jmOutlet.Id, CategoryId = catMains.Id, Name = "Special Malhar Mutton Thali", BasePrice = 420, IsVeg = false, IsAvailable = true },
                new() { TenantId = jmTenant.Id, OutletId = jmOutlet.Id, CategoryId = catBreads.Id, Name = "Jowar Bhakri (Fresh Hot)", BasePrice = 30, IsVeg = true, IsAvailable = true }
            };
            await context.MenuItems.InsertManyAsync(jmItems);
        }
    }
}
