using Application.Common.Interfaces;
using Application.Common.Interfaces.Repositories;
using Application.DTOs;
using Application.Features.Chat.Commands;
using Application.Features.Chat.Queries;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Backend.UnitTests;

public class ChatFeaturesTests
{
    [Fact]
    public void ChatRoom_And_ChatRoomMember_Should_Initialize_Correctly()
    {
        var room = new ChatRoom("Nhóm phượt Hà Giang", isGroup: true);
        room.Name.Should().Be("Nhóm phượt Hà Giang");
        room.IsGroup.Should().BeTrue();
        room.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));

        room.AddMember(100);
        room.AddMember(200);
        room.Members.Should().HaveCount(2);

        var member = new ChatRoomMember(room.Id, 100);
        member.UserId.Should().Be(100);
        member.LastReadAt.Should().NotBeNull();

        var newReadTime = DateTime.UtcNow.AddMinutes(5);
        member.MarkRead(newReadTime);
        member.LastReadAt.Should().Be(newReadTime);
    }

    [Fact]
    public async Task GetOrCreateDirectRoom_Should_Fail_When_User_Chats_With_Themself()
    {
        var chatRepo = Substitute.For<IChatRepository>();
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var handler = new GetOrCreateDirectRoomCommandHandler(chatRepo, unitOfWork);

        var result = await handler.Handle(new GetOrCreateDirectRoomCommand(10, 10), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("chính mình");
    }

    [Fact]
    public async Task GetOrCreateDirectRoom_Should_Fail_When_TargetUser_NotFound()
    {
        var chatRepo = Substitute.For<IChatRepository>();
        var unitOfWork = Substitute.For<IUnitOfWork>();
        unitOfWork.Users.GetByIdAsync(999, Arg.Any<CancellationToken>()).Returns((User?)null);

        var handler = new GetOrCreateDirectRoomCommandHandler(chatRepo, unitOfWork);
        var result = await handler.Handle(new GetOrCreateDirectRoomCommand(10, 999), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(System.Net.HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetRoomMessages_Should_Return_Forbidden_When_User_Not_In_Room()
    {
        var chatRepo = Substitute.For<IChatRepository>();
        chatRepo.IsUserInRoomAsync(1, 99, Arg.Any<CancellationToken>()).Returns(false);

        var handler = new GetRoomMessagesQueryHandler(chatRepo);
        var result = await handler.Handle(new GetRoomMessagesQuery(1, 99), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(System.Net.HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task SendMessage_Should_Return_Forbidden_When_Sender_Not_In_Room()
    {
        var chatRepo = Substitute.For<IChatRepository>();
        var notifier = Substitute.For<IChatNotifier>();
        var blobService = Substitute.For<IBlobService>();
        chatRepo.IsUserInRoomAsync(1, 99, Arg.Any<CancellationToken>()).Returns(false);

        var handler = new SendMessageCommandHandler(chatRepo, notifier, blobService);
        var result = await handler.Handle(new SendMessageCommand(1, 99, "Xin chào"), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(System.Net.HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task SendMessage_Should_Return_Failure_When_Content_And_Attachments_Empty()
    {
        var chatRepo = Substitute.For<IChatRepository>();
        var notifier = Substitute.For<IChatNotifier>();
        var blobService = Substitute.For<IBlobService>();
        chatRepo.IsUserInRoomAsync(1, 10, Arg.Any<CancellationToken>()).Returns(true);

        var handler = new SendMessageCommandHandler(chatRepo, notifier, blobService);
        var result = await handler.Handle(new SendMessageCommand(1, 10, "   "), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("không được để trống");
    }

    [Fact]
    public async Task SendMessage_Should_Succeed_And_Broadcast_Via_Notifier()
    {
        var chatRepo = Substitute.For<IChatRepository>();
        var notifier = Substitute.For<IChatNotifier>();
        var blobService = Substitute.For<IBlobService>();

        chatRepo.IsUserInRoomAsync(5, 10, Arg.Any<CancellationToken>()).Returns(true);

        var expectedDto = new ChatMessageDto
        {
            Id = 1001,
            RoomId = 5,
            SenderId = 10,
            Content = "Hẹn gặp bạn ở hồ Hoàn Kiếm",
            CreatedAt = DateTime.UtcNow
        };

        chatRepo.SendMessageAsync(
            5,
            10,
            "Hẹn gặp bạn ở hồ Hoàn Kiếm",
            null,
            Arg.Any<IReadOnlyList<CreateAttachmentInput>?>(),
            Arg.Any<CancellationToken>())
            .Returns(expectedDto);

        var handler = new SendMessageCommandHandler(chatRepo, notifier, blobService);
        var result = await handler.Handle(new SendMessageCommand(5, 10, "Hẹn gặp bạn ở hồ Hoàn Kiếm"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Id.Should().Be(1001);

        await notifier.Received(1).NotifyMessageReceivedAsync(5, expectedDto, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task MarkRoomAsRead_Should_Succeed_And_Broadcast_Via_Notifier()
    {
        var chatRepo = Substitute.For<IChatRepository>();
        var notifier = Substitute.For<IChatNotifier>();

        chatRepo.IsUserInRoomAsync(5, 10, Arg.Any<CancellationToken>()).Returns(true);
        chatRepo.MarkRoomAsReadAsync(5, 10, Arg.Any<CancellationToken>()).Returns(true);

        var handler = new MarkRoomAsReadCommandHandler(chatRepo, notifier);
        var result = await handler.Handle(new MarkRoomAsReadCommand(5, 10), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        await notifier.Received(1).NotifyMessageReadAsync(5, 10, Arg.Any<DateTime>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task AddMessageReaction_Should_Succeed_And_Broadcast_Via_Notifier()
    {
        var chatRepo = Substitute.For<IChatRepository>();
        var notifier = Substitute.For<IChatNotifier>();

        chatRepo.IsUserInRoomAsync(5, 10, Arg.Any<CancellationToken>()).Returns(true);
        chatRepo.AddReactionAsync(1001, 10, "❤️", Arg.Any<CancellationToken>()).Returns(true);

        var handler = new AddMessageReactionCommandHandler(chatRepo, notifier);
        var result = await handler.Handle(new AddMessageReactionCommand(5, 1001, 10, "❤️"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        await notifier.Received(1).NotifyMessageReactedAsync(5, 1001, 10, "❤️", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CreateGroupRoom_Should_Fail_When_Name_Is_Empty()
    {
        var chatRepo = Substitute.For<IChatRepository>();
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var handler = new CreateGroupRoomCommandHandler(chatRepo, unitOfWork);

        var result = await handler.Handle(new CreateGroupRoomCommand(10, "", new List<long> { 20 }), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Tên nhóm");
    }

    [Fact]
    public async Task CreateGroupRoom_Should_Fail_When_No_Other_Members()
    {
        var chatRepo = Substitute.For<IChatRepository>();
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var handler = new CreateGroupRoomCommandHandler(chatRepo, unitOfWork);

        var result = await handler.Handle(new CreateGroupRoomCommand(10, "Group Test", new List<long> { 10 }), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("ít nhất 1 thành viên khác");
    }

    [Fact]
    public async Task CreateGroupRoom_Should_Succeed_When_Valid()
    {
        var chatRepo = Substitute.For<IChatRepository>();
        var unitOfWork = Substitute.For<IUnitOfWork>();
        chatRepo.CreateGroupRoomAsync("Phượt Hà Giang", 10, Arg.Any<IReadOnlyList<long>>(), Arg.Any<CancellationToken>())
            .Returns(99);

        var handler = new CreateGroupRoomCommandHandler(chatRepo, unitOfWork);
        var result = await handler.Handle(new CreateGroupRoomCommand(10, "Phượt Hà Giang", new List<long> { 20, 30 }), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().Be(99);
    }

    [Fact]
    public async Task AddMembersToRoom_Should_Fail_When_Room_Not_Found()
    {
        var chatRepo = Substitute.For<IChatRepository>();
        chatRepo.GetRoomByIdAsync(50, Arg.Any<CancellationToken>()).Returns((ChatRoom?)null);

        var handler = new AddMembersToRoomCommandHandler(chatRepo);
        var result = await handler.Handle(new AddMembersToRoomCommand(50, 10, new List<long> { 20 }), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("không tồn tại");
    }

    [Fact]
    public async Task AddMembersToRoom_Should_Fail_When_Room_Is_Not_Group()
    {
        var chatRepo = Substitute.For<IChatRepository>();
        var directRoom = new ChatRoom(null, isGroup: false);
        chatRepo.GetRoomByIdAsync(50, Arg.Any<CancellationToken>()).Returns(directRoom);

        var handler = new AddMembersToRoomCommandHandler(chatRepo);
        var result = await handler.Handle(new AddMembersToRoomCommand(50, 10, new List<long> { 20 }), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("phòng chat nhóm");
    }

    [Fact]
    public async Task AddMembersToRoom_Should_Fail_When_Requester_Not_Member()
    {
        var chatRepo = Substitute.For<IChatRepository>();
        var groupRoom = new ChatRoom("Group A", isGroup: true);
        chatRepo.GetRoomByIdAsync(50, Arg.Any<CancellationToken>()).Returns(groupRoom);
        chatRepo.IsUserInRoomAsync(50, 10, Arg.Any<CancellationToken>()).Returns(false);

        var handler = new AddMembersToRoomCommandHandler(chatRepo);
        var result = await handler.Handle(new AddMembersToRoomCommand(50, 10, new List<long> { 20 }), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("không phải thành viên");
    }

    [Fact]
    public async Task AddMembersToRoom_Should_Succeed_When_Valid()
    {
        var chatRepo = Substitute.For<IChatRepository>();
        var groupRoom = new ChatRoom("Group A", isGroup: true);
        chatRepo.GetRoomByIdAsync(50, Arg.Any<CancellationToken>()).Returns(groupRoom);
        chatRepo.IsUserInRoomAsync(50, 10, Arg.Any<CancellationToken>()).Returns(true);
        chatRepo.AddMembersToRoomAsync(50, Arg.Any<IReadOnlyList<long>>(), Arg.Any<CancellationToken>()).Returns(true);

        var handler = new AddMembersToRoomCommandHandler(chatRepo);
        var result = await handler.Handle(new AddMembersToRoomCommand(50, 10, new List<long> { 20, 30 }), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
    }
}