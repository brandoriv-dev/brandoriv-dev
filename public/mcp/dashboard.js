(() => {
  const NOT_MEASURED = "Not measured";
  const PENDING_MEASUREMENT = "pending re-measurement";

  const state = {
    data: null,
    activeCategory: null,
    activeConnection: null,
    toastTimer: null,
    loginMessage: "",
    bearerToken: null,
    tokenRevealed: false,
    // Groups start closed; selecting a policy opens only its ancestors.
    expandedCategories: new Set(),
  };

  // The Microsoft callback redirects here with ?login=<outcome> when it cannot
  // issue a session. Read it once, then drop it from the URL so a refresh is clean.
  const loginOutcome = new URLSearchParams(window.location.search).get("login");
  const requestedNext = new URLSearchParams(window.location.search).get("next");
  if (requestedNext === "/moss") sessionStorage.setItem("brandoriv-dashboard-next", requestedNext);
  if (loginOutcome) {
    state.loginMessage =
      {
        denied: "That Microsoft account is not allowed here.",
        expired: "The sign-in took too long. Try again.",
        unavailable: "Microsoft sign-in is unavailable right now. Try again, or use the token.",
      }[loginOutcome] ?? "Sign-in failed.";
    window.history.replaceState(null, "", window.location.pathname + window.location.hash);
  }

  const app = document.querySelector("#dashboard-app");
  const authForm = document.querySelector("#auth-form");
  const authError = document.querySelector("#auth-error");
  const tokenInput = document.querySelector("#token-input");
  const signInButton = document.querySelector("#sign-in-button");
  const refreshButton = document.querySelector("#refresh-button");
  const logoutButton = document.querySelector("#logout-button");
  const menuButton = document.querySelector("#menu-button");
  const sidebarScrim = document.querySelector("#sidebar-scrim");
  const copyConfigButton = document.querySelector("#copy-config-button");
  const topbarMore = document.querySelector(".topbar-more");
  const topbarMoreButton = document.querySelector("#topbar-more-button");

  authForm?.addEventListener("submit", signIn);
  refreshButton?.addEventListener("click", () => loadDashboard(true));
  logoutButton?.addEventListener("click", signOut);
  menuButton?.addEventListener("click", () => document.body.classList.add("sidebar-open"));
  sidebarScrim?.addEventListener("click", closeSidebar);
  copyConfigButton?.addEventListener("click", copyActiveConfiguration);
  topbarMoreButton?.addEventListener("click", () => setTopbarMore(!topbarMore.classList.contains("is-open")));
  document.querySelector("#edit-policy")?.addEventListener("click", beginPolicyEdit);
  document.querySelector("#cancel-policy-edit")?.addEventListener("click", endPolicyEdit);
  document.querySelector("#policy-editor")?.addEventListener("submit", savePolicy);
  document.querySelector("#policy-history")?.addEventListener("click", loadPolicyHistory);
  document.querySelector("#reveal-token-button")?.addEventListener("click", toggleTokenReveal);
  document.querySelector("#copy-token-button")?.addEventListener("click", () => {
    if (state.bearerToken) copyText(state.bearerToken, "Token copied");
  });

  document.querySelectorAll("[data-copy-endpoint]").forEach((button) => {
    button.addEventListener("click", () => copyText(state.data?.service.endpoint ?? "https://brandoriv.dev/mcp", "Endpoint copied"));
  });

  document.querySelectorAll("[data-view-target]").forEach((button) => {
    button.addEventListener("click", () => selectView(button.dataset.viewTarget));
  });

  document.addEventListener("click", (event) => {
    if (topbarMore?.classList.contains("is-open") && !topbarMore.contains(event.target)) setTopbarMore(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSidebar();
      setTopbarMore(false, true);
    }
  });

  window.addEventListener("hashchange", () => selectView(viewFromHash(), false));
  selectView(viewFromHash(), false);
  loadDashboard(false);

  async function loadDashboard(showRefreshNotice) {
    refreshButton?.classList.add("is-spinning");
    if (refreshButton) refreshButton.disabled = true;

    try {
      const response = await fetch("/mcp/dashboard/data", {
        credentials: "same-origin",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (response.status === 401) {
        showAuthentication(state.loginMessage);
        state.loginMessage = "";
        return;
      }

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) throw new Error(payload?.error ?? `Dashboard request failed (${response.status})`);

      state.data = payload;
      renderDashboard(payload);
      document.body.dataset.authenticated = "true";
      if (app) app.inert = false;
      app?.setAttribute("aria-busy", "false");
      authError.textContent = "";
      const next = sessionStorage.getItem("brandoriv-dashboard-next");
      if (next === "/moss") {
        sessionStorage.removeItem("brandoriv-dashboard-next");
        window.location.replace(next);
        return;
      }
      if (showRefreshNotice) showToast("Dashboard refreshed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load the dashboard.";
      if (state.data) showToast(message);
      else showAuthentication(message);
    } finally {
      refreshButton?.classList.remove("is-spinning");
      if (refreshButton) refreshButton.disabled = false;
    }
  }

  async function signIn(event) {
    event.preventDefault();
    const token = tokenInput.value;
    if (!token) return;

    signInButton.disabled = true;
    authError.textContent = "";

    try {
      const response = await fetch("/mcp/dashboard/session", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(response.status === 401 ? "That bearer token was not accepted." : payload?.error ?? "Sign-in failed.");
      }

      tokenInput.value = "";
      await loadDashboard(false);
    } catch (error) {
      authError.textContent = error instanceof Error ? error.message : "Sign-in failed.";
      tokenInput.select();
    } finally {
      signInButton.disabled = false;
    }
  }

  async function signOut() {
    logoutButton.disabled = true;
    try {
      await fetch("/mcp/dashboard/session", { method: "DELETE", credentials: "same-origin" });
    } finally {
      state.data = null;
      state.bearerToken = null;
      state.tokenRevealed = false;
      renderToken();
      logoutButton.disabled = false;
      showAuthentication();
      showToast("Session ended");
    }
  }

  function showAuthentication(message = "") {
    document.body.dataset.authenticated = "false";
    if (app) app.inert = true;
    app?.setAttribute("aria-busy", "false");
    authError.textContent = message;
    // The token input now sits inside a collapsed <details>, so focus the primary path.
    window.setTimeout(() => document.querySelector("#microsoft-sign-in")?.focus(), 0);
  }

  function renderDashboard(data) {
    const { service, evaluation } = data;
    const number = new Intl.NumberFormat("en-US");

    setText("service-display-name", service.displayName);
    renderNotices();
    setText("service-endpoint", service.endpoint);
    setText("service-version", `v${service.version}`);
    setText("last-refreshed", `Refreshed ${formatTime(data.generatedAt)}`);
    setText("snapshot-date", `${formatDate(evaluation.evaluatedAt)} evaluation`);
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    setText("overview-title", `${greeting}, Brandon.`);
    setText("overview-date", new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date()));
    setText("context-baseline-label", evaluation.baseline.replace(" frozen baseline", ""));
    setText("answer-baseline-label", evaluation.baseline.replace(" frozen baseline", ""));

    document.querySelectorAll("[data-endpoint]").forEach((element) => {
      element.textContent = service.endpoint;
    });

    const contextTokens = evaluation.serializedResultTokens;
    const answerTokens = evaluation.visibleAnswerTokens;
    const blindJudge = evaluation.blindJudge;

    setText("context-token-change", isMeasured(contextTokens) ? formatPercent(contextTokens.changePercent) : NOT_MEASURED);
    setText(
      "context-token-values",
      isMeasured(contextTokens)
        ? `${number.format(contextTokens.baseline)} to ${number.format(contextTokens.candidate)}`
        : PENDING_MEASUREMENT
    );
    setText("answer-token-change", isMeasured(answerTokens) ? formatPercent(answerTokens.changePercent) : NOT_MEASURED);
    setText(
      "answer-token-values",
      isMeasured(answerTokens)
        ? `${number.format(answerTokens.baseline)} to ${number.format(answerTokens.candidate)}`
        : PENDING_MEASUREMENT
    );
    setText("coverage-value", `${evaluation.policyPatternChecks.candidate}/${evaluation.policyPatternChecks.possible}`);
    setText("coverage-detail", `${evaluation.policyPatternChecks.lostBaselineMatches} frozen-baseline phrase matches absent`);
    setText("blind-quality-value", hasJudgeScore(blindJudge) ? `${blindJudge.candidate}/${blindJudge.possible}` : NOT_MEASURED);
    setText("blind-quality-detail", hasJudgeScore(blindJudge) ? "recorded one-run sample" : PENDING_MEASUREMENT);

    renderComparison("context", evaluation.serializedResultTokens);
    renderComparison("answer", evaluation.visibleAnswerTokens);
    setText("guidance-text-change", `${formatPercent(evaluation.guidanceText.changePercent)} guidance text`);
    setText(
      "guidance-text-detail",
      `${evaluation.guidanceText.largerCases}/${evaluation.guidanceText.caseCount} cases grew; normalized result bytes ${formatPercent(evaluation.normalizedSerializedResponses.changePercent)}.`
    );

    const strictJudge = evaluation.strictJudge;
    const judged = hasJudgeScore(blindJudge) || hasJudgeScore(strictJudge);

    setText("blind-judge-score", hasJudgeScore(blindJudge) ? `${blindJudge.candidate}/${blindJudge.possible}` : NOT_MEASURED);
    setText(
      "strict-judge-score",
      hasJudgeScore(strictJudge) ? `${strictJudge.candidateAccepted}/${strictJudge.possible} accepted` : NOT_MEASURED
    );
    setText(
      "strict-baseline-score",
      hasJudgeScore(strictJudge) ? `baseline ${strictJudge.baselineAccepted}/${strictJudge.possible}` : PENDING_MEASUREMENT
    );
    setText("candidate-wins", judged ? `${strictJudge.candidateWins} wins` : NOT_MEASURED);
    setText(
      "candidate-outcomes",
      judged ? `${strictJudge.candidateLosses} losses / ${strictJudge.ties} ties` : PENDING_MEASUREMENT
    );
    setText("hard-defects", judged ? String(blindJudge.hardDefects) : NOT_MEASURED);
    setText("quality-caveat", evaluation.provenance.modelAnswerSample.label);

    setText("policy-case-count", String(evaluation.corpus.policyCases));
    setText("routing-check-count", String(evaluation.corpus.routingChecks));
    setText("answer-pair-count", String(evaluation.corpus.answerPairs));
    setText("protocol-count", String(service.protocols.length));
    setText("evaluation-note", evaluation.note);

    renderTools(data.tools);
    renderCategories(data.categories);
    renderConnections(data.connections);
    renderProtocols(service.protocols);
    setText("transport-value", service.transport);
    setText("auth-value", service.authentication);

    state.bearerToken = service.bearerToken ?? null;
    const editButton = document.querySelector("#edit-policy");
    if (editButton) {
      editButton.disabled = !data.policyStorage.durable;
      editButton.title = data.policyStorage.durable ? "Create a new active version" : "Durable policy storage is not configured";
    }
    renderToken();
  }

  // The token is masked by default so a glance at the Connect view over someone's
  // shoulder does not hand it over; Reveal is deliberate, Copy never needs Reveal.
  function renderToken() {
    const field = document.querySelector("#bearer-token");
    const reveal = document.querySelector("#reveal-token-button");
    if (!field) return;
    if (!state.bearerToken) {
      field.textContent = "not available";
      field.dataset.revealed = "false";
      return;
    }
    field.textContent = state.tokenRevealed ? state.bearerToken : "•".repeat(24);
    field.dataset.revealed = String(state.tokenRevealed);
    if (reveal) {
      reveal.setAttribute("aria-pressed", String(state.tokenRevealed));
      const label = reveal.querySelector("span");
      if (label) label.textContent = state.tokenRevealed ? "Hide" : "Reveal";
    }
  }

  function toggleTokenReveal() {
    state.tokenRevealed = !state.tokenRevealed;
    renderToken();
  }

  // A re-baselined snapshot zeroes the metrics it did not re-measure, rather than
  // carrying forward figures from a superseded comparison. Render those as absent
  // instead of as a real zero.
  function isMeasured(metric) {
    return Boolean(metric) && (metric.baseline !== 0 || metric.candidate !== 0);
  }

  function hasJudgeScore(judge) {
    return Boolean(judge) && judge.possible > 0;
  }

  function renderComparison(prefix, metric) {
    const number = new Intl.NumberFormat("en-US");

    if (!isMeasured(metric)) {
      setText(`${prefix}-comparison-change`, NOT_MEASURED);
      setText(`${prefix}-baseline-value`, "—");
      setText(`${prefix}-candidate-value`, "—");
      for (const id of [`${prefix}-baseline-bar`, `${prefix}-candidate-bar`]) {
        const bar = document.querySelector(`#${id}`);
        if (!bar) continue;
        bar.max = 1;
        bar.value = 0;
        bar.textContent = "—";
        bar.setAttribute("aria-valuetext", "not measured");
      }
      return;
    }

    const max = Math.max(metric.baseline, metric.candidate, 1);
    const baselineBar = document.querySelector(`#${prefix}-baseline-bar`);
    const candidateBar = document.querySelector(`#${prefix}-candidate-bar`);

    if (baselineBar) {
      baselineBar.max = max;
      baselineBar.value = metric.baseline;
      baselineBar.textContent = number.format(metric.baseline);
      baselineBar.setAttribute("aria-valuetext", `${number.format(metric.baseline)} tokens`);
    }
    if (candidateBar) {
      candidateBar.max = max;
      candidateBar.value = metric.candidate;
      candidateBar.textContent = number.format(metric.candidate);
      candidateBar.setAttribute("aria-valuetext", `${number.format(metric.candidate)} tokens`);
    }

    setText(`${prefix}-comparison-change`, formatPercent(metric.changePercent));
    setText(`${prefix}-baseline-value`, number.format(metric.baseline));
    setText(`${prefix}-candidate-value`, number.format(metric.candidate));
  }

  function renderTools(tools) {
    const container = document.querySelector("#tool-list");
    if (!container) return;
    container.replaceChildren();

    tools.forEach((tool) => {
      const item = document.createElement("div");
      const details = document.createElement("div");
      const name = document.createElement("code");
      const title = document.createElement("span");
      const badge = document.createElement("span");

      item.className = "tool-item";
      name.textContent = tool.name;
      title.textContent = tool.title;
      badge.className = "read-only-badge";
      badge.textContent = "Read only";
      details.append(name, title);
      item.append(details, badge);
      container.append(item);
    });

    setText("tool-count", String(tools.length));
  }

  function renderCategories(categories) {
    const container = document.querySelector("#category-nav");
    if (!container) return;
    container.replaceChildren();

    const byParent = new Map();
    categories.forEach((category) => {
      const key = category.parentId ?? "root";
      byParent.set(key, [...(byParent.get(key) ?? []), category]);
    });
    const appendBranch = (parentId = "root", depth = 0, parent = container) => (byParent.get(parentId) ?? []).forEach((category) => {
      const row = document.createElement("div");
      const button = document.createElement("button");
      const disclosure = document.createElement("button");
      const marker = document.createElement("i");
      const copy = document.createElement("span");
      const title = document.createElement("span");
      const description = document.createElement("small");
      const position = document.createElement("code");
      const branch = document.createElement("div");
      const isGroup = category.kind === "group";
      const collapsed = isGroup && !state.expandedCategories.has(category.id);

      row.className = "category-row";
      row.style.setProperty("--tree-depth", depth);
      button.type = "button";
      button.className = "category-button";
      button.dataset.categoryId = category.id;
      button.setAttribute("aria-pressed", "false");
      title.textContent = category.title;
      title.className = "category-title";
      copy.className = "category-copy";
      description.className = "category-description";
      description.textContent = category.description ?? "";
      position.textContent = isGroup ? "" : `v${category.version}`;
      button.classList.toggle("is-group", isGroup);
      copy.append(title);
      if (category.description) copy.append(description);
      button.append(marker, copy, position);
      disclosure.type = "button";
      disclosure.className = "category-disclosure";
      disclosure.hidden = !isGroup;
      disclosure.setAttribute("aria-expanded", String(!collapsed));
      disclosure.setAttribute("aria-label", `${collapsed ? "Expand" : "Collapse"} ${category.title}`);
      disclosure.innerHTML = '<span aria-hidden="true"></span>';
      row.append(button, disclosure);
      branch.className = "category-branch";
      branch.dataset.parentCategoryId = category.id;
      branch.setAttribute("role", "group");
      branch.hidden = collapsed;
      button.addEventListener("click", () => {
        selectCategory(category.id);
      });
      disclosure.addEventListener("click", () => {
        const willCollapse = disclosure.getAttribute("aria-expanded") === "true";
        disclosure.setAttribute("aria-expanded", String(!willCollapse));
        disclosure.setAttribute("aria-label", `${willCollapse ? "Expand" : "Collapse"} ${category.title}`);
        branch.hidden = willCollapse;
        if (!willCollapse) {
          branch.classList.remove("is-revealing");
          requestAnimationFrame(() => branch.classList.add("is-revealing"));
        }
        willCollapse ? state.expandedCategories.delete(category.id) : state.expandedCategories.add(category.id);
      });
      parent.append(row);
      appendBranch(category.id, depth + 1, branch);
      if (branch.childElementCount > 0) parent.append(branch);
    });
    appendBranch();

    setText("category-count", String(categories.length));
    selectCategory(state.activeCategory && categories.some(({ id }) => id === state.activeCategory)
      ? state.activeCategory
      : categories.find(({ parentId }) => parentId === null)?.id);
  }

  function setTopbarMore(open, restoreFocus = false) {
    if (!topbarMore || !topbarMoreButton) return;
    topbarMore.classList.toggle("is-open", open);
    topbarMoreButton.setAttribute("aria-expanded", String(open));
    if (restoreFocus && !open && topbarMore.contains(document.activeElement)) topbarMoreButton.focus();
  }

  function selectCategory(categoryId) {
    if (!categoryId || !state.data) return;
    const category = state.data.categories.find(({ id }) => id === categoryId);
    if (!category) return;
    state.activeCategory = categoryId;
    revealAncestors(category);

    document.querySelectorAll("[data-category-id]").forEach((button) => {
      const active = button.dataset.categoryId === categoryId;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    setText("policy-title", category.title);
    setText("policy-id", `personal://${category.id}`);
    setText("policy-version", `v${category.version}`);
    setText("policy-activation", category.activation);
    document.querySelector("#edit-policy").hidden = category.kind === "group";
    document.querySelector("#policy-history").hidden = category.kind === "group";
    renderPolicy(category.kind === "group" ? category.description ?? "" : category.content);
    const policyDocument = document.querySelector(".policy-document");
    policyDocument?.classList.remove("is-updating");
    requestAnimationFrame(() => policyDocument?.classList.add("is-updating"));
    endPolicyEdit();
    document.querySelector("#policy-history-list").hidden = true;
  }

  // Opening a policy from a link or notice must not leave it hidden inside a closed group.
  function revealAncestors(category) {
    let parentId = category.parentId;
    while (parentId) {
      state.expandedCategories.add(parentId);
      const branch = document.querySelector(`[data-parent-category-id="${CSS.escape(parentId)}"]`);
      const disclosure = document.querySelector(`[data-category-id="${CSS.escape(parentId)}"]`)?.parentElement?.querySelector(".category-disclosure");
      if (branch) branch.hidden = false;
      if (disclosure) { disclosure.setAttribute("aria-expanded", "true"); disclosure.setAttribute("aria-label", `Collapse ${parentId}`); }
      parentId = state.data.categories.find(({ id }) => id === parentId)?.parentId ?? null;
    }
  }

  const dismissedKey = "mcp-dismissed-notices";
  const readDismissed = () => { try { return JSON.parse(localStorage.getItem(dismissedKey) || "{}"); } catch { return {}; } };
  const writeDismissed = (value) => { try { localStorage.setItem(dismissedKey, JSON.stringify(value)); } catch { /* Dismissal is a convenience only. */ } };
  const iconMarkup = (name) => document.querySelector(`template[data-icon="${name}"]`)?.innerHTML ?? "";

  function buildNotices(data) {
    const items = [];
    if (!data.policyStorage?.durable) items.push({ id: "storage", tone: "warning", title: "Policy editing is off", detail: "The MCP_POLICIES KV binding is not configured, so policies are read-only here.", label: "Open policies", view: "policies" });
    if (!hasJudgeScore(data.evaluation?.blindJudge)) items.push({ id: "quality", tone: "warning", title: "Answer-quality study not re-run", detail: `Run bun run mcp:policy-eval against the ${data.evaluation?.baseline ?? "current baseline"}.`, label: "Open overview", view: "overview" });
    for (const policy of data.categories ?? []) {
      if (policy.version > 1) items.push({ id: `policy-${policy.id}-v${policy.version}`, tone: "update", title: `${policy.title} updated to v${policy.version}`, detail: policy.changeNote || "New active version.", label: "Open policy", view: "policies", categoryId: policy.id });
    }
    const dismissed = readDismissed();
    return items.filter((item) => dismissed[item.id] !== `${item.title}|${item.detail}`);
  }

  function renderNotices() {
    const panel = document.querySelector("#notice-panel");
    const count = document.querySelector("#bell-count");
    if (!panel || !count || !state.data) return;
    const notices = buildNotices(state.data);
    count.textContent = String(notices.length);
    count.hidden = notices.length === 0;
    count.classList.toggle("urgent", notices.some((item) => item.tone === "danger"));
    panel.replaceChildren();
    const header = document.createElement("div");
    header.className = "notice-panel-header";
    header.innerHTML = `<h2>Notifications</h2>${notices.length ? '<button type="button" class="notice-dismiss-all">Dismiss all</button>' : ""}`;
    header.querySelector("button")?.classList.add("go");
    panel.append(header);
    if (!notices.length) {
      const clear = document.createElement("div");
      clear.className = "notice-clear";
      clear.innerHTML = '<img src="/mcp/icon-192.png" alt="" width="40" height="40">Nothing needs you right now.';
      panel.append(clear);
    }
    notices.forEach((item) => {
      const article = document.createElement("article");
      article.className = `notice-item ${item.tone}`;
      article.innerHTML = `<moss-icon class="icon notice-symbol" name="${item.tone === "update" ? "message" : "warning"}"></moss-icon><div><h3></h3><p></p><div class="notice-actions"><button type="button" class="go"></button><button type="button" class="dismiss">Dismiss</button></div></div>`;
      article.querySelector("h3").textContent = item.title;
      article.querySelector("p").textContent = item.detail;
      const go = article.querySelector(".go");
      go.innerHTML = `${item.label} <moss-icon class="icon" name="forward"></moss-icon>`;
      go.addEventListener("click", () => {
        selectView(item.view);
        if (item.categoryId) selectCategory(item.categoryId);
        toggleNotices(false);
      });
      article.querySelector(".dismiss").addEventListener("click", () => {
        const dismissed = readDismissed();
        dismissed[item.id] = `${item.title}|${item.detail}`;
        writeDismissed(dismissed);
        renderNotices();
      });
      panel.append(article);
    });
    header.querySelector(".notice-dismiss-all")?.addEventListener("click", () => {
      const dismissed = readDismissed();
      notices.forEach((item) => { dismissed[item.id] = `${item.title}|${item.detail}`; });
      writeDismissed(dismissed);
      renderNotices();
    });
    document.querySelector("#notice-bell")?.setAttribute("aria-label", notices.length ? `Notifications, ${notices.length} waiting` : "Notifications");
  }

  function toggleNotices(open) {
    const panel = document.querySelector("#notice-panel");
    const bell = document.querySelector("#notice-bell");
    if (!panel || !bell) return;
    const next = open ?? panel.hidden;
    panel.hidden = !next;
    bell.setAttribute("aria-expanded", String(next));
  }

  document.querySelector("#notice-bell")?.addEventListener("click", () => toggleNotices());
  document.addEventListener("click", (event) => {
    if (!event.target.closest("#notice-bell") && !event.target.closest("#notice-panel")) toggleNotices(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !document.querySelector("#notice-panel")?.hidden) { toggleNotices(false); document.querySelector("#notice-bell")?.focus(); }
  });

  function beginPolicyEdit() {
    const policy = state.data?.categories.find(({ id }) => id === state.activeCategory);
    if (!policy) return;
    document.querySelector("#policy-editor-content").value = policy.content;
    document.querySelector("#policy-change-note").value = "";
    document.querySelector("#policy-content").hidden = true;
    document.querySelector("#policy-editor").hidden = false;
    document.querySelector("#policy-editor-content").focus();
  }

  function endPolicyEdit() {
    document.querySelector("#policy-content").hidden = false;
    document.querySelector("#policy-editor").hidden = true;
  }

  async function savePolicy(event) {
    event.preventDefault();
    const response = await fetch(`/mcp/dashboard/policies/${encodeURIComponent(state.activeCategory)}`, {
      method: "PUT", credentials: "same-origin", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: document.querySelector("#policy-editor-content").value, changeNote: document.querySelector("#policy-change-note").value }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) return showToast(payload?.error ?? "Policy could not be saved");
    showToast(`Saved ${payload.policy.id} v${payload.policy.version}`);
    await loadDashboard(false);
  }

  async function loadPolicyHistory() {
    const response = await fetch(`/mcp/dashboard/policies/${encodeURIComponent(state.activeCategory)}`, { credentials: "same-origin" });
    const payload = await response.json();
    const container = document.querySelector("#policy-history-list");
    container.replaceChildren(...payload.versions.slice().reverse().map((version) => {
      const row = document.createElement("div");
      row.textContent = `v${version.version} · ${version.changeNote} · ${new Date(version.updatedAt).toLocaleString()}`;
      return row;
    }));
    container.hidden = false;
  }

  function renderPolicy(markdown) {
    const container = document.querySelector("#policy-content");
    if (!container) return;
    container.replaceChildren();
    let list = null;

    for (const rawLine of markdown.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line) {
        list = null;
        continue;
      }
      if (line === "---") {
        container.append(document.createElement("hr"));
        list = null;
        continue;
      }
      if (line.startsWith("# ")) continue;
      if (line.startsWith("## ") || line.startsWith("### ")) {
        const level = line.startsWith("### ") ? 3 : 2;
        const heading = document.createElement(`h${level}`);
        appendInlineText(heading, line.slice(level + 1));
        container.append(heading);
        list = null;
        continue;
      }

      const ordered = line.match(/^\d+\.\s+(.+)$/);
      const unordered = line.match(/^-\s+(.+)$/);
      if (ordered || unordered) {
        const listType = ordered ? "OL" : "UL";
        if (!list || list.tagName !== listType) {
          list = document.createElement(listType.toLowerCase());
          container.append(list);
        }
        const item = document.createElement("li");
        appendInlineText(item, (ordered ?? unordered)[1]);
        list.append(item);
        continue;
      }

      const paragraph = document.createElement("p");
      appendInlineText(paragraph, line);
      container.append(paragraph);
      list = null;
    }
  }

  function appendInlineText(parent, text) {
    const tokenPattern = /(`[^`]+`|\*\*[^*]+\*\*)/g;
    let cursor = 0;

    for (const match of text.matchAll(tokenPattern)) {
      if (match.index > cursor) parent.append(document.createTextNode(text.slice(cursor, match.index)));
      const token = match[0];
      const element = document.createElement(token.startsWith("`") ? "code" : "strong");
      element.textContent = token.startsWith("`") ? token.slice(1, -1) : token.slice(2, -2);
      parent.append(element);
      cursor = match.index + token.length;
    }

    if (cursor < text.length) parent.append(document.createTextNode(text.slice(cursor)));
  }

  function renderConnections(connections) {
    const container = document.querySelector("#client-tabs");
    if (!container) return;
    container.replaceChildren();

    connections.forEach((connection) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "client-tab";
      button.role = "tab";
      button.dataset.connectionId = connection.id;
      button.textContent = connection.label;
      button.addEventListener("click", () => selectConnection(connection.id));
      container.append(button);
    });

    selectConnection(state.activeConnection && connections.some(({ id }) => id === state.activeConnection)
      ? state.activeConnection
      : connections[0]?.id);
  }

  function selectConnection(connectionId) {
    if (!connectionId || !state.data) return;
    const connection = state.data.connections.find(({ id }) => id === connectionId);
    if (!connection) return;
    state.activeConnection = connectionId;

    document.querySelectorAll("[data-connection-id]").forEach((button) => {
      const active = button.dataset.connectionId === connectionId;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    });

    setText("connection-filename", connection.filename);
    setText("connection-code", connection.code);
    const source = document.querySelector("#connection-source");
    if (source) source.href = connection.source;
  }

  function renderProtocols(protocols) {
    const container = document.querySelector("#protocol-list");
    if (!container) return;
    container.replaceChildren();

    protocols.forEach((protocol) => {
      const item = document.createElement("div");
      const version = document.createElement("code");
      const status = document.createElement("span");
      item.className = "protocol-item";
      version.textContent = protocol;
      status.textContent = "Supported";
      item.append(version, status);
      container.append(item);
    });
  }

  function selectView(view, updateHash = true) {
    const validView = ["overview", "policies", "connect"].includes(view) ? view : "overview";
    document.querySelectorAll("[data-view]").forEach((panel) => {
      const active = panel.dataset.view === validView;
      panel.classList.toggle("is-active", active);
      panel.hidden = !active;
    });
    document.querySelectorAll("[data-view-target]").forEach((button) => {
      const active = button.dataset.viewTarget === validView;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });

    if (updateHash && window.location.hash !== `#${validView}`) history.replaceState(null, "", `#${validView}`);
    closeSidebar();
  }

  function viewFromHash() {
    return window.location.hash.slice(1) || "overview";
  }

  function closeSidebar() {
    document.body.classList.remove("sidebar-open");
  }

  function copyActiveConfiguration() {
    const connection = state.data?.connections.find(({ id }) => id === state.activeConnection);
    if (connection) copyText(connection.code, `${connection.label} configuration copied`);
  }

  async function copyText(value, successMessage) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(value);
    } catch {
      showToast("Copy failed");
      return;
    }
    showToast(successMessage);
  }

  function showToast(message) {
    if (customElements.get("moss-toast-stack") && document.querySelector("moss-toast-stack")) {
      window.dispatchEvent(new CustomEvent("moss-toast", { detail: { message, duration: 2600 } }));
      return;
    }
    const toast = document.querySelector("#toast");
    if (!toast) return;
    window.clearTimeout(state.toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    state.toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function formatPercent(value) {
    return `${value > 0 ? "+" : ""}${value}%`;
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${value}T00:00:00Z`));
  }

  function formatTime(value) {
    return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
  }
})();
