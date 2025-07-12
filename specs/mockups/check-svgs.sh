#!/bin/bash

echo "Checking SVG files for common issues..."
echo "======================================="

for svg in $(find . -name "*.svg" -type f); do
    # Check if file starts with <?xml
    if ! head -1 "$svg" | grep -q "^<?xml"; then
        echo "⚠️  $svg - Missing XML declaration"
    fi
    
    # Check for unescaped ampersands
    if grep -q "&[^a#]" "$svg"; then
        echo "❌ $svg - Contains unescaped ampersands"
        grep -n "&[^a#]" "$svg" | head -3
    fi
    
    # Check for unescaped less than signs (not in tags)
    if grep -q "[^<]<[^/!?a-zA-Z]" "$svg"; then
        echo "❌ $svg - May contain unescaped < characters"
    fi
    
    # Check for unescaped quotes in attributes
    if grep -E 'attribute="[^"]*"[^"]*"' "$svg"; then
        echo "❌ $svg - May contain unescaped quotes in attributes"
    fi
    
    # Check if file is properly closed
    if ! tail -1 "$svg" | grep -q "</svg>"; then
        echo "❌ $svg - Missing closing </svg> tag"
    fi
done

echo "======================================="
echo "✅ SVG validation complete"