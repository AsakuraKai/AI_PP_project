#!/usr/bin/env python3
"""
Script to remove all emojis from the project and replace them with system-friendly text.
Excludes the docs/ folder as per user request.
"""

import os
import glob
from pathlib import Path

# Comprehensive emoji replacement map
EMOJI_MAP = {
    # Success/Check marks
    '✅': '[OK]',
    '❌': '[X]',
    '⚠️': '[WARN]',
    
    # Symbols
    '🎯': '[TARGET]',
    '🎉': '[SUCCESS]',
    '🚀': '[LAUNCH]',
    '⚡': '[FAST]',
    '📊': '[STATS]',
    '🔍': '[SEARCH]',
    '📝': '[NOTE]',
    '💡': '[IDEA]',
    '🔧': '[TOOL]',
    '🛠️': '[BUILD]',
    '✨': '[FEATURE]',
    '🔥': '[HOT]',
    '💻': '[CODE]',
    '📦': '[PACKAGE]',
    '🎨': '[DESIGN]',
    '🐛': '[BUG]',
    '⭐': '[STAR]',
    '🔄': '[SYNC]',
    '📈': '[UP]',
    '📉': '[DOWN]',
    '⏱️': '[TIME]',
    '🌟': '[HIGHLIGHT]',
    '💪': '[STRONG]',
    '🎭': '[MASK]',
    '🔒': '[LOCK]',
    '🔓': '[UNLOCK]',
    '🌈': '[RAINBOW]',
    '🚨': '[ALERT]',
    '👍': '[THUMBS_UP]',
    '👎': '[THUMBS_DOWN]',
    '📌': '[PIN]',
    '🎪': '[CIRCUS]',
    '🔔': '[BELL]',
    '💬': '[CHAT]',
    '🌐': '[WEB]',
    '🖥️': '[MONITOR]',
    '📱': '[PHONE]',
    '🎬': '[MOVIE]',
    '🎮': '[GAME]',
    '🎲': '[DICE]',
    '🏆': '[TROPHY]',
    '🎁': '[GIFT]',
    
    # Additional common emojis
    '⚙️': '[CONFIG]',
    '🧪': '[TEST]',
    '♿': '[ACCESS]',
    '📋': '[LIST]',
    '⏳': '[PENDING]',
    '📁': '[FOLDER]',
    '📄': '[FILE]',
    '🌀': '[LOADING]',
    '❤️': '[HEART]',
    '💔': '[BROKEN]',
}

def should_exclude(file_path):
    """Check if file should be excluded from emoji replacement"""
    path_str = str(file_path).replace('\\', '/')
    
    # Exclude docs folder
    if '/docs/' in path_str:
        return True
    
    # Exclude node_modules
    if '/node_modules/' in path_str:
        return True
    
    # Exclude build outputs
    if '/.next/' in path_str or '/dist/' in path_str or '/build/' in path_str:
        return True
    
    return False

def replace_emojis_in_file(file_path):
    """Replace all emojis in a file with text alternatives"""
    try:
        # Read file content
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Check if file contains any emojis
        has_emoji = any(emoji in content for emoji in EMOJI_MAP.keys())
        
        if not has_emoji:
            return False  # No changes needed
        
        # Replace all emojis
        original_content = content
        for emoji, replacement in EMOJI_MAP.items():
            content = content.replace(emoji, replacement)
        
        # Only write if content actually changed
        if content != original_content:
            # Detect original line ending style
            has_crlf = '\r\n' in original_content
            has_lf = '\n' in original_content and not has_crlf
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        
        return False
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    """Main function to process all files in the project"""
    project_root = Path(__file__).parent.parent
    
    # File patterns to search
    patterns = [
        '**/*.ts',
        '**/*.tsx',
        '**/*.js',
        '**/*.jsx',
        '**/*.md',
        '**/*.json',
    ]
    
    files_processed = 0
    files_modified = 0
    
    print("Removing emojis from project files (excluding docs folder)...")
    print("-" * 60)
    
    for pattern in patterns:
        for file_path in project_root.glob(pattern):
            if should_exclude(file_path):
                continue
            
            files_processed += 1
            if replace_emojis_in_file(file_path):
                files_modified += 1
                rel_path = file_path.relative_to(project_root)
                print(f"Modified: {rel_path}")
    
    print("-" * 60)
    print(f"Processed {files_processed} files")
    print(f"Modified {files_modified} files")
    print("Done!")

if __name__ == '__main__':
    main()
