using Domain.Entities;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class ProposalRepository : IProposalRepository
{
    private readonly TravelReviewDbContext _dbContext;

    public ProposalRepository(TravelReviewDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Proposal?> GetByIdAsync(long id, CancellationToken ct = default)
    {
        return await _dbContext.Proposals
            .Include(p => p.TargetPlace)
            .FirstOrDefaultAsync(p => p.Id == id, ct);
    }

    public async Task AddAsync(Proposal proposal, CancellationToken ct = default)
    {
        await _dbContext.Proposals.AddAsync(proposal, ct);
    }

    public void Remove(Proposal proposal)
    {
        _dbContext.Proposals.Remove(proposal);
    }
}
