using System.Net;
using StackExchange.Redis;

namespace Infrastructure.Caching.Connection;

public interface IRedisConnectionProvider : IAsyncDisposable
{
    bool IsConnected { get; }
    IDatabase GetDatabase(int db = -1);
    IServer GetServer(EndPoint endpoint);
    EndPoint[] GetEndPoints();
    Task<T> ExecuteWithResilienceAsync<T>(
        Func<IDatabase, Task<T>> operation,
        T fallbackValue,
        bool failOpen = true,
        CancellationToken ct = default);
}

