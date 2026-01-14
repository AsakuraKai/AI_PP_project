# PowerShell script to replace all emojis in docs folder with text equivalents
# Run this from the project root directory

$docsPath = "c:\Users\Admin\OneDrive\Desktop\Nuclear Creation\AI\AI_PP_project\docs"

# Define emoji replacements
$replacements = @{
    "✅"   = "[DONE]"
    "❌"   = "[FAIL]"
    "🎯"  = "[TARGET]"
    "📊"  = "[CHART]"
    "🚀"  = "[LAUNCH]"
    "🧪"  = "[TEST]"
    "📈"  = "[GRAPH]"
    "🎓"  = "[LEARN]"
    "📚"  = "[DOCS]"
    "🔧"  = "[TOOL]"
    "🚦"  = "[STATUS]"
    "📞"  = "[CALL]"
    "🎉"  = "[SUCCESS]"
    "💡"  = "[IDEA]"
    "⚠️"  = "[WARNING]"
    "🔍"  = "[SEARCH]"
    "📝"  = "[NOTE]"
    "🎨"  = "[DESIGN]"
    "⚡"   = "[FAST]"
    "🔥"  = "[HOT]"
    "💻"  = "[CODE]"
    "📦"  = "[PACKAGE]"
    "🏗️" = "[BUILD]"
    "🎭"  = "[MOCK]"
    "🌟"  = "[STAR]"
    "⏱️"  = "[TIMER]"
    "📌"  = "[PIN]"
    "🛠️" = "[FIX]"
    "🎁"  = "[GIFT]"
    "🔒"  = "[LOCK]"
    "🌐"  = "[WEB]"
    "📄"  = "[FILE]"
    "🗂️" = "[FOLDER]"
    "🏆"  = "[TROPHY]"
    "⭐"   = "[STAR]"
    "🤖"  = "[BOT]"
    "🧩"  = "[PUZZLE]"
    "📱"  = "[MOBILE]"
    "🖥️" = "[DESKTOP]"
    "☁️"  = "[CLOUD]"
    "🗄️" = "[DATABASE]"
    "🔄"  = "[REFRESH]"
    "♻️"  = "[RECYCLE]"
    "🎬"  = "[ACTION]"
    "🏁"  = "[FINISH]"
    "✨"   = "[SPARKLE]"
    "💾"  = "[SAVE]"
    "🎪"  = "[CIRCUS]"
    "🔬"  = "[LAB]"
    "🗓️" = "[CALENDAR]"
    "📋"  = "[CLIPBOARD]"
    "🔗"  = "[LINK]"
    "🧰"  = "[TOOLBOX]"
    "📺"  = "[SCREEN]"
    "🕒"  = "[TIME]"
    "📢"  = "[ANNOUNCE]"
    "🎮"  = "[GAME]"
    "🧙"  = "[WIZARD]"
    "👥"  = "[USERS]"
    "💼"  = "[WORK]"
    "🌈"  = "[RAINBOW]"
    "🎸"  = "[MUSIC]"
    "📡"  = "[SIGNAL]"
    "🐛"  = "[BUG]"
    "🏃"  = "[RUN]"
    "⏰"   = "[ALARM]"
    "💬"  = "[CHAT]"
    "📍"  = "[LOCATION]"
    "🔔"  = "[BELL]"
    "🔑"  = "[KEY]"
    "📏"  = "[RULER]"
    "🖼️" = "[FRAME]"
    "⚙️"  = "[SETTINGS]"
    "🎲"  = "[DICE]"
    "👍"  = "[LIKE]"
    "👎"  = "[DISLIKE]"
    "✔️"  = "[CHECK]"
    "📅"  = "[DATE]"
    "🔀"  = "[SHUFFLE]"
    "🔨"  = "[HAMMER]"
    "🏷️" = "[TAG]"
    "⚔️"  = "[SWORD]"
    "🎤"  = "[MIC]"
    "🛡️" = "[SHIELD]"
    "📖"  = "[BOOK]"
    "🧠"  = "[BRAIN]"
    "⬆️"  = "[UP]"
    "⬇️"  = "[DOWN]"
    "➡️"  = "[RIGHT]"
    "⬅️"  = "[LEFT]"
    "🔃"  = "[CYCLE]"
    "🔁"  = "[REPEAT]"
    "▶"   = "[PLAY]"
    "⏸"   = "[PAUSE]"
    "⏹"   = "[STOP]"
    "◀"   = "[BACK]"
    "▲"   = "[UP]"
    "▼"   = "[DOWN]"
    "◆"   = "[DIAMOND]"
    "●"   = "[DOT]"
    "○"   = "[CIRCLE]"
    "■"   = "[SQUARE]"
    "□"   = "[BOX]"
    "🔺"  = "[TRIANGLE_UP]"
    "🔻"  = "[TRIANGLE_DOWN]"
    "↩"   = "[RETURN]"
    "↪"   = "[ENTER]"
    "↔"   = "[H_ARROW]"
    "↕"   = "[V_ARROW]"
    "⤴"   = "[UP_RIGHT]"
    "⤵"   = "[DOWN_RIGHT]"
    "🚨"  = "[ALERT]"
    "🔮"  = "[FUTURE]"
    "🟢"  = "[GREEN]"
    "🟡"  = "[YELLOW]"
    "🔴"  = "[RED]"
    "🔓"  = "[UNLOCKED]"
    "♾️"  = "[INFINITY]"
    "🏛️" = "[BUILD]"
    "🗺️" = "[LOCATION]"
    "📑"  = "[FILE]"
    "⏳"   = "[TIMER]"
}

# Get all markdown files in docs folder recursively
$mdFiles = Get-ChildItem -Path $docsPath -Filter "*.md" -Recurse

Write-Host "Found $($mdFiles.Count) markdown files to process" -ForegroundColor Cyan
Write-Host ""

$totalReplacements = 0
$filesModified = 0

foreach ($file in $mdFiles) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    $fileReplacements = 0
    
    foreach ($emoji in $replacements.Keys) {
        $replacement = $replacements[$emoji]
        if ($content -match [regex]::Escape($emoji)) {
            $count = ([regex]::Matches($content, [regex]::Escape($emoji))).Count
            $content = $content -replace [regex]::Escape($emoji), $replacement
            $fileReplacements += $count
        }
    }
    
    if ($fileReplacements -gt 0) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "[✓] $($file.Name): $fileReplacements replacements" -ForegroundColor Green
        $filesModified++
        $totalReplacements += $fileReplacements
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Emoji Replacement Complete!" -ForegroundColor Green
Write-Host "Files Modified: $filesModified" -ForegroundColor Yellow
Write-Host "Total Replacements: $totalReplacements" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
