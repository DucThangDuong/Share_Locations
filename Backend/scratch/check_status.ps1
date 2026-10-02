$conn = New-Object System.Data.SqlClient.SqlConnection("Server=thang;Database=TravelReviewDB;Trusted_Connection=True;TrustServerCertificate=True")
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT Status, COUNT(1) AS Cnt FROM dbo.Reviews GROUP BY Status; SELECT Status, COUNT(1) AS Cnt FROM dbo.Comments GROUP BY Status;"
$r = $cmd.ExecuteReader()
Write-Host "--- REVIEWS ---"
while ($r.Read()) {
    Write-Host "Status: $($r['Status']) Count: $($r['Cnt'])"
}
$r.NextResult()
Write-Host "--- COMMENTS ---"
while ($r.Read()) {
    Write-Host "Status: $($r['Status']) Count: $($r['Cnt'])"
}
$conn.Close()
