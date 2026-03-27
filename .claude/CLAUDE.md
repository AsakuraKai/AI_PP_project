# Context Optimization & Search Directives

You are operating in a token-optimized environment. **NEVER** use `cat`, `Get-Content`, or raw `Select-String` on large files. 

### Search Strategy:
1. **Try `sg` (ast-grep) first.**
   - If the file is TypeScript, ALWAYS use `-l ts`.
   - Pattern for functions: `sg --pattern 'function $NAME($$$) { $$$ }' -l ts`
   - Pattern for classes: `sg --pattern 'class $CLASS { $$$ }' -l ts`
2. **Use `gast` (grep-ast) as the primary fallback.** - It provides structural context around matches, saving tokens compared to full file reads.
3. **Use `fd`** to locate files quickly before searching.

### Examples:
- Find function: `sg --pattern 'function calculateTotal($$$)' -l ts`
- Find data in JSON: `Get-Content package.json | jq '.dependencies'`
