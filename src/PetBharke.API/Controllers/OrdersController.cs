using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using MongoDB.Bson;
using MongoDB.Driver;
using PetBharke.API.Hubs;
using PetBharke.Application.Interfaces;
using PetBharke.Domain.Entities;
using PetBharke.Domain.Enums;

namespace PetBharke.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IMongoDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IHubContext<OrderHub> _orderHub;

    public OrdersController(
        IMongoDbContext context,
        ICurrentUserService currentUser,
        IHubContext<OrderHub> orderHub)
    {
        _context = context;
        _currentUser = currentUser;
        _orderHub = orderHub;
    }

    [HttpGet]
    public async Task<IActionResult> GetOrders(
        [FromQuery] OrderStatus? status,
        [FromQuery] OrderType? orderType,
        [FromQuery] AggregatorSource? aggregator,
        [FromQuery] string? billNo,
        [FromQuery] string? kotNo,
        [FromQuery] int limit = 50)
    {
        var tenantId = _currentUser.TenantId;
        var outletId = _currentUser.OutletId;
        if (string.IsNullOrEmpty(tenantId))
            return Unauthorized(new { success = false, message = "Tenant context required." });

        var builder = Builders<Order>.Filter;
        var filter = builder.Eq(o => o.IsActive, true)
            & builder.Eq(o => o.TenantId, tenantId);

        if (!string.IsNullOrEmpty(outletId))
        {
            filter &= (builder.Eq(o => o.OutletId, outletId) | builder.Eq(o => o.OutletId, "") | builder.Eq(o => o.OutletId, (string?)null));
        }
        if (status.HasValue) filter &= builder.Eq(o => o.Status, status.Value);
        if (orderType.HasValue) filter &= builder.Eq(o => o.OrderType, orderType.Value);
        if (aggregator.HasValue) filter &= builder.Eq(o => o.AggregatorSource, aggregator.Value);
        if (!string.IsNullOrWhiteSpace(billNo)) filter &= builder.Regex(o => o.BillNumber, new MongoDB.Bson.BsonRegularExpression(billNo, "i"));
        if (!string.IsNullOrWhiteSpace(kotNo)) filter &= builder.Regex(o => o.KotNumber, new MongoDB.Bson.BsonRegularExpression(kotNo, "i"));

        var orders = await _context.Orders
            .Find(filter)
            .SortByDescending(o => o.PlacedAt)
            .Limit(limit)
            .ToListAsync();

        return Ok(new { success = true, data = orders });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetOrderById(string id)
    {
        var tenantId = _currentUser.TenantId;
        Order? order = null;
        if (ObjectId.TryParse(id, out _))
        {
            order = await _context.Orders
                .Find(o => o.Id == id && o.TenantId == tenantId)
                .FirstOrDefaultAsync();
        }
        else
        {
            order = await _context.Orders
                .Find(o => (o.KotNumber == id || o.BillNumber == id) && o.TenantId == tenantId)
                .FirstOrDefaultAsync();
        }

        if (order == null) return NotFound();
        return Ok(new { success = true, data = order });
    }

    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] Order order)
    {
        var tenantId = _currentUser.TenantId ?? string.Empty;
        var outletId = _currentUser.OutletId ?? string.Empty;

        if (!ObjectId.TryParse(order.Id, out _))
        {
            order.Id = ObjectId.GenerateNewId().ToString();
        }

        // Auto-generate Bill & KOT Number if not provided
        var todayCount = await _context.Orders.CountDocumentsAsync(o => o.TenantId == tenantId && o.PlacedAt >= DateTime.UtcNow.Date);
        var nextSeq = todayCount + 1;

        if (string.IsNullOrEmpty(order.BillNumber))
        {
            order.BillNumber = $"{nextSeq}";
        }
        if (string.IsNullOrEmpty(order.KotNumber))
        {
            order.KotNumber = $"KOT-{nextSeq + 100}";
        }

        order.TenantId = tenantId;
        order.OutletId = outletId;
        order.BillerUserId = _currentUser.UserId;
        order.BillerName = _currentUser.Username ?? "Biller";
        order.PlacedAt = DateTime.UtcNow;
        order.CreatedAt = DateTime.UtcNow;
        order.IsActive = true;

        if (order.Status == 0)
        {
            order.Status = OrderStatus.KotCreated;
        }

        // Calculate line items total if needed
        if (order.SubTotal == 0 && order.Items.Count > 0)
        {
            order.SubTotal = order.Items.Sum(i => i.TotalPrice);
            order.CgstAmount = order.SubTotal * 0.025m;
            order.SgstAmount = order.SubTotal * 0.025m;
            order.TotalAmount = Math.Round(order.SubTotal + order.CgstAmount + order.SgstAmount - order.DiscountAmount + order.DeliveryCharges);
        }

        var groupName = $"outlet_{tenantId}_{outletId}";
        var kdsGroupName = $"kds_{tenantId}_{outletId}";

        // Dine-In order handling (Open tabs, Repeat KOT accumulation, Table state)
        if (order.OrderType == OrderType.DineIn && !string.IsNullOrEmpty(order.TableNumber))
        {
            var normalizedTableNumber = order.TableNumber.Trim().ToUpper();
            order.TableNumber = normalizedTableNumber;

            var existingTable = await _context.Tables
                .Find(t => t.TenantId == tenantId && t.TableNumber == normalizedTableNumber && t.IsActive)
                .FirstOrDefaultAsync();

            var isSettled = order.Status == OrderStatus.Delivered;

            if (isSettled)
            {
                // Bill payment / settlement flow
                if (existingTable != null && !string.IsNullOrEmpty(existingTable.CurrentOrderId))
                {
                    await _context.Orders.UpdateOneAsync(
                        o => o.Id == existingTable.CurrentOrderId && o.TenantId == tenantId,
                        Builders<Order>.Update
                            .Set(o => o.Status, OrderStatus.Delivered)
                            .Set(o => o.DeliveredAt, DateTime.UtcNow)
                            .Set(o => o.Payments, order.Payments)
                            .Set(o => o.UpdatedAt, DateTime.UtcNow)
                    );
                }

                await _context.Orders.InsertOneAsync(order);

                if (existingTable != null)
                {
                    await _context.Tables.UpdateOneAsync(
                        t => t.Id == existingTable.Id,
                        Builders<RestaurantTable>.Update
                            .Set(t => t.IsOccupied, false)
                            .Set(t => t.CurrentOrderId, null)
                            .Set(t => t.UpdatedAt, DateTime.UtcNow)
                    );
                }

                await _orderHub.Clients.Group(groupName).SendAsync("TableStatusChanged", new
                {
                    tableNumber = normalizedTableNumber,
                    isOccupied = false,
                    currentOrderId = (string?)null,
                    orderTotal = 0m,
                    items = new List<OrderItem>()
                });

                await _orderHub.Clients.Group(groupName).SendAsync("ReceiveOrderUpdate", order);
                await _orderHub.Clients.Group(kdsGroupName).SendAsync("ReceiveOrderUpdate", new
                {
                    id = order.Id,
                    tableNumber = normalizedTableNumber,
                    status = 5,
                    kotNumber = order.KotNumber
                });

                return Ok(new { success = true, data = order });
            }

            // Non-settled: Check for active open tab on this table (Repeat KOT)
            Order? activeOrder = null;
            if (existingTable != null && existingTable.IsOccupied && !string.IsNullOrEmpty(existingTable.CurrentOrderId))
            {
                activeOrder = await _context.Orders
                    .Find(o => o.Id == existingTable.CurrentOrderId && o.TenantId == tenantId && o.Status != OrderStatus.Delivered && o.Status != OrderStatus.Cancelled)
                    .FirstOrDefaultAsync();
            }

            if (activeOrder != null)
            {
                // Repeat KOT on existing open table: accumulate items and running total
                activeOrder.Items.AddRange(order.Items);
                activeOrder.SubTotal = activeOrder.Items.Sum(i => i.TotalPrice);
                activeOrder.CgstAmount = activeOrder.SubTotal * 0.025m;
                activeOrder.SgstAmount = activeOrder.SubTotal * 0.025m;
                activeOrder.TotalAmount = Math.Round(activeOrder.SubTotal + activeOrder.CgstAmount + activeOrder.SgstAmount - activeOrder.DiscountAmount + activeOrder.DeliveryCharges);
                activeOrder.UpdatedAt = DateTime.UtcNow;

                await _context.Orders.ReplaceOneAsync(o => o.Id == activeOrder.Id, activeOrder);

                // Broadcast cumulative running total to Tables & Billing
                await _orderHub.Clients.Group(groupName).SendAsync("TableStatusChanged", new
                {
                    tableNumber = normalizedTableNumber,
                    isOccupied = true,
                    currentOrderId = activeOrder.Id,
                    orderTotal = activeOrder.TotalAmount,
                    billNumber = activeOrder.BillNumber,
                    kotNumber = order.KotNumber,
                    items = activeOrder.Items,
                    orderTime = activeOrder.PlacedAt.ToString("o")
                });

                // Broadcast fresh delta KOT to KDS and Outlets
                var repeatKotData = new
                {
                    orderId = activeOrder.Id,
                    kotNumber = order.KotNumber,
                    billNumber = activeOrder.BillNumber,
                    tableNumber = normalizedTableNumber,
                    orderType = order.OrderType.ToString(),
                    placedAt = DateTime.UtcNow,
                    items = order.Items,
                    status = "Pending",
                    totalAmount = activeOrder.TotalAmount
                };
                await _orderHub.Clients.Group(kdsGroupName).SendAsync("NewKOTReceived", repeatKotData);
                await _orderHub.Clients.Group(groupName).SendAsync("NewKOTReceived", repeatKotData);
                await _orderHub.Clients.Group(kdsGroupName).SendAsync("ReceiveOrderUpdate", new
                {
                    id = activeOrder.Id,
                    kotNumber = order.KotNumber,
                    tableNumber = normalizedTableNumber,
                    orderType = order.OrderType.ToString(),
                    placedAt = DateTime.UtcNow,
                    items = order.Items,
                    status = 1,
                    totalAmount = activeOrder.TotalAmount
                });

                return Ok(new { success = true, data = activeOrder });
            }

            // Fresh Dine-In Order
            await _context.Orders.InsertOneAsync(order);

            if (existingTable != null)
            {
                await _context.Tables.UpdateOneAsync(
                    t => t.Id == existingTable.Id,
                    Builders<RestaurantTable>.Update
                        .Set(t => t.IsOccupied, true)
                        .Set(t => t.CurrentOrderId, order.Id)
                        .Set(t => t.UpdatedAt, DateTime.UtcNow)
                );
            }

            await _orderHub.Clients.Group(groupName).SendAsync("TableStatusChanged", new
            {
                tableNumber = normalizedTableNumber,
                isOccupied = true,
                currentOrderId = order.Id,
                orderTotal = order.TotalAmount,
                billNumber = order.BillNumber,
                kotNumber = order.KotNumber,
                items = order.Items,
                orderTime = DateTime.UtcNow.ToString("o")
            });
        }
        else
        {
            // Non-DineIn (TakeAway / Delivery)
            await _context.Orders.InsertOneAsync(order);
        }

        // Real-time broadcast via SignalR
        await _orderHub.Clients.Group(groupName).SendAsync("ReceiveOrderUpdate", order);

        // KOT broadcast to KDS
        var kotData = new
        {
            orderId = order.Id,
            kotNumber = order.KotNumber,
            billNumber = order.BillNumber,
            tableNumber = order.TableNumber,
            orderType = order.OrderType.ToString(),
            placedAt = order.PlacedAt,
            items = order.Items,
            status = "Pending",
            totalAmount = order.TotalAmount
        };
        await _orderHub.Clients.Group(kdsGroupName).SendAsync("NewKOTReceived", kotData);
        await _orderHub.Clients.Group(groupName).SendAsync("NewKOTReceived", kotData);

        return Ok(new { success = true, data = order });
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateOrderStatus(string id, [FromBody] UpdateOrderStatusRequest request)
    {
        var tenantId = _currentUser.TenantId;
        Order? order = null;
        if (ObjectId.TryParse(id, out _))
        {
            order = await _context.Orders
                .Find(o => o.Id == id && o.TenantId == tenantId)
                .FirstOrDefaultAsync();
        }
        else
        {
            order = await _context.Orders
                .Find(o => (o.KotNumber == id || o.BillNumber == id) && o.TenantId == tenantId)
                .FirstOrDefaultAsync();
        }

        if (order == null) return NotFound();
        id = order.Id;

        order.Status = request.Status;
        order.UpdatedAt = DateTime.UtcNow;

        if (request.Status == OrderStatus.FoodReady) order.FoodReadyAt = DateTime.UtcNow;
        else if (request.Status == OrderStatus.Dispatched) order.DispatchedAt = DateTime.UtcNow;
        else if (request.Status == OrderStatus.Delivered) order.DeliveredAt = DateTime.UtcNow;
        else if (request.Status == OrderStatus.Cancelled) order.CancelledAt = DateTime.UtcNow;

        if (request.RiderDetails != null)
        {
            order.RiderDetails = request.RiderDetails;
        }

        await _context.Orders.ReplaceOneAsync(o => o.Id == id && o.TenantId == tenantId, order);

        var groupName = $"outlet_{tenantId}_{order.OutletId}";
        var kdsGroupName = $"kds_{tenantId}_{order.OutletId}";

        // Free table if completed or cancelled
        if ((request.Status == OrderStatus.Delivered || request.Status == OrderStatus.Cancelled) && !string.IsNullOrEmpty(order.TableNumber))
        {
            await _context.Tables.UpdateOneAsync(
                t => t.TenantId == tenantId && t.TableNumber == order.TableNumber,
                Builders<RestaurantTable>.Update
                    .Set(t => t.IsOccupied, false)
                    .Set(t => t.CurrentOrderId, null)
            );

            await _orderHub.Clients.Group(groupName).SendAsync("TableStatusChanged", new
            {
                tableNumber = order.TableNumber,
                isOccupied = false,
                currentOrderId = (string?)null,
                orderTotal = 0m,
                items = new List<OrderItem>()
            });
        }

        // Broadcast to SignalR
        await _orderHub.Clients.Group(groupName).SendAsync("ReceiveOrderUpdate", order);
        await _orderHub.Clients.Group(kdsGroupName).SendAsync("ReceiveOrderUpdate", order);

        return Ok(new { success = true, data = order });
    }

    [HttpPost("simulate-online")]
    public async Task<IActionResult> SimulateOnlineOrder([FromQuery] string aggregator = "Zomato")
    {
        var tenantId = _currentUser.TenantId ?? string.Empty;
        var outletId = _currentUser.OutletId ?? string.Empty;

        var sampleCustomers = new[]
        {
            new { Name = "Rohan Shinde", Phone = "9822114455" },
            new { Name = "Pooja Deshmukh", Phone = "9822336677" },
            new { Name = "Sameer Kulkarni", Phone = "9822558899" },
            new { Name = "Tanvi Joshi", Phone = "9822771122" }
        };

        var random = new Random();
        var customer = sampleCustomers[random.Next(sampleCustomers.Length)];
        var isZomato = aggregator.ToLower().Contains("zomato");

        var newOrder = new Order
        {
            TenantId = tenantId,
            OutletId = outletId,
            BillNumber = random.Next(80, 99).ToString(),
            KotNumber = $"KOT-{random.Next(200, 299)}",
            ExternalOrderId = random.Next(825000000, 829999999).ToString(),
            Otp = random.Next(1000, 9999).ToString(),
            CustomerName = customer.Name,
            CustomerPhone = customer.Phone,
            OrderType = OrderType.Delivery,
            Status = OrderStatus.Pending,
            AggregatorSource = isZomato ? AggregatorSource.Zomato : AggregatorSource.Swiggy,
            DeliveryInstructions = "Call before arrival, handle with care",
            PlacedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            IsActive = true,
            SubTotal = 280.00m,
            CgstAmount = 7.00m,
            SgstAmount = 7.00m,
            TotalAmount = 294.00m,
            Payments = new List<OrderPayment> { new() { Mode = PaymentMode.Online, Amount = 294.00m } },
            Items = new List<OrderItem>
            {
                new() { Name = "Choco Belgian Shake", Quantity = 1, UnitPrice = 190, TotalPrice = 190 },
                new() { Name = "Vanilla Classic", Quantity = 1, UnitPrice = 90, TotalPrice = 90 }
            }
        };

        await _context.Orders.InsertOneAsync(newOrder);

        var groupName = $"outlet_{tenantId}_{outletId}";
        await _orderHub.Clients.Group(groupName).SendAsync("ReceiveAggregatorOrder", newOrder);

        return Ok(new { success = true, data = newOrder });
    }
}

public class UpdateOrderStatusRequest
{
    public OrderStatus Status { get; set; }
    public RiderDetails? RiderDetails { get; set; }
}
