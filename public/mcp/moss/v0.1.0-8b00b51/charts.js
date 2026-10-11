import { getChartExample, buildChartOption, prepareChartModel } from "./chart-recipes.js";

let enginePromise;
let engineAttempts = 0;
let chartId = 0;
const loadEngine = () => {
  if (!enginePromise) {
    const attempt = engineAttempts++;
    // Browsers cache failed module fetches. An explicit retry needs a fresh local URL.
    const pending = attempt === 0 ? import("./vendor/echarts.esm.min.js") :
      import(`./vendor/echarts.esm.min.js?retry=${attempt}`);
    enginePromise = pending.catch((error) => {
      enginePromise = undefined;
      throw error;
    });
  }
  return enginePromise;
};
const exactValue = (value) => {
  if (value === undefined) return "Missing";
  if (value === null) return "null";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};
const element = (document, tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

/**
 * Optional SVG renderer. Hosts load charts.css alongside their Moss stylesheet.
 * config/model replace the recipe; data replaces rows. Missing values remain gaps.
 * Native range/series/slice controls emit { index, key, value } with the control
 * name as key; row/geometry selections use the series key and normalized value.
 * Chart data discloses exact source values. Arrow/Home/End inspection retains focus.
 * Loading, empty, partial, invalid, disabled and engine-failure states are explicit.
 */
export class MossChart extends (globalThis.HTMLElement ?? class {}) {
  static observedAttributes = ["preset", "loading", "disabled", "error", "summary"];

  constructor() {
    super();
    this._needsModel = true;
    this._version = 0;
    this._selectedIndex = 0;
    this._onChange = (event) => this._changeSelection(event);
    this._onKeyDown = (event) => this._navigateData(event);
    this._onClick = (event) => {
      if (event.target.closest?.("[data-chart-retry]") === this._retry) {
        if (this.disabled) return;
        this._renderError = undefined;
        this._schedule();
        return;
      }
      const button = event.target.closest?.("[data-chart-row]");
      if (button && this._table.contains(button) && !this.disabled) this._selectRow(Number(button.dataset.chartRow));
    };
    this._onEnvironment = () => this._schedule();
  }

  connectedCallback() {
    if (this._connected) return;
    this._connected = true;
    this._buildShell();
    // Property assignments made before custom-element registration must survive upgrade.
    for (const key of ["config", "model", "data", "loading", "disabled", "error", "summary"]) {
      if (Object.hasOwn(this, key)) {
        const value = this[key];
        delete this[key];
        this[key] = value;
      }
    }
    this.addEventListener("change", this._onChange);
    this.addEventListener("keydown", this._onKeyDown);
    this.addEventListener("click", this._onClick);
    const view = this.ownerDocument.defaultView;
    this._visible = !view.IntersectionObserver;
    if (view.IntersectionObserver) {
      this._visibilityObserver = new view.IntersectionObserver(([entry]) => {
        this._visible = entry.isIntersecting;
        if (this._visible) this._schedule();
      }, { rootMargin: "240px" });
      this._visibilityObserver.observe(this);
    }
    view.addEventListener("resize", this._onEnvironment);
    this._reducedMotion = view.matchMedia?.("(prefers-reduced-motion: reduce)");
    this._reducedMotion?.addEventListener("change", this._onEnvironment);
    this.ownerDocument.fonts?.addEventListener("loadingdone", this._onEnvironment);
    if (view.ResizeObserver) {
      this._resizeObserver = new view.ResizeObserver(() => {
        const { width, height } = this._viewport.getBoundingClientRect();
        if (width === this._width && height === this._height) return;
        this._width = width;
        this._height = height;
        this._schedule();
      });
      this._resizeObserver.observe(this._viewport);
    }
    this._themeObserver = new view.MutationObserver(this._onEnvironment);
    // Observe only ancestor attributes, never the engine's SVG or our state DOM.
    for (let ancestor = this; ancestor; ancestor = ancestor.parentElement || ancestor.getRootNode().host) {
      this._themeObserver.observe(ancestor, { attributes: true, attributeFilter: [
        "style", "class", "mode", "density", "data-moss-theme", "data-moss-mode",
        "data-moss-density", "data-moss-theme-name", "data-moss-style"
      ] });
    }
    this._schedule();
  }

  disconnectedCallback() {
    this._connected = false;
    this._version++;
    const view = this.ownerDocument.defaultView;
    view.cancelAnimationFrame(this._frame);
    this._frame = undefined;
    this._resizeObserver?.disconnect();
    this._visibilityObserver?.disconnect();
    this._themeObserver?.disconnect();
    this._resizeObserver = this._themeObserver = undefined;
    this._reducedMotion?.removeEventListener("change", this._onEnvironment);
    this.ownerDocument.fonts?.removeEventListener("loadingdone", this._onEnvironment);
    view.removeEventListener("resize", this._onEnvironment);
    this.removeEventListener("change", this._onChange);
    this.removeEventListener("keydown", this._onKeyDown);
    this.removeEventListener("click", this._onClick);
    this._disposeEngine();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (name === "preset") {
      this._config = this._data = this._selection = undefined;
      this._selectedIndex = 0;
      this._needsModel = true;
      this._renderError = undefined;
    }
    this._schedule();
  }

  get config() { return this._config ?? getChartExample(this.getAttribute("preset")); }
  set config(value) {
    this._config = value;
    this._data = this._selection = undefined;
    this._selectedIndex = 0;
    this._needsModel = true;
    this._renderError = undefined;
    this._schedule();
  }
  get model() { return this.config; }
  set model(value) { this.config = value; }
  get data() { return this._data === undefined ? this.config?.data : this._data; }
  set data(value) {
    this._data = value;
    this._needsModel = true;
    this._renderError = undefined;
    this._schedule();
  }
  get loading() { return this.hasAttribute("loading"); }
  set loading(value) { this.toggleAttribute("loading", Boolean(value)); }
  get disabled() { return this.hasAttribute("disabled"); }
  set disabled(value) { this.toggleAttribute("disabled", Boolean(value)); }
  get error() { return this.getAttribute("error"); }
  set error(value) {
    if (value == null || value === false) this.removeAttribute("error");
    else this.setAttribute("error", String(value));
  }
  get summary() { return this.getAttribute("summary") ?? this._model?.summary ?? ""; }
  set summary(value) {
    if (value == null) this.removeAttribute("summary");
    else this.setAttribute("summary", String(value));
  }

  _buildShell() {
    if (this._viewport) return;
    const document = this.ownerDocument;
    const id = `moss-chart-${++chartId}`;
    this._title = element(document, "p", "moss-chart-runtime__title");
    this._title.id = `${id}-title`;
    this._summary = element(document, "p", "moss-chart-runtime__summary");
    this._summary.id = `${id}-summary`;
    this._controls = element(document, "div", "moss-chart-runtime__controls");
    this._status = element(document, "p", "moss-chart-runtime__status");
    this._status.id = `${id}-status`;
    this._status.setAttribute("role", "status");
    this._retry = element(document, "button", "moss-chart-runtime__retry");
    this._retry.type = "button";
    this._retry.dataset.chartRetry = "";
    const icon = element(document, "moss-icon");
    icon.setAttribute("name", "refresh");
    this._retry.append(icon, document.createTextNode("Retry chart"));
    this._retry.hidden = true;
    this._viewport = element(document, "div", "moss-chart-runtime__viewport");
    this._viewport.setAttribute("role", "group");
    this._viewport.setAttribute("aria-roledescription", "chart");
    this._viewport.setAttribute("aria-labelledby", this._title.id);
    this._instructions = element(document, "p", "moss-chart-runtime__sr-only",
      "Use the arrow keys, Home, and End to inspect data. Exact values are available in Chart data.");
    this._instructions.id = `${id}-instructions`;
    this._selectedText = element(document, "p", "moss-chart-runtime__selection");
    this._selectedText.id = `${id}-selection`;
    this._selectedText.setAttribute("aria-live", "polite");
    this._selectedText.setAttribute("aria-atomic", "true");
    this._viewport.setAttribute("aria-describedby", `${this._summary.id} ${this._status.id} ${this._selectedText.id} ${this._instructions.id}`);
    this._details = element(document, "details", "moss-chart-runtime__data");
    const disclosure = element(document, "summary", "", "Chart data");
    this._tableScroll = element(document, "div", "moss-chart-runtime__table-scroll");
    this._tableScroll.tabIndex = 0;
    this._tableScroll.setAttribute("role", "region");
    this._tableScroll.setAttribute("aria-label", "Exact chart data");
    this._table = element(document, "table", "moss-chart-runtime__table");
    this._tableScroll.append(this._table);
    this._details.append(disclosure, this._tableScroll);
    this.replaceChildren(this._title, this._summary, this._controls, this._status, this._retry,
      this._viewport, this._instructions, this._selectedText, this._details);
  }

  _schedule() {
    this._version++;
    if (!this._connected || this._frame !== undefined) return;
    this._frame = this.ownerDocument.defaultView.requestAnimationFrame(() => {
      this._frame = undefined;
      void this._render();
    });
  }

  _prepareModel() {
    this._needsModel = false;
    this._model = undefined;
    this._modelError = undefined;
    this._message = "";
    this._select = undefined;
    this._rowButtons = [];
    this._sourceRows = [];
    try {
      const source = this.config;
      if (!source) {
        if (this.hasAttribute("preset")) throw new TypeError(`Unknown chart preset: ${this.getAttribute("preset")}`);
        this._state = "empty";
        this._message = "No chart data.";
        this._controls.replaceChildren();
        this._table.replaceChildren();
        return;
      }
      const input = this._data === undefined ? source : { ...source, data: this._data };
      const prepared = prepareChartModel(input);
      this._model = prepared.model;
      this._sourceRows = input.data.map((row) => ({ ...row }));
      this._state = prepared.empty ? "empty" : prepared.partial ? "partial" : "ready";
      this._message = prepared.empty ? "No numeric chart data." : prepared.partial ? "Some values are missing or invalid. Gaps are preserved; exact source values are in Chart data." : "";
      const interactive = this._model.config?.interactive;
      if (interactive === "range" && ![30, 60, 90].includes(this._selection)) this._selection = 90;
      if (interactive === "series" && !this._model.series.some((series) => series.key === this._selection)) this._selection = this._model.series[0]?.key;
      if (interactive === "slice" && !Number.isInteger(this._selection)) this._selection = 0;
      if (interactive === "slice") this._selection = Math.max(0, Math.min(this._selection, this._model.data.length - 1));
      this._buildControls();
      this._buildTable();
    } catch (error) {
      this._modelError = error instanceof Error ? error.message : "Invalid chart configuration.";
      this._state = "error";
      this._controls.replaceChildren();
      this._table.replaceChildren();
    }
  }

  _rows() {
    const rows = this._model?.data ?? [];
    return this._model?.config?.interactive === "range" ? rows.slice(-this._selection) : rows;
  }

  _exactRows() {
    const rows = this._sourceRows ?? [];
    return this._model?.config?.interactive === "range" ? rows.slice(-this._selection) : rows;
  }

  _buildControls() {
    const interactive = this._model.config?.interactive;
    this._controls.replaceChildren();
    this._select = undefined;
    if (!["range", "series", "slice"].includes(interactive)) return;
    const document = this.ownerDocument;
    const label = element(document, "label", "moss-chart-runtime__control");
    label.append(element(document, "span", "", { range: "Range", series: "Series", slice: "Slice" }[interactive]));
    this._select = element(document, "select");
    this._select.dataset.chartControl = interactive;
    const choices = interactive === "range" ? [30, 60, 90].map((value) => [value, `Last ${value} days`]) :
      interactive === "series" ? this._model.series.map((series) => [series.key, series.label || series.key]) :
        this._model.data.map((row, index) => [index, exactValue(row[this._model.xKey])]);
    for (const [value, text] of choices) {
      const option = element(document, "option", "", text);
      option.value = String(value);
      this._select.append(option);
    }
    this._select.value = String(this._selection);
    label.append(this._select);
    this._controls.append(label);
  }

  _buildTable() {
    const document = this.ownerDocument;
    const rows = this._rows();
    this._selectedIndex = Math.max(0, Math.min(this._selectedIndex, rows.length - 1));
    if (this._model.config?.interactive === "slice") this._selectedIndex = this._selection;
    const columns = [this._model.xKey, ...this._model.series.map((series) => series.key)];
    const caption = element(document, "caption", "", this._model.title || "Chart data");
    const head = element(document, "thead");
    const headings = element(document, "tr");
    for (const key of columns) {
      const label = this._model.series.find((series) => series.key === key)?.label || key;
      const cell = element(document, "th", "", label);
      cell.scope = "col";
      headings.append(cell);
    }
    head.append(headings);
    const body = element(document, "tbody");
    this._rowButtons = [];
    rows.forEach((row, index) => {
      const tr = element(document, "tr");
      const heading = element(document, "th");
      heading.scope = "row";
      const source = this._exactRows()[index];
      const button = element(document, "button", "moss-chart-runtime__row", exactValue(source[this._model.xKey]));
      button.type = "button";
      button.dataset.chartRow = String(index);
      button.setAttribute("aria-label", this._rowDescription(index));
      this._rowButtons.push(button);
      heading.append(button);
      tr.append(heading);
      for (const series of this._model.series) tr.append(element(document, "td", "", exactValue(source[series.key])));
      body.append(tr);
    });
    this._table.replaceChildren(caption, head, body);
  }

  _rowDescription(index) {
    const row = this._exactRows()[index];
    if (!row) return "";
    return [exactValue(row[this._model.xKey]), ...this._model.series.map((series) =>
      `${series.label || series.key}: ${exactValue(row[series.key])}`)].join("; ");
  }

  _syncSelection() {
    this._rowButtons?.forEach((button, index) => {
      const selected = index === this._selectedIndex;
      button.tabIndex = selected && !this.disabled ? 0 : -1;
      button.disabled = this.disabled;
      button.setAttribute("aria-pressed", String(selected));
      button.closest("tr").toggleAttribute("data-selected", selected);
    });
    const description = this._rowDescription(this._selectedIndex);
    if (this._selectedText.textContent !== description) this._selectedText.textContent = description;
    this._selectedText.hidden = !description;
    if (this._select) this._select.value = String(this._selection);
  }

  _syncState(state, message = "") {
    this.dataset.chartState = state;
    this.setAttribute("aria-busy", String(state === "loading" || state === "rendering"));
    this.setAttribute("aria-disabled", String(this.disabled));
    this._title.textContent = this._model?.title || "Chart";
    this._summary.textContent = this.summary || this._model?.description || "";
    this._summary.hidden = !this._summary.textContent;
    this._status.textContent = message;
    this._status.hidden = !message;
    const available = ["ready", "partial"].includes(state);
    this._viewport.hidden = !available && state !== "rendering";
    this._viewport.tabIndex = available && !this.disabled ? 0 : -1;
    this._controls.hidden = !this._select;
    if (this._select) this._select.disabled = this.disabled || !available;
    this._details.hidden = !this._rows().length || this.loading;
    this._retry.hidden = !this._renderError || this.loading;
    this._retry.disabled = this.disabled;
    this._syncSelection();
  }

  _context(width) {
    const style = this.ownerDocument.defaultView.getComputedStyle(this);
    const token = (name) => style.getPropertyValue(`--moss-${name}`).trim();
    return {
      palette: [1, 2, 3, 4, 5].map((index) => token(`data-${index}`)).filter(Boolean),
      text: token("text") || style.color,
      muted: token("text-muted") || style.color,
      border: token("border") || token("border-soft"),
      surface: token("surface"), font: style.fontFamily,
      width, motion: Boolean(this._hasRendered && !this._reducedMotion?.matches && Number.parseFloat(token("motion-normal")) > 0),
      selectedIndex: this._selectedIndex, selection: this._selection
    };
  }

  async _render() {
    if (!this._connected) return;
    if (this._needsModel) this._prepareModel();
    if (this.loading) {
      this._syncState("loading", "Loading chart.");
      this._disposeEngine();
      return;
    }
    const error = this.error ?? this._modelError ?? this._renderError;
    if (error !== undefined && error !== null) {
      this._syncState("error", error || "Unable to display chart.");
      this._disposeEngine();
      return;
    }
    const hasValues = this._rows().some((row) => this._model.series.some((series) =>
      (this._model.config?.interactive !== "series" || series.key === this._selection) && Number.isFinite(row[series.key])));
    if (!this._model || !hasValues || this._state === "empty") {
      this._syncState("empty", this._message || "No chart data.");
      this._disposeEngine();
      return;
    }
    this._syncState(this._state, this._message);
    if (!this._visible) return;
    const { width, height } = this._viewport.getBoundingClientRect();
    this._width = width;
    this._height = height;
    if (!width || !height) return;
    const version = this._version;
    try {
      const context = this._context(width);
      const option = buildChartOption({ ...this._model, data: this._rows() }, context);
      option.animation = context.motion;
      option.animationDuration = 0;
      option.aria = { enabled: false };
      if (option.tooltip && typeof option.tooltip === "object") option.tooltip.renderMode = "richText";
      if (this.disabled) {
        if (option.tooltip) option.tooltip.show = false;
        for (const series of option.series ?? []) {
          series.silent = true;
          series.emphasis = { ...series.emphasis, disabled: true };
        }
      }
      if (!this._engine) this._syncState("rendering", "Loading chart renderer.");
      const echarts = await loadEngine();
      if (!this._connected || this._version !== version) return;
      if (!this._engine) {
        this._engine = echarts.init(this._viewport, null, { renderer: "svg", width, height });
        this._engine.on("click", (params) => {
          if (!this.disabled && params.componentType === "series" && Number.isInteger(params.dataIndex)) {
            const key = this._model.series.find((series) => series.key === params.seriesId ||
              (series.label || series.key) === params.seriesName)?.key ||
              (this._model.config?.interactive === "series" ? this._selection : this._model.series[params.seriesIndex]?.key);
            // Radar polygons and aggregate gauges represent a series, not one source row.
            if (params.seriesType === "radar" || params.seriesType === "gauge") {
              this._emitSelection({ index: null, key: key || this._model.series[0].key, value: params.value });
            } else this._selectRow(params.data?.originalIndex ?? params.dataIndex, key);
          }
        });
      }
      this._engine.resize({ width, height, animation: { duration: 0 } });
      this._engine.setOption(option, { notMerge: true, lazyUpdate: false });
      // Geometry is visual; the summary, native controls, and exact table own accessibility.
      this._viewport.querySelector("svg")?.setAttribute("aria-hidden", "true");
      this._hasRendered = true;
      this._syncState(this._state, this._message);
      this.dispatchEvent(new CustomEvent("moss-chart-ready", { bubbles: true, composed: true }));
    } catch {
      if (!this._connected || this._version !== version) return;
      this._renderError = "Unable to render chart. Exact values are available in Chart data. Retry the chart.";
      this._disposeEngine();
      this._syncState("error", this._renderError);
    }
  }

  _disposeEngine() {
    this._engine?.dispose();
    this._engine = undefined;
    this._hasRendered = false;
  }

  _emitSelection(detail) {
    this.dispatchEvent(new CustomEvent("moss-chart-select", { detail, bubbles: true, composed: true }));
  }

  _selectRow(index, key = this._selection) {
    const rows = this._rows();
    if (this.disabled || !rows[index]) return;
    if (!this._model.series.some((series) => series.key === key)) key = this._model.series[0]?.key;
    this._selectedIndex = index;
    if (this._model.config?.interactive === "slice") this._selection = index;
    this._syncSelection();
    this._emitSelection({ index, key, value: rows[index][key] });
    this._schedule();
  }

  _changeSelection(event) {
    if (event.target !== this._select || this.disabled) return;
    const kind = this._select.dataset.chartControl;
    this._selection = kind === "series" ? this._select.value : Number(this._select.value);
    if (kind === "range") { this._selectedIndex = 0; this._buildTable(); }
    if (kind === "slice") this._selectedIndex = this._selection;
    this._syncSelection();
    this._emitSelection({ index: kind === "slice" ? this._selection : null, key: kind, value: this._selection });
    this._schedule();
  }

  _navigateData(event) {
    const button = event.target.closest?.("[data-chart-row]");
    if (this.disabled || (event.target !== this._viewport && !this._table.contains(button))) return;
    const rows = this._rows();
    if (!rows.length) return;
    let index = this._selectedIndex;
    if (event.key === "Home") index = 0;
    else if (event.key === "End") index = rows.length - 1;
    else if (["ArrowUp", "ArrowLeft"].includes(event.key)) index = Math.max(0, index - 1);
    else if (["ArrowDown", "ArrowRight"].includes(event.key)) index = Math.min(rows.length - 1, index + 1);
    else return;
    event.preventDefault();
    this._selectRow(index);
    if (button) this._rowButtons[index]?.focus();
  }
}

if (globalThis.customElements && !customElements.get("moss-chart")) customElements.define("moss-chart", MossChart);
