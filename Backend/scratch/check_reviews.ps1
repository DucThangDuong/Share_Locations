$conn = New-Object System.Data.SqlClient.SqlConnection("Server=thang;Database=TravelReviewDB;Trusted_Connection=True;TrustServerCertificate=True")
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT Id, PlaceId, Status, Content FROM dbo.Reviews"
$reader = $cmd.ExecuteReader()
while ($reader.Read()) {
    Write-Host "Review $($reader['Id']) - Place $($reader['PlaceId']) - Status: $($reader['Status']) - Content: $($reader['Content'])"
}
$reader.Close()

$cmd2 = $conn.CreateCommand()
$cmd2.CommandText = "SELECT Id, ReviewId, Status, Content FROM dbo.Comments"
$reader2 = $cmd2.ExecuteReader()
while ($reader2.Read()) {
    Write-Host "Comment $($reader2['Id']) - Review $($reader2['ReviewId']) - Status: $($reader2['Status']) - Content: $($reader2['Content'])"
}
$reader2.Close()
$conn.Close()
