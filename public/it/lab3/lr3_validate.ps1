# Перевірка моделі на теці data\перевірка через локальний API Lobe (Lobe Connect).
# validate.ps1 <мітка прогону> [тека в data]  →  io\val_<мітка>.csv
param([string]$Tag = 'run', [string]$Set = 'перевірка')
$root = 'C:\LobeSandbox'
$log = Get-ChildItem "$env:APPDATA\Lobe\logs" -Recurse -Filter backend.log | sort LastWriteTime | select -Last 1
$id = (Select-String -Path $log.FullName -Pattern 'Stopped Training' | select -Last 1).Line -replace '.*?\((\w{8}-\w{4}-\w{4}-\w{4}-\w{12})\).*', '$1'
$url = "http://localhost:38101/v1/predict/$id"
$rows = foreach ($f in Get-ChildItem "$root\data\$Set" -Recurse -File) {
  $body = @{ image = [Convert]::ToBase64String([IO.File]::ReadAllBytes($f.FullName)) } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri $url -Method Post -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($body))
  $top = $r.predictions | sort confidence -Descending | select -First 1
  [pscustomobject]@{ class = $f.Directory.Name; file = $f.Name; predicted = $top.label;
    confidence = [math]::Round($top.confidence, 4); ok = [int]($top.label -eq $f.Directory.Name) }
}
$rows | Export-Csv "$root\io\val_$Tag.csv" -NoTypeInformation -Encoding UTF8
"url $url"
$rows | Group-Object class | % { "{0}: {1}/{2}" -f $_.Name, ($_.Group | Measure-Object ok -Sum).Sum, $_.Count }
"всього: {0}/{1}" -f ($rows | Measure-Object ok -Sum).Sum, @($rows).Count
