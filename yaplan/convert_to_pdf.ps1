# convert_to_pdf.ps1 — 用 PowerPoint 将 PPTX 转换为 PDF（字体完全保留）

$pptxPath = "C:\Users\oyzh8\Desktop\win_code\docker\omnara_workspace\steve\xiaolu-homepage\yaplan-pitch.pptx"
$pdfPath  = "C:\Users\oyzh8\Desktop\win_code\docker\omnara_workspace\steve\xiaolu-homepage\yaplan-pitch.pdf"

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = [Microsoft.Office.Core.MsoTriState]::msoFalse

$deck = $ppt.Presentations.Open($pptxPath, $true, $false, $false)
$deck.SaveAs($pdfPath, 32)   # 32 = ppSaveAsPDF
$deck.Close()
$ppt.Quit()

Write-Host "✅ 已生成：$pdfPath"
