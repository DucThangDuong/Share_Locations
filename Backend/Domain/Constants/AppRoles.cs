namespace Domain.Constants;

public static class AppRoles
{
    public const string SystemAdmin = "SystemAdmin";
    public const string CategoryAdmin = "CategoryAdmin";
    public const string User = "User";

    public const string DbSystemAdmin = "SYSTEM_ADMIN";
    public const string DbCategoryAdmin = "CATEGORY_ADMIN";
    public const string DbUser = "USER";
    
    public static readonly string[] SuperAdminOnly = 
    { 
        SystemAdmin, 
        DbSystemAdmin 
    };
    
    public static readonly string[] AnyAdmin = 
    { 
        CategoryAdmin, 
        SystemAdmin, 
        DbCategoryAdmin, 
        DbSystemAdmin 
    };

    public static readonly string[] AllAuthenticated = 
    { 
        User, 
        CategoryAdmin, 
        SystemAdmin, 
        DbUser, 
        DbCategoryAdmin, 
        DbSystemAdmin 
    };
}
