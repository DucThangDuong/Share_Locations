namespace Domain.Entities;

public class FoodProvince
{
    public long FoodId { get; private set; }
    public int ProvinceId { get; private set; }

    // Navigation
    public virtual Food Food { get; private set; } = null!;
    public virtual Province Province { get; private set; } = null!;
}
