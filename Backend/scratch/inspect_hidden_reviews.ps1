$conn = New-Object System.Data.SqlClient.SqlConnection("Server=thang;Database=TravelReviewDB;Trusted_Connection=True;TrustServerCertificate=True")
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT Id, PlaceId, UserId, Status, Content, CreatedAt FROM dbo.Reviews WHERE Status = 0"
$r = $cmd.ExecuteReader()
while ($r.Read()) {
    Write-Host "Hidden Review: ID=$($r['Id']), PlaceId=$($r['PlaceId']), Content=$($r['Content']), CreatedAt=$($r['CreatedAt'])"
}
$conn.Close()
