namespace Domain.Entities;

public class RolePermission
{
    public byte RoleId { get; private set; }
    public short PermissionId { get; private set; }

    // Navigation
    public virtual Role Role { get; private set; } = null!;
    public virtual Permission Permission { get; private set; } = null!;

    protected RolePermission() { }

    public RolePermission(byte roleId, short permissionId)
    {
        RoleId = roleId;
        PermissionId = permissionId;
    }
}
