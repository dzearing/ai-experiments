#!/bin/bash

BASE_DIR="/Users/dzearing/workspace/projects/claude-flow/repos/claude-flow-1/packages/ui-kit-react/docs/plans"
cd "$BASE_DIR"

# Core components
mkdir -p core-components/badge && mv build-components/components/Badge.md core-components/badge/plan.md 2>/dev/null || true
mkdir -p core-components/chip && mv build-components/components/Chip.md core-components/chip/plan.md 2>/dev/null || true
mkdir -p core-components/label && mv build-components/components/Label.md core-components/label/plan.md 2>/dev/null || true
mkdir -p core-components/icon && mv build-components/components/Icon.md core-components/icon/plan.md 2>/dev/null || true
mkdir -p core-components/icon-button && mv build-components/components/IconButton.md core-components/icon-button/plan.md 2>/dev/null || true
mkdir -p core-components/input && mv build-components/components/Input.md core-components/input/plan.md 2>/dev/null || true
mkdir -p core-components/text && mv build-components/components/Text.md core-components/text/plan.md 2>/dev/null || true
mkdir -p core-components/heading && mv build-components/components/Heading.md core-components/heading/plan.md 2>/dev/null || true
mkdir -p core-components/button && mv build-components/components/button.md core-components/button/plan.md 2>/dev/null || true
mkdir -p core-components/loading-button && mv build-components/components/LoadingButton.md core-components/loading-button/plan.md 2>/dev/null || true
mkdir -p core-components/toggle-button && mv build-components/components/ToggleButton.md core-components/toggle-button/plan.md 2>/dev/null || true

# Layout components  
mkdir -p layout-components/box && mv build-components/components/Box.md layout-components/box/plan.md 2>/dev/null || true
mkdir -p layout-components/flex && mv build-components/components/Flex.md layout-components/flex/plan.md 2>/dev/null || true
mkdir -p layout-components/grid && mv build-components/components/grid.md layout-components/grid/plan.md 2>/dev/null || true
mkdir -p layout-components/container && mv build-components/components/container.md layout-components/container/plan.md 2>/dev/null || true
mkdir -p layout-components/stack && mv build-components/components/stack.md layout-components/stack/plan.md 2>/dev/null || true
mkdir -p layout-components/columns && mv build-components/components/columns.md layout-components/columns/plan.md 2>/dev/null || true
mkdir -p layout-components/center && mv build-components/components/center.md layout-components/center/plan.md 2>/dev/null || true
mkdir -p layout-components/spacer && mv build-components/components/spacer.md layout-components/spacer/plan.md 2>/dev/null || true
mkdir -p layout-components/scroll-view && mv build-components/components/ScrollView.md layout-components/scroll-view/plan.md 2>/dev/null || true
mkdir -p layout-components/aspect-ratio && mv build-components/components/aspect-ratio.md layout-components/aspect-ratio/plan.md 2>/dev/null || true
mkdir -p layout-components/flexbox && mv build-components/components/flexbox.md layout-components/flexbox/plan.md 2>/dev/null || true
mkdir -p layout-components/float && mv build-components/components/float.md layout-components/float/plan.md 2>/dev/null || true
mkdir -p layout-components/sticky && mv build-components/components/sticky.md layout-components/sticky/plan.md 2>/dev/null || true
mkdir -p layout-components/masonry && mv build-components/components/masonry.md layout-components/masonry/plan.md 2>/dev/null || true
mkdir -p layout-components/split-view && mv build-components/components/split-view.md layout-components/split-view/plan.md 2>/dev/null || true
mkdir -p layout-components/resizable-panel && mv build-components/components/resizable-panel.md layout-components/resizable-panel/plan.md 2>/dev/null || true

# Form components
mkdir -p form-components/form-field && mv build-components/components/form-field.md form-components/form-field/plan.md 2>/dev/null || true
mkdir -p form-components/form-label && mv build-components/components/FormLabel.md form-components/form-label/plan.md 2>/dev/null || true
mkdir -p form-components/form-error && mv build-components/components/FormError.md form-components/form-error/plan.md 2>/dev/null || true
mkdir -p form-components/form-helper-text && mv build-components/components/FormHelperText.md form-components/form-helper-text/plan.md 2>/dev/null || true
mkdir -p form-components/text-field && mv build-components/components/TextField.md form-components/text-field/plan.md 2>/dev/null || true
mkdir -p form-components/text-area-field && mv build-components/components/TextAreaField.md form-components/text-area-field/plan.md 2>/dev/null || true
mkdir -p form-components/text-area && mv build-components/components/text-area.md form-components/text-area/plan.md 2>/dev/null || true
mkdir -p form-components/password-input && mv build-components/components/password-input.md form-components/password-input/plan.md 2>/dev/null || true
mkdir -p form-components/number-input && mv build-components/components/number-input.md form-components/number-input/plan.md 2>/dev/null || true
mkdir -p form-components/pin-input && mv build-components/components/pin-input.md form-components/pin-input/plan.md 2>/dev/null || true
mkdir -p form-components/autocomplete-input && mv build-components/components/autocomplete-input.md form-components/autocomplete-input/plan.md 2>/dev/null || true
mkdir -p form-components/search-input && mv build-components/components/search-input.md form-components/search-input/plan.md 2>/dev/null || true
mkdir -p form-components/tag-input && mv build-components/components/tag-input.md form-components/tag-input/plan.md 2>/dev/null || true
mkdir -p form-components/slider-input && mv build-components/components/slider-input.md form-components/slider-input/plan.md 2>/dev/null || true
mkdir -p form-components/range-slider && mv build-components/components/range-slider.md form-components/range-slider/plan.md 2>/dev/null || true
mkdir -p form-components/rating-input && mv build-components/components/rating-input.md form-components/rating-input/plan.md 2>/dev/null || true
mkdir -p form-components/file-input && mv build-components/components/file-input.md form-components/file-input/plan.md 2>/dev/null || true

# Navigation components
mkdir -p navigation-components/tab-list && mv build-components/components/TabList.md navigation-components/tab-list/plan.md 2>/dev/null || true
mkdir -p navigation-components/tab && mv build-components/components/Tab.md navigation-components/tab/plan.md 2>/dev/null || true
mkdir -p navigation-components/tab-panel && mv build-components/components/TabPanel.md navigation-components/tab-panel/plan.md 2>/dev/null || true
mkdir -p navigation-components/breadcrumb && mv build-components/components/breadcrumb.md navigation-components/breadcrumb/plan.md 2>/dev/null || true
mkdir -p navigation-components/breadcrumb-collapsed && mv build-components/components/breadcrumb-collapsed.md navigation-components/breadcrumb-collapsed/plan.md 2>/dev/null || true
mkdir -p navigation-components/navigation-drawer && mv build-components/components/navigation-drawer.md navigation-components/navigation-drawer/plan.md 2>/dev/null || true
mkdir -p navigation-components/navigation-rail && mv build-components/components/navigation-rail.md navigation-components/navigation-rail/plan.md 2>/dev/null || true
mkdir -p navigation-components/navigation-search && mv build-components/components/navigation-search.md navigation-components/navigation-search/plan.md 2>/dev/null || true
mkdir -p navigation-components/bottom-navigation && mv build-components/components/bottom-navigation.md navigation-components/bottom-navigation/plan.md 2>/dev/null || true
mkdir -p navigation-components/tab-navigation && mv build-components/components/tab-navigation.md navigation-components/tab-navigation/plan.md 2>/dev/null || true
mkdir -p navigation-components/vertical-tabs && mv build-components/components/vertical-tabs.md navigation-components/vertical-tabs/plan.md 2>/dev/null || true
mkdir -p navigation-components/mega-menu && mv build-components/components/mega-menu.md navigation-components/mega-menu/plan.md 2>/dev/null || true
mkdir -p navigation-components/context-menu && mv build-components/components/context-menu.md navigation-components/context-menu/plan.md 2>/dev/null || true
mkdir -p navigation-components/command-bar && mv build-components/components/command-bar.md navigation-components/command-bar/plan.md 2>/dev/null || true
mkdir -p navigation-components/command-palette && mv build-components/components/command-palette.md navigation-components/command-palette/plan.md 2>/dev/null || true
mkdir -p navigation-components/path-bar && mv build-components/components/path-bar.md navigation-components/path-bar/plan.md 2>/dev/null || true
mkdir -p navigation-components/history-navigation && mv build-components/components/history-navigation.md navigation-components/history-navigation/plan.md 2>/dev/null || true

# Feedback components
mkdir -p feedback-components/alert && mv build-components/components/alert.md feedback-components/alert/plan.md 2>/dev/null || true
mkdir -p feedback-components/alert-dialog && mv build-components/components/alert-dialog.md feedback-components/alert-dialog/plan.md 2>/dev/null || true
mkdir -p feedback-components/toast && mv build-components/components/toast.md feedback-components/toast/plan.md 2>/dev/null || true
mkdir -p feedback-components/snackbar && mv build-components/components/snackbar.md feedback-components/snackbar/plan.md 2>/dev/null || true
mkdir -p feedback-components/loading-button && mv build-components/components/loading-button.md feedback-components/loading-button/plan.md 2>/dev/null || true
mkdir -p feedback-components/skeleton-loader && mv build-components/components/skeleton-loader.md feedback-components/skeleton-loader/plan.md 2>/dev/null || true
mkdir -p feedback-components/progress-bar && mv build-components/components/progress-bar.md feedback-components/progress-bar/plan.md 2>/dev/null || true
mkdir -p feedback-components/progress-ring && mv build-components/components/progress-ring.md feedback-components/progress-ring/plan.md 2>/dev/null || true
mkdir -p feedback-components/progress-steps && mv build-components/components/progress-steps.md feedback-components/progress-steps/plan.md 2>/dev/null || true
mkdir -p feedback-components/loading-overlay && mv build-components/components/loading-overlay.md feedback-components/loading-overlay/plan.md 2>/dev/null || true
mkdir -p feedback-components/pulse-loader && mv build-components/components/pulse-loader.md feedback-components/pulse-loader/plan.md 2>/dev/null || true
mkdir -p feedback-components/wave-loader && mv build-components/components/wave-loader.md feedback-components/wave-loader/plan.md 2>/dev/null || true
mkdir -p feedback-components/banner && mv build-components/components/banner.md feedback-components/banner/plan.md 2>/dev/null || true
mkdir -p feedback-components/announcement && mv build-components/components/announcement.md feedback-components/announcement/plan.md 2>/dev/null || true
mkdir -p feedback-components/notification-center && mv build-components/components/notification-center.md feedback-components/notification-center/plan.md 2>/dev/null || true
mkdir -p feedback-components/help-tooltip && mv build-components/components/help-tooltip.md feedback-components/help-tooltip/plan.md 2>/dev/null || true
mkdir -p feedback-components/tour && mv build-components/components/tour.md feedback-components/tour/plan.md 2>/dev/null || true
mkdir -p feedback-components/validation-message && mv build-components/components/validation-message.md feedback-components/validation-message/plan.md 2>/dev/null || true
mkdir -p feedback-components/error-message && mv build-components/components/error-message.md feedback-components/error-message/plan.md 2>/dev/null || true
mkdir -p feedback-components/info-message && mv build-components/components/info-message.md feedback-components/info-message/plan.md 2>/dev/null || true
mkdir -p feedback-components/success-message && mv build-components/components/success-message.md feedback-components/success-message/plan.md 2>/dev/null || true
mkdir -p feedback-components/warning-message && mv build-components/components/warning-message.md feedback-components/warning-message/plan.md 2>/dev/null || true
mkdir -p feedback-components/step-indicator && mv build-components/components/step-indicator.md feedback-components/step-indicator/plan.md 2>/dev/null || true
mkdir -p feedback-components/status-indicator && mv build-components/components/status-indicator.md feedback-components/status-indicator/plan.md 2>/dev/null || true
mkdir -p feedback-components/status-bar && mv build-components/components/status-bar.md feedback-components/status-bar/plan.md 2>/dev/null || true

# Overlay components
mkdir -p overlay-components/dialog && mv build-components/components/dialog.md overlay-components/dialog/plan.md 2>/dev/null || true
mkdir -p overlay-components/confirm-dialog && mv build-components/components/ConfirmDialog.md overlay-components/confirm-dialog/plan.md 2>/dev/null || true
mkdir -p overlay-components/confirm-dialog && mv build-components/components/confirm-dialog.md overlay-components/confirm-dialog/plan.md 2>/dev/null || true
mkdir -p overlay-components/modal && mv build-components/components/modal.md overlay-components/modal/plan.md 2>/dev/null || true
mkdir -p overlay-components/drawer && mv build-components/components/drawer.md overlay-components/drawer/plan.md 2>/dev/null || true
mkdir -p overlay-components/popover && mv build-components/components/popover.md overlay-components/popover/plan.md 2>/dev/null || true
mkdir -p overlay-components/tooltip && mv build-components/components/tooltip.md overlay-components/tooltip/plan.md 2>/dev/null || true
mkdir -p overlay-components/overlay && mv build-components/components/Overlay.md overlay-components/overlay/plan.md 2>/dev/null || true
mkdir -p overlay-components/sheet && mv build-components/components/sheet.md overlay-components/sheet/plan.md 2>/dev/null || true
mkdir -p overlay-components/fullscreen-dialog && mv build-components/components/fullscreen-dialog.md overlay-components/fullscreen-dialog/plan.md 2>/dev/null || true
mkdir -p overlay-components/lightbox && mv build-components/components/lightbox.md overlay-components/lightbox/plan.md 2>/dev/null || true
mkdir -p overlay-components/floating-panel && mv build-components/components/floating-panel.md overlay-components/floating-panel/plan.md 2>/dev/null || true
mkdir -p overlay-components/floating-toolbar && mv build-components/components/floating-toolbar.md overlay-components/floating-toolbar/plan.md 2>/dev/null || true

# Data components
mkdir -p data-components/data-table && mv build-components/components/data-table.md data-components/data-table/plan.md 2>/dev/null || true
mkdir -p data-components/list-view && mv build-components/components/list-view.md data-components/list-view/plan.md 2>/dev/null || true
mkdir -p data-components/tree && mv build-components/components/Tree.md data-components/tree/plan.md 2>/dev/null || true
mkdir -p data-components/tree-table && mv build-components/components/tree-table.md data-components/tree-table/plan.md 2>/dev/null || true
mkdir -p data-components/details-list && mv build-components/components/details-list.md data-components/details-list/plan.md 2>/dev/null || true
mkdir -p data-components/grid-view && mv build-components/components/grid-view.md data-components/grid-view/plan.md 2>/dev/null || true
mkdir -p data-components/kanban-board && mv build-components/components/kanban-board.md data-components/kanban-board/plan.md 2>/dev/null || true
mkdir -p data-components/kanban-card && mv build-components/components/kanban-card.md data-components/kanban-card/plan.md 2>/dev/null || true
mkdir -p data-components/kanban-column && mv build-components/components/kanban-column.md data-components/kanban-column/plan.md 2>/dev/null || true
mkdir -p data-components/task-board && mv build-components/components/task-board.md data-components/task-board/plan.md 2>/dev/null || true
mkdir -p data-components/sprint-view && mv build-components/components/sprint-view.md data-components/sprint-view/plan.md 2>/dev/null || true
mkdir -p data-components/timeline && mv build-components/components/timeline.md data-components/timeline/plan.md 2>/dev/null || true
mkdir -p data-components/calendar && mv build-components/components/calendar.md data-components/calendar/plan.md 2>/dev/null || true
mkdir -p data-components/table-filters && mv build-components/components/table-filters.md data-components/table-filters/plan.md 2>/dev/null || true
mkdir -p data-components/table-pagination && mv build-components/components/table-pagination.md data-components/table-pagination/plan.md 2>/dev/null || true
mkdir -p data-components/table-sort && mv build-components/components/table-sort.md data-components/table-sort/plan.md 2>/dev/null || true
mkdir -p data-components/virtualized-list && mv build-components/components/virtualized-list.md data-components/virtualized-list/plan.md 2>/dev/null || true
mkdir -p data-components/infinite-list && mv build-components/components/infinite-list.md data-components/infinite-list/plan.md 2>/dev/null || true
mkdir -p data-components/sortable-list && mv build-components/components/sortable-list.md data-components/sortable-list/plan.md 2>/dev/null || true
mkdir -p data-components/selectable-list && mv build-components/components/selectable-list.md data-components/selectable-list/plan.md 2>/dev/null || true
mkdir -p data-components/grouped-list && mv build-components/components/grouped-list.md data-components/grouped-list/plan.md 2>/dev/null || true
mkdir -p data-components/filterable-list && mv build-components/components/filterable-list.md data-components/filterable-list/plan.md 2>/dev/null || true
mkdir -p data-components/expandable-list-item && mv build-components/components/expandable-list-item.md data-components/expandable-list-item/plan.md 2>/dev/null || true
mkdir -p data-components/compact-list && mv build-components/components/compact-list.md data-components/compact-list/plan.md 2>/dev/null || true
mkdir -p data-components/staggered-list && mv build-components/components/staggered-list.md data-components/staggered-list/plan.md 2>/dev/null || true

# Selection components
mkdir -p selection-components/dropdown && mv build-components/components/dropdown.md selection-components/dropdown/plan.md 2>/dev/null || true
mkdir -p selection-components/multi-select && mv build-components/components/multi-select.md selection-components/multi-select/plan.md 2>/dev/null || true
mkdir -p selection-components/radio-group && mv build-components/components/RadioGroup.md selection-components/radio-group/plan.md 2>/dev/null || true
mkdir -p selection-components/toggle-button && mv build-components/components/toggle-button.md selection-components/toggle-button/plan.md 2>/dev/null || true
mkdir -p selection-components/segmented-control && mv build-components/components/SegmentedControl.md selection-components/segmented-control/plan.md 2>/dev/null || true
mkdir -p selection-components/searchable-select && mv build-components/components/searchable-select.md selection-components/searchable-select/plan.md 2>/dev/null || true

# Chart components
mkdir -p chart-components/chart-container && mv build-components/components/ChartContainer.md chart-components/chart-container/plan.md 2>/dev/null || true
mkdir -p chart-components/line-chart && mv build-components/components/LineChart.md chart-components/line-chart/plan.md 2>/dev/null || true
mkdir -p chart-components/burndown-chart && mv build-components/components/burndown-chart.md chart-components/burndown-chart/plan.md 2>/dev/null || true

# Media components
mkdir -p media-components/image && mv build-components/components/Image.md media-components/image/plan.md 2>/dev/null || true
mkdir -p media-components/avatar && mv build-components/components/avatar.md media-components/avatar/plan.md 2>/dev/null || true
mkdir -p media-components/avatar-group && mv build-components/components/avatar-group.md media-components/avatar-group/plan.md 2>/dev/null || true
mkdir -p media-components/avatar-with-status && mv build-components/components/avatar-with-status.md media-components/avatar-with-status/plan.md 2>/dev/null || true
mkdir -p media-components/image-grid && mv build-components/components/image-grid.md media-components/image-grid/plan.md 2>/dev/null || true
mkdir -p media-components/image-tile && mv build-components/components/image-tile.md media-components/image-tile/plan.md 2>/dev/null || true
mkdir -p media-components/image-upload && mv build-components/components/image-upload.md media-components/image-upload/plan.md 2>/dev/null || true

# Chat components
mkdir -p chat-components/chat-bubble && mv build-components/components/chat-bubble.md chat-components/chat-bubble/plan.md 2>/dev/null || true
mkdir -p chat-components/chat-message-group && mv build-components/components/chat-message-group.md chat-components/chat-message-group/plan.md 2>/dev/null || true
mkdir -p chat-components/chat-toolbar && mv build-components/components/chat-toolbar.md chat-components/chat-toolbar/plan.md 2>/dev/null || true
mkdir -p chat-components/chat-search && mv build-components/components/chat-search.md chat-components/chat-search/plan.md 2>/dev/null || true
mkdir -p chat-components/typing-indicator && mv build-components/components/typing-indicator.md chat-components/typing-indicator/plan.md 2>/dev/null || true
mkdir -p chat-components/chat-error-boundary && mv build-components/components/chat-error-boundary.md chat-components/chat-error-boundary/plan.md 2>/dev/null || true
mkdir -p chat-components/chat-export && mv build-components/components/chat-export.md chat-components/chat-export/plan.md 2>/dev/null || true
mkdir -p chat-components/chat-metadata && mv build-components/components/chat-metadata.md chat-components/chat-metadata/plan.md 2>/dev/null || true
mkdir -p chat-components/chat-scroll-anchor && mv build-components/components/chat-scroll-anchor.md chat-components/chat-scroll-anchor/plan.md 2>/dev/null || true
mkdir -p chat-components/conversation-list && mv build-components/components/conversation-list.md chat-components/conversation-list/plan.md 2>/dev/null || true
mkdir -p chat-components/message-actions && mv build-components/components/message-actions.md chat-components/message-actions/plan.md 2>/dev/null || true
mkdir -p chat-components/message-bookmark && mv build-components/components/message-bookmark.md chat-components/message-bookmark/plan.md 2>/dev/null || true
mkdir -p chat-components/message-divider && mv build-components/components/message-divider.md chat-components/message-divider/plan.md 2>/dev/null || true
mkdir -p chat-components/response-suggestions && mv build-components/components/response-suggestions.md chat-components/response-suggestions/plan.md 2>/dev/null || true
mkdir -p chat-components/prompt-history && mv build-components/components/prompt-history.md chat-components/prompt-history/plan.md 2>/dev/null || true
mkdir -p chat-components/smart-prompt-input && mv build-components/components/smart-prompt-input.md chat-components/smart-prompt-input/plan.md 2>/dev/null || true
mkdir -p chat-components/streaming-text && mv build-components/components/streaming-text.md chat-components/streaming-text/plan.md 2>/dev/null || true

# File components
mkdir -p file-components/file-picker && mv build-components/components/FilePicker.md file-components/file-picker/plan.md 2>/dev/null || true
mkdir -p file-components/file-upload-zone && mv build-components/components/file-upload-zone.md file-components/file-upload-zone/plan.md 2>/dev/null || true
mkdir -p file-components/file-tree && mv build-components/components/file-tree.md file-components/file-tree/plan.md 2>/dev/null || true
mkdir -p file-components/file-explorer && mv build-components/components/file-explorer.md file-components/file-explorer/plan.md 2>/dev/null || true
mkdir -p file-components/file-actions && mv build-components/components/file-actions.md file-components/file-actions/plan.md 2>/dev/null || true
mkdir -p file-components/file-attachment && mv build-components/components/file-attachment.md file-components/file-attachment/plan.md 2>/dev/null || true
mkdir -p file-components/file-breadcrumb && mv build-components/components/file-breadcrumb.md file-components/file-breadcrumb/plan.md 2>/dev/null || true
mkdir -p file-components/file-diff && mv build-components/components/file-diff.md file-components/file-diff/plan.md 2>/dev/null || true
mkdir -p file-components/file-icon && mv build-components/components/file-icon.md file-components/file-icon/plan.md 2>/dev/null || true
mkdir -p file-components/file-metadata && mv build-components/components/file-metadata.md file-components/file-metadata/plan.md 2>/dev/null || true
mkdir -p file-components/file-preview && mv build-components/components/file-preview.md file-components/file-preview/plan.md 2>/dev/null || true
mkdir -p file-components/file-progress && mv build-components/components/file-progress.md file-components/file-progress/plan.md 2>/dev/null || true
mkdir -p file-components/file-search && mv build-components/components/file-search.md file-components/file-search/plan.md 2>/dev/null || true
mkdir -p file-components/file-stats && mv build-components/components/file-stats.md file-components/file-stats/plan.md 2>/dev/null || true
mkdir -p file-components/file-versions && mv build-components/components/file-versions.md file-components/file-versions/plan.md 2>/dev/null || true
mkdir -p file-components/folder-tree && mv build-components/components/folder-tree.md file-components/folder-tree/plan.md 2>/dev/null || true
mkdir -p file-components/directory-picker && mv build-components/components/directory-picker.md file-components/directory-picker/plan.md 2>/dev/null || true
mkdir -p file-components/recent-files && mv build-components/components/recent-files.md file-components/recent-files/plan.md 2>/dev/null || true

# Specialized components
mkdir -p specialized-components/code-editor && mv build-components/components/code-editor.md specialized-components/code-editor/plan.md 2>/dev/null || true
mkdir -p specialized-components/markdown-editor && mv build-components/components/markdown-editor.md specialized-components/markdown-editor/plan.md 2>/dev/null || true
mkdir -p specialized-components/markdown-preview && mv build-components/components/markdown-preview.md specialized-components/markdown-preview/plan.md 2>/dev/null || true
mkdir -p specialized-components/rich-text-editor && mv build-components/components/rich-text-editor.md specialized-components/rich-text-editor/plan.md 2>/dev/null || true
mkdir -p specialized-components/date-picker && mv build-components/components/date-picker.md specialized-components/date-picker/plan.md 2>/dev/null || true
mkdir -p specialized-components/date-range-picker && mv build-components/components/date-range-picker.md specialized-components/date-range-picker/plan.md 2>/dev/null || true
mkdir -p specialized-components/date-time-picker && mv build-components/components/date-time-picker.md specialized-components/date-time-picker/plan.md 2>/dev/null || true
mkdir -p specialized-components/time-picker && mv build-components/components/TimePicker.md specialized-components/time-picker/plan.md 2>/dev/null || true
mkdir -p specialized-components/color-picker && mv build-components/components/color-picker.md specialized-components/color-picker/plan.md 2>/dev/null || true
mkdir -p specialized-components/workflow-builder && mv build-components/components/workflow-builder.md specialized-components/workflow-builder/plan.md 2>/dev/null || true
mkdir -p specialized-components/code-file-preview && mv build-components/components/code-file-preview.md specialized-components/code-file-preview/plan.md 2>/dev/null || true
mkdir -p specialized-components/code-review && mv build-components/components/code-review.md specialized-components/code-review/plan.md 2>/dev/null || true
mkdir -p specialized-components/commit-history && mv build-components/components/commit-history.md specialized-components/commit-history/plan.md 2>/dev/null || true

# AI/Agent components
mkdir -p ai-components/agent-card && mv build-components/components/agent-card.md ai-components/agent-card/plan.md 2>/dev/null || true
mkdir -p ai-components/agent-status && mv build-components/components/agent-status.md ai-components/agent-status/plan.md 2>/dev/null || true
mkdir -p ai-components/ai-persona-indicator && mv build-components/components/ai-persona-indicator.md ai-components/ai-persona-indicator/plan.md 2>/dev/null || true
mkdir -p ai-components/persona-card && mv build-components/components/persona-card.md ai-components/persona-card/plan.md 2>/dev/null || true
mkdir -p ai-components/persona-selector && mv build-components/components/persona-selector.md ai-components/persona-selector/plan.md 2>/dev/null || true

# User components
mkdir -p user-components/user-activity && mv build-components/components/user-activity.md user-components/user-activity/plan.md 2>/dev/null || true
mkdir -p user-components/user-badge && mv build-components/components/user-badge.md user-components/user-badge/plan.md 2>/dev/null || true
mkdir -p user-components/user-card && mv build-components/components/user-card.md user-components/user-card/plan.md 2>/dev/null || true
mkdir -p user-components/user-mention && mv build-components/components/user-mention.md user-components/user-mention/plan.md 2>/dev/null || true
mkdir -p user-components/user-presence && mv build-components/components/user-presence.md user-components/user-presence/plan.md 2>/dev/null || true
mkdir -p user-components/user-profile && mv build-components/components/user-profile.md user-components/user-profile/plan.md 2>/dev/null || true
mkdir -p user-components/user-tooltip && mv build-components/components/user-tooltip.md user-components/user-tooltip/plan.md 2>/dev/null || true
mkdir -p user-components/collaborator-indicator && mv build-components/components/collaborator-indicator.md user-components/collaborator-indicator/plan.md 2>/dev/null || true
mkdir -p user-components/team-list && mv build-components/components/team-list.md user-components/team-list/plan.md 2>/dev/null || true
mkdir -p user-components/gender-avatar && mv build-components/components/gender-avatar.md user-components/gender-avatar/plan.md 2>/dev/null || true

# Project components
mkdir -p project-components/project-card && mv build-components/components/project-card.md project-components/project-card/plan.md 2>/dev/null || true
mkdir -p project-components/project-progress && mv build-components/components/project-progress.md project-components/project-progress/plan.md 2>/dev/null || true
mkdir -p project-components/work-item-card && mv build-components/components/work-item-card.md project-components/work-item-card/plan.md 2>/dev/null || true
mkdir -p project-components/repo-card && mv build-components/components/repo-card.md project-components/repo-card/plan.md 2>/dev/null || true
mkdir -p project-components/activity-feed && mv build-components/components/activity-feed.md project-components/activity-feed/plan.md 2>/dev/null || true
mkdir -p project-components/collaboration-hub && mv build-components/components/collaboration-hub.md project-components/collaboration-hub/plan.md 2>/dev/null || true
mkdir -p project-components/dashboard-widget && mv build-components/components/dashboard-widget.md project-components/dashboard-widget/plan.md 2>/dev/null || true
mkdir -p project-components/metrics-display && mv build-components/components/metrics-display.md project-components/metrics-display/plan.md 2>/dev/null || true
mkdir -p project-components/automation-rule && mv build-components/components/automation-rule.md project-components/automation-rule/plan.md 2>/dev/null || true
mkdir -p project-components/integration-status && mv build-components/components/integration-status.md project-components/integration-status/plan.md 2>/dev/null || true
mkdir -p project-components/checklist-item && mv build-components/components/checklist-item.md project-components/checklist-item/plan.md 2>/dev/null || true

# Search components
mkdir -p search-components/search-analytics && mv build-components/components/search-analytics.md search-components/search-analytics/plan.md 2>/dev/null || true
mkdir -p search-components/search-filters && mv build-components/components/search-filters.md search-components/search-filters/plan.md 2>/dev/null || true
mkdir -p search-components/search-highlight && mv build-components/components/search-highlight.md search-components/search-highlight/plan.md 2>/dev/null || true
mkdir -p search-components/search-history && mv build-components/components/search-history.md search-components/search-history/plan.md 2>/dev/null || true
mkdir -p search-components/search-preview && mv build-components/components/search-preview.md search-components/search-preview/plan.md 2>/dev/null || true
mkdir -p search-components/search-results && mv build-components/components/search-results.md search-components/search-results/plan.md 2>/dev/null || true
mkdir -p search-components/search-shortcuts && mv build-components/components/search-shortcuts.md search-components/search-shortcuts/plan.md 2>/dev/null || true
mkdir -p search-components/search-suggestions && mv build-components/components/search-suggestions.md search-components/search-suggestions/plan.md 2>/dev/null || true
mkdir -p search-components/global-search && mv build-components/components/global-search.md search-components/global-search/plan.md 2>/dev/null || true
mkdir -p search-components/advanced-search && mv build-components/components/advanced-search.md search-components/advanced-search/plan.md 2>/dev/null || true
mkdir -p search-components/fuzzy-search && mv build-components/components/fuzzy-search.md search-components/fuzzy-search/plan.md 2>/dev/null || true
mkdir -p search-components/voice-search && mv build-components/components/voice-search.md search-components/voice-search/plan.md 2>/dev/null || true

# Animation components
mkdir -p animation-components/animation-transition-components && mv build-components/components/animation-transition-components.md animation-components/animation-transition-components/plan.md 2>/dev/null || true
mkdir -p animation-components/crossfade-transition && mv build-components/components/crossfade-transition.md animation-components/crossfade-transition/plan.md 2>/dev/null || true
mkdir -p animation-components/fade-transition && mv build-components/components/fade-transition.md animation-components/fade-transition/plan.md 2>/dev/null || true
mkdir -p animation-components/scale-transition && mv build-components/components/scale-transition.md animation-components/scale-transition/plan.md 2>/dev/null || true
mkdir -p animation-components/slide-transition && mv build-components/components/slide-transition.md animation-components/slide-transition/plan.md 2>/dev/null || true
mkdir -p animation-components/spring-animation && mv build-components/components/spring-animation.md animation-components/spring-animation/plan.md 2>/dev/null || true
mkdir -p animation-components/page-transition && mv build-components/components/page-transition.md animation-components/page-transition/plan.md 2>/dev/null || true
mkdir -p animation-components/parallax-scroll && mv build-components/components/parallax-scroll.md animation-components/parallax-scroll/plan.md 2>/dev/null || true
mkdir -p animation-components/animated-counter && mv build-components/components/animated-counter.md animation-components/animated-counter/plan.md 2>/dev/null || true
mkdir -p animation-components/animated-icon && mv build-components/components/animated-icon.md animation-components/animated-icon/plan.md 2>/dev/null || true

# Utility components
mkdir -p utility-components/divider && mv build-components/components/divider.md utility-components/divider/plan.md 2>/dev/null || true
mkdir -p utility-components/scroll-area && mv build-components/components/scroll-area.md utility-components/scroll-area/plan.md 2>/dev/null || true
mkdir -p utility-components/bookmark-bar && mv build-components/components/bookmark-bar.md utility-components/bookmark-bar/plan.md 2>/dev/null || true
mkdir -p utility-components/quick-actions && mv build-components/components/quick-actions.md utility-components/quick-actions/plan.md 2>/dev/null || true
mkdir -p utility-components/quick-create && mv build-components/components/quick-create.md utility-components/quick-create/plan.md 2>/dev/null || true
mkdir -p utility-components/quick-view && mv build-components/components/quick-view.md utility-components/quick-view/plan.md 2>/dev/null || true
mkdir -p utility-components/feedback-form && mv build-components/components/feedback-form.md utility-components/feedback-form/plan.md 2>/dev/null || true
mkdir -p utility-components/voice-input && mv build-components/components/voice-input.md utility-components/voice-input/plan.md 2>/dev/null || true
mkdir -p utility-components/duration-counter && mv build-components/components/duration-counter.md utility-components/duration-counter/plan.md 2>/dev/null || true
mkdir -p utility-components/stream-progress && mv build-components/components/stream-progress.md utility-components/stream-progress/plan.md 2>/dev/null || true
mkdir -p utility-components/hashtag-autocomplete && mv build-components/components/hashtag-autocomplete.md utility-components/hashtag-autocomplete/plan.md 2>/dev/null || true
mkdir -p utility-components/mention-autocomplete && mv build-components/components/mention-autocomplete.md utility-components/mention-autocomplete/plan.md 2>/dev/null || true
mkdir -p utility-components/image-paste-handler && mv build-components/components/image-paste-handler.md utility-components/image-paste-handler/plan.md 2>/dev/null || true
mkdir -p utility-components/text-paste-handler && mv build-components/components/text-paste-handler.md utility-components/text-paste-handler/plan.md 2>/dev/null || true
mkdir -p utility-components/list-empty-state && mv build-components/components/list-empty-state.md utility-components/list-empty-state/plan.md 2>/dev/null || true
mkdir -p utility-components/list-error-state && mv build-components/components/list-error-state.md utility-components/list-error-state/plan.md 2>/dev/null || true
mkdir -p utility-components/list-loading-state && mv build-components/components/list-loading-state.md utility-components/list-loading-state/plan.md 2>/dev/null || true
mkdir -p utility-components/list-item-action && mv build-components/components/list-item-action.md utility-components/list-item-action/plan.md 2>/dev/null || true
mkdir -p utility-components/list-data-components && mv build-components/components/list-data-components.md utility-components/list-data-components/plan.md 2>/dev/null || true

echo "Files reorganized successfully!"