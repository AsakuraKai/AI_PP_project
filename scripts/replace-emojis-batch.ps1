# PowerShell script to replace all emojis in docs folder with text equivalents
# Run this from the scripts directory

$docsPath = "c:\Users\Admin\OneDrive\Desktop\Nuclear Creation\AI\AI_PP_project\docs"

# Define emoji patterns to replace (using Unicode codepoints to avoid encoding issues)
function Replace-Emojis {
    param (
        [string]$content
    )
    
    # Replace emojis using regex patterns
    $content = $content -replace '\u2705', '[DONE]'          # ✅
    $content = $content -replace '\u274C', '[FAIL]'          # ❌
    $content = $content -replace '\uD83C\uDFAF', '[TARGET]'  # 🎯
    $content = $content -replace '\uD83D\uDCCA', '[CHART]'   # 📊
    $content = $content -replace '\uD83D\uDE80', '[LAUNCH]'  # 🚀
    $content = $content -replace '\uD83E\uDDEA', '[TEST]'    # 🧪
    $content = $content -replace '\uD83D\uDCC8', '[GRAPH]'   # 📈
    $content = $content -replace '\uD83C\uDF93', '[LEARN]'   # 🎓
    $content = $content -replace '\uD83D\uDCDA', '[DOCS]'    # 📚
    $content = $content -replace '\uD83D\uDD27', '[TOOL]'    # 🔧
    $content = $content -replace '\uD83D\uDEA6', '[STATUS]'  # 🚦
    $content = $content -replace '\uD83D\uDCDE', '[CALL]'    # 📞
    $content = $content -replace '\uD83C\uDF89', '[SUCCESS]' # 🎉
    $content = $content -replace '\uD83D\uDCA1', '[IDEA]'    # 💡
    $content = $content -replace '\u26A0\uFE0F', '[WARNING]' # ⚠️
    $content = $content -replace '\u26A0', '[WARNING]'       # ⚠
    $content = $content -replace '\uD83D\uDD0D', '[SEARCH]'  # 🔍
    $content = $content -replace '\uD83D\uDCDD', '[NOTE]'    # 📝
    $content = $content -replace '\uD83C\uDFA8', '[DESIGN]'  # 🎨
    $content = $content -replace '\u26A1', '[FAST]'          # ⚡
    $content = $content -replace '\uD83D\uDD25', '[HOT]'     # 🔥
    $content = $content -replace '\uD83D\uDCBB', '[CODE]'    # 💻
    $content = $content -replace '\uD83D\uDCE6', '[PACKAGE]' # 📦
    $content = $content -replace '\uD83C\uDFD7\uFE0F', '[BUILD]' # 🏗️
    $content = $content -replace '\uD83C\uDFD7', '[BUILD]'   # 🏗
    $content = $content -replace '\uD83C\uDFAD', '[MOCK]'    # 🎭
    $content = $content -replace '\uD83C\uDF1F', '[STAR]'    # 🌟
    $content = $content -replace '\u23F1\uFE0F', '[TIMER]'   # ⏱️
    $content = $content -replace '\u23F1', '[TIMER]'         # ⏱
    $content = $content -replace '\uD83D\uDCCC', '[PIN]'     # 📌
    $content = $content -replace '\uD83D\uDEE0\uFE0F', '[FIX]' # 🛠️
    $content = $content -replace '\uD83D\uDEE0', '[FIX]'     # 🛠
    $content = $content -replace '\uD83C\uDF81', '[GIFT]'    # 🎁
    $content = $content -replace '\uD83D\uDD12', '[LOCK]'    # 🔒
    $content = $content -replace '\uD83C\uDF10', '[WEB]'     # 🌐
    $content = $content -replace '\uD83D\uDCC4', '[FILE]'    # 📄
    $content = $content -replace '\uD83D\uDDC2\uFE0F', '[FOLDER]' # 🗂️
    $content = $content -replace '\uD83D\uDDC2', '[FOLDER]'  # 🗂
    $content = $content -replace '\uD83C\uDFC6', '[TROPHY]'  # 🏆
    $content = $content -replace '\u2B50', '[STAR]'          # ⭐
    $content = $content -replace '\uD83E\uDD16', '[BOT]'     # 🤖
    $content = $content -replace '\uD83E\uDDE9', '[PUZZLE]'  # 🧩
    $content = $content -replace '\uD83D\uDCF1', '[MOBILE]'  # 📱
    $content = $content -replace '\uD83D\uDDA5\uFE0F', '[DESKTOP]' # 🖥️
    $content = $content -replace '\uD83D\uDDA5', '[DESKTOP]' # 🖥
    $content = $content -replace '\u2601\uFE0F', '[CLOUD]'   # ☁️
    $content = $content -replace '\u2601', '[CLOUD]'         # ☁
    $content = $content -replace '\uD83D\uDDC4\uFE0F', '[DATABASE]' # 🗄️
    $content = $content -replace '\uD83D\uDDC4', '[DATABASE]' # 🗄
    $content = $content -replace '\uD83D\uDD04', '[REFRESH]' # 🔄
    $content = $content -replace '\u267B\uFE0F', '[RECYCLE]' # ♻️
    $content = $content -replace '\u267B', '[RECYCLE]'       # ♻
    $content = $content -replace '\uD83C\uDFAC', '[ACTION]'  # 🎬
    $content = $content -replace '\uD83C\uDFC1', '[FINISH]'  # 🏁
    $content = $content -replace '\u2728', '[SPARKLE]'       # ✨
    $content = $content -replace '\uD83D\uDCBE', '[SAVE]'    # 💾
    $content = $content -replace '\uD83C\uDFAA', '[CIRCUS]'  # 🎪
    $content = $content -replace '\uD83D\uDD2C', '[LAB]'     # 🔬
    $content = $content -replace '\uD83D\uDDD3\uFE0F', '[CALENDAR]' # 🗓️
    $content = $content -replace '\uD83D\uDDD3', '[CALENDAR]' # 🗓
    $content = $content -replace '\uD83D\uDCCB', '[CLIPBOARD]' # 📋
    $content = $content -replace '\uD83D\uDD17', '[LINK]'    # 🔗
    $content = $content -replace '\uD83E\uDDF0', '[TOOLBOX]' # 🧰
    $content = $content -replace '\uD83D\uDCFA', '[SCREEN]'  # 📺
    $content = $content -replace '\uD83D\uDD52', '[TIME]'    # 🕒
    $content = $content -replace '\uD83D\uDCE2', '[ANNOUNCE]' # 📢
    $content = $content -replace '\uD83C\uDFAE', '[GAME]'    # 🎮
    $content = $content -replace '\uD83E\uDDD9', '[WIZARD]'  # 🧙
    $content = $content -replace '\uD83D\uDC65', '[USERS]'   # 👥
    $content = $content -replace '\uD83D\uDCBC', '[WORK]'    # 💼
    $content = $content -replace '\uD83C\uDF08', '[RAINBOW]' # 🌈
    $content = $content -replace '\uD83C\uDFB8', '[MUSIC]'   # 🎸
    $content = $content -replace '\uD83D\uDCE1', '[SIGNAL]'  # 📡
    $content = $content -replace '\uD83D\uDC1B', '[BUG]'     # 🐛
    $content = $content -replace '\uD83C\uDFC3', '[RUN]'     # 🏃
    $content = $content -replace '\u23F0', '[ALARM]'         # ⏰
    $content = $content -replace '\uD83D\uDCAC', '[CHAT]'    # 💬
    $content = $content -replace '\uD83D\uDCCD', '[LOCATION]' # 📍
    $content = $content -replace '\uD83D\uDD14', '[BELL]'    # 🔔
    $content = $content -replace '\uD83D\uDD11', '[KEY]'     # 🔑
    $content = $content -replace '\uD83D\uDCCF', '[RULER]'   # 📏
    $content = $content -replace '\uD83D\uDDBC\uFE0F', '[FRAME]' # 🖼️
    $content = $content -replace '\uD83D\uDDBC', '[FRAME]'   # 🖼
    $content = $content -replace '\u2699\uFE0F', '[SETTINGS]' # ⚙️
    $content = $content -replace '\u2699', '[SETTINGS]'      # ⚙
    $content = $content -replace '\uD83C\uDFB2', '[DICE]'    # 🎲
    $content = $content -replace '\uD83D\uDC4D', '[LIKE]'    # 👍
    $content = $content -replace '\uD83D\uDC4E', '[DISLIKE]' # 👎
    $content = $content -replace '\u2714\uFE0F', '[CHECK]'   # ✔️
    $content = $content -replace '\u2714', '[CHECK]'         # ✔
    $content = $content -replace '\uD83D\uDCC5', '[DATE]'    # 📅
    $content = $content -replace '\uD83D\uDD00', '[SHUFFLE]' # 🔀
    $content = $content -replace '\uD83D\uDD28', '[HAMMER]'  # 🔨
    $content = $content -replace '\uD83C\uDFF7\uFE0F', '[TAG]' # 🏷️
    $content = $content -replace '\uD83C\uDFF7', '[TAG]'     # 🏷
    $content = $content -replace '\u2694\uFE0F', '[SWORD]'   # ⚔️
    $content = $content -replace '\u2694', '[SWORD]'         # ⚔
    $content = $content -replace '\uD83C\uDFA4', '[MIC]'     # 🎤
    $content = $content -replace '\uD83D\uDEE1\uFE0F', '[SHIELD]' # 🛡️
    $content = $content -replace '\uD83D\uDEE1', '[SHIELD]'  # 🛡
    $content = $content -replace '\uD83D\uDCD6', '[BOOK]'    # 📖
    $content = $content -replace '\uD83E\uDDE0', '[BRAIN]'   # 🧠
    $content = $content -replace '\u2B06\uFE0F', '[UP]'      # ⬆️
    $content = $content -replace '\u2B06', '[UP]'            # ⬆
    $content = $content -replace '\u2B07\uFE0F', '[DOWN]'    # ⬇️
    $content = $content -replace '\u2B07', '[DOWN]'          # ⬇
    $content = $content -replace '\u27A1\uFE0F', '[RIGHT]'   # ➡️
    $content = $content -replace '\u27A1', '[RIGHT]'         # ➡
    $content = $content -replace '\u2B05\uFE0F', '[LEFT]'    # ⬅️
    $content = $content -replace '\u2B05', '[LEFT]'          # ⬅
    $content = $content -replace '\uD83D\uDD03', '[CYCLE]'   # 🔃
    $content = $content -replace '\uD83D\uDD01', '[REPEAT]'  # 🔁
    $content = $content -replace '\u25B6', '[PLAY]'          # ▶
    $content = $content -replace '\u23F8', '[PAUSE]'         # ⏸
    $content = $content -replace '\u23F9', '[STOP]'          # ⏹
    $content = $content -replace '\u25C0', '[BACK]'          # ◀
    $content = $content -replace '\u25B2', '[UP]'            # ▲
    $content = $content -replace '\u25BC', '[DOWN]'          # ▼
    $content = $content -replace '\u25C6', '[DIAMOND]'       # ◆
    $content = $content -replace '\u25CF', '[DOT]'           # ●
    $content = $content -replace '\u25CB', '[CIRCLE]'        # ○
    $content = $content -replace '\u25A0', '[SQUARE]'        # ■
    $content = $content -replace '\u25A1', '[BOX]'           # □
    $content = $content -replace '\uD83D\uDD3A', '[TRIANGLE_UP]' # 🔺
    $content = $content -replace '\uD83D\uDD3B', '[TRIANGLE_DOWN]' # 🔻
    $content = $content -replace '\u21A9', '[RETURN]'        # ↩
    $content = $content -replace '\u21AA', '[ENTER]'         # ↪
    $content = $content -replace '\u2194', '[H_ARROW]'       # ↔
    $content = $content -replace '\u2195', '[V_ARROW]'       # ↕
    $content = $content -replace '\u2934', '[UP_RIGHT]'      # ⤴
    $content = $content -replace '\u2935', '[DOWN_RIGHT]'    # ⤵
    $content = $content -replace '\uD83D\uDEA8', '[ALERT]'   # 🚨
    $content = $content -replace '\uD83D\uDD2E', '[FUTURE]'  # 🔮
    $content = $content -replace '\uD83D\uDFE2', '[GREEN]'   # 🟢
    $content = $content -replace '\uD83D\uDFE1', '[YELLOW]'  # 🟡
    $content = $content -replace '\uD83D\uDD34', '[RED]'     # 🔴
    $content = $content -replace '\uD83D\uDD13', '[UNLOCKED]' # 🔓
    $content = $content -replace '\u267E\uFE0F', '[INFINITY]' # ♾️
    $content = $content -replace '\u267E', '[INFINITY]'      # ♾
    $content = $content -replace '\uD83C\uDFDB\uFE0F', '[BUILD]' # 🏛️
    $content = $content -replace '\uD83C\uDFDB', '[BUILD]'   # 🏛
    $content = $content -replace '\uD83D\uDDFA\uFE0F', '[LOCATION]' # 🗺️
    $content = $content -replace '\uD83D\uDDFA', '[LOCATION]' # 🗺
    $content = $content -replace '\uD83D\uDCD1', '[FILE]'    # 📑
    $content = $content -replace '\u23F3', '[TIMER]'         # ⏳
    $content = $content -replace '\u2328\uFE0F', '[KEYBOARD]' # ⌨️
    $content = $content -replace '\u2328', '[KEYBOARD]'      # ⌨
    $content = $content -replace '\uD83D\uDC41\uFE0F', '[EYE]' # 👁️
    $content = $content -replace '\uD83D\uDC41', '[EYE]'     # 👁
    $content = $content -replace '\uD83D\uDDD1\uFE0F', '[TRASH]' # 🗑️
    $content = $content -replace '\uD83D\uDDD1', '[TRASH]'   # 🗑
    $content = $content -replace '\u2139\uFE0F', '[INFO]'    # ℹ️
    $content = $content -replace '\u2139', '[INFO]'          # ℹ
    $content = $content -replace '\u23ED\uFE0F', '[NEXT]'    # ⏭️
    $content = $content -replace '\u23ED', '[NEXT]'          # ⏭
    $content = $content -replace '\u270F\uFE0F', '[EDIT]'    # ✏️
    $content = $content -replace '\u270F', '[EDIT]'          # ✏
    $content = $content -replace '\uD83C\uDFD6\uFE0F', '[BEACH]' # 🏖️
    $content = $content -replace '\uD83C\uDFD6', '[BEACH]'   # 🏖
    
    return $content
}

# Get all markdown files
$mdFiles = Get-ChildItem -Path $docsPath -Filter "*.md" -Recurse

Write-Host "Found $($mdFiles.Count) markdown files to process" -ForegroundColor Cyan
Write-Host ""

$filesModified = 0

foreach ($file in $mdFiles) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $newContent = Replace-Emojis -content $content
    
    if ($content -ne $newContent) {
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8 -NoNewline
        Write-Host "[DONE] $($file.Name)" -ForegroundColor Green
        $filesModified++
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Emoji Replacement Complete!" -ForegroundColor Green
Write-Host "Files Modified: $filesModified" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
