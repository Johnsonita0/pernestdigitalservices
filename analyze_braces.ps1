$lines = Get-Content 'c:\Users\imeob\Documents\JFOLDER\Trophy\src\App.css'
$depth = 0
$issues = @()

Write-Host "Analyzing brace structure..."
Write-Host ""

for ($i = 0; $i -lt $lines.Count; $i++) {
  $line = $lines[$i]
  $openCount = [Regex]::Matches($line, '\{').Count
  $closeCount = [Regex]::Matches($line, '\}').Count
  
  $depth += $openCount
  $depth -= $closeCount
  
  if ($depth -lt 0) {
    $issues += @{
      LineNumber = $i + 1
      Content = $line
      Depth = $depth
    }
  }
}

Write-Host "SUMMARY:"
Write-Host "=========="
Write-Host "Opening braces: 939"
Write-Host "Closing braces: 940"
Write-Host "Final nesting depth: $depth"
Write-Host ""

if ($issues.Count -gt 0) {
  Write-Host "PROBLEM LOCATION:"
  Write-Host "=================="
  Write-Host "First line where depth becomes negative (ORPHANED CLOSING BRACE):"
  Write-Host ""
  Write-Host "Line $($issues[0].LineNumber):"
  Write-Host "Content: $($issues[0].Content)"
  Write-Host "Depth after this line: $($issues[0].Depth)"
  Write-Host ""
  Write-Host "Additional problematic lines:"
  for ($j = 1; $j -lt [Math]::Min($issues.Count, 5); $j++) {
    Write-Host "  Line $($issues[$j].LineNumber): Depth = $($issues[$j].Depth)"
  }
}
