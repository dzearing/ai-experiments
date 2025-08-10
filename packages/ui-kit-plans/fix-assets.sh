#!/bin/bash

BASE_DIR="/Users/dzearing/workspace/projects/claude-flow/repos/claude-flow-1/packages/ui-kit-plans"
cd "$BASE_DIR"

echo "Fixing asset references in mockup files..."

# Find all HTML files in the plans directory
find plans -name "*.html" -type f | while read -r file; do
    echo "Processing: $file"
    
    # The files are now at plans/{group}/{component}/*.html
    # They need to reference /assets which is at the root
    # So they need to go up 3 levels: ../../../assets
    
    # Update references from ../../assets to ../../../assets
    sed -i '' 's|href="../../assets/|href="../../../assets/|g' "$file"
    sed -i '' 's|src="../../assets/|src="../../../assets/|g' "$file"
    
    # Also update any references that might be using /assets directly to be relative
    sed -i '' 's|href="/assets/|href="../../../assets/|g' "$file"
    sed -i '' 's|src="/assets/|src="../../../assets/|g' "$file"
    
    # Update window.__uiKitBasePath if it exists
    sed -i '' "s|window.__uiKitBasePath = '/assets/'|window.__uiKitBasePath = '../../../assets/'|g" "$file"
    sed -i '' "s|window.__uiKitBasePath = '../../assets/'|window.__uiKitBasePath = '../../../assets/'|g" "$file"
done

echo "Asset references fixed!"