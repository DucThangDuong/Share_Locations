using System.Text.Json;
using System.Text.Json.Serialization;

namespace Application.Common.Converters;

/// <summary>
/// Converter linh hoạt cho danh sách số long (ví dụ danh sách FoodIds),
/// hỗ trợ nhận vào mảng số [1, 2], mảng chuỗi ["1", "2"], hoặc mảng object [{"id": 1}, {"foodId": 2}].
/// </summary>
public class FlexibleLongListConverter : JsonConverter<List<long>>
{
    public override List<long> Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
        {
            return new List<long>();
        }

        if (reader.TokenType == JsonTokenType.Number)
        {
            return new List<long> { reader.GetInt64() };
        }

        if (reader.TokenType == JsonTokenType.String)
        {
            if (long.TryParse(reader.GetString(), out var val))
            {
                return new List<long> { val };
            }
            return new List<long>();
        }

        if (reader.TokenType != JsonTokenType.StartArray)
        {
            throw new JsonException($"Expected array or number but got {reader.TokenType}");
        }

        var list = new List<long>();

        while (reader.Read())
        {
            if (reader.TokenType == JsonTokenType.EndArray)
            {
                break;
            }

            if (reader.TokenType == JsonTokenType.Number)
            {
                list.Add(reader.GetInt64());
            }
            else if (reader.TokenType == JsonTokenType.String)
            {
                if (long.TryParse(reader.GetString(), out var val))
                {
                    list.Add(val);
                }
            }
            else if (reader.TokenType == JsonTokenType.StartObject)
            {
                using var doc = JsonDocument.ParseValue(ref reader);
                var root = doc.RootElement;
                if (TryGetLongProperty(root, out var id))
                {
                    list.Add(id);
                }
            }
            else
            {
                reader.Skip();
            }
        }

        return list;
    }

    private static bool TryGetLongProperty(JsonElement element, out long value)
    {
        string[] propNames = ["id", "Id", "foodId", "FoodId", "placeId", "PlaceId", "value", "Value"];
        foreach (var name in propNames)
        {
            if (element.TryGetProperty(name, out var prop))
            {
                if (prop.ValueKind == JsonValueKind.Number && prop.TryGetInt64(out value))
                {
                    return true;
                }
                if (prop.ValueKind == JsonValueKind.String && long.TryParse(prop.GetString(), out value))
                {
                    return true;
                }
            }
        }
        value = 0;
        return false;
    }

    public override void Write(Utf8JsonWriter writer, List<long> value, JsonSerializerOptions options)
    {
        writer.WriteStartArray();
        foreach (var item in value)
        {
            writer.WriteNumberValue(item);
        }
        writer.WriteEndArray();
    }
}
