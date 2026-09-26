// Product-owned fixtures use the public MossTheme value schema directly.
export const frogThemes = {
  "tree": {
    "name": "Green tree frog",
    "palette": {
      "dark": {
        "canvas": "#17201c",
        "surface": "#202b25",
        "surfaceRaised": "#29372f",
        "surfaceStrong": "#33443a",
        "text": "#f2f6ee",
        "textMuted": "#b3c1b6",
        "textFaint": "#a7b3aa",
        "border": "#405247",
        "borderSoft": "#303f36",
        "primary": "#70d35d",
        "primaryStrong": "#a2ee8d",
        "primarySurface": "#294d28",
        "secondary": "#f0b84d",
        "secondaryStrong": "#ffd985",
        "secondarySurface": "#503c18",
        "status": {
          "positive": "#70d35d",
          "warning": "#f0b84d",
          "critical": "#f3988a",
          "info": "#7ab3e2"
        }
      },
      "light": {
        "canvas": "#f2f6ef",
        "surface": "#ffffff",
        "surfaceRaised": "#e7eee8",
        "surfaceStrong": "#dce7de",
        "text": "#17231b",
        "textMuted": "#526258",
        "textFaint": "#5b6760",
        "border": "#c1cec4",
        "borderSoft": "#d7e0d9",
        "primary": "#296d31",
        "primaryStrong": "#21652a",
        "primarySurface": "#d9f0d7",
        "secondary": "#885900",
        "secondaryStrong": "#724a00",
        "secondarySurface": "#f7e9c7",
        "status": {
          "positive": "#386b2f",
          "warning": "#795d27",
          "critical": "#9b4b3e",
          "info": "#406787"
        }
      },
      "status": {
        "positive": "#70d35d",
        "warning": "#f0b84d",
        "critical": "#ee735f",
        "info": "#69a9de"
      },
      "data": [
        "#70d35d",
        "#69a9de",
        "#f0b84d",
        "#a58adf",
        "#ee735f"
      ]
    },
    "typography": {
      "sans": "\"Manrope\", system-ui, sans-serif",
      "heading": "var(--moss-font-sans)",
      "mono": "\"DM Mono\", \"SFMono-Regular\", Consolas, monospace",
      "baseSize": "1rem",
      "scale": 1.2,
      "bodyWeight": "400",
      "mediumWeight": "500",
      "headingWeight": "620",
      "headingTracking": "-.035em",
      "bodyTracking": "0",
      "lineHeight": 1.52,
      "headingLineHeight": 1.08
    },
    "densityScale": {
      "comfortable": {
        "control": "2.8rem",
        "row": "3.5rem",
        "gap": "1rem",
        "inset": "1rem"
      },
      "balanced": {
        "control": "2.4rem",
        "row": "2.7rem",
        "gap": ".75rem",
        "inset": ".75rem"
      },
      "compact": {
        "control": "2.05rem",
        "row": "2.1rem",
        "gap": ".5rem",
        "inset": ".625rem"
      }
    },
    "density": "balanced",
    "spacing": {
      "unit": ".25rem",
      "section": "2.25rem",
      "page": "clamp(1rem,3vw,2.75rem)",
      "contentMax": "92rem"
    },
    "geometry": {
      "sharpness": 0.38,
      "radiusMin": ".2rem",
      "radiusMax": "1.25rem",
      "borderWidth": "1px"
    },
    "elevation": {
      "surface": "none",
      "raised": "0 .65rem 1.8rem rgb(9 20 12/.18)",
      "overlay": "0 1.5rem 4rem rgb(5 12 7/.42)"
    },
    "motion": {
      "fast": "150ms",
      "normal": "240ms",
      "slow": "390ms",
      "ease": "cubic-bezier(.2,.8,.2,1)",
      "distance": ".3rem"
    },
    "interaction": {
      "focusWidth": "3px",
      "focusOpacity": "28%",
      "hoverLift": "-1px",
      "disabledOpacity": ".5",
      "targetMin": "2.75rem"
    },
    "layout": {
      "railExpanded": "15.5rem",
      "railCollapsed": "4.75rem",
      "topbarHeight": "4.1rem"
    },
    "charts": {
      "strokeWidth": "2.5",
      "gridOpacity": ".16",
      "barRadius": ".15rem",
      "pointRadius": "3.5",
      "areaOpacity": ".16"
    },
    "components": {
      "rail": {
        "collapsible": true
      },
      "table": {
        "defaultDensity": "compact"
      }
    }
  },
  "dart": {
    "name": "Blue poison dart frog",
    "palette": {
      "dark": {
        "canvas": "#0c151d",
        "surface": "#121f2a",
        "surfaceRaised": "#192b39",
        "surfaceStrong": "#213848",
        "text": "#f3f8fb",
        "textMuted": "#a8bfcd",
        "textFaint": "#90a5b2",
        "border": "#2b485a",
        "borderSoft": "#203746",
        "primary": "#40a9ff",
        "primaryStrong": "#67bdff",
        "primarySurface": "#103b5c",
        "secondary": "#ffe043",
        "secondaryStrong": "#fff08a",
        "secondarySurface": "#4d4310",
        "status": {
          "positive": "#36df88",
          "warning": "#ffd24a",
          "critical": "#ff797d",
          "info": "#40a9ff"
        }
      },
      "light": {
        "canvas": "#eef6fa",
        "surface": "#ffffff",
        "surfaceRaised": "#e1edf3",
        "surfaceStrong": "#d2e3eb",
        "text": "#101f28",
        "textMuted": "#4b626f",
        "textFaint": "#4f5f68",
        "border": "#b8cbd5",
        "borderSoft": "#d0dfe6",
        "primary": "#0066a5",
        "primaryStrong": "#005386",
        "primarySurface": "#cceaff",
        "secondary": "#735f00",
        "secondaryStrong": "#665400",
        "secondarySurface": "#fbf1bd",
        "status": {
          "positive": "#196a41",
          "warning": "#725e22",
          "critical": "#a53c40",
          "info": "#1262a5"
        }
      },
      "status": {
        "positive": "#36df88",
        "warning": "#ffd24a",
        "critical": "#ff5d63",
        "info": "#1998ff"
      },
      "data": [
        "#1998ff",
        "#36df88",
        "#9d7cff",
        "#ffd24a",
        "#ff5d63"
      ]
    },
    "typography": {
      "sans": "\"Inter\", \"Manrope\", system-ui, sans-serif",
      "heading": "var(--moss-font-sans)",
      "mono": "\"DM Mono\", \"SFMono-Regular\", Consolas, monospace",
      "baseSize": "1rem",
      "scale": 1.14,
      "bodyWeight": "400",
      "mediumWeight": "500",
      "headingWeight": "680",
      "headingTracking": "-.045em",
      "bodyTracking": "-.005em",
      "lineHeight": 1.44,
      "headingLineHeight": 1.02
    },
    "densityScale": {
      "comfortable": {
        "control": "2.65rem",
        "row": "3.25rem",
        "gap": ".875rem",
        "inset": ".875rem"
      },
      "balanced": {
        "control": "2.25rem",
        "row": "2.45rem",
        "gap": ".625rem",
        "inset": ".675rem"
      },
      "compact": {
        "control": "1.95rem",
        "row": "1.9rem",
        "gap": ".4rem",
        "inset": ".5rem"
      }
    },
    "density": "compact",
    "spacing": {
      "unit": ".225rem",
      "section": "1.75rem",
      "page": "clamp(.875rem,2.5vw,2.25rem)",
      "contentMax": "96rem"
    },
    "geometry": {
      "sharpness": 0.82,
      "radiusMin": ".1rem",
      "radiusMax": ".7rem",
      "borderWidth": "1px"
    },
    "elevation": {
      "surface": "none",
      "raised": "0 .45rem 1.3rem rgb(0 8 18/.24)",
      "overlay": "0 1.2rem 3.5rem rgb(0 6 14/.55)"
    },
    "motion": {
      "fast": "110ms",
      "normal": "180ms",
      "slow": "300ms",
      "ease": "cubic-bezier(.18,.82,.2,1)",
      "distance": ".2rem"
    },
    "interaction": {
      "focusWidth": "2px",
      "focusOpacity": "34%",
      "hoverLift": "-1px",
      "disabledOpacity": ".44",
      "targetMin": "2.6rem"
    },
    "layout": {
      "railExpanded": "14.5rem",
      "railCollapsed": "4.4rem",
      "topbarHeight": "3.75rem"
    },
    "charts": {
      "strokeWidth": "2",
      "gridOpacity": ".22",
      "barRadius": "0",
      "pointRadius": "2.5",
      "areaOpacity": ".11"
    },
    "components": {
      "rail": {
        "collapsible": true
      },
      "table": {
        "defaultDensity": "compact"
      }
    }
  },
  "mossy": {
    "name": "Vietnamese mossy frog",
    "palette": {
      "dark": {
        "canvas": "#191d18",
        "surface": "#232922",
        "surfaceRaised": "#2d352c",
        "surfaceStrong": "#394137",
        "text": "#f1f0e8",
        "textMuted": "#b8baae",
        "textFaint": "#aaaea5",
        "border": "#494f45",
        "borderSoft": "#373d35",
        "primary": "#9eb37a",
        "primaryStrong": "#aec87c",
        "primarySurface": "#354225",
        "secondary": "#c2ab7f",
        "secondaryStrong": "#d8bd86",
        "secondarySurface": "#493d28",
        "status": {
          "positive": "#9eb37a",
          "warning": "#d3a94f",
          "critical": "#da9d8f",
          "info": "#97b2bd"
        }
      },
      "light": {
        "canvas": "#f3f2e9",
        "surface": "#fffef7",
        "surfaceRaised": "#e9e9de",
        "surfaceStrong": "#dedfd2",
        "text": "#20241e",
        "textMuted": "#595e55",
        "textFaint": "#5e625a",
        "border": "#cbcdbf",
        "borderSoft": "#dedfd5",
        "primary": "#4f622c",
        "primaryStrong": "#415423",
        "primarySurface": "#e2e8cf",
        "secondary": "#715829",
        "secondaryStrong": "#5d471f",
        "secondarySurface": "#eee2c8",
        "status": {
          "positive": "#556637",
          "warning": "#725b2b",
          "critical": "#8b4d3f",
          "info": "#48626c"
        }
      },
      "status": {
        "positive": "#829d55",
        "warning": "#d3a94f",
        "critical": "#c9705c",
        "info": "#7096a6"
      },
      "data": [
        "#829d55",
        "#b69a65",
        "#7096a6",
        "#9a80ad",
        "#c9705c"
      ]
    },
    "typography": {
      "sans": "\"Source Sans 3\", \"Manrope\", system-ui, sans-serif",
      "heading": "var(--moss-font-sans)",
      "mono": "\"DM Mono\", \"SFMono-Regular\", Consolas, monospace",
      "baseSize": "1rem",
      "scale": 1.24,
      "bodyWeight": "400",
      "mediumWeight": "500",
      "headingWeight": "590",
      "headingTracking": "-.025em",
      "bodyTracking": ".003em",
      "lineHeight": 1.58,
      "headingLineHeight": 1.14
    },
    "densityScale": {
      "comfortable": {
        "control": "3rem",
        "row": "3.8rem",
        "gap": "1.1rem",
        "inset": "1.1rem"
      },
      "balanced": {
        "control": "2.55rem",
        "row": "2.9rem",
        "gap": ".85rem",
        "inset": ".85rem"
      },
      "compact": {
        "control": "2.2rem",
        "row": "2.25rem",
        "gap": ".6rem",
        "inset": ".7rem"
      }
    },
    "density": "comfortable",
    "spacing": {
      "unit": ".275rem",
      "section": "2.75rem",
      "page": "clamp(1.25rem,4vw,3.25rem)",
      "contentMax": "84rem"
    },
    "geometry": {
      "sharpness": 0.18,
      "radiusMin": ".3rem",
      "radiusMax": "1.5rem",
      "borderWidth": "1px"
    },
    "elevation": {
      "surface": "0 .15rem .4rem rgb(17 22 16/.08)",
      "raised": "0 .8rem 2.2rem rgb(13 18 12/.2)",
      "overlay": "0 1.8rem 4.5rem rgb(8 12 7/.44)"
    },
    "motion": {
      "fast": "180ms",
      "normal": "290ms",
      "slow": "460ms",
      "ease": "cubic-bezier(.24,.72,.22,1)",
      "distance": ".4rem"
    },
    "interaction": {
      "focusWidth": "3px",
      "focusOpacity": "24%",
      "hoverLift": "-2px",
      "disabledOpacity": ".52",
      "targetMin": "2.9rem"
    },
    "layout": {
      "railExpanded": "16rem",
      "railCollapsed": "5rem",
      "topbarHeight": "4.35rem"
    },
    "charts": {
      "strokeWidth": "3",
      "gridOpacity": ".13",
      "barRadius": ".25rem",
      "pointRadius": "4",
      "areaOpacity": ".2"
    },
    "components": {
      "rail": {
        "collapsible": true
      },
      "table": {
        "defaultDensity": "balanced"
      }
    }
  },
  "tomato": {
    "name": "Tomato frog",
    "palette": {
      "dark": {
        "canvas": "#241714",
        "surface": "#30201c",
        "surfaceRaised": "#3d2923",
        "surfaceStrong": "#4a332c",
        "text": "#fff4ed",
        "textMuted": "#d0b3a6",
        "textFaint": "#b8a49a",
        "border": "#5b4037",
        "borderSoft": "#463129",
        "primary": "#f58673",
        "primaryStrong": "#ff9079",
        "primarySurface": "#5b241b",
        "secondary": "#f3bd3f",
        "secondaryStrong": "#ffdc82",
        "secondarySurface": "#554214",
        "status": {
          "positive": "#72bd67",
          "warning": "#f3bd3f",
          "critical": "#f58673",
          "info": "#75aad7"
        }
      },
      "light": {
        "canvas": "#fff3eb",
        "surface": "#fffaf6",
        "surfaceRaised": "#f5e4da",
        "surfaceStrong": "#ecd5c9",
        "text": "#2a1813",
        "textMuted": "#6f5146",
        "textFaint": "#6a544c",
        "border": "#dbc0b3",
        "borderSoft": "#ead6cc",
        "primary": "#a8301e",
        "primaryStrong": "#872416",
        "primarySurface": "#ffd9ce",
        "secondary": "#7a5700",
        "secondaryStrong": "#6e4e00",
        "secondarySurface": "#f8e9b9",
        "status": {
          "positive": "#3e6637",
          "warning": "#745a1e",
          "critical": "#9b3b28",
          "info": "#3c617f"
        }
      },
      "status": {
        "positive": "#72bd67",
        "warning": "#f3bd3f",
        "critical": "#f05a3f",
        "info": "#639fd1"
      },
      "data": [
        "#f05a3f",
        "#f3bd3f",
        "#72bd67",
        "#639fd1",
        "#ad75b7"
      ]
    },
    "typography": {
      "sans": "\"Avenir Next\", \"Manrope\", system-ui, sans-serif",
      "heading": "var(--moss-font-sans)",
      "mono": "\"DM Mono\", \"SFMono-Regular\", Consolas, monospace",
      "baseSize": "1rem",
      "scale": 1.28,
      "bodyWeight": "400",
      "mediumWeight": "500",
      "headingWeight": "700",
      "headingTracking": "-.055em",
      "bodyTracking": ".002em",
      "lineHeight": 1.5,
      "headingLineHeight": 0.98
    },
    "densityScale": {
      "comfortable": {
        "control": "2.9rem",
        "row": "3.6rem",
        "gap": "1rem",
        "inset": "1.05rem"
      },
      "balanced": {
        "control": "2.5rem",
        "row": "2.75rem",
        "gap": ".8rem",
        "inset": ".8rem"
      },
      "compact": {
        "control": "2.15rem",
        "row": "2.1rem",
        "gap": ".55rem",
        "inset": ".65rem"
      }
    },
    "density": "balanced",
    "spacing": {
      "unit": ".25rem",
      "section": "2.5rem",
      "page": "clamp(1rem,3.5vw,3rem)",
      "contentMax": "88rem"
    },
    "geometry": {
      "sharpness": 0.28,
      "radiusMin": ".25rem",
      "radiusMax": "1.35rem",
      "borderWidth": "1.5px"
    },
    "elevation": {
      "surface": "none",
      "raised": "0 .7rem 1.8rem rgb(45 17 10/.2)",
      "overlay": "0 1.6rem 4rem rgb(32 10 5/.48)"
    },
    "motion": {
      "fast": "135ms",
      "normal": "225ms",
      "slow": "375ms",
      "ease": "cubic-bezier(.22,.9,.28,1)",
      "distance": ".35rem"
    },
    "interaction": {
      "focusWidth": "3px",
      "focusOpacity": "30%",
      "hoverLift": "-2px",
      "disabledOpacity": ".46",
      "targetMin": "2.8rem"
    },
    "layout": {
      "railExpanded": "15.75rem",
      "railCollapsed": "4.8rem",
      "topbarHeight": "4.2rem"
    },
    "charts": {
      "strokeWidth": "2.75",
      "gridOpacity": ".15",
      "barRadius": ".2rem",
      "pointRadius": "4.5",
      "areaOpacity": ".18"
    },
    "components": {
      "rail": {
        "collapsible": true
      },
      "table": {
        "defaultDensity": "balanced"
      }
    }
  },
  "glass": {
    "name": "Glass frog",
    "palette": {
      "dark": {
        "canvas": "#111d1d",
        "surface": "#182827",
        "surfaceRaised": "#203432",
        "surfaceStrong": "#29413e",
        "text": "#edf9f5",
        "textMuted": "#aac9c1",
        "textFaint": "#91b0a9",
        "border": "#34534d",
        "borderSoft": "#273f3b",
        "primary": "#58d5a1",
        "primaryStrong": "#9aefcb",
        "primarySurface": "#164d3a",
        "secondary": "#72d7df",
        "secondaryStrong": "#aceef2",
        "secondarySurface": "#1b4b50",
        "status": {
          "positive": "#58d5a1",
          "warning": "#e4c15c",
          "critical": "#eb8f90",
          "info": "#72d7df"
        }
      },
      "light": {
        "canvas": "#eefaf6",
        "surface": "#fbfffd",
        "surfaceRaised": "#e0f1eb",
        "surfaceStrong": "#d0e6de",
        "text": "#122520",
        "textMuted": "#45655b",
        "textFaint": "#4f6660",
        "border": "#b7d1c8",
        "borderSoft": "#d0e2dc",
        "primary": "#136b4c",
        "primaryStrong": "#0b6244",
        "primarySurface": "#cdf2e2",
        "secondary": "#156b75",
        "secondaryStrong": "#0c5b64",
        "secondarySurface": "#d1f1f3",
        "status": {
          "positive": "#2d6c51",
          "warning": "#6d5c2b",
          "critical": "#954748",
          "info": "#37676a"
        }
      },
      "status": {
        "positive": "#58d5a1",
        "warning": "#e4c15c",
        "critical": "#e76f70",
        "info": "#72d7df"
      },
      "data": [
        "#72d7df",
        "#58d5a1",
        "#8e96df",
        "#e4c15c",
        "#e76f70"
      ]
    },
    "typography": {
      "sans": "\"Nunito Sans\", \"Manrope\", system-ui, sans-serif",
      "heading": "var(--moss-font-sans)",
      "mono": "\"DM Mono\", \"SFMono-Regular\", Consolas, monospace",
      "baseSize": "1rem",
      "scale": 1.18,
      "bodyWeight": "400",
      "mediumWeight": "500",
      "headingWeight": "600",
      "headingTracking": "-.03em",
      "bodyTracking": ".005em",
      "lineHeight": 1.56,
      "headingLineHeight": 1.1
    },
    "densityScale": {
      "comfortable": {
        "control": "2.85rem",
        "row": "3.55rem",
        "gap": "1.05rem",
        "inset": "1rem"
      },
      "balanced": {
        "control": "2.45rem",
        "row": "2.7rem",
        "gap": ".78rem",
        "inset": ".78rem"
      },
      "compact": {
        "control": "2.1rem",
        "row": "2.05rem",
        "gap": ".52rem",
        "inset": ".62rem"
      }
    },
    "density": "balanced",
    "spacing": {
      "unit": ".25rem",
      "section": "2.35rem",
      "page": "clamp(1rem,3vw,2.6rem)",
      "contentMax": "90rem"
    },
    "geometry": {
      "sharpness": 0.46,
      "radiusMin": ".2rem",
      "radiusMax": "1.1rem",
      "borderWidth": "1px"
    },
    "elevation": {
      "surface": "0 .1rem .3rem rgb(4 32 26/.08)",
      "raised": "0 .6rem 1.8rem rgb(3 28 23/.17)",
      "overlay": "0 1.4rem 3.8rem rgb(2 20 17/.4)"
    },
    "motion": {
      "fast": "160ms",
      "normal": "250ms",
      "slow": "410ms",
      "ease": "cubic-bezier(.16,.78,.24,1)",
      "distance": ".28rem"
    },
    "interaction": {
      "focusWidth": "3px",
      "focusOpacity": "25%",
      "hoverLift": "-1px",
      "disabledOpacity": ".5",
      "targetMin": "2.85rem"
    },
    "layout": {
      "railExpanded": "15.25rem",
      "railCollapsed": "4.65rem",
      "topbarHeight": "4rem"
    },
    "charts": {
      "strokeWidth": "2.25",
      "gridOpacity": ".12",
      "barRadius": ".1rem",
      "pointRadius": "3",
      "areaOpacity": ".13"
    },
    "components": {
      "rail": {
        "collapsible": true
      },
      "table": {
        "defaultDensity": "compact"
      }
    }
  }
};
