# PowerShell script to fix .js extensions in TypeScript imports
$ErrorActionPreference = "Continue"

function Fix-TsImports {
    param([string]$Directory)
    
    $files = Get-ChildItem -Path $Directory -Recurse -Filter "*.ts" | 
             Where-Object { $_.Directory.Name -notmatch "node_modules|dist|client" }
    
    $fixedCount = 0
    
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if (-not $content) { continue }
        
        $originalContent = $content
        
        # Fix relative imports that don't end with .js
        $content = $content -replace 'from [''"](\.\.[^''"]*?)(?<!\.js)[''"]', 'from "$1.js"'
        $content = $content -replace 'from [''"](\.[^''"]*?)(?<!\.js)[''"]', 'from "$1.js"'
        
        if ($content -ne $originalContent) {
            Set-Content $file.FullName -Value $content -NoNewline
            $fixedCount++
            Write-Host "Fixed: $($file.FullName)"
        }
    }
    
    Write-Host "Fixed $fixedCount files"
}

Fix-TsImports "agent"
Fix-TsImports "server"
Fix-TsImports "tests"
