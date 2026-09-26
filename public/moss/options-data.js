export const candidateFamilies = [
  {
    id: "suggestions",
    tier: "Primitives",
    title: "Combobox and suggestions",
    question: "What kind of choice is the user making from suggestions?",
    context: "The current catalog calls native select, action menus, and filter editors dropdowns. Moss needs separate semantics before it needs another shared look.",
    use: "Use when typed input narrows a set of valid objects or values.",
    avoid: "Avoid when the list is short and known; use a native select or visible choice group.",
    mobile: "Promote remote or multi-select search into a sheet while a short local list stays inline.",
    options: [
      { key: "A", title: "Local listbox", tradeoff: "Fast and familiar, but only for a bounded client-side set.", keyboard: "Arrows move the active option; Enter commits; Escape closes.", states: "No match, disabled option, long label, invalid selection.", preview: `<div class="pv-field">Search regions<span>can</span></div><div class="pv-list"><div class="pv-row is-active"><b>Canada</b><small>Country</small></div><div class="pv-row"><b>Canary Islands</b><small>Region</small></div><div class="pv-row"><b>Canton</b><small>City</small></div></div>` },
      { key: "B", title: "Remote entity search", tradeoff: "Handles large sets and richer identity, but owns latency and retry states.", keyboard: "Input retains focus while the active descendant moves through results.", states: "Loading, retry, stale result, permission, pagination.", preview: `<div class="pv-field">Search people or teams<span>riv</span></div><div class="pv-group"><em>People</em><div class="pv-row is-active"><i>BR</i><b>Brandon Rivera</b><small>Owner</small></div></div><div class="pv-group"><em>Teams</em><div class="pv-row"><i>DX</i><b>Design systems</b><small>8 members</small></div></div>` },
      { key: "C", title: "Tokenizing multi-select", tradeoff: "Makes a set visible and editable, but increases focus and removal complexity.", keyboard: "Backspace removes the last token only from an empty input; every token is reachable.", states: "Limit reached, duplicate, invalid token, remote error.", preview: `<div class="pv-token-field"><span>Finance <b>x</b></span><span>Platform <b>x</b></span><i>Add a team...</i></div><div class="pv-list"><div class="pv-row is-active"><b>Security</b><small>Add team</small></div><div class="pv-row"><b>Support</b><small>Add team</small></div></div>` }
    ]
  },
  {
    id: "choice-group",
    tier: "Primitives",
    title: "Choice group",
    question: "How much explanation does each mutually exclusive choice require?",
    context: "Moss has selects, tabs, and segmented controls, but no contract for form choices that stay visible.",
    use: "Use when the available choices should remain visible while the user decides.",
    avoid: "Avoid when choices switch peer views; use tabs or a segmented control.",
    mobile: "Give every label a full-width touch target and transform matrices into labelled fieldsets.",
    options: [
      { key: "A", title: "Native stacked choices", tradeoff: "The strongest default for short labels; weak when consequences need comparison.", keyboard: "Native radio or checkbox behavior.", states: "Disabled option, validation error, long label.", preview: `<div class="pv-choice"><i class="is-selected"></i><span><b>Notify on exceptions</b><small>Only items that need action</small></span></div><div class="pv-choice"><i></i><span><b>Daily digest</b><small>One summary each morning</small></span></div><div class="pv-choice"><i></i><span><b>No notifications</b></span></div>` },
      { key: "B", title: "Described choice cards", tradeoff: "Supports consequence-heavy choices, but becomes noisy beyond four options.", keyboard: "One tab stop enters the radio group; arrows change the selection.", states: "Recommended, disabled, warning, validation error.", preview: `<div class="pv-card-choice is-selected"><span>01</span><b>Safe rollout</b><small>10 percent, then review</small></div><div class="pv-card-choice"><span>02</span><b>Immediate</b><small>Publish to every workspace</small></div>` },
      { key: "C", title: "Dense choice matrix", tradeoff: "Efficient for repeated entities, but demands careful row and column labeling.", keyboard: "Cells use native inputs; row and column context stays announced.", states: "Mixed values, locked cell, bulk change, overflow.", preview: `<div class="pv-matrix"><b>Workspace</b><b>View</b><b>Edit</b><span>Ledger</span><i class="is-on"></i><i class="is-on"></i><span>Trading</span><i class="is-on"></i><i></i><span>MCP</span><i class="is-on"></i><i></i></div>` }
    ]
  },
  {
    id: "date-range",
    tier: "Primitives",
    title: "Date and range input",
    question: "Is the user choosing a date, a visible span, or a relative comparison?",
    context: "Functional products repeatedly need time scope, but one calendar popover cannot serve every temporal decision.",
    use: "Use when time bounds change the result set, report, or scheduled action.",
    avoid: "Avoid when a fixed product period can be a simple segmented control.",
    mobile: "Use platform date input for a single date; promote range and comparison work into a focused sheet.",
    options: [
      { key: "A", title: "Native date fields", tradeoff: "Accessible and low-cost, but poor for visually comparing a span.", keyboard: "Preserve platform input behavior and explicit labels.", states: "Invalid order, unavailable date, timezone note.", preview: `<div class="pv-date-pair"><label>Start<b>Sep 01, 2026</b></label><span>to</span><label>End<b>Sep 23, 2026</b></label></div><small class="pv-note">23 days in America/New_York</small>` },
      { key: "B", title: "Calendar range", tradeoff: "Makes span and exclusions visible, but owns grid keyboard behavior.", keyboard: "Arrow through dates; Shift extends; labels announce range boundaries.", states: "Unavailable dates, cross-month, open end, validation.", preview: `<div class="pv-calendar"><b>September 2026</b><div><span>7</span><span>8</span><span class="in-range">9</span><span class="in-range">10</span><span class="in-range">11</span><span>12</span><span>13</span><span>14</span><span class="in-range">15</span><span class="in-range">16</span><span class="in-range">17</span><span class="in-range">18</span><span>19</span><span>20</span></div></div>` },
      { key: "C", title: "Preset plus comparison", tradeoff: "Fast for analytical routines, but unsuitable for arbitrary scheduling.", keyboard: "Presets are a radio group; custom range reveals labelled fields.", states: "Unavailable comparison, partial period, timezone shift.", preview: `<div class="pv-preset"><span>Last 7 days</span><span class="is-selected">Last 30 days</span><span>Quarter to date</span></div><div class="pv-compare"><i></i><span>Compare with previous period</span><b>On</b></div>` }
    ]
  },
  {
    id: "pagination",
    tier: "Primitives",
    title: "Result navigation",
    question: "Does the user need location, chronology, or accumulated context?",
    context: "Dense tables currently stop at one viewport even though pagination is a listed host-owned gap.",
    use: "Use when results exceed the amount that can be read or operated on safely at once.",
    avoid: "Avoid when filtering or virtualization can keep the meaningful set small.",
    mobile: "Keep the current range announced and reduce controls without hiding the navigation model.",
    options: [
      { key: "A", title: "Numbered pages", tradeoff: "Supports jumping and location, but assumes a stable count.", keyboard: "Each page is a named link; the current page is announced.", states: "Unknown total, last-page deletion, disabled bounds.", preview: `<div class="pv-pager"><span>Previous</span><i>1</i><i>2</i><i class="is-current">3</i><i>4</i><i>12</i><span>Next</span></div><small class="pv-note">41-60 of 238 records</small>` },
      { key: "B", title: "Cursor newer / older", tradeoff: "Fits live chronological data, but cannot promise arbitrary jumps.", keyboard: "Two stable named controls; focus returns to the new range heading.", states: "New records arrived, cursor expired, end reached.", preview: `<div class="pv-result-head"><b>Sep 23, 18:00-20:00</b><small>50 events</small></div><div class="pv-actions"><span>Newer</span><span>Older</span></div>` },
      { key: "C", title: "Explicit load more", tradeoff: "Preserves exploration context, but grows the document and complicates return position.", keyboard: "Focus moves to the first appended item after activation.", states: "Retry append, no more results, partial append.", preview: `<div class="pv-stack"><div></div><div></div><div></div></div><div class="pv-load">Load 25 more <small>75 remaining</small></div>` }
    ]
  },
  {
    id: "context-navigation",
    tier: "Primitives",
    title: "Context navigation",
    question: "Should the control explain hierarchy, return history, or switch scope?",
    context: "The persistent rail identifies destinations but not the object or workspace context inside them.",
    use: "Use when users can lose their place inside nested objects or repeated scopes.",
    avoid: "Avoid when the page is already a top-level rail destination.",
    mobile: "Keep the current parent or scope visible and collapse only intermediate hierarchy.",
    options: [
      { key: "A", title: "Breadcrumb trail", tradeoff: "Explains stable hierarchy, but falsely implies one parent when objects are cross-linked.", keyboard: "Every ancestor is a normal link; current page is not linked.", states: "Long names, deep hierarchy, moved object.", preview: `<div class="pv-crumbs"><span>Workspaces</span><i>/</i><span>Ledger</span><i>/</i><span>Policies</span><i>/</i><b>Retention</b></div>` },
      { key: "B", title: "Back link plus identity", tradeoff: "Preserves a single return context, but does not describe global hierarchy.", keyboard: "Back is a named link and restores list query and scroll.", states: "Direct URL with no return context, deleted parent.", preview: `<div class="pv-back">Back to policy results</div><div class="pv-identity"><small>Retention policy</small><b>Transactions / seven years</b></div>` },
      { key: "C", title: "Scope switcher", tradeoff: "Efficient across repeated workspaces, but is not navigation history.", keyboard: "Opens a searchable listbox and announces the new scope.", states: "No access, many scopes, stale current scope.", preview: `<small class="pv-label">Current workspace</small><div class="pv-scope"><i>LE</i><b>Ledger</b><span>Change</span></div><div class="pv-scope-list"><span>Trading Agent</span><span>MCP Console</span></div>` }
    ]
  },
  {
    id: "inspector",
    tier: "Structures",
    title: "Inspector and mobile sheet",
    question: "How much context must remain operable while detail is open?",
    context: "Inspector / mobile sheet is specified but unbuilt, while products currently invent their own responsive overlay behavior.",
    use: "Use when a modest object or short edit needs more room than inline disclosure.",
    avoid: "Avoid when the object has a full lifecycle; use a dedicated route.",
    mobile: "Choose an explicit full-height sheet transformation and preserve the selected object's identity.",
    options: [
      { key: "A", title: "Persistent side inspector", tradeoff: "Keeps list or canvas operable, but reduces its working width.", keyboard: "Focus may move between source and inspector without a modal trap.", states: "No selection, stale object, permission, narrow host.", preview: `<div class="pv-split"><div class="pv-canvas"><span class="is-selected">Selected row</span><span></span><span></span></div><aside><small>Transaction</small><b>Northwind</b><dl><dt>Status</dt><dd>Cleared</dd><dt>Owner</dt><dd>Brandon</dd></dl></aside></div>` },
      { key: "B", title: "Modal task drawer", tradeoff: "Protects a short edit from background changes, but interrupts scanning.", keyboard: "Traps focus, closes on Escape, and returns focus to the opener.", states: "Unsaved change, validation, async save, conflict.", preview: `<div class="pv-dim"><div></div><div></div></div><aside class="pv-drawer"><small>Edit owner</small><b>Assign transaction</b><div class="pv-field">Owner<span>Brandon</span></div><div class="pv-actions"><span>Cancel</span><span>Save</span></div></aside>` },
      { key: "C", title: "Anchored context popover", tradeoff: "Keeps a brief property near its source, but collapses under long forms.", keyboard: "Trigger exposes expanded state; focus returns on close.", states: "Collision, small viewport, missing value, error.", preview: `<div class="pv-anchor">Selected status: Review</div><div class="pv-popover"><small>Status</small><span>Ready</span><span class="is-selected">Review</span><span>Blocked</span></div>` }
    ]
  },
  {
    id: "form-structure",
    tier: "Structures",
    title: "Form structure and validation",
    question: "Is the user configuring, editing in context, or confirming a consequential change?",
    context: "Fields have visual states but no shared structure for validation summaries, sections, or publish review.",
    use: "Use when several related fields form one save or submission boundary.",
    avoid: "Avoid when one field can save safely in place.",
    mobile: "Keep errors near fields and make the save state visible without covering the active input.",
    options: [
      { key: "A", title: "Sectioned single page", tradeoff: "Easy to scan and correct non-linearly, but can become a long undifferentiated form.", keyboard: "Error summary links focus the exact invalid field.", states: "Dirty, invalid, saving, conflict, permission.", preview: `<div class="pv-form-nav"><span class="is-active">General</span><span>Limits</span><span>Notifications</span></div><div class="pv-form"><b>General settings</b><div class="pv-field">Workspace name<span>Ledger</span></div><div class="pv-field is-error">Slug<span>ledger /</span></div><small class="pv-error">Remove the space</small></div>` },
      { key: "B", title: "Compact property editor", tradeoff: "Fast for experts beside an object, but poor for onboarding and explanation.", keyboard: "Rows expose one labelled control each; Enter starts edit, Escape cancels.", states: "Read-only, mixed values, optimistic save, conflict.", preview: `<div class="pv-properties"><div><span>Owner</span><b>Brandon</b></div><div><span>Mode</span><b>Automatic</b></div><div><span>Threshold</span><b>82%</b></div><div><span>Updated</span><b>2m ago</b></div></div>` },
      { key: "C", title: "Review and confirm", tradeoff: "Makes consequence visible, but adds friction to ordinary reversible settings.", keyboard: "Edit links return to the exact source field; final action is last in order.", states: "Changed since review, partial validation, publish failure.", preview: `<div class="pv-review"><small>3 pending changes</small><div><span>Retention</span><b>3 years -> 7 years</b></div><div><span>Scope</span><b>4 workspaces</b></div><div class="pv-warning">Deletes 18,420 archived records later</div><div class="pv-actions"><span>Edit</span><span>Publish</span></div></div>` }
    ]
  },
  {
    id: "finder",
    tier: "Structures",
    title: "Command and global finder",
    question: "Is the user searching nouns, invoking verbs, or acting on the current object?",
    context: "The catalog advertises Ctrl K but has no search or command behavior. The missing contract is semantic, not decorative.",
    use: "Use when visible navigation cannot efficiently expose a large set of destinations or expert actions.",
    avoid: "Avoid when three to five actions can remain visible beside the object.",
    mobile: "Become a dedicated full-screen surface; never depend on a keyboard shortcut.",
    options: [
      { key: "A", title: "Command launcher", tradeoff: "Efficient for expert verbs, but weak for scanning content matches.", keyboard: "Shortcut opens; arrows select; Enter invokes; Escape restores focus.", states: "No command, disabled command, async action, permission.", preview: `<div class="pv-command"><div class="pv-field">Run a command<span>publish</span></div><div class="pv-row is-active"><b>Publish current theme</b><small>Action</small></div><div class="pv-row"><b>Open publishing history</b><small>Navigation</small></div></div>` },
      { key: "B", title: "Global search", tradeoff: "Strong for entities and pages, but actions need a separate model.", keyboard: "Input owns active descendants; result type and destination are announced.", states: "Loading, grouped empty, retry, restricted result.", preview: `<div class="pv-field">Search Moss<span>table</span></div><div class="pv-group"><em>Components</em><div class="pv-row is-active"><b>Dense table</b><small>Data</small></div></div><div class="pv-group"><em>Guidance</em><div class="pv-row"><b>Tables are exact instruments</b><small>Foundation</small></div></div>` },
      { key: "C", title: "Context action palette", tradeoff: "Scales actions on a selected object, but should not replace an obvious primary action.", keyboard: "Opens from the object menu; destructive actions remain separated and described.", states: "No selection, multi-selection, restricted action, conflict.", preview: `<small class="pv-label">Transaction / Northwind</small><div class="pv-action-list"><span class="is-active">Assign owner <b>A</b></span><span>Add note <b>N</b></span><span>Mark reviewed <b>R</b></span><span class="is-danger">Archive</span></div>` }
    ]
  },
  {
    id: "task-flow",
    tier: "Structures",
    title: "Task flow and lifecycle",
    question: "Are steps ordered inputs, resumable tasks, or a read-only process history?",
    context: "Products need progress through work, but dots and numbered circles often collapse distinct workflow models.",
    use: "Use when completion depends on multiple named stages with visible progress or ownership.",
    avoid: "Avoid when independent settings can be saved directly.",
    mobile: "Use text progress and one primary task; never rely on a horizontal row of tiny steps.",
    options: [
      { key: "A", title: "Linear wizard", tradeoff: "Makes prerequisites clear, but blocks non-linear correction unless explicitly supported.", keyboard: "Back and Continue follow document order; step labels expose position.", states: "Invalid step, save and resume, expired session.", preview: `<div class="pv-stepper"><span class="is-done">1 Scope</span><span class="is-current">2 Map fields</span><span>3 Review</span></div><div class="pv-work"><small>Step 2 of 3</small><b>Map imported columns</b><div class="pv-actions"><span>Back</span><span>Continue</span></div></div>` },
      { key: "B", title: "Non-linear checklist", tradeoff: "Supports resumable setup, but cannot enforce strict dependency order by appearance alone.", keyboard: "Each task is a named link with separate status text.", states: "Blocked task, optional task, partial completion, owner.", preview: `<div class="pv-checklist"><div class="is-done"><i></i><span><b>Connect data</b><small>Complete</small></span></div><div class="is-current"><i></i><span><b>Invite reviewers</b><small>2 of 4 added</small></span></div><div><i></i><span><b>Publish policy</b><small>Not started</small></span></div></div>` },
      { key: "C", title: "Approval lifecycle", tradeoff: "Explains ownership and blockers, but is not an input wizard.", keyboard: "Timeline items are ordinary headings and links; current blocker comes first.", states: "Rejected, waiting, overdue, reassigned, skipped.", preview: `<div class="pv-timeline"><div class="is-done"><i></i><span><b>Drafted</b><small>Brandon / 09:14</small></span></div><div class="is-current"><i></i><span><b>Security review</b><small>Waiting on Alex</small></span></div><div><i></i><span><b>Publish</b><small>Blocked</small></span></div></div>` }
    ]
  },
  {
    id: "progress-states",
    tier: "Structures",
    title: "Loading and partial progress",
    question: "Is the layout known, partially usable, or waiting on a long-running job?",
    context: "Moss claims loading and partial states but currently demonstrates only one empty surface.",
    use: "Use when work is pending long enough that silence would look broken.",
    avoid: "Avoid when an action completes below the perception threshold.",
    mobile: "Preserve the meaningful reading order and keep cancel or retry actions reachable above safe areas.",
    options: [
      { key: "A", title: "Structural skeleton", tradeoff: "Preserves orientation for known layouts, but falsely promises content shape when data is uncertain.", keyboard: "Skeleton is hidden from assistive technology; the region exposes busy state.", states: "Timeout, reduced motion, replaced content, empty result.", preview: `<div class="pv-skeleton"><i></i><b></b><span></span><span></span><span></span></div><div class="pv-skeleton"><i></i><b></b><span></span><span></span></div>` },
      { key: "B", title: "Inline partial state", tradeoff: "Keeps usable content available, but must distinguish stale evidence from current values.", keyboard: "Local status is announced without moving focus; Retry follows the message.", states: "Stale, retry, partial failure, permission.", preview: `<div class="pv-partial"><div><small>Portfolio value</small><b>$248,410</b></div><div class="pv-signal">Holdings are current. Benchmarks failed to refresh. <span>Retry</span></div></div>` },
      { key: "C", title: "Queued job progress", tradeoff: "Explains long-running work, but is excessive for ordinary saves.", keyboard: "Progress has a name and value; cancel and details stay reachable.", states: "Queued, indeterminate, paused, failed, completed.", preview: `<div class="pv-job"><small>Importing transactions</small><b>Mapping 8,241 of 12,004 rows</b><div><i class="pv-progress-68"></i></div><span>2 warnings / 38 seconds</span></div>` }
    ]
  },
  {
    id: "activity",
    tier: "Structures",
    title: "Activity and audit",
    question: "Does the user need a human narrative, exact evidence, or sparse lifecycle milestones?",
    context: "Products expose change history, but a generic feed cannot serve collaboration and compliance equally.",
    use: "Use when who changed what and when affects the next decision.",
    avoid: "Avoid when only the current value matters.",
    mobile: "Use one vertical sequence and move dense filters into a sheet.",
    options: [
      { key: "A", title: "Conversational feed", tradeoff: "Readable for collaboration, but weak for exact field-level evidence.", keyboard: "Every item has an actor heading and local action group.", states: "Deleted actor, edited note, attachment failure.", preview: `<div class="pv-feed"><div><i>BR</i><span><b>Brandon changed the threshold</b><small>82% to 88% / 12 minutes ago</small></span></div><div><i>AL</i><span><b>Alex left a note</b><small>Ready for review / 4 minutes ago</small></span></div></div>` },
      { key: "B", title: "Dense audit log", tradeoff: "Precise and filterable, but less useful as a human story.", keyboard: "Rows expose complete labels on mobile and preserve table semantics on desktop.", states: "Redacted value, export failure, long identifier, timezone.", preview: `<div class="pv-audit"><b>Time</b><b>Actor</b><b>Event</b><span>18:42:09</span><span>b.rivera</span><span>policy.updated</span><span>18:39:51</span><span>system</span><span>review.started</span></div>` },
      { key: "C", title: "Milestone timeline", tradeoff: "Makes lifecycle and blockers obvious, but hides high-volume detail.", keyboard: "Milestones are headings; evidence links sit under the relevant event.", states: "Overdue, skipped, rejected, reopened.", preview: `<div class="pv-timeline"><div class="is-done"><i></i><span><b>Submitted</b><small>Sep 21 / Evidence attached</small></span></div><div class="is-current"><i></i><span><b>Reviewing</b><small>Exception found in policy 7</small></span></div><div><i></i><span><b>Decision</b><small>Not reached</small></span></div></div>` }
    ]
  },
  {
    id: "file-import",
    tier: "Structures",
    title: "File upload and import",
    question: "Is a file being attached, queued, or transformed into product data?",
    context: "Upload is a recurrent product need, but drag-and-drop should not become a decorative default.",
    use: "Use when a local file is the source or attachment for a user task.",
    avoid: "Avoid when a direct service connection or paste flow is more reliable.",
    mobile: "Lead with the platform picker or camera; remove drag-only language.",
    options: [
      { key: "A", title: "Native picker row", tradeoff: "Low ceremony and robust on mobile, but gives little batch visibility.", keyboard: "Visible button labels the native file input.", states: "Wrong type, too large, upload failure, remove.", preview: `<div class="pv-upload-row"><i>CSV</i><span><b>Transactions file</b><small>CSV up to 25 MB</small></span><b>Choose file</b></div>` },
      { key: "B", title: "Batch queue", tradeoff: "Manages multiple files and retry, but is too heavy for one required attachment.", keyboard: "Every queued file exposes named retry and remove controls.", states: "Per-file progress, duplicate, partial failure, cancel.", preview: `<div class="pv-files"><div><i>CSV</i><span><b>september.csv</b><small>Complete / 4.8 MB</small></span><em>Done</em></div><div><i>XLS</i><span><b>archive.xlsx</b><small>Uploading / 61%</small></span><em>Cancel</em></div></div>` },
      { key: "C", title: "Import workflow", tradeoff: "Supports mapping and validation, but creates a full task lifecycle.", keyboard: "Each stage is named; error summary links to the bad row or mapping.", states: "Parse error, unmapped column, warning, rollback.", preview: `<div class="pv-import"><div class="pv-stepper"><span class="is-done">1 Upload</span><span class="is-current">2 Map</span><span>3 Validate</span></div><div><span>Date</span><b>Transaction date</b></div><div><span>Memo</span><b>Description</b></div><div><span>Amount</span><b>Net value</b></div></div>` }
    ]
  },
  {
    id: "triage-workspace",
    tier: "Layouts",
    title: "Triage workspace",
    question: "How should a user move through many records that need decisions?",
    context: "This is a task-specific page composition, not another generic dashboard or card grid.",
    use: "Use when users repeatedly scan, select, and resolve items from a working set.",
    avoid: "Avoid when each record requires a long independent lifecycle.",
    mobile: "Turn panes into explicit list and detail routes while preserving filter, scroll, and selection.",
    options: [
      { key: "A", title: "Queue plus inspector", tradeoff: "Balances scanning and detail, but detail width is constrained.", keyboard: "Arrow through the queue; selection updates a non-modal inspector.", states: "Empty queue, stale selection, locked record, bulk action.", preview: `<div class="pv-page pv-page--two"><header><b>Review queue</b><span>12 need action</span></header><nav><span class="is-active">Unmatched transfer</span><span>Missing owner</span><span>Policy exception</span></nav><main><small>Unmatched transfer</small><b>$4,820.00</b><p>Northwind / Sep 22</p><div class="pv-actions"><span>Dismiss</span><span>Resolve</span></div></main></div>` },
      { key: "B", title: "Dense explorer", tradeoff: "Supports comparison and bulk work, but asks users to open detail separately.", keyboard: "Table selection, sorting, filters, and bulk actions follow one consistent model.", states: "No results, partial data, selected across pages, conflict.", preview: `<div class="pv-page pv-page--table"><header><b>Transactions</b><span>Filter / Sep 2026</span></header><div class="pv-toolbar"><i>All</i><i>Review 12</i><i>Blocked 3</i></div><main class="pv-audit"><b>Date</b><b>Merchant</b><b>Status</b><span>Sep 22</span><span>Northwind</span><span>Review</span><span>Sep 21</span><span>Contoso</span><span>Ready</span></main></div>` },
      { key: "C", title: "Focused decision loop", tradeoff: "Maximizes throughput on one item, but reduces cross-record comparison.", keyboard: "A stable shortcut set accepts, skips, or opens evidence without moving focus unexpectedly.", states: "No next item, undo, blocked decision, session summary.", preview: `<div class="pv-page pv-page--focus"><header><small>Item 4 of 12</small><b>Is this transfer internal?</b></header><main><b>$4,820.00</b><p>Northwind / account ending 1842</p><div class="pv-evidence"><span>Same owner name</span><span>Known destination</span></div></main><footer><span>Skip</span><span>No</span><span>Yes</span></footer></div>` }
    ]
  },
  {
    id: "object-detail",
    tier: "Layouts",
    title: "Object detail workspace",
    question: "Should the page foreground current identity, working evidence, or change history?",
    context: "A dedicated object page should reflect the object's real lifecycle instead of defaulting to tabs and cards.",
    use: "Use when an object has enough identity, evidence, and actions to deserve its own route.",
    avoid: "Avoid when a modest object fits an inspector without losing context.",
    mobile: "Keep identity and the next useful action first; move supporting evidence behind named sections.",
    options: [
      { key: "A", title: "Identity plus sections", tradeoff: "Familiar and linkable, but can hide relationships between sections.", keyboard: "Section navigation uses links and current-location semantics.", states: "Missing section, archived object, restricted action, long title.", preview: `<div class="pv-page pv-page--detail"><header><small>Retention policy</small><b>Transactions / seven years</b><span>Active</span></header><nav><i class="is-active">Overview</i><i>Rules</i><i>History</i></nav><main><b>Current coverage</b><p>4 workspaces / 18,420 archived records</p><div class="pv-properties"><div><span>Owner</span><b>Finance</b></div><div><span>Review</span><b>Dec 12</b></div></div></main></div>` },
      { key: "B", title: "Evidence workspace", tradeoff: "Connects the decision to proof, but needs strong responsive prioritization.", keyboard: "Evidence list and inspector remain separate landmarks with predictable focus.", states: "Partial evidence, stale source, permission, conflicting evidence.", preview: `<div class="pv-page pv-page--evidence"><header><b>Policy review</b><span>1 exception</span></header><main><div class="pv-chart-mini"><i></i><i></i><i></i><i></i></div><b>Coverage dropped after Sep 18</b><p>One source stopped reporting.</p></main><aside><small>Exception</small><b>Trading archive</b><p>Last evidence 5 days ago</p><span>Open source</span></aside></div>` },
      { key: "C", title: "Timeline-led detail", tradeoff: "Explains a process object well, but buries stable configuration.", keyboard: "Current blocker is first; timeline uses headings and ordinary links.", states: "Reopened, rejected, late, missing actor, redaction.", preview: `<div class="pv-page pv-page--timeline"><header><b>Access request #1842</b><span>Waiting for review</span></header><main class="pv-timeline"><div class="is-current"><i></i><span><b>Manager review</b><small>Waiting on Dana / 2h</small></span></div><div class="is-done"><i></i><span><b>Requested</b><small>Brandon / Sep 23</small></span></div><div><i></i><span><b>Provision</b><small>Not started</small></span></div></main></div>` }
    ]
  },
  {
    id: "configuration-workspace",
    tier: "Layouts",
    title: "Setup and configuration workspace",
    question: "Is configuration routine, resumable, or consequential enough to require review?",
    context: "Settings pages often become flat field dumps. The page structure should express dependency and consequence.",
    use: "Use when a product exposes several related settings, setup tasks, or publishable configuration.",
    avoid: "Avoid when a single reversible preference belongs beside the feature it changes.",
    mobile: "Promote one section or task at a time and keep save, dirty, and validation state visible.",
    options: [
      { key: "A", title: "Section navigation", tradeoff: "Efficient for familiar recurring settings, but weak for first-time setup.", keyboard: "Section links and headings preserve route and focus context.", states: "Unsaved section, cross-section error, permission, search.", preview: `<div class="pv-page pv-page--settings"><header><b>Workspace settings</b><span>Saved</span></header><nav><i class="is-active">General</i><i>Members</i><i>Policies</i><i>Integrations</i></nav><main><b>General</b><div class="pv-field">Workspace name<span>Ledger</span></div><div class="pv-field">Timezone<span>America/New_York</span></div></main></div>` },
      { key: "B", title: "Readiness checklist", tradeoff: "Makes resumable setup legible, but is unnecessary after routine adoption.", keyboard: "Checklist items are links with independent status and blockers.", states: "Blocked, optional, delegated, resumed, complete.", preview: `<div class="pv-page pv-page--setup"><header><small>Workspace readiness</small><b>3 of 5 complete</b><div><i class="pv-progress-60"></i></div></header><main class="pv-checklist"><div class="is-done"><i></i><span><b>Connect source</b><small>Complete</small></span></div><div class="is-current"><i></i><span><b>Define policy</b><small>Needs review</small></span></div><div><i></i><span><b>Invite team</b><small>Not started</small></span></div></main></div>` },
      { key: "C", title: "Review and publish", tradeoff: "Makes configuration changes auditable, but adds ceremony to low-risk preferences.", keyboard: "Change list links back to editable sections; publish is the final focused action.", states: "Conflict, approver missing, publish failure, rollback.", preview: `<div class="pv-page pv-page--publish"><header><b>Configuration draft</b><span>4 changes</span></header><main><div><small>Policy</small><b>Retention 3 -> 7 years</b></div><div><small>Scope</small><b>Add Trading Agent</b></div><div class="pv-warning">One change requires owner approval.</div></main><footer><span>Keep editing</span><span>Request approval</span></footer></div>` }
    ]
  }
];
