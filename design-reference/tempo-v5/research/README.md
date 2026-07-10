# Tempo v5 — component spec index

Re-implementation-grade specs of every documented Geist component (source: vercel.com/geist), plus `_foundations.md` (system model) and `_public-sources.md` (what is liftable vs re-implemented). The extension patterns live in [`../patterns/`](../patterns/).

| Spec | Purpose |
| --- | --- |
| [Geist Foundations](_foundations.md) |  |
| [Public sources — what of Vercel's Geist can we legally lift vs. must re-implement](_public-sources.md) | _Research pass, 2026-07-11. Sources checked live via `gh api`, `npm view`/registry JSON, and |
| [Avatar](avatar.md) | Avatars represent a user or a team. Stacked avatars represent a group of people. |
| [Badge](badge.md) | A label that emphasizes an element that requires attention, or helps categorize with other similar elements. |
| [Banner](banner.md) | A prominent message that spans the full width of its container to announce important information. |
| [Book](book.md) | A responsive book component. |
| [Breadcrumbs](breadcrumbs.md) | Navigation aid that shows the user's location within a site's hierarchy, with text and menu variants. |
| [Browser](browser.md) | The Browser component lets you showcase website screenshots or any other content within a realistic browser-style frame. |
| [Button](button.md) | Trigger an action or event, such as submitting a form or displaying a dialog. |
| [Calendar](calendar.md) | Displays a calendar from which users can select a date or range of dates. |
| [Card](card.md) | A container that groups related content and actions on a surface. |
| [Checkbox](checkbox.md) | A control that toggles between two options, checked or unchecked. |
| [Choicebox](choicebox.md) | A larger form of Radio or Checkbox, where the user has a larger tap target and more details. |
| [Clearable Input](clearable-input.md) | Text input with a clear button that resets the value on Escape. |
| [Code Block](code-block.md) | Code Block component used across Vercel and Next.js. |
| [Code](code.md) | Display a snippet of code with syntax highlighting. |
| [Collapse](collapse.md) | A set of headings, vertically stacked, that each reveal an related section of content. Commonly referred to as an accordion. |
| [Combobox](combobox.md) | Filters large lists to selectable options based on the matching query. |
| [Command Menu](command-menu.md) | Launch a set of actions as a full-screen overlay." (Vercel Geist Design System — `command-menu`) |
| [Context Card](context-card.md) | Vercel's own one-line tag for this page is literally the word **"Tooltip"** (`frontmatter.description: "Tooltip"`, rendered verbatim as the  |
| [Context Menu](context-menu.md) | Displays a brief heading and subheading to communicate any additional information or context a user needs to continue." (Note: this is Geist |
| [Copy Button](copy-button.md) | A button that copies a given string to the clipboard and provides feedback when copied. |
| [Description](description.md) | Displays a brief heading and subheading to communicate any additional information or context a user needs to continue. |
| [Destructive Action Modal](destructive-action-modal.md) | Confirm destructive actions with a required type-to-confirm gate and an optional irreversibility band. |
| [Dots Menu](dots-menu.md) | An overflow menu triggered by a three-dot icon that reveals additional actions in a dropdown. |
| [Drawer](drawer.md) | Display content in a separate view from the existing context. |
| [Empty State](empty-state.md) | Fill spaces when no content has been added yet, or is temporarily empty due to the nature of the feature and should be designed to prevent c |
| [Entity](entity.md) | Displays up-to-two columns of content. The left column can contain arbitrary content, and the right column typically contains controls or ac |
| [Error Card](error-card.md) | A card used to communicate an error state with a title and message. |
| [Error](error.md) | Good error design is clear, useful, and friendly. Designing concise and accurate error messages unblocks users and builds trust by meeting p |
| [Feedback](feedback.md) | Gather text feedback with an associated emotion. |
| [Fieldset](fieldset.md) | Groups related form controls inside a bordered card with optional footer actions. |
| [File Tree](file-tree.md) | Display a hierarchical directory structure with expandable folders and files, useful for illustrating project layouts. |
| [Gauge](gauge.md) | A circular visual for conveying a percentage. |
| [Grid](grid.md) | Display elements in a grid layout. |
| [Input](input.md) | Retrieve text input from a user." (Geist page one-liner) |
| [JSON View](json-view.md) | Render JSON objects and arrays as a collapsible tree with syntax coloring, keyboard navigation, search highlighting, and selectable text. |
| [Keyboard Input (`Kbd`)](keyboard-input.md) | Display keyboard input that triggers an action. |
| [Label](label.md) | Accessible text label for form controls. |
| [Load More Button](load-more-button.md) | A full-width button used to append more items to a paginated list, with loading and styling variants. |
| [Loading Dots](loading-dots.md) | Indicate an action running in the background." (Geist frontmatter description; page title: "Loading Dots") |
| [Menu](menu.md) | Dropdown menu opened via button. Supports typeahead and keyboard navigation. |
| [MiddleTruncate](middle-truncate.md) | Truncates text in the middle, preserving the start and end of the string for maximum readability. |
| [Modal](modal.md) | Display popup content that requires attention or provides additional information. |
| [Multi Select](multi-select.md) | A keyboard-navigable dropdown for selecting multiple items with advanced focus management. |
| [Note](note.md) | Display text that requires attention or provides additional information. |
| [Pagination](pagination.md) | Navigate to the previous or next page." — Geist Design System |
| [Phone](phone.md) | The Phone component lets you showcase website screenshots or other content within a realistic phone-style frame. |
| [Pill](pill.md) | Not a real Geist component — this page does not exist. |
| [Progress](progress.md) | Display progress relative to a limit or related to a task. |
| [Project Banner](project-banner.md) | Used for temporary, project-wide notifications that require resolution |
| [Radio](radio.md) | Provides single user input from a selection of options. |
| [Relative Time Card](relative-time-card.md) | Popover to show a given date in local time. |
| [Scroller](scroller.md) | Display an overflowing list of items. |
| [Search Input](search-input.md) | Pre-configured search input with a magnifying glass icon and clear button." (Geist Design System, `vercel.com/geist/search-input`) |
| [Select](select.md) | Display a dropdown list of items. |
| [Separator](separator.md) | A visual divider that separates content into distinct sections, with support for horizontal and vertical orientations. |
| [Sheet](sheet.md) | Display content in a side panel that slides in from the edge of the screen. |
| [Show More](show-more.md) | Styling component to show expanded or collapsed content." (page h1 subtitle) |
| [Skeleton](skeleton.md) | Display a skeleton whilst another component is loading." (Vercel Geist) |
| [Slider](slider.md) | Input to select a value from a given range. |
| [Snippet](snippet.md) | Display a snippet of copyable code for the command line." (Vercel Geist, https://vercel.com/geist/snippet) |
| [Spinner](spinner.md) | Indicate an action running in the background. Unlike the loading dots, this should generally be used to indicate loading feedback in respons |
| [Split Button](split-button.md) | A button that offers a primary interaction coupled with a dropdown menu offering additional actions." — Geist Design System |
| [Status Dot](status-dot.md) | Display an indicator of deployment status. |
| [Switch](switch.md) | Choose between a set of options." (Vercel Geist, `/geist/switch`) |
| [Table](table.md) | A semantic HTML table component" (Geist, `vercel.com/geist/table`) |
| [Tabs](tabs.md) | Display tab content. |
| [Text With Copy Button](text-with-copy-button.md) | Display text alongside a button that copies the text to the clipboard. |
| [Textarea](textarea.md) | Retrieve multi-line user input. |
| [Theme Switcher](theme-switcher.md) | Component that allows users to switch between light and dark themes. |
| [Toast](toast.md) | A succinct message that is displayed temporarily. |
| [Toggle](toggle.md) | Displays a boolean value. |
| [Tooltip](tooltip.md) | A set of headings, vertically stacked, that each reveal an related section of content." — (note: this is a stale/copy-pasted meta descriptio |
| [Video](video.md) | Embed a video with built-in playback controls and lazy loading support. |
