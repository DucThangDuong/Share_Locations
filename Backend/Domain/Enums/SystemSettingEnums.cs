using System.Text.Json.Serialization;

namespace Domain.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum SystemSettingKey
{
    MAINTENANCE_MODE,
    SITE_NAME,
    SITE_EMAIL,
    SITE_HOTLINE,
    AUTO_APPROVE_PLACES,
    AUTO_APPROVE_REVIEWS,
    MAX_UPLOAD_PHOTOS,
    MAX_UPLOAD_SIZE_MB,
    BLACKLIST_WORDS,
    ALLOW_REGISTRATION,
    REQUIRE_EMAIL_VERIFICATION,
    ENABLE_TWO_FACTOR,
    DEFAULT_USER_AVATAR,
    DEFAULT_GROUP_AVATAR,
    HOME_HERO_IMAGE
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum SystemSettingGroup
{
    GENERAL,
    MODERATION,
    SECURITY,
    SYSTEM,
    NOTIFICATION,
    MEDIA
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ReportTargetScope
{
    PLACE,
    CONTENT,
    REVIEW,
    COMMENT,
    ALL
}

