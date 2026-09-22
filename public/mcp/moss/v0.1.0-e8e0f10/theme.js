// Vendored from @brandoriv/moss revision e8e0f10.
const DEFAULT_THEME = {
  name: "Moss", mode: "dark", density: "balanced",
  palette: {
    dark: { canvas:"#191b19",surface:"#222522",surfaceRaised:"#292d29",surfaceStrong:"#303530",text:"#f4f2e9",textMuted:"#afb5ad",textFaint:"#7e887f",border:"#3b403b",borderSoft:"#303430",accent:"#74d69b",accentStrong:"#9be9b8",accentSurface:"#254a34" },
    light: { canvas:"#f4f4ef",surface:"#ffffff",surfaceRaised:"#eceee9",surfaceStrong:"#e2e5df",text:"#1d221e",textMuted:"#59635b",textFaint:"#78827a",border:"#cbd1ca",borderSoft:"#dde1dc",accent:"#247a4c",accentStrong:"#165f39",accentSurface:"#d9eee1" },
    status: { positive:"#74d69b",warning:"#efc36b",critical:"#ff8a69",info:"#7fa9ff" },
    data: ["#7fa9ff","#74d69b","#b4a2ff","#efc36b","#ff8a69"]
  },
  typography: { sans:'"Manrope", "DM Sans", ui-sans-serif, system-ui, sans-serif',heading:"var(--moss-font-sans)",mono:'"DM Mono", "SFMono-Regular", Consolas, monospace',baseSize:"1rem",headingWeight:"600",headingTracking:"-.035em" },
  densityScale: { comfortable:{control:"2.75rem",row:"3.5rem"},balanced:{control:"2.375rem",row:"2.625rem"},compact:{control:"2rem",row:"2rem"} },
  geometry: { radiusSm:".3125rem",radiusMd:".5rem",radiusLg:".75rem",borderWidth:"1px" },
  motion: { fast:"140ms",normal:"220ms",ease:"cubic-bezier(.2,.8,.2,1)" },
  layout: { railExpanded:"15rem",railCollapsed:"4.75rem",topbarHeight:"4rem" },
  charts: { strokeWidth:"2.5" },
  components: { rail:{collapsible:true,collapsedTooltips:true},table:{defaultDensity:"compact"},bars:{radius:"1px 1px 0 0"} }
};

const PRESETS = { moss: DEFAULT_THEME };
const isObject = value => value && typeof value === "object" && !Array.isArray(value);
const merge = (base, override={}) => Object.fromEntries(Object.keys({...base,...override}).map(key => [key,isObject(base?.[key])&&isObject(override?.[key])?merge(base[key],override[key]):(override?.[key]??base?.[key])]));
const variables = {canvas:"--moss-canvas",surface:"--moss-surface",surfaceRaised:"--moss-surface-raised",surfaceStrong:"--moss-surface-strong",text:"--moss-text",textMuted:"--moss-text-muted",textFaint:"--moss-text-faint",border:"--moss-border",borderSoft:"--moss-border-soft",accent:"--moss-accent",accentStrong:"--moss-accent-strong",accentSurface:"--moss-accent-surface"};

class MossTheme {
  constructor(options={}) { const preset=PRESETS[options.preset||"moss"]||DEFAULT_THEME; Object.assign(this,merge(DEFAULT_THEME,merge(preset,options))); }
  toVariables(mode=this.mode,density=this.density) {
    const color=this.palette[mode]||this.palette.dark, result={};
    for(const [key,name] of Object.entries(variables)) result[name]=color[key];
    for(const [key,name] of Object.entries({positive:"--moss-positive",warning:"--moss-warning",critical:"--moss-critical",info:"--moss-info"})) result[name]=this.palette.status[key];
    this.palette.data.forEach((value,index)=>result[`--moss-data-${index+1}`]=value);
    return Object.assign(result,{"--moss-font-sans":this.typography.sans,"--moss-font-heading":this.typography.heading,"--moss-font-mono":this.typography.mono,"--moss-font-size":this.typography.baseSize,"--moss-heading-weight":this.typography.headingWeight,"--moss-heading-tracking":this.typography.headingTracking,"--moss-control-height":this.densityScale[density].control,"--moss-density-row":this.densityScale[density].row,"--moss-radius-sm":this.geometry.radiusSm,"--moss-radius-md":this.geometry.radiusMd,"--moss-radius-lg":this.geometry.radiusLg,"--moss-border-width":this.geometry.borderWidth,"--moss-motion-fast":this.motion.fast,"--moss-motion-normal":this.motion.normal,"--moss-ease":this.motion.ease,"--moss-rail-expanded":this.layout.railExpanded,"--moss-rail-collapsed":this.layout.railCollapsed,"--moss-topbar-height":this.layout.topbarHeight,"--moss-chart-stroke":this.charts.strokeWidth});
  }
  apply(target=document.documentElement,options={}) { const mode=options.mode||this.mode,density=options.density||this.density; for(const [name,value] of Object.entries(this.toVariables(mode,density))) target.style.setProperty(name,value); target.dataset.mossTheme=mode; target.dataset.mossDensity=density; target.dataset.mossThemeName=this.name; return this; }
  static from(preset,options={}) { return new MossTheme({preset,...options}); }
  static get presets() { return Object.keys(PRESETS); }
}

class MossThemeProvider extends HTMLElement {
  static observedAttributes=["preset","mode","density"];
  connectedCallback(){this.renderTheme();}
  attributeChangedCallback(){if(this.isConnected)this.renderTheme();}
  renderTheme(){this.theme=MossTheme.from(this.getAttribute("preset")||"moss",{mode:this.getAttribute("mode")||"dark",density:this.getAttribute("density")||"balanced"});this.theme.apply(this);}
}
if(!customElements.get("moss-theme-provider"))customElements.define("moss-theme-provider",MossThemeProvider);
export { MossTheme,MossThemeProvider,DEFAULT_THEME,PRESETS as MossThemePresets };
