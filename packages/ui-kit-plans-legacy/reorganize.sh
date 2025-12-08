#!/bin/bash

BASE_DIR="/Users/dzearing/workspace/projects/claude-flow/repos/claude-flow-1/packages/ui-kit-plans"
cd "$BASE_DIR"

echo "Reorganizing ui-kit-plans structure..."

# Chat components
mkdir -p plans/chat-components/ai-persona-indicator
mv plans/chat-components/ai-persona-indicator-plan.md plans/chat-components/ai-persona-indicator/plan.md 2>/dev/null
mv mockups/chat-components/ai-persona-indicator-default.html plans/chat-components/ai-persona-indicator/mockup.html 2>/dev/null

mkdir -p plans/chat-components/chat-bubble
mv plans/chat-components/chat-bubble-plan.md plans/chat-components/chat-bubble/plan.md 2>/dev/null
mv mockups/chat-components/chat-bubble-default.html plans/chat-components/chat-bubble/mockup.html 2>/dev/null

mkdir -p plans/chat-components/chat-error-boundary
mv plans/chat-components/chat-error-boundary-plan.md plans/chat-components/chat-error-boundary/plan.md 2>/dev/null

mkdir -p plans/chat-components/chat-message-group
mv plans/chat-components/chat-message-group-plan.md plans/chat-components/chat-message-group/plan.md 2>/dev/null
mv mockups/chat-components/chat-message-group-default.html plans/chat-components/chat-message-group/mockup.html 2>/dev/null

mkdir -p plans/chat-components/chat-split-fork
mv plans/chat-components/chat-split-fork-plan.md plans/chat-components/chat-split-fork/plan.md 2>/dev/null
mv mockups/chat-components/chat-split-fork.html plans/chat-components/chat-split-fork/mockup.html 2>/dev/null

mkdir -p plans/chat-components/chat-summary-card
mv plans/chat-components/chat-summary-card-plan.md plans/chat-components/chat-summary-card/plan.md 2>/dev/null

mkdir -p plans/chat-components/code-diff-visualizer
mv plans/chat-components/code-diff-visualizer-plan.md plans/chat-components/code-diff-visualizer/plan.md 2>/dev/null
mv mockups/chat-components/code-diff-visualizer.html plans/chat-components/code-diff-visualizer/mockup.html 2>/dev/null

mkdir -p plans/chat-components/code-graph-visualizer
mv plans/chat-components/code-graph-visualizer-plan.md plans/chat-components/code-graph-visualizer/plan.md 2>/dev/null

mkdir -p plans/chat-components/conversation-list
mv plans/chat-components/conversation-list-plan.md plans/chat-components/conversation-list/plan.md 2>/dev/null

mkdir -p plans/chat-components/file-attachment
mv plans/chat-components/file-attachment-plan.md plans/chat-components/file-attachment/plan.md 2>/dev/null
mv mockups/chat-components/file-attachment-default.html plans/chat-components/file-attachment/mockup.html 2>/dev/null

mkdir -p plans/chat-components/file-tree-visualizer
mv plans/chat-components/file-tree-visualizer-plan.md plans/chat-components/file-tree-visualizer/plan.md 2>/dev/null
mv mockups/chat-components/file-tree-visualizer.html plans/chat-components/file-tree-visualizer/mockup.html 2>/dev/null

mkdir -p plans/chat-components/image-paste-handler
mv plans/chat-components/image-paste-handler-plan.md plans/chat-components/image-paste-handler/plan.md 2>/dev/null

mkdir -p plans/chat-components/mention-autocomplete
mv plans/chat-components/mention-autocomplete-plan.md plans/chat-components/mention-autocomplete/plan.md 2>/dev/null

mkdir -p plans/chat-components/multi-chat-dashboard
mv plans/chat-components/multi-chat-dashboard-plan.md plans/chat-components/multi-chat-dashboard/plan.md 2>/dev/null
mv mockups/chat-components/multi-chat-dashboard.html plans/chat-components/multi-chat-dashboard/mockup.html 2>/dev/null

mkdir -p plans/chat-components/prompt-history
mv plans/chat-components/prompt-history-plan.md plans/chat-components/prompt-history/plan.md 2>/dev/null

mkdir -p plans/chat-components/search-results-visualizer
mv plans/chat-components/search-results-visualizer-plan.md plans/chat-components/search-results-visualizer/plan.md 2>/dev/null
mv mockups/chat-components/search-results-visualizer.html plans/chat-components/search-results-visualizer/mockup.html 2>/dev/null

mkdir -p plans/chat-components/smart-prompt-input
mv plans/chat-components/smart-prompt-input-plan.md plans/chat-components/smart-prompt-input/plan.md 2>/dev/null
mv mockups/chat-components/smart-prompt-input-default.html plans/chat-components/smart-prompt-input/mockup.html 2>/dev/null

mkdir -p plans/chat-components/streaming-text
mv plans/chat-components/streaming-text-plan.md plans/chat-components/streaming-text/plan.md 2>/dev/null
mv mockups/chat-components/streaming-text-default.html plans/chat-components/streaming-text/mockup.html 2>/dev/null

mkdir -p plans/chat-components/text-paste-handler
mv plans/chat-components/text-paste-handler-plan.md plans/chat-components/text-paste-handler/plan.md 2>/dev/null

mkdir -p plans/chat-components/tool-execution-container
mv plans/chat-components/tool-execution-container-plan.md plans/chat-components/tool-execution-container/plan.md 2>/dev/null
mv mockups/chat-components/tool-execution-container-default.html plans/chat-components/tool-execution-container/mockup-default.html 2>/dev/null
mv mockups/chat-components/tool-execution-container.html plans/chat-components/tool-execution-container/mockup.html 2>/dev/null

mkdir -p plans/chat-components/typing-indicator
mv plans/chat-components/typing-indicator-plan.md plans/chat-components/typing-indicator/plan.md 2>/dev/null
mv mockups/chat-components/typing-indicator-default.html plans/chat-components/typing-indicator/mockup.html 2>/dev/null

# Move test theme files to a test-themes folder
mkdir -p plans/chat-components/test-themes
mv mockups/chat-components/test-theme.html plans/chat-components/test-themes/test-theme.html 2>/dev/null
mv mockups/chat-components/test-theme-simple.html plans/chat-components/test-themes/test-theme-simple.html 2>/dev/null
mv mockups/chat-components/token-verification-report.md plans/chat-components/test-themes/token-verification-report.md 2>/dev/null

# Form components - segmented control
mkdir -p plans/form-components/segmented-control
mv mockups/form-components/segmented-control-default.html plans/form-components/segmented-control/mockup-default.html 2>/dev/null
mv mockups/form-components/segmented-control-dark.html plans/form-components/segmented-control/mockup-dark.html 2>/dev/null
mv mockups/form-components/segmented-control-interactive.html plans/form-components/segmented-control/mockup-interactive.html 2>/dev/null
mv mockups/form-components/segmented-control-responsive.html plans/form-components/segmented-control/mockup-responsive.html 2>/dev/null
mv mockups/form-components/segmented-control-variants.html plans/form-components/segmented-control/mockup-variants.html 2>/dev/null

# List components
mkdir -p plans/list-components/chat-list
mv plans/list-components/chat-list-component-plan.md plans/list-components/chat-list/plan.md 2>/dev/null
mv mockups/list-components/chat-list-default.html plans/list-components/chat-list/mockup.html 2>/dev/null

mkdir -p plans/list-components/virtualized-list
mv plans/list-components/virtualized-list-plan.md plans/list-components/virtualized-list/plan.md 2>/dev/null

mkdir -p plans/list-components/tree-view
mv plans/list-components/mockup-tree-view.md plans/list-components/tree-view/mockup-plan.md 2>/dev/null

# Move other list component docs
mkdir -p plans/list-components/docs
mv plans/list-components/imperative-component-model.md plans/list-components/docs/imperative-component-model.md 2>/dev/null
mv plans/list-components/mockup-chat-list.md plans/list-components/docs/mockup-chat-list.md 2>/dev/null

echo "Reorganization complete!"
echo "Cleaning up empty directories..."

# Remove empty mockups directories if they exist
rmdir mockups/chat-components 2>/dev/null
rmdir mockups/form-components 2>/dev/null
rmdir mockups/list-components 2>/dev/null
rmdir mockups 2>/dev/null

echo "Done!"