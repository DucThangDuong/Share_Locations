using Application.DTOs;

namespace Application.Services;

public static class KnnMathEngine
{
    public static PlaceVectorCatalog BuildPlaceCatalog(List<PlaceFeatureVector> rawPlaces)
    {
        var catalog = new PlaceVectorCatalog
        {
            ComputedAtUtc = DateTime.UtcNow
        };

        if (rawPlaces.Count == 0)
            return catalog;

        int nMin = rawPlaces.Min(p => p.ReviewCount);
        int nMax = rawPlaces.Max(p => p.ReviewCount);
        double reviewRange = nMax - nMin;

        catalog.MinReviewCount = nMin;
        catalog.MaxReviewCount = nMax;

        foreach (var p in rawPlaces)
        {
            double rPrime = p.AvgRating < 1.0m
                ? 0.0
                : Math.Clamp((double)(p.AvgRating - 1.0m) / 4.0, 0.0, 1.0);

            double nPrime = reviewRange <= 0
                ? 0.0
                : Math.Clamp((p.ReviewCount - nMin) / reviewRange, 0.0, 1.0);

            p.NormRating = rPrime;
            p.NormReviewCount = nPrime;

            p.VectorNorm = Math.Sqrt(1.0 + 1.0 + (rPrime * rPrime) + (nPrime * nPrime));

            catalog.PlacesById[p.PlaceId] = p;
        }

        return catalog;
    }

    public static UserPreferenceVector BuildUserPreferenceVector(
        long userId,
        List<UserInteractionRecord> positiveInteractions,
        HashSet<long> excludedPlaceIds,
        PlaceVectorCatalog catalog,
        RecommendationOptions options)
    {
        var userVector = new UserPreferenceVector
        {
            UserId = userId,
            ExcludedPlaceIds = excludedPlaceIds
        };

        var validInteractions = positiveInteractions
            .Where(x => catalog.PlacesById.ContainsKey(x.PlaceId))
            .ToList();

        if (validInteractions.Count == 0)
        {
            userVector.IsColdStart = true;
            return userVector;
        }

        userVector.IsColdStart = false;
        userVector.PositiveSampleCount = validInteractions.Count;

        double totalWeight = 0.0;
        DateTime now = DateTime.UtcNow;

        foreach (var item in validInteractions)
        {
            var place = catalog.PlacesById[item.PlaceId];

            double w = 1.0;
            if (!options.StrictTheoryMode && options.UseTimeDecayAndWeights)
            {
                double daysElapsed = Math.Max(0.0, (now - item.InteractedAtUtc).TotalDays);
                w = item.Weight * Math.Exp(-options.TimeDecayLambda * daysElapsed);
            }

            totalWeight += w;

            userVector.CategoryWeights[place.CategoryId] =
                userVector.CategoryWeights.GetValueOrDefault(place.CategoryId, 0.0) + w;

            userVector.ProvinceWeights[place.ProvinceId] =
                userVector.ProvinceWeights.GetValueOrDefault(place.ProvinceId, 0.0) + w;

            userVector.PreferredNormRating += w * place.NormRating;
            userVector.PreferredNormReviewCount += w * place.NormReviewCount;
        }

        if (totalWeight > 0.0)
        {
            foreach (var catId in userVector.CategoryWeights.Keys.ToList())
            {
                userVector.CategoryWeights[catId] /= totalWeight;
            }

            foreach (var provId in userVector.ProvinceWeights.Keys.ToList())
            {
                userVector.ProvinceWeights[provId] /= totalWeight;
            }

            userVector.PreferredNormRating /= totalWeight;
            userVector.PreferredNormReviewCount /= totalWeight;
        }

        userVector.VectorNorm = ComputeUserVectorNorm(userVector);

        return userVector;
    }

    public static double ComputeUserVectorNorm(UserPreferenceVector u)
    {
        double sumSquares = 0.0;

        foreach (var val in u.CategoryWeights.Values)
            sumSquares += val * val;

        foreach (var val in u.ProvinceWeights.Values)
            sumSquares += val * val;

        sumSquares += (u.PreferredNormRating * u.PreferredNormRating);
        sumSquares += (u.PreferredNormReviewCount * u.PreferredNormReviewCount);

        return Math.Sqrt(sumSquares);
    }

    public static (double CosineSim, string ExplainReason) ComputeCosineAndExplain(
        UserPreferenceVector u,
        PlaceFeatureVector p)
    {
        if (u.VectorNorm <= 1e-9 || p.VectorNorm <= 1e-9)
            return (0.0, "Gợi ý khám phá địa điểm phổ biến");

        double catContribution = u.CategoryWeights.GetValueOrDefault(p.CategoryId, 0.0);
        double provContribution = u.ProvinceWeights.GetValueOrDefault(p.ProvinceId, 0.0);
        double ratingContribution = u.PreferredNormRating * p.NormRating;
        double reviewContribution = u.PreferredNormReviewCount * p.NormReviewCount;

        double dotProduct = catContribution + provContribution + ratingContribution + reviewContribution;
        double cosine = Math.Clamp(dotProduct / (u.VectorNorm * p.VectorNorm), 0.0, 1.0);

        string reason = BuildExplainText(catContribution, provContribution, p);

        return (cosine, reason);
    }

    private static string BuildExplainText(double catWeight, double provWeight, PlaceFeatureVector p)
    {
        int catPercent = (int)Math.Round(catWeight * 100);
        int provPercent = (int)Math.Round(provWeight * 100);

        if (catWeight >= 0.25 && provWeight >= 0.25)
            return $"Hợp gu vì bạn thường thích {p.CategoryName} ({catPercent}%) tại {p.ProvinceName} ({provPercent}%)";

        if (catWeight >= 0.25)
            return $"Gợi ý vì bạn yêu thích danh mục {p.CategoryName} ({catPercent}% lịch sử của bạn)";

        if (provWeight >= 0.25)
            return $"Điểm đến nổi bật tại {p.ProvinceName} phù hợp với mức đánh giá bạn ưa chuộng";

        return $"Địa điểm có điểm đánh giá ({p.AvgRating:0.0}★) và độ phổ biến tương đồng với sở thích của bạn";
    }

    public static double ComputeItemToItemCosine(PlaceFeatureVector p1, PlaceFeatureVector p2)
    {
        if (p1.VectorNorm <= 1e-9 || p2.VectorNorm <= 1e-9) return 0.0;

        double dot = 0.0;
        if (p1.CategoryId == p2.CategoryId) dot += 1.0;
        else if (p1.PlaceTypeId == p2.PlaceTypeId) dot += 0.35;

        if (p1.ProvinceId == p2.ProvinceId) dot += 1.0;
        else if (p1.RegionId == p2.RegionId) dot += 0.25;

        dot += (p1.NormRating * p2.NormRating);
        dot += (p1.NormReviewCount * p2.NormReviewCount);

        return Math.Clamp(dot / (p1.VectorNorm * p2.VectorNorm), 0.0, 1.0);
    }

    public static UserPreferenceVector MergeGroupPreferenceVectors(List<UserPreferenceVector> memberVectors)
    {
        var activeVectors = memberVectors.Where(v => !v.IsColdStart).ToList();
        if (activeVectors.Count == 0)
        {
            return new UserPreferenceVector { IsColdStart = true };
        }

        var groupVector = new UserPreferenceVector
        {
            IsColdStart = false,
            PositiveSampleCount = activeVectors.Sum(v => v.PositiveSampleCount)
        };

        int count = activeVectors.Count;

        foreach (var v in activeVectors)
        {
            foreach (var (catId, weight) in v.CategoryWeights)
                groupVector.CategoryWeights[catId] = groupVector.CategoryWeights.GetValueOrDefault(catId, 0.0) + (weight / count);

            foreach (var (provId, weight) in v.ProvinceWeights)
                groupVector.ProvinceWeights[provId] = groupVector.ProvinceWeights.GetValueOrDefault(provId, 0.0) + (weight / count);

            groupVector.PreferredNormRating += v.PreferredNormRating / count;
            groupVector.PreferredNormReviewCount += v.PreferredNormReviewCount / count;

            foreach (var exId in v.ExcludedPlaceIds)
                groupVector.ExcludedPlaceIds.Add(exId);
        }

        groupVector.VectorNorm = ComputeUserVectorNorm(groupVector);
        return groupVector;
    }

    public static double ComputeDistanceKm(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371.0;
        double dLat = DegreesToRadians(lat2 - lat1);
        double dLon = DegreesToRadians(lon2 - lon1);

        double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                   Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2)) *
                   Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private static double DegreesToRadians(double deg) => deg * (Math.PI / 180.0);
}
