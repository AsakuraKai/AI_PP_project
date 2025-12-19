const fs = require('fs');

const file = 'tests/unit/GradleParser.test.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace all old type names with new gradle_ prefixed ones
content = content.replace(/\.toBe\('dependency_resolution_error'\)/g, ".toBe('gradle_dependency_resolution_error')");
content = content.replace(/\.toBe\('dependency_conflict'\)/g, ".toBe('gradle_dependency_conflict')");
content = content.replace(/\.toBe\('build_script_syntax_error'\)/g, ".toBe('gradle_build_script_syntax_error')");

fs.writeFileSync(file, content);
console.log('✅ Fixed GradleParser.test.ts type names');
console.log('  - dependency_resolution_error → gradle_dependency_resolution_error');
console.log('  - dependency_conflict → gradle_dependency_conflict');
console.log('  - build_script_syntax_error → gradle_build_script_syntax_error');
