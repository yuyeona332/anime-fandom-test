(function () {
  const PALETTE = {
    outline: "#2e2144",
    skin: "#f6d4bf",
    skinShadow: "#e9b899",
    hair: {
      aqua: "#79e8d8",
      mint: "#7fd7c5",
      lavender: "#b9b8ff",
      peach: "#f9b8a7",
      rose: "#f7a7cb",
      lilac: "#d7b7ff",
      sky: "#9edaf8",
      coral: "#ffa794",
      sage: "#9ed8a0",
      gold: "#f3d99d",
      plum: "#b59ef0",
      cream: "#f1d6ac",
      blue: "#87aef7",
      pink: "#f7a7d8",
      jade: "#8ee0b4",
      purple: "#9a7bdd"
    },
    fabric: {
      indigo: "#5a5bc9",
      lilac: "#d8d4ff",
      mint: "#d3f4ef",
      peach: "#ffd6bd",
      blush: "#f8a7c0",
      rose: "#ffcedd",
      sky: "#cfeaff",
      plum: "#c3b8ff",
      jade: "#bff2d4",
      butter: "#ffe7aa",
      cloud: "#f2f2ff",
      cream: "#fff6d9",
      lavender: "#e7d5ff",
      coral: "#ffc4a9",
      bubble: "#dff7ff",
      deep: "#3d3d7d"
    },
    dark: {
      navy: "#2d2f59",
      charcoal: "#3d3d43",
      plum: "#4f3f6d",
      forest: "#33564a",
      dusk: "#4a466c",
      cocoa: "#52473d",
      blue: "#335a7d",
      berry: "#6e4765"
    },
    accent: {
      star: "#ffd95f",
      heart: "#ff7db4",
      sparkle: "#7be4ff",
      tea: "#cfa86d",
      snack: "#ffb05d",
      cup: "#7fc9d9",
      glass: "#9fe8d4"
    },
    white: "#ffffff",
    black: "#2a2a36",
    transparent: "rgba(0,0,0,0)"
  };

  const TYPE_STYLE_MAP = {
    RCFP: { hair: "twin", hairColor: "rose", outfit: "indigo", accent: "heart", skin: "skin", outline: "outline" },
    RCFD: { hair: "bob", hairColor: "lavender", outfit: "peach", accent: "heart", skin: "skin", outline: "outline" },
    RCEP: { hair: "ponytail", hairColor: "aqua", outfit: "mint", accent: "sparkle", skin: "skin", outline: "outline" },
    RCED: { hair: "side", hairColor: "sky", outfit: "cloud", accent: "star", skin: "skin", outline: "outline" },
    RWFP: { hair: "twin", hairColor: "jade", outfit: "deep", accent: "glass", skin: "skin", outline: "outline" },
    RWFD: { hair: "bob", hairColor: "plum", outfit: "lilac", accent: "star", skin: "skin", outline: "outline" },
    RWEP: { hair: "short", hairColor: "coral", outfit: "coral", accent: "sparkle", skin: "skin", outline: "outline" },
    RWED: { hair: "side", hairColor: "mint", outfit: "butter", accent: "star", skin: "skin", outline: "outline" },
    SCFP: { hair: "bob", hairColor: "lavender", outfit: "indigo", accent: "heart", skin: "skin", outline: "outline" },
    SCFD: { hair: "twin", hairColor: "pink", outfit: "rose", accent: "heart", skin: "skin", outline: "outline" },
    SCEP: { hair: "short", hairColor: "aqua", outfit: "jade", accent: "sparkle", skin: "skin", outline: "outline" },
    SCED: { hair: "side", hairColor: "blue", outfit: "sky", accent: "star", skin: "skin", outline: "outline" },
    SWFP: { hair: "ponytail", hairColor: "jade", outfit: "forest", accent: "cup", skin: "skin", outline: "outline" },
    SWFD: { hair: "side", hairColor: "peach", outfit: "rose", accent: "bubble", skin: "skin", outline: "outline" },
    SWEP: { hair: "twin", hairColor: "sage", outfit: "mint", accent: "sparkle", skin: "skin", outline: "outline" },
    SWED: { hair: "bob", hairColor: "purple", outfit: "lavender", accent: "sparkle", skin: "skin", outline: "outline" },
    XXXX: { hair: "bob", hairColor: "mint", outfit: "cloud", accent: "star", skin: "skin", outline: "outline" }
  };

  function rect(list, x, y, w, h, color) {
    list.push({ x, y, w, h, color });
  }

  function fillBlock(list, x, y, w, h, fill) {
    for (let py = y; py < y + h; py += 1) {
      for (let px = x; px < x + w; px += 1) {
        rect(list, px, py, 1, 1, fill);
      }
    }
  }

  function toColor(key, map) {
    const palettes = map === "hair" ? PALETTE.hair : map === "fabric" ? PALETTE.fabric : map === "accent" ? PALETTE.accent : map === "dark" ? PALETTE.dark : PALETTE.fabric;
    return palettes[key] || PALETTE.fabric.indigo;
  }

  function getStyle(code) {
    const normalized = String(code || "XXXX").toUpperCase();
    return TYPE_STYLE_MAP[normalized] || TYPE_STYLE_MAP.XXXX;
  }

  function drawHair(list, styleKey, colorKey) {
    const hairColor = toColor(colorKey, "hair");
    const outline = PALETTE.outline;

    if (styleKey === "twin") {
      fillBlock(list, 9, 3, 4, 10, hairColor);
      fillBlock(list, 19, 3, 4, 10, hairColor);
      fillBlock(list, 8, 3, 1, 10, outline);
      fillBlock(list, 23, 3, 1, 10, outline);
      fillBlock(list, 10, 12, 2, 2, hairColor);
      fillBlock(list, 20, 12, 2, 2, hairColor);
      fillBlock(list, 13, 1, 1, 2, hairColor);
      fillBlock(list, 18, 1, 1, 2, hairColor);
    } else if (styleKey === "bob") {
      fillBlock(list, 8, 3, 16, 8, hairColor);
      fillBlock(list, 7, 5, 2, 8, hairColor);
      fillBlock(list, 23, 5, 2, 8, hairColor);
      fillBlock(list, 10, 2, 12, 2, hairColor);
      fillBlock(list, 7, 10, 2, 4, outline);
      fillBlock(list, 23, 10, 2, 4, outline);
    } else if (styleKey === "ponytail") {
      fillBlock(list, 9, 3, 14, 8, hairColor);
      fillBlock(list, 7, 6, 2, 6, hairColor);
      fillBlock(list, 23, 6, 2, 6, hairColor);
      fillBlock(list, 12, 2, 8, 2, hairColor);
      fillBlock(list, 8, 12, 2, 4, hairColor);
      fillBlock(list, 22, 12, 2, 4, hairColor);
    } else if (styleKey === "short") {
      fillBlock(list, 9, 4, 14, 7, hairColor);
      fillBlock(list, 8, 5, 2, 6, hairColor);
      fillBlock(list, 22, 5, 2, 6, hairColor);
      fillBlock(list, 12, 2, 8, 2, hairColor);
      fillBlock(list, 11, 11, 10, 2, hairColor);
    } else if (styleKey === "side") {
      fillBlock(list, 8, 3, 16, 8, hairColor);
      fillBlock(list, 7, 4, 2, 6, hairColor);
      fillBlock(list, 23, 4, 2, 6, hairColor);
      fillBlock(list, 8, 11, 2, 4, hairColor);
      fillBlock(list, 22, 11, 2, 4, hairColor);
      fillBlock(list, 10, 3, 2, 2, outline);
      fillBlock(list, 20, 3, 2, 2, outline);
    }
  }

  function drawBody(list, outfitColor) {
    const outfit = toColor(outfitColor, "fabric");
    const outline = PALETTE.outline;
    fillBlock(list, 10, 17, 12, 8, outfit);
    fillBlock(list, 9, 18, 14, 6, outfit);
    fillBlock(list, 11, 25, 2, 4, outline);
    fillBlock(list, 19, 25, 2, 4, outline);
    fillBlock(list, 9, 19, 2, 5, outline);
    fillBlock(list, 21, 19, 2, 5, outline);
    fillBlock(list, 12, 23, 8, 2, outline);
  }

  function drawFace(list, skinColor) {
    const skin = PALETTE.skin;
    const outline = PALETTE.outline;
    fillBlock(list, 9, 10, 14, 8, skin);
    fillBlock(list, 9, 10, 14, 1, outline);
    fillBlock(list, 9, 17, 14, 1, outline);
    fillBlock(list, 9, 10, 1, 8, outline);
    fillBlock(list, 22, 10, 1, 8, outline);

    fillBlock(list, 12, 12, 2, 2, PALETTE.black);
    fillBlock(list, 18, 12, 2, 2, PALETTE.black);
    fillBlock(list, 13, 12, 1, 1, PALETTE.white);
    fillBlock(list, 19, 12, 1, 1, PALETTE.white);

    fillBlock(list, 14, 15, 4, 2, PALETTE.skinShadow);
    fillBlock(list, 12, 15, 2, 1, PALETTE.blush || "#f7b1c8");
    fillBlock(list, 18, 15, 2, 1, PALETTE.blush || "#f7b1c8");
    fillBlock(list, 15, 16, 2, 1, PALETTE.black);
  }

  function drawAccessory(list, code) {
    const normalized = String(code || "XXXX").toUpperCase();
    const accent = PALETTE.accent;

    if (normalized.includes("R")) {
      fillBlock(list, 24, 21, 3, 3, accent.snack);
      fillBlock(list, 24, 24, 2, 2, accent.popcorn || accent.snack);
      fillBlock(list, 27, 20, 2, 2, accent.cup || accent.snack);
      fillBlock(list, 26, 23, 3, 2, PALETTE.fabric.cream);
    }
    if (normalized.includes("S")) {
      fillBlock(list, 24, 21, 4, 3, PALETTE.fabric.cream);
      fillBlock(list, 27, 24, 2, 2, PALETTE.accent.tea || PALETTE.fabric.cream);
      fillBlock(list, 24, 25, 1, 1, PALETTE.dark.navy);
    }
    if (normalized.includes("C")) {
      fillBlock(list, 11, 6, 2, 2, PALETTE.accent.heart || "#ff7db4");
      fillBlock(list, 13, 5, 2, 2, PALETTE.accent.heart || "#ff7db4");
      fillBlock(list, 15, 6, 2, 2, PALETTE.accent.heart || "#ff7db4");
      fillBlock(list, 19, 5, 2, 2, PALETTE.accent.heart || "#ff7db4");
    }
    if (normalized.includes("W")) {
      fillBlock(list, 10, 10, 4, 2, PALETTE.dark.navy);
      fillBlock(list, 18, 10, 4, 2, PALETTE.dark.navy);
      fillBlock(list, 15, 10, 2, 2, PALETTE.dark.navy);
      fillBlock(list, 9, 11, 1, 1, PALETTE.dark.navy);
      fillBlock(list, 23, 11, 1, 1, PALETTE.dark.navy);
    }
    if (normalized.includes("F")) {
      fillBlock(list, 8, 2, 2, 3, PALETTE.accent.sparkle || "#7be4ff");
      fillBlock(list, 22, 2, 2, 3, PALETTE.accent.sparkle || "#7be4ff");
      fillBlock(list, 10, 1, 1, 2, PALETTE.accent.sparkle || "#7be4ff");
      fillBlock(list, 21, 1, 1, 2, PALETTE.accent.sparkle || "#7be4ff");
    }
    if (normalized.includes("E")) {
      fillBlock(list, 14, 2, 1, 1, PALETTE.accent.star || "#ffd95f");
      fillBlock(list, 16, 2, 1, 1, PALETTE.accent.star || "#ffd95f");
      fillBlock(list, 15, 1, 1, 2, PALETTE.accent.star || "#ffd95f");
      fillBlock(list, 15, 4, 1, 1, PALETTE.accent.sparkle || "#7be4ff");
    }
    if (normalized.includes("P")) {
      fillBlock(list, 7, 14, 1, 10, PALETTE.dark.navy);
      fillBlock(list, 24, 14, 1, 10, PALETTE.dark.navy);
      fillBlock(list, 8, 13, 1, 2, PALETTE.dark.navy);
      fillBlock(list, 23, 13, 1, 2, PALETTE.dark.navy);
      fillBlock(list, 10, 19, 12, 2, PALETTE.dark.navy);
    }
    if (normalized.includes("D")) {
      fillBlock(list, 22, 14, 5, 5, PALETTE.fabric.cloud || "#f2f2ff");
      fillBlock(list, 23, 15, 3, 3, PALETTE.accent.sparkle || "#7be4ff");
      fillBlock(list, 25, 18, 1, 1, PALETTE.dark.navy);
      fillBlock(list, 24, 19, 1, 1, PALETTE.dark.navy);
    }
  }

  function drawDefault(list) {
    drawHair(list, "bob", "mint");
    drawFace(list, "skin");
    drawBody(list, "cloud");
    fillBlock(list, 11, 20, 10, 2, PALETTE.fabric.indigo);
    fillBlock(list, 14, 11, 4, 1, PALETTE.black);
    fillBlock(list, 12, 12, 2, 2, PALETTE.black);
    fillBlock(list, 18, 12, 2, 2, PALETTE.black);
    fillBlock(list, 15, 15, 2, 1, PALETTE.black);
  }

  function buildSpriteSvg(code, size = 64) {
    const style = getStyle(code);
    const list = [];
    const outline = PALETTE.outline;

    fillBlock(list, 8, 26, 16, 3, PALETTE.dark.charcoal);
    fillBlock(list, 9, 27, 14, 2, PALETTE.fabric.cloud);

    drawHair(list, style.hair, style.hairColor);
    drawFace(list, style.skin);
    drawBody(list, style.outfit);
    drawAccessory(list, code);

    const rectMarkup = list
      .map((item) => `<rect x="${item.x}" y="${item.y}" width="${item.w}" height="${item.h}" fill="${item.color}" />`)
      .join("");

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}" role="img" aria-label="${String(code || "XXXX").toUpperCase()} pixel character" style="image-rendering:pixelated; shape-rendering:crispEdges;">
        <rect width="32" height="32" fill="transparent" />
        ${rectMarkup}
      </svg>
    `.trim();
  }

  window.ANIME_PIXEL_SPRITES = {
    buildSpriteSvg: buildSpriteSvg,
    defaultSprite: buildSpriteSvg("XXXX", 64)
  };
})();
