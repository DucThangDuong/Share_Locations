using Domain.Entities;

namespace Domain.Interfaces;

public interface IProposalRepository
{
    Task<Proposal?> GetByIdAsync(long id, CancellationToken ct = default);
    Task AddAsync(Proposal proposal, CancellationToken ct = default);
    void Remove(Proposal proposal);
}
