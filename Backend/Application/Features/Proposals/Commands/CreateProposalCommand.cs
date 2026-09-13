using System.Text.Json;
using Application.Common;
using Application.DTOs;
using Domain.Entities;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Proposals.Commands;

public record CreateProposalCommand(long UserId, CreateProposalRequestDto Dto) : IRequest<Result<UserProposalItemDto>>;

public class CreateProposalCommandHandler : IRequestHandler<CreateProposalCommand, Result<UserProposalItemDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateProposalCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<UserProposalItemDto>> Handle(CreateProposalCommand request, CancellationToken ct)
    {
        var dto = request.Dto;
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return Result<UserProposalItemDto>.Failure("Tên địa điểm không được để trống.");
        }

        if (string.IsNullOrWhiteSpace(dto.Address))
        {
            return Result<UserProposalItemDto>.Failure("Địa chỉ không được để trống.");
        }

        var json = JsonSerializer.Serialize(dto);
        var proposal = new Proposal(request.UserId, json);

        await _unitOfWork.Proposals.AddAsync(proposal, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        var responseDto = new UserProposalItemDto
        {
            Id = proposal.Id,
            Name = dto.Name,
            Address = dto.Address,
            OpeningHours = dto.OpeningHours,
            MinPrice = dto.MinPrice,
            MaxPrice = dto.MaxPrice,
            Description = dto.Description,
            CoverImg = dto.CoverImg,
            MediaUrls = dto.MediaUrls ?? new List<string>(),
            Status = (int)proposal.Status,
            CreatedAt = proposal.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        };

        return Result<UserProposalItemDto>.Created(
            responseDto,
            "Gửi đề xuất địa điểm thành công! Quản trị viên sẽ xét duyệt trong 24h.");
    }
}
