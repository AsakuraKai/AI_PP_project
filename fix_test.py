import re

# Read the file
with open('tests/integration/agent/PromptEngine-FewShot.test.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern: find ParsedError objects with duplicate filePath
# Match pattern: filePath: 'xxx',\n  line: N,\n  language: 'xxx',\n  filePath: 'yyy'
pattern = r"(filePath:\s*'[^']+',\s*\n\s+line:\s*\d+,\s*\n\s+language:\s*'[^']+',)\s*\n\s+filePath:\s*'[^']+'"
replacement = r'\1'

content = re.sub(pattern, replacement, content)

# Write back
with open('tests/integration/agent/PromptEngine-FewShot.test.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed!")
