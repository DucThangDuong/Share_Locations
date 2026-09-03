using Application.Common;
using Application.Common.Behaviors;
using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
using MediatR;
using NSubstitute;
using Xunit;

namespace Backend.UnitTests;

public class ValidationBehaviorTests
{
    public record SampleCommand(string Name) : IRequest<Result<string>>;

    public class SampleCommandValidator : AbstractValidator<SampleCommand>
    {
        public SampleCommandValidator()
        {
            RuleFor(x => x.Name).NotEmpty().WithMessage("Tên không được để trống.");
        }
    }

    [Fact]
    public async Task Handle_WhenValidationFails_ShouldReturnValidationErrorWithoutCallingNext()
    {
        // Arrange
        var validator = new SampleCommandValidator();
        var validators = new List<IValidator<SampleCommand>> { validator };
        var behavior = new ValidationBehavior<SampleCommand, Result<string>>(validators);

        var request = new SampleCommand(""); // Invalid name
        var nextDelegate = Substitute.For<RequestHandlerDelegate<Result<string>>>();

        // Act
        var result = await behavior.Handle(request, nextDelegate, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(System.Net.HttpStatusCode.UnprocessableEntity);
        result.Errors.Should().HaveCount(1);
        result.Errors[0].Field.Should().Be("Name");
        result.Errors[0].Message.Should().Be("Tên không được để trống.");

        // next() must NOT be invoked when validation fails
        await nextDelegate.DidNotReceive().Invoke();
    }

    [Fact]
    public async Task Handle_WhenValidationPasses_ShouldInvokeNextDelegate()
    {
        // Arrange
        var validator = new SampleCommandValidator();
        var validators = new List<IValidator<SampleCommand>> { validator };
        var behavior = new ValidationBehavior<SampleCommand, Result<string>>(validators);

        var request = new SampleCommand("Valid Name");
        var expectedResponse = Result<string>.Success("Success Value");
        var nextDelegate = Substitute.For<RequestHandlerDelegate<Result<string>>>();
        nextDelegate.Invoke().Returns(Task.FromResult(expectedResponse));

        // Act
        var result = await behavior.Handle(request, nextDelegate, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().Be("Success Value");
        await nextDelegate.Received(1).Invoke();
    }

    [Fact]
    public async Task Handle_WhenNoValidatorsRegistered_ShouldInvokeNextDelegateDirectly()
    {
        // Arrange
        var validators = Enumerable.Empty<IValidator<SampleCommand>>();
        var behavior = new ValidationBehavior<SampleCommand, Result<string>>(validators);

        var request = new SampleCommand("Any");
        var expectedResponse = Result<string>.Success("OK");
        var nextDelegate = Substitute.For<RequestHandlerDelegate<Result<string>>>();
        nextDelegate.Invoke().Returns(Task.FromResult(expectedResponse));

        // Act
        var result = await behavior.Handle(request, nextDelegate, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        await nextDelegate.Received(1).Invoke();
    }
}
