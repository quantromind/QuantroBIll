using System.Collections.Concurrent;
using PetBharke.Application.Interfaces;

namespace PetBharke.Infrastructure.Security;

public class PinRateLimiter : IPinRateLimiter
{
    private class AttemptRecord
    {
        public int FailedAttempts { get; set; }
        public DateTime? LockedUntilUtc { get; set; }
        public DateTime LastAttemptUtc { get; set; } = DateTime.UtcNow;
    }

    private readonly ConcurrentDictionary<string, AttemptRecord> _attempts = new();
    private const int MaxFailedAttempts = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(5);

    public bool IsLocked(string outletId, out TimeSpan remainingLockout)
    {
        remainingLockout = TimeSpan.Zero;
        if (string.IsNullOrWhiteSpace(outletId)) return false;

        if (_attempts.TryGetValue(outletId, out var record))
        {
            lock (record)
            {
                if (record.LockedUntilUtc.HasValue)
                {
                    if (DateTime.UtcNow < record.LockedUntilUtc.Value)
                    {
                        remainingLockout = record.LockedUntilUtc.Value - DateTime.UtcNow;
                        return true;
                    }

                    // Lockout period has elapsed - reset
                    record.LockedUntilUtc = null;
                    record.FailedAttempts = 0;
                }
            }
        }

        return false;
    }

    public void RecordFailure(string outletId)
    {
        if (string.IsNullOrWhiteSpace(outletId)) return;

        var record = _attempts.GetOrAdd(outletId, _ => new AttemptRecord());
        lock (record)
        {
            record.LastAttemptUtc = DateTime.UtcNow;
            record.FailedAttempts++;

            if (record.FailedAttempts >= MaxFailedAttempts)
            {
                record.LockedUntilUtc = DateTime.UtcNow.Add(LockoutDuration);
            }
        }
    }

    public void RecordSuccess(string outletId)
    {
        if (string.IsNullOrWhiteSpace(outletId)) return;

        if (_attempts.TryGetValue(outletId, out var record))
        {
            lock (record)
            {
                record.FailedAttempts = 0;
                record.LockedUntilUtc = null;
                record.LastAttemptUtc = DateTime.UtcNow;
            }
        }
    }
}
