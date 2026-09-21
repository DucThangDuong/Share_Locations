namespace Domain.Entities;

public class FoodProvince
{
    public long FoodId { get; private set; }
    public int ProvinceId { get; private set; }

    // Constructors
    protected FoodProvince() { }

    public FoodProvince(long foodId, int provinceId)
    {
        FoodId = foodId;
        ProvinceId = provinceId;
    }

    // Navigation
    public virtual Food Food { get; private set; } = null!;
    public virtual Province Province { get; private set; } = null!;
}
