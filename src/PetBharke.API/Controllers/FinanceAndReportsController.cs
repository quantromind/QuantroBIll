using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using PetBharke.Application.Interfaces;
using PetBharke.Domain.Entities;
using PetBharke.Domain.Enums;

namespace PetBharke.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FinanceController : ControllerBase
{
    private readonly IMongoDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public FinanceController(IMongoDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet("cash-flow")]
    public async Task<IActionResult> GetCashFlow()
    {
        var tenantId = _currentUser.TenantId;
        var entries = await _context.CashFlowEntries
            .Find(c => c.TenantId == tenantId && c.IsActive)
            .SortByDescending(c => c.EntryDate)
            .Limit(50)
            .ToListAsync();

        return Ok(new { success = true, data = entries });
    }

    [HttpPost("cash-flow")]
    public async Task<IActionResult> AddCashFlow([FromBody] CashFlowEntry entry)
    {
        entry.TenantId = _currentUser.TenantId ?? string.Empty;
        entry.OutletId = _currentUser.OutletId ?? string.Empty;
        entry.PerformedByUserId = _currentUser.UserId ?? string.Empty;
        entry.PerformedByName = _currentUser.Username ?? "Cashier";
        entry.EntryDate = DateTime.UtcNow;
        entry.CreatedAt = DateTime.UtcNow;
        entry.IsActive = true;

        await _context.CashFlowEntries.InsertOneAsync(entry);
        return Ok(new { success = true, data = entry });
    }

    [HttpGet("expenses")]
    public async Task<IActionResult> GetExpenses()
    {
        var tenantId = _currentUser.TenantId;
        var expenses = await _context.Expenses
            .Find(e => e.TenantId == tenantId && e.IsActive)
            .SortByDescending(e => e.ExpenseDate)
            .Limit(50)
            .ToListAsync();

        return Ok(new { success = true, data = expenses });
    }

    [HttpPost("expenses")]
    public async Task<IActionResult> AddExpense([FromBody] Expense expense)
    {
        expense.TenantId = _currentUser.TenantId ?? string.Empty;
        expense.OutletId = _currentUser.OutletId ?? string.Empty;
        expense.PaidBy = _currentUser.Username ?? "Staff";
        expense.ExpenseDate = DateTime.UtcNow;
        expense.CreatedAt = DateTime.UtcNow;
        expense.IsActive = true;

        await _context.Expenses.InsertOneAsync(expense);
        return Ok(new { success = true, data = expense });
    }

    [HttpGet("shift-summary")]
    public async Task<IActionResult> GetShiftSummary()
    {
        var tenantId = _currentUser.TenantId;
        var today = DateTime.UtcNow.Date;

        var orders = await _context.Orders
            .Find(o => o.TenantId == tenantId && o.PlacedAt >= today && o.Status != OrderStatus.Cancelled)
            .ToListAsync();

        var expenses = await _context.Expenses
            .Find(e => e.TenantId == tenantId && e.ExpenseDate >= today && e.IsActive)
            .ToListAsync();

        var cashFlow = await _context.CashFlowEntries
            .Find(c => c.TenantId == tenantId && c.EntryDate >= today && c.IsActive)
            .ToListAsync();

        var totalSales = orders.Sum(o => o.TotalAmount);
        var cashSales = orders.Where(o => o.Payments.Any(p => p.Mode == PaymentMode.Cash)).Sum(o => o.TotalAmount);
        var upiSales = orders.Where(o => o.Payments.Any(p => p.Mode == PaymentMode.UPI)).Sum(o => o.TotalAmount);
        var cardSales = orders.Where(o => o.Payments.Any(p => p.Mode == PaymentMode.Card)).Sum(o => o.TotalAmount);
        var onlineSales = orders.Where(o => o.Payments.Any(p => p.Mode == PaymentMode.Online)).Sum(o => o.TotalAmount);
        var totalExpense = expenses.Sum(e => e.Amount);

        var openingCash = cashFlow.Where(c => c.Type == "OpeningCash").Sum(c => c.Amount);
        var cashTopUp = cashFlow.Where(c => c.Type == "CashTopUp").Sum(c => c.Amount);
        var withdrawal = cashFlow.Where(c => c.Type == "Withdrawal").Sum(c => c.Amount);

        var expectedDrawerCash = openingCash + cashSales + cashTopUp - withdrawal - totalExpense;

        return Ok(new
        {
            success = true,
            data = new
            {
                totalSales,
                ordersCount = orders.Count,
                cashSales,
                upiSales,
                cardSales,
                onlineSales,
                totalExpense,
                openingCash,
                cashTopUp,
                withdrawal,
                expectedDrawerCash
            }
        });
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IMongoDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public ReportsController(IMongoDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet("sales-summary")]
    public async Task<IActionResult> GetSalesSummary([FromQuery] int days = 7)
    {
        var tenantId = _currentUser.TenantId;
        var startDate = DateTime.UtcNow.Date.AddDays(-days);

        var orders = await _context.Orders
            .Find(o => o.TenantId == tenantId && o.PlacedAt >= startDate && o.Status != OrderStatus.Cancelled)
            .ToListAsync();

        var totalRevenue = orders.Sum(o => o.TotalAmount);
        var totalCgst = orders.Sum(o => o.CgstAmount);
        var totalSgst = orders.Sum(o => o.SgstAmount);
        var averageOrderValue = orders.Count > 0 ? totalRevenue / orders.Count : 0;

        // Daily breakdown
        var dailySales = orders
            .GroupBy(o => o.PlacedAt.ToString("yyyy-MM-dd"))
            .Select(g => new
            {
                Date = g.Key,
                Revenue = g.Sum(o => o.TotalAmount),
                Count = g.Count()
            })
            .OrderBy(d => d.Date)
            .ToList();

        // Channel breakdown
        var channelSales = orders
            .GroupBy(o => o.AggregatorSource.ToString())
            .Select(g => new
            {
                Channel = g.Key,
                Revenue = g.Sum(o => o.TotalAmount),
                Count = g.Count()
            })
            .ToList();

        return Ok(new
        {
            success = true,
            data = new
            {
                totalRevenue,
                totalOrders = orders.Count,
                averageOrderValue,
                totalCgst,
                totalSgst,
                dailySales,
                channelSales
            }
        });
    }
}
