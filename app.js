(() => {
  'use strict';

  /* ────────────────────────────────────────────────────────────
     Karasu Houkaiin · Quick Image Lab
     A local-first H5 image compositor for a 2560 × 1344 poster.
     ──────────────────────────────────────────────────────────── */

  const TARGET = Object.freeze({ width: 2560, height: 1344 });
  const TARGET_RATIO = TARGET.width / TARGET.height;
  const LINE_HEIGHT = 1.12;
  const TEXT_BLEND_MODE = 'overlay';
  const BASE_FONT_FAMILY = 'Otsutome_web';
  const BASE_FONT_SPEC = `700 100px "${BASE_FONT_FAMILY}"`;
  const BASE_FONT_WOFF2 = './assets/fonts/OtsutomeFont-Bold.woff2?v=20261028c';
  const BASE_FONT_TTF = './assets/fonts/OtsutomeFont-Bold.ttf?v=20261028c';
  const BASE_FONT_SAMPLE =
    'Karasu Houkaiin なぜおとなしく死を待てない？ PSDファイル 0123456789';
  const SAMPLE_SRC = './assets/images/sample-artwork.jpg';
  const SAMPLE_NAME = 'sample-artwork.jpg';

  const FONT_OPTIONS = {
    otsutome: {
      label: 'おつとめフォント / Bold',
      note: '内置',
      css: '"Otsutome_web"',
      ps: 'Otsutome_font-Bold',
    },
    sans: {
      label: '无衬线 / Sans',
      note: '系统',
      css: '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "Noto Sans JP", sans-serif',
      ps: 'MicrosoftYaHei-Bold',
    },
    serif: {
      label: '明朝 / Serif',
      note: '系统',
      css: '"Yu Mincho", "Hiragino Mincho ProN", "Songti SC", "Noto Serif JP", serif',
      ps: 'YuMincho-Bold',
    },
    mono: {
      label: '等宽 / Mono',
      note: '系统',
      css: '"Cascadia Mono", "SFMono-Regular", Consolas, monospace',
      ps: 'CascadiaMono-Bold',
    },
  };

  const DEFAULT_LAYERS = Object.freeze([
    {
      id: 'title',
      short: '01',
      name: '主标题',
      english: 'TITLE',
      text: 'Karasu Houkaiin',
      visible: true,
      font: 'otsutome',
      fontSize: 270,
      letterSpacing: 1.5,
      x: 134,
      baseline: 1086,
      align: 'left',
    },
    {
      id: 'subtitle',
      short: '02',
      name: '副标题',
      english: 'COPY',
      text: 'なぜおとなしく死を待てない？',
      visible: true,
      font: 'otsutome',
      fontSize: 85,
      letterSpacing: 4,
      x: 145,
      baseline: 1228,
      align: 'left',
    },
    {
      id: 'tag',
      short: '03',
      name: '右侧标签',
      english: 'TAG',
      text: 'PSDファイル',
      visible: true,
      font: 'otsutome',
      fontSize: 120,
      letterSpacing: 3,
      x: 2441,
      baseline: 1230,
      align: 'right',
    },
  ]);

  const ADJUST_DEFAULTS = Object.freeze({
    brightness: { enabled: false, value: -20 },
    saturation: { enabled: false, value: -40 },
    blur: { enabled: false, value: 50 },
  });

  const els = {
    stageWrap: document.getElementById('stageWrap'),
    canvasShell: document.getElementById('canvasShell'),
    previewCanvas: document.getElementById('previewCanvas'),
    textOverlay: document.getElementById('textOverlay'),
    canvasLoading: document.getElementById('canvasLoading'),
    fileInput: document.getElementById('fileInput'),
    fontInput: document.getElementById('fontInput'),
    fileName: document.getElementById('fileName'),
    fileMeta: document.getElementById('fileMeta'),
    importBtn: document.getElementById('importBtn'),
    exportPngBtn: document.getElementById('exportPngBtn'),
    exportPsdBtn: document.getElementById('exportPsdBtn'),
    exportPngTile: document.getElementById('exportPngTile'),
    exportPsdTile: document.getElementById('exportPsdTile'),
    cropBtn: document.getElementById('cropBtn'),
    cropBtn2: document.getElementById('cropBtn2'),
    compareBtn: document.getElementById('compareBtn'),
    dropOverlay: document.getElementById('dropOverlay'),
    cropStateText: document.getElementById('cropStateText'),
    layerList: document.getElementById('layerList'),
    showAllTextBtn: document.getElementById('showAllTextBtn'),
    hideAllTextBtn: document.getElementById('hideAllTextBtn'),
    doubleOverlayRow: document.getElementById('doubleOverlayRow'),
    doubleOverlayToggle: document.getElementById('doubleOverlayToggle'),
    glowCard: document.getElementById('glowCard'),
    glowToggle: document.getElementById('glowToggle'),
    glowSwatches: document.getElementById('glowSwatches'),
    glowColorInput: document.getElementById('glowColorInput'),
    glowHex: document.getElementById('glowHex'),
    resetAdjustBtn: document.getElementById('resetAdjustBtn'),
    cropModal: document.getElementById('cropModal'),
    cropViewport: document.getElementById('cropViewport'),
    cropImage: document.getElementById('cropImage'),
    cropFrame: document.getElementById('cropFrame'),
    cropFrameSize: document.getElementById('cropFrameSize'),
    cropCloseBtn: document.getElementById('cropCloseBtn'),
    cropApplyBtn: document.getElementById('cropApplyBtn'),
    cropResetBtn: document.getElementById('cropResetBtn'),
    cropZoom: document.getElementById('cropZoom'),
    cropZoomIn: document.getElementById('cropZoomIn'),
    cropZoomOut: document.getElementById('cropZoomOut'),
    cropZoomValue: document.getElementById('cropZoomValue'),
    cropSourceInfo: document.getElementById('cropSourceInfo'),
    busyModal: document.getElementById('busyModal'),
    busyTitle: document.getElementById('busyTitle'),
    busyStatus: document.getElementById('busyStatus'),
    busyEyebrow: document.getElementById('busyEyebrow'),
    busyProgress: document.getElementById('busyProgress'),
    toastStack: document.getElementById('toastStack'),
    saveState: document.getElementById('saveState'),
    inspectorScroll: document.getElementById('inspectorScroll'),
    stagePanel: document.querySelector('.stage-panel'),
  };

  const state = {
    image: null,
    imageURL: '',
    imageName: '',
    imageType: 'JPEG',
    natural: { width: 0, height: 0 },
    crop: null,
    adjustments: cloneAdjustments(),
    layers: cloneLayers(),
    selectedLayerId: 'title',
    openLayerId: 'title',
    glow: true,
    glowColor: '#f4371c',
    doubleOverlay: true,
    customFonts: [],
    compare: false,
    preview: { displayW: 0, displayH: 0, renderScale: 1 },
    isExporting: false,
    initialized: false,
  };

  const cropSession = {
    open: false,
    mode: null,
    info: null,
    image: null,
    imgW: 0,
    imgH: 0,
    baseCrop: null,
    frame: { left: 0, top: 0, width: 0, height: 0 },
    view: { scale: 1, offsetX: 0, offsetY: 0 },
    initial: { scale: 1, offsetX: 0, offsetY: 0 },
    minScale: 1,
    maxScale: 4,
    drag: null,
    lastFocus: null,
  };

  const measureCanvas = document.createElement('canvas');
  measureCanvas.width = 32;
  measureCanvas.height = 32;
  const measureCtx = measureCanvas.getContext('2d');

  let scratchCanvas = document.createElement('canvas');
  let textCompositeCanvas = document.createElement('canvas');
  let previewQueued = false;
  let initialRenderDone = false;
  let fontTargetLayerId = null;
  let fileDragDepth = 0;
  let resizeTimer = 0;
  let cropResizeTimer = 0;

  const nextPaint = () =>
    new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const round = (value) => Math.round(value * 100) / 100;

  function normalizeHex(value) {
    const input = String(value || '').trim().toLowerCase();
    if (/^#[0-9a-f]{6}$/.test(input)) return input;
    if (/^#[0-9a-f]{3}$/.test(input)) {
      return `#${input[1]}${input[1]}${input[2]}${input[2]}${input[3]}${input[3]}`;
    }
    return null;
  }

  function hexToRgba(value, alpha = 1) {
    const hex = normalizeHex(value) || '#f4371c';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
  }

  function cloneAdjustments() {
    return {
      brightness: { ...ADJUST_DEFAULTS.brightness },
      saturation: { ...ADJUST_DEFAULTS.saturation },
      blur: { ...ADJUST_DEFAULTS.blur },
    };
  }

  function cloneLayers() {
    return DEFAULT_LAYERS.map((layer) => ({ ...layer }));
  }

  function getFontDef(id) {
    return (
      FONT_OPTIONS[id] ||
      state.customFonts.find((font) => font.id === id) ||
      FONT_OPTIONS.otsutome
    );
  }

  function fontCssForLayer(layer) {
    return getFontDef(layer.font).css;
  }

  function canvasFont(layer, scale) {
    void scale;
    return `700 ${Math.max(1, layer.fontSize)}px ${fontCssForLayer(layer)}`;
  }

  function formatSigned(value) {
    const number = Number(value);
    if (number < 0) return `−${Math.abs(number)}`;
    return String(number);
  }

  function isInputTarget(target) {
    return (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable)
    );
  }

  function revokeIfBlob(url) {
    if (url && String(url).startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        /* noop */
      }
    }
  }

  function fileBaseName() {
    const raw = (state.imageName || 'Karasu-Houkaiin').replace(/\.[^.]+$/, '');
    const safe = raw.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_').trim().slice(0, 70);
    return safe || 'Karasu-Houkaiin';
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }

  function toast(message, type = 'info', duration = 3400) {
    const node = document.createElement('div');
    node.className = `toast ${type === 'success' ? 'is-success' : ''}${type === 'warn' ? ' is-warn' : ''}`;
    const dot = document.createElement('span');
    dot.className = 'toast-dot';
    const text = document.createElement('span');
    text.textContent = message;
    node.append(dot, text);
    els.toastStack.append(node);

    window.setTimeout(() => {
      node.classList.add('is-out');
      window.setTimeout(() => node.remove(), 240);
    }, duration);
  }

  function setCanvasLoading(show, message = '正在显影') {
    if (!show) {
      els.canvasLoading.classList.add('is-hidden');
      return;
    }
    els.canvasLoading.classList.remove('is-hidden');
    const label = els.canvasLoading.querySelector('span:last-child');
    if (label) label.textContent = message;
  }

  function markChanged() {
    if (!els.saveState) return;
    els.saveState.innerHTML = '<span class="live-dot"></span><span>UPDATED</span>';
    els.saveState.animate(
      [
        { opacity: 0.45 },
        { opacity: 1 },
      ],
      { duration: 260, easing: 'ease-out' }
    );
  }

  /* ── Image loading ─────────────────────────────────────────── */

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('图片无法读取，请尝试 JPG、PNG 或 WEBP 格式。'));
      image.src = src;
    });
  }

  function mimeShortName(mime, fileName = '') {
    const lower = String(mime || '').toLowerCase();
    if (lower.includes('png')) return 'PNG';
    if (lower.includes('jpeg') || lower.includes('jpg')) return 'JPEG';
    if (lower.includes('webp')) return 'WEBP';
    if (lower.includes('gif')) return 'GIF';
    if (lower.includes('avif')) return 'AVIF';
    const extension = fileName.split('.').pop();
    return (extension || 'IMG').toUpperCase().slice(0, 5);
  }

  function isImageFile(file) {
    if (!file) return false;
    if (file.type && file.type.startsWith('image/')) {
      return !['image/svg+xml', 'image/svg'].includes(file.type.toLowerCase());
    }
    return /\.(jpe?g|png|webp|gif|avif)$/i.test(file.name || '');
  }

  async function readImageFile(file) {
    if (!isImageFile(file)) {
      throw new Error('请选择 JPG、PNG、WEBP、GIF 或 AVIF 图片。');
    }
    if (file.size > 60 * 1024 * 1024) {
      throw new Error('图片超过 60 MB，请压缩后再试。');
    }
    const url = URL.createObjectURL(file);
    try {
      const image = await loadImage(url);
      if (!image.naturalWidth || !image.naturalHeight) {
        throw new Error('图片尺寸无效。');
      }
      return {
        image,
        url,
        name: file.name || 'untitled.jpg',
        type: mimeShortName(file.type, file.name),
        size: file.size,
      };
    } catch (error) {
      revokeIfBlob(url);
      throw error;
    }
  }

  function fullCrop(image) {
    return {
      x: 0,
      y: 0,
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
    };
  }

  function centeredCoverCrop(image) {
    const iw = image.naturalWidth || image.width;
    const ih = image.naturalHeight || image.height;
    if (Math.abs(iw / ih - TARGET_RATIO) < 0.000001) {
      return { x: 0, y: 0, width: iw, height: ih };
    }
    if (iw / ih > TARGET_RATIO) {
      const width = ih * TARGET_RATIO;
      return { x: (iw - width) / 2, y: 0, width, height: ih };
    }
    const height = iw / TARGET_RATIO;
    return { x: 0, y: (ih - height) / 2, width: iw, height };
  }

  function normalizeCrop(rect, image = state.image) {
    if (!image) return null;
    const iw = image.naturalWidth || image.width;
    const ih = image.naturalHeight || image.height;
    const fallback = centeredCoverCrop(image);
    if (!rect || !Number.isFinite(rect.x) || !Number.isFinite(rect.y)) return fallback;
    const width = clamp(Number(rect.width) || fallback.width, 1, iw);
    const height = clamp(Number(rect.height) || fallback.height, 1, ih);
    const x = clamp(Number(rect.x) || 0, 0, Math.max(0, iw - width));
    const y = clamp(Number(rect.y) || 0, 0, Math.max(0, ih - height));
    return { x, y, width, height };
  }

  function isFullCrop(crop = state.crop) {
    if (!crop || !state.image) return true;
    const iw = state.natural.width;
    const ih = state.natural.height;
    return crop.x <= 1 && crop.y <= 1 && crop.width >= iw - 1 && crop.height >= ih - 1;
  }

  function ratioMatches(image) {
    const iw = image.naturalWidth || image.width;
    const ih = image.naturalHeight || image.height;
    return Math.abs(iw / ih - TARGET_RATIO) / TARGET_RATIO < 0.0015;
  }

  function updateImageMeta() {
    if (!state.image) return;
    els.fileName.textContent = state.imageName;
    els.fileMeta.textContent = `${state.natural.width} × ${state.natural.height} · ${state.imageType}`;
    if (isFullCrop()) {
      els.cropStateText.textContent = '整个画面 · 无裁切';
    } else {
      els.cropStateText.textContent = `${Math.round(state.crop.width)} × ${Math.round(state.crop.height)} 原图取景`;
    }
    document.title = `${fileBaseName()} · Karasu Houkaiin`;
  }

  async function commitSource(info, cropRect) {
    const previousURL = state.imageURL;
    const image = info.image;
    state.image = image;
    state.imageURL = info.url;
    state.imageName = info.name;
    state.imageType = info.type || mimeShortName('', info.name);
    state.natural = {
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
    };
    state.crop = normalizeCrop(cropRect, image);
    updateImageMeta();

    if (previousURL && previousURL !== info.url) revokeIfBlob(previousURL);

    layoutStage();
    queuePreview();
    initialRenderDone = false;
    setCanvasLoading(true, '正在显影');
  }

  async function handleIncomingFile(file) {
    if (!file) return;
    if (state.isExporting) {
      toast('正在导出，请稍候再导入新图片。', 'warn');
      return;
    }
    if (cropSession.open) {
      toast('请先完成当前裁切。', 'warn');
      return;
    }

    try {
      setCanvasLoading(true, '正在读取图片');
      const info = await readImageFile(file);
      if (ratioMatches(info.image)) {
        await commitSource(info, fullCrop(info.image));
        toast('图片比例匹配，已整图适配到 2560 × 1344。', 'success');
      } else {
        setCanvasLoading(false);
        openCropModal(info, 'upload');
        toast('图片比例不同，请框选 2560 × 1344 的取景范围。', 'info', 4200);
      }
    } catch (error) {
      setCanvasLoading(false);
      console.error(error);
      toast(error.message || '图片读取失败。', 'warn', 4600);
    } finally {
      if (els.fileInput) els.fileInput.value = '';
    }
  }

  /* ── Stage sizing / preview ────────────────────────────────── */

  function layoutStage() {
    const style = getComputedStyle(els.stageWrap);
    const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const stacked = window.matchMedia('(max-width: 980px)').matches;

    let availableWidth = Math.max(280, els.stageWrap.clientWidth - padX);
    let availableHeight = stacked
      ? Number.POSITIVE_INFINITY
      : Math.max(220, els.stageWrap.clientHeight - padY);

    const maxWidth = stacked ? availableWidth : Math.min(availableWidth, 1320);
    let width = Math.min(availableWidth, maxWidth);
    let height = width / TARGET_RATIO;

    if (Number.isFinite(availableHeight) && height > availableHeight) {
      height = availableHeight;
      width = height * TARGET_RATIO;
    }

    width = Math.max(280, Math.floor(width));
    height = Math.max(147, Math.round(width / TARGET_RATIO));

    els.canvasShell.style.width = `${width}px`;
    els.canvasShell.style.height = `${height}px`;
    state.preview.displayW = width;
    state.preview.displayH = height;
  }

  function queuePreview() {
    if (previewQueued) return;
    previewQueued = true;
    requestAnimationFrame(() => {
      previewQueued = false;
      renderPreview();
    });
  }

  function currentPreviewPixelWidth() {
    const cssWidth = state.preview.displayW || els.previewCanvas.clientWidth || 1280;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    return Math.min(1920, Math.max(760, Math.round(cssWidth * dpr)));
  }

  function renderPreview() {
    if (!state.image) return;
    const width = currentPreviewPixelWidth();
    const scale = width / TARGET.width;
    const height = Math.round(TARGET.height * scale);
    const canvas = els.previewCanvas;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: false });
    renderScene(ctx, scale, width, height, {
      drawText: !state.compare,
      filters: !state.compare,
    });

    state.preview.renderScale = scale;
    updateTextHitBoxes();
    els.textOverlay.style.visibility = state.compare ? 'hidden' : '';

    if (!initialRenderDone) {
      initialRenderDone = true;
      setCanvasLoading(false);
    }
  }

  function renderScene(ctx, scale, width, height, options = {}) {
    const { drawText = true, filters = true } = options;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0b0706';
    ctx.fillRect(0, 0, width, height);
    drawBackground(ctx, scale, width, height, filters);
    if (drawText) {
      const passes = state.doubleOverlay ? 2 : 1;
      for (const layer of state.layers) {
        compositeTextLayerOverlay(ctx, layer, scale, width, height, passes);
      }
    }
    ctx.restore();
  }

  function buildFilterString(scale, useFilters) {
    if (!useFilters) return 'none';
    const filters = [];
    if (state.adjustments.brightness.enabled) {
      filters.push(`brightness(${(100 + state.adjustments.brightness.value) / 100})`);
    }
    if (state.adjustments.saturation.enabled) {
      filters.push(`saturate(${(100 + state.adjustments.saturation.value) / 100})`);
    }
    if (state.adjustments.blur.enabled && state.adjustments.blur.value > 0) {
      filters.push(`blur(${state.adjustments.blur.value * scale}px)`);
    }
    return filters.length ? filters.join(' ') : 'none';
  }

  function drawBackground(ctx, scale, width, height, useFilters) {
    if (!state.image || !state.crop) return;
    const image = state.image;
    const crop = state.crop;
    const filter = buildFilterString(scale, useFilters);
    const blurPx =
      useFilters && state.adjustments.blur.enabled
        ? Math.max(0, state.adjustments.blur.value * scale)
        : 0;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (blurPx > 0.2) {
      const pad = Math.ceil(blurPx * 2.25) + 2;
      const tempWidth = width + pad * 2;
      const tempHeight = height + pad * 2;
      if (scratchCanvas.width < tempWidth || scratchCanvas.height < tempHeight) {
        scratchCanvas.width = tempWidth;
        scratchCanvas.height = tempHeight;
      }
      const tctx = scratchCanvas.getContext('2d', { alpha: true, willReadFrequently: false });
      tctx.setTransform(1, 0, 0, 1, 0, 0);
      tctx.clearRect(0, 0, tempWidth, tempHeight);
      tctx.imageSmoothingEnabled = true;
      tctx.imageSmoothingQuality = 'high';

      const sourcePadX = (pad * crop.width) / width;
      const sourcePadY = (pad * crop.height) / height;
      const expandedWidth = crop.width + sourcePadX * 2;
      const expandedHeight = crop.height + sourcePadY * 2;
      const sourceX = crop.x - sourcePadX;
      const sourceY = crop.y - sourcePadY;
      const sourceLeft = Math.max(0, sourceX);
      const sourceTop = Math.max(0, sourceY);
      const sourceRight = Math.min(state.natural.width, sourceX + expandedWidth);
      const sourceBottom = Math.min(state.natural.height, sourceY + expandedHeight);

      if (sourceRight > sourceLeft && sourceBottom > sourceTop) {
        const dx = ((sourceLeft - sourceX) / expandedWidth) * tempWidth;
        const dy = ((sourceTop - sourceY) / expandedHeight) * tempHeight;
        const dw = ((sourceRight - sourceLeft) / expandedWidth) * tempWidth;
        const dh = ((sourceBottom - sourceTop) / expandedHeight) * tempHeight;
        tctx.filter = filter === 'none' ? 'none' : filter;
        tctx.drawImage(
          image,
          sourceLeft,
          sourceTop,
          sourceRight - sourceLeft,
          sourceBottom - sourceTop,
          dx,
          dy,
          dw,
          dh
        );
        tctx.filter = 'none';
      }

      ctx.drawImage(scratchCanvas, 0, 0, tempWidth, tempHeight, -pad, -pad, tempWidth, tempHeight);
      return;
    }

    ctx.save();
    ctx.filter = filter;
    ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);
    ctx.restore();
  }

  function drawTextLayer(ctx, layer, scale) {
    if (!layer.visible || !layer.text) return;
    const lines = String(layer.text).split(/\r?\n/);
    if (!lines.some((line) => line.length)) return;

    const fontSize = Math.max(1, layer.fontSize * scale);
    const lineHeight = layer.fontSize * LINE_HEIGHT * scale;
    const x = layer.x * scale;
    const baseline = layer.baseline * scale;

    ctx.save();
    ctx.font = `700 ${fontSize}px ${fontCssForLayer(layer)}`;
    ctx.letterSpacing = `${(layer.letterSpacing || 0) * scale}px`;
    ctx.textAlign = layer.align === 'right' ? 'right' : 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 1;

    if (state.glow) {
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // A wide, soft halo plus a tighter, brighter halo keeps the chosen
      // colour readable over both dark and busy backgrounds.
      ctx.shadowColor = hexToRgba(state.glowColor, 0.8);
      ctx.shadowBlur = Math.max(6, layer.fontSize * 0.12) * scale;
      lines.forEach((line, index) => {
        if (line) ctx.fillText(line, x, baseline + index * lineHeight);
      });

      ctx.shadowColor = hexToRgba(state.glowColor, 0.56);
      ctx.shadowBlur = Math.max(3, layer.fontSize * 0.052) * scale;
      lines.forEach((line, index) => {
        if (line) ctx.fillText(line, x, baseline + index * lineHeight);
      });

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }

    lines.forEach((line, index) => {
      if (line) ctx.fillText(line, x, baseline + index * lineHeight);
    });
    ctx.restore();
  }

  function getTextRasterFrame(layer, scale, maxWidth, maxHeight) {
    if (!layer.visible || !String(layer.text || '').trim()) return null;
    const metrics = measureLayer(layer);
    const pad = state.glow ? Math.ceil(layer.fontSize * 0.2) + 12 : 8;
    const left = clamp(Math.floor((metrics.left - pad) * scale), 0, maxWidth - 1);
    const top = clamp(Math.floor((metrics.top - pad) * scale), 0, maxHeight - 1);
    const right = clamp(Math.ceil((metrics.right + pad) * scale), left + 1, maxWidth);
    const bottom = clamp(Math.ceil((metrics.bottom + pad) * scale), top + 1, maxHeight);
    const width = right - left;
    const height = bottom - top;
    if (width <= 0 || height <= 0) return null;
    return { left, top, width, height, metrics };
  }

  function compositeTextLayerOverlay(ctx, layer, scale, outputWidth, outputHeight, passes = 1) {
    const frame = getTextRasterFrame(layer, scale, outputWidth, outputHeight);
    if (!frame) return;

    if (
      textCompositeCanvas.width !== frame.width ||
      textCompositeCanvas.height !== frame.height
    ) {
      textCompositeCanvas.width = frame.width;
      textCompositeCanvas.height = frame.height;
    }
    const layerCtx = textCompositeCanvas.getContext('2d', { alpha: true });
    layerCtx.setTransform(1, 0, 0, 1, 0, 0);
    layerCtx.globalAlpha = 1;
    layerCtx.globalCompositeOperation = 'source-over';
    layerCtx.clearRect(0, 0, frame.width, frame.height);
    layerCtx.save();
    layerCtx.translate(-frame.left, -frame.top);
    drawTextLayer(layerCtx, layer, scale);
    layerCtx.restore();
    layerCtx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.save();
    ctx.globalCompositeOperation = TEXT_BLEND_MODE;
    for (let pass = 0; pass < Math.max(1, passes); pass += 1) {
      ctx.drawImage(
        textCompositeCanvas,
        0,
        0,
        frame.width,
        frame.height,
        frame.left,
        frame.top,
        frame.width,
        frame.height
      );
    }
    ctx.restore();
  }

  function measureLayer(layer) {
    const lines = String(layer.text || '').split(/\r?\n/);
    const lineHeight = layer.fontSize * LINE_HEIGHT;
    measureCtx.font = `700 ${Math.max(1, layer.fontSize)}px ${fontCssForLayer(layer)}`;
    measureCtx.letterSpacing = `${layer.letterSpacing || 0}px`;
    measureCtx.textAlign = 'left';
    measureCtx.textBaseline = 'alphabetic';

    let inkLeft = Number.POSITIVE_INFINITY;
    let inkTop = Number.POSITIVE_INFINITY;
    let inkRight = Number.NEGATIVE_INFINITY;
    let inkBottom = Number.NEGATIVE_INFINITY;
    let maxAdvance = 0;

    lines.forEach((line, index) => {
      const content = line || ' ';
      const metrics = measureCtx.measureText(content);
      const advance = metrics.width || 0;
      const ascent = Number.isFinite(metrics.actualBoundingBoxAscent)
        ? metrics.actualBoundingBoxAscent
        : layer.fontSize * 0.78;
      const descent = Number.isFinite(metrics.actualBoundingBoxDescent)
        ? metrics.actualBoundingBoxDescent
        : layer.fontSize * 0.2;
      const leftOffset = Number.isFinite(metrics.actualBoundingBoxLeft)
        ? metrics.actualBoundingBoxLeft
        : 0;
      const rightOffset = Number.isFinite(metrics.actualBoundingBoxRight)
        ? metrics.actualBoundingBoxRight
        : advance;

      const lineLeft = layer.align === 'right' ? layer.x - advance : layer.x;
      const lineTop = layer.baseline + index * lineHeight - ascent;

      inkLeft = Math.min(inkLeft, lineLeft - leftOffset);
      inkRight = Math.max(inkRight, lineLeft + rightOffset);
      inkTop = Math.min(inkTop, lineTop);
      inkBottom = Math.max(inkBottom, lineTop + ascent + descent);
      maxAdvance = Math.max(maxAdvance, advance);
    });

    if (!Number.isFinite(inkLeft)) {
      return {
        left: layer.x,
        top: layer.baseline - layer.fontSize,
        right: layer.x + layer.fontSize,
        bottom: layer.baseline,
        width: layer.fontSize,
        height: layer.fontSize,
        advance: layer.fontSize,
        lineHeight,
      };
    }

    return {
      left: inkLeft,
      top: inkTop,
      right: inkRight,
      bottom: inkBottom,
      width: Math.max(1, inkRight - inkLeft),
      height: Math.max(1, inkBottom - inkTop),
      advance: maxAdvance,
      lineHeight,
    };
  }

  function selectedLayer() {
    return state.layers.find((layer) => layer.id === state.selectedLayerId) || null;
  }

  /* ── Text hit areas / direct manipulation ──────────────────── */

  function buildTextHits() {
    for (const layer of state.layers) {
      const hit = document.createElement('div');
      hit.className = 'text-hit';
      hit.dataset.layerId = layer.id;
      hit.tabIndex = 0;
      hit.setAttribute('role', 'button');
      hit.setAttribute('aria-label', `文字图层 ${layer.short} ${layer.name}，可拖动位置`);

      const label = document.createElement('span');
      label.className = 'text-hit-label';
      label.innerHTML = '<span class="label-dot"></span>';
      const labelText = document.createElement('span');
      label.append(labelText);

      hit.append(label);
      for (const corner of ['tl', 'tr', 'bl', 'br']) {
        const handle = document.createElement('span');
        handle.className = `text-hit-corner ${corner}`;
        hit.append(handle);
      }

      hit.addEventListener('pointerdown', onTextPointerDown);
      hit.addEventListener('dblclick', () => {
        openLayer(layer.id, true);
        const textarea = layer._refs?.textarea;
        if (textarea) {
          textarea.focus();
          textarea.select();
        }
      });
      hit.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectLayer(layer.id, { open: true, scroll: true });
        }
      });
      hit.addEventListener('click', (event) => {
        event.stopPropagation();
      });

      layer._hit = hit;
      layer._label = labelText;
      els.textOverlay.append(hit);
    }
  }

  function updateTextHitBoxes() {
    for (const layer of state.layers) {
      const hit = layer._hit;
      if (!hit) continue;
      const hasText = layer.visible && String(layer.text).trim().length > 0;
      if (!hasText) {
        hit.style.display = 'none';
        continue;
      }
      const bounds = measureLayer(layer);
      const padding = clamp(layer.fontSize * 0.04, 5, 14);
      const left = clamp(bounds.left - padding, 0, TARGET.width);
      const top = clamp(bounds.top - padding, 0, TARGET.height);
      const right = clamp(bounds.right + padding, 0, TARGET.width);
      const bottom = clamp(bounds.bottom + padding, 0, TARGET.height);

      hit.style.display = '';
      hit.style.left = `${(left / TARGET.width) * 100}%`;
      hit.style.top = `${(top / TARGET.height) * 100}%`;
      hit.style.width = `${Math.max(0.5, ((right - left) / TARGET.width) * 100)}%`;
      hit.style.height = `${Math.max(0.5, ((bottom - top) / TARGET.height) * 100)}%`;
      hit.classList.toggle('is-selected', layer.id === state.selectedLayerId);
      if (layer._label) {
        layer._label.textContent = `${layer.short} · ${layer.name}`;
      }
    }
  }

  function onTextPointerDown(event) {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    const hit = event.currentTarget;
    const layer = state.layers.find((item) => item.id === hit.dataset.layerId);
    if (!layer) return;
    event.preventDefault();
    event.stopPropagation();

    selectLayer(layer.id, { open: true, scroll: false });

    const startX = event.clientX;
    const startY = event.clientY;
    const initialX = layer.x;
    const initialBaseline = layer.baseline;
    const displayWidth = state.preview.displayW || els.canvasShell.clientWidth || 1;
    const displayHeight = state.preview.displayH || els.canvasShell.clientHeight || 1;
    const designPerPixelX = TARGET.width / displayWidth;
    const designPerPixelY = TARGET.height / displayHeight;

    hit.classList.add('is-dragging');
    try {
      hit.setPointerCapture(event.pointerId);
    } catch {
      /* noop */
    }

    const onMove = (moveEvent) => {
      if (moveEvent.pointerId !== event.pointerId) return;
      let nextX = initialX + (moveEvent.clientX - startX) * designPerPixelX;
      let nextBaseline = initialBaseline + (moveEvent.clientY - startY) * designPerPixelY;
      const measured = measureLayer({ ...layer, x: nextX, baseline: nextBaseline });
      const pad = layer.fontSize * 0.05;
      if (layer.align === 'right') {
        nextX = clamp(nextX, Math.min(TARGET.width, measured.advance + pad), TARGET.width - 10);
      } else {
        nextX = clamp(nextX, 10, TARGET.width - measured.advance - pad);
      }
      nextBaseline = clamp(nextBaseline, layer.fontSize + 6, TARGET.height - 8);
      layer.x = round(nextX);
      layer.baseline = round(nextBaseline);
      updateLayerMeta(layer);
      updateTextHitBoxes();
      queuePreview();
      markChanged();
    };

    const finish = () => {
      hit.classList.remove('is-dragging');
      hit.removeEventListener('pointermove', onMove);
      hit.removeEventListener('pointerup', finish);
      hit.removeEventListener('pointercancel', finish);
      hit.removeEventListener('lostpointercapture', finish);
    };

    hit.addEventListener('pointermove', onMove);
    hit.addEventListener('pointerup', finish);
    hit.addEventListener('pointercancel', finish);
    hit.addEventListener('lostpointercapture', finish);
  }

  function selectLayer(id, { open = false, scroll = false } = {}) {
    const layer = state.layers.find((item) => item.id === id);
    if (!layer) return;
    state.selectedLayerId = id;
    if (open) state.openLayerId = id;
    syncLayerCards();
    updateTextHitBoxes();
    if (scroll && layer._card) {
      window.setTimeout(() => {
        layer._card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 70);
    }
  }

  function openLayer(id, forceOpen = false) {
    const layer = state.layers.find((item) => item.id === id);
    if (!layer) return;
    state.selectedLayerId = id;
    if (forceOpen) {
      state.openLayerId = id;
    } else {
      state.openLayerId = state.openLayerId === id ? null : id;
    }
    syncLayerCards();
    updateTextHitBoxes();
  }

  function updateLayerMeta(layer) {
    if (!layer?._refs?.posTag) return;
    layer._refs.posTag.textContent = `X ${Math.round(layer.x)} · Y ${Math.round(layer.baseline)}`;
    layer._refs.sizeInput.value = Math.round(layer.fontSize);
    if (layer._refs.spacingInput) {
      layer._refs.spacingInput.value = Number(layer.letterSpacing || 0)
        .toFixed(1)
        .replace(/\.0$/, '');
    }
    layer._refs.textarea.value = layer.text;
    if (layer._refs.preview && document.activeElement !== layer._refs.textarea) {
      layer._refs.preview.textContent = firstLine(layer.text);
    }
  }

  function firstLine(text) {
    const line = String(text || '').split(/\r?\n/).find((part) => part.trim());
    return line ? line.trim() : '未输入文字';
  }

  /* ── Layer UI ──────────────────────────────────────────────── */

  function fillFontSelect(select, selectedId) {
    select.innerHTML = '';
    for (const [id, font] of Object.entries(FONT_OPTIONS)) {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = font.note ? `${font.label} · ${font.note}` : font.label;
      select.append(option);
    }
    for (const font of state.customFonts) {
      const option = document.createElement('option');
      option.value = font.id;
      option.textContent = `${font.label} · 上传`;
      select.append(option);
    }
    const upload = document.createElement('option');
    upload.value = '__upload';
    upload.textContent = '＋ 上传新字体…';
    select.append(upload);
    select.value = selectedId && [...select.options].some((option) => option.value === selectedId)
      ? selectedId
      : 'otsutome';
  }

  function refreshAllFontSelects() {
    for (const layer of state.layers) {
      if (layer._refs?.fontSelect) {
        fillFontSelect(layer._refs.fontSelect, layer.font);
      }
    }
  }

  function buildLayerCards() {
    els.layerList.innerHTML = '';
    state.layers.forEach((layer) => {
      const card = document.createElement('article');
      card.className = 'layer-card';
      card.dataset.layerId = layer.id;

      card.innerHTML = `
        <div class="layer-head">
          <button class="layer-main" type="button" aria-expanded="false">
            <span class="layer-index">${layer.short}</span>
            <span class="layer-main-copy">
              <span class="layer-title-row">
                <strong>${layer.name}</strong>
                <span class="layer-align-tag">${layer.align === 'right' ? '右对齐' : '左对齐'}</span>
              </span>
              <span class="layer-preview-text"></span>
            </span>
          </button>
          <label class="switch layer-visibility" aria-label="显示或隐藏${layer.name}">
            <input class="layer-toggle" type="checkbox" ${layer.visible ? 'checked' : ''} />
            <span class="switch-track"></span>
          </label>
          <button class="layer-open-btn" type="button" aria-label="展开或收起${layer.name}">
            <svg viewBox="0 0 14 14" fill="none"><path d="m3.5 5.2 3.5 3.6 3.5-3.6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
        <div class="layer-editor">
          <label class="field">
            <span class="field-label">文字内容 <em>可输入多行</em></span>
            <textarea class="text-editor" rows="2" spellcheck="false"></textarea>
          </label>
          <div class="field-grid">
            <div class="field">
              <span class="field-label">字体 <em>FONT</em></span>
              <span class="select-wrap"><select class="font-select" aria-label="${layer.name}字体"></select></span>
            </div>
            <label class="field">
              <span class="field-label">字号 <em>SIZE</em></span>
              <span class="size-input-wrap"><input class="size-input" type="number" min="8" max="600" step="1" /><span>px</span></span>
            </label>
            <label class="field">
              <span class="field-label">字距 <em>TRACK</em></span>
              <span class="size-input-wrap"><input class="spacing-input" type="number" min="-30" max="100" step="0.5" /><span>px</span></span>
            </label>
          </div>
          <div class="layer-meta-row">
            <div class="layer-meta-tags">
              <span class="meta-tag">${layer.align === 'right' ? 'RIGHT' : 'LEFT'}</span>
              <span class="meta-tag blend-tag">OVERLAY</span>
              <span class="meta-tag"><span class="color-dot"></span>#FFFFFF</span>
              <span class="meta-tag pos-tag"></span>
            </div>
            <button class="layer-reset" type="button" title="恢复默认位置">重置位置</button>
          </div>
        </div>
      `;

      const query = (selector) => card.querySelector(selector);
      const refs = {
        main: query('.layer-main'),
        open: query('.layer-open-btn'),
        toggle: query('.layer-toggle'),
        textarea: query('.text-editor'),
        fontSelect: query('.font-select'),
        sizeInput: query('.size-input'),
        spacingInput: query('.spacing-input'),
        posTag: query('.pos-tag'),
        preview: query('.layer-preview-text'),
        reset: query('.layer-reset'),
      };

      refs.textarea.value = layer.text;
      refs.sizeInput.value = layer.fontSize;
      refs.spacingInput.value = layer.letterSpacing || 0;
      refs.preview.textContent = firstLine(layer.text);
      fillFontSelect(refs.fontSelect, layer.font);
      refs.posTag.textContent = `X ${Math.round(layer.x)} · Y ${Math.round(layer.baseline)}`;

      refs.main.addEventListener('click', () => {
        selectLayer(layer.id, { open: true });
      });
      refs.open.addEventListener('click', (event) => {
        event.stopPropagation();
        openLayer(layer.id);
      });
      refs.toggle.addEventListener('change', () => {
        layer.visible = refs.toggle.checked;
        syncLayerCards();
        updateTextHitBoxes();
        queuePreview();
        markChanged();
      });
      refs.textarea.addEventListener('input', () => {
        layer.text = refs.textarea.value;
        refs.preview.textContent = firstLine(layer.text);
        autoGrowTextarea(refs.textarea);
        updateTextHitBoxes();
        queuePreview();
        markChanged();
      });
      refs.fontSelect.addEventListener('change', () => {
        const value = refs.fontSelect.value;
        if (value === '__upload') {
          fontTargetLayerId = layer.id;
          refs.fontSelect.value = layer.font;
          els.fontInput.click();
          return;
        }
        layer.font = value;
        queuePreview();
        markChanged();
      });
      refs.sizeInput.addEventListener('input', () => {
        const value = Number(refs.sizeInput.value);
        if (!Number.isFinite(value) || value <= 0) return;
        layer.fontSize = clamp(value, 4, 600);
        updateTextHitBoxes();
        queuePreview();
        markChanged();
      });
      refs.sizeInput.addEventListener('blur', () => {
        refs.sizeInput.value = Math.round(clamp(layer.fontSize, 8, 600));
      });
      refs.spacingInput.addEventListener('input', () => {
        const value = Number(refs.spacingInput.value);
        if (!Number.isFinite(value)) return;
        layer.letterSpacing = clamp(value, -30, 100);
        updateTextHitBoxes();
        queuePreview();
        markChanged();
      });
      refs.spacingInput.addEventListener('blur', () => {
        refs.spacingInput.value = Number(layer.letterSpacing || 0).toFixed(1).replace(/\.0$/, '');
      });
      refs.reset.addEventListener('click', () => {
        const defaults = DEFAULT_LAYERS.find((item) => item.id === layer.id);
        if (!defaults) return;
        layer.x = defaults.x;
        layer.baseline = defaults.baseline;
        updateLayerMeta(layer);
        updateTextHitBoxes();
        queuePreview();
        markChanged();
        toast('已重置该文字的位置。', 'success', 2200);
        // Only the position is restored; typographic choices stay as edited.
      });

      refs.textarea.addEventListener('focus', () => {
        state.selectedLayerId = layer.id;
        syncLayerCards();
        updateTextHitBoxes();
      });

      layer._card = card;
      layer._refs = refs;
      els.layerList.append(card);
      autoGrowTextarea(refs.textarea);
    });

    syncLayerCards();
  }

  function autoGrowTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(110, Math.max(45, textarea.scrollHeight))}px`;
  }

  function syncLayerCards() {
    for (const layer of state.layers) {
      const card = layer._card;
      if (!card) continue;
      card.classList.toggle('is-selected', layer.id === state.selectedLayerId);
      card.classList.toggle('is-open', layer.id === state.openLayerId);
      card.classList.toggle('is-hidden-layer', !layer.visible);
      if (layer._refs) {
        layer._refs.toggle.checked = layer.visible;
        layer._refs.main.setAttribute('aria-expanded', layer.id === state.openLayerId ? 'true' : 'false');
        layer._refs.main.setAttribute(
          'aria-label',
          `${layer.name}，${layer.visible ? '可见' : '隐藏'}，${layer.id === state.openLayerId ? '收起' : '展开'}`
        );
      }
    }
    updateTextHitBoxes();
  }

  /* ── Adjustments UI ────────────────────────────────────────── */

  const adjustIds = {
    brightness: {
      toggle: 'brightnessToggle',
      range: 'brightnessRange',
      readout: 'brightnessReadout',
      unit: '',
    },
    saturation: {
      toggle: 'saturationToggle',
      range: 'saturationRange',
      readout: 'saturationReadout',
      unit: '',
    },
    blur: {
      toggle: 'blurToggle',
      range: 'blurRange',
      readout: 'blurReadout',
      unit: '',
    },
  };

  function updateAdjustmentUI() {
    for (const [key, ids] of Object.entries(adjustIds)) {
      const setting = state.adjustments[key];
      const toggle = document.getElementById(ids.toggle);
      const range = document.getElementById(ids.range);
      const readout = document.getElementById(ids.readout);
      const item = range.closest('.adjust-item');
      if (!toggle || !range || !readout) continue;
      toggle.checked = setting.enabled;
      range.value = setting.value;
      range.disabled = !setting.enabled;
      readout.textContent = key === 'blur' ? String(setting.value) : formatSigned(setting.value);
      item.classList.toggle('is-active', setting.enabled);
    }
  }

  function bindAdjustmentEvents() {
    for (const [key, ids] of Object.entries(adjustIds)) {
      const toggle = document.getElementById(ids.toggle);
      const range = document.getElementById(ids.range);
      if (!toggle || !range) continue;
      toggle.addEventListener('change', () => {
        state.adjustments[key].enabled = toggle.checked;
        range.disabled = !toggle.checked;
        updateAdjustmentUI();
        queuePreview();
        markChanged();
      });
      range.addEventListener('input', () => {
        state.adjustments[key].value = Number(range.value);
        updateAdjustmentUI();
        queuePreview();
        markChanged();
      });
    }

    els.resetAdjustBtn.addEventListener('click', () => {
      state.adjustments = cloneAdjustments();
      updateAdjustmentUI();
      queuePreview();
      markChanged();
      toast('影像处理已恢复为预设值，并全部关闭。', 'success', 2400);
    });
  }

  /* ── Crop modal ────────────────────────────────────────────── */

  function centerCoverCrop() {
    return centeredCoverCrop(cropSession.image);
  }

  function openCropModal(info, mode) {
    cropSession.open = true;
    cropSession.mode = mode;
    cropSession.info = info;
    cropSession.image = info.image;
    cropSession.imgW = info.image.naturalWidth || info.image.width;
    cropSession.imgH = info.image.naturalHeight || info.image.height;
    cropSession.baseCrop =
      mode === 'recrop' && state.crop
        ? normalizeCrop(state.crop, state.image)
        : centeredCoverCrop(info.image);
    cropSession.lastFocus = document.activeElement;

    els.cropImage.src = info.url;
    els.cropModal.classList.add('is-open');
    els.cropModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    els.cropZoom.value = '100';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        layoutCropModal();
        initCropView(cropSession.baseCrop);
        els.cropApplyBtn.focus({ preventScroll: true });
      });
    });
  }

  function closeCropModal({ afterApply = false } = {}) {
    if (!cropSession.open) return;
    const wasUpload = cropSession.mode === 'upload';
    const pendingURL = wasUpload ? cropSession.info?.url : null;
    cropSession.open = false;
    els.cropModal.classList.remove('is-open');
    els.cropModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    cropSession.drag = null;

    if (wasUpload && !afterApply) {
      revokeIfBlob(pendingURL);
      toast('已取消导入，继续保留当前画面。', 'info', 2600);
    }

    cropSession.mode = null;
    cropSession.info = null;
    cropSession.image = null;
    cropSession.baseCrop = null;
    cropSession.imgW = 0;
    cropSession.imgH = 0;

    if (cropSession.lastFocus && typeof cropSession.lastFocus.focus === 'function') {
      try {
        cropSession.lastFocus.focus({ preventScroll: true });
      } catch {
        /* noop */
      }
    }
  }

  function layoutCropModal() {
    if (!cropSession.open) return;
    const viewport = els.cropViewport;
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    if (vw <= 2 || vh <= 2) return;

    const width = Math.min(vw * 0.86, vh * 0.74 * TARGET_RATIO);
    const height = width / TARGET_RATIO;
    cropSession.frame = {
      left: (vw - width) / 2,
      top: (vh - height) / 2,
      width,
      height,
    };

    Object.assign(els.cropFrame.style, {
      left: `${cropSession.frame.left}px`,
      top: `${cropSession.frame.top}px`,
      width: `${cropSession.frame.width}px`,
      height: `${cropSession.frame.height}px`,
    });
    els.cropFrameSize.textContent = '2560 × 1344';
  }

  function initCropView(baseCrop) {
    if (!cropSession.open || !baseCrop) return;
    const frame = cropSession.frame;
    const baseScale = Math.max(0.00001, frame.width / baseCrop.width);
    cropSession.minScale = Math.max(frame.width / cropSession.imgW, frame.height / cropSession.imgH);
    cropSession.maxScale = Math.max(cropSession.minScale * 8, baseScale * 2);
    cropSession.view.scale = clamp(baseScale, cropSession.minScale, cropSession.maxScale);
    cropSession.view.offsetX = frame.left - baseCrop.x * cropSession.view.scale;
    cropSession.view.offsetY = frame.top - baseCrop.y * cropSession.view.scale;
    cropSession.initial = { ...cropSession.view };
    clampCropSourceView();
    els.cropZoom.min = '100';
    els.cropZoom.max = String(
      Math.max(400, Math.ceil((cropSession.maxScale / cropSession.minScale) * 100))
    );
    updateCropView();
  }

  function resetCropView() {
    if (!cropSession.open) return;
    if (cropSession.initial) {
      cropSession.view = { ...cropSession.initial };
    } else {
      const base = cropSession.baseCrop || centerCoverCrop();
      initCropView(base);
      return;
    }
    clampCropSourceView();
    updateCropView();
  }

  function clampCropSourceView() {
    if (!cropSession.open) return;
    const frame = cropSession.frame;
    const scaledW = cropSession.imgW * cropSession.view.scale;
    const scaledH = cropSession.imgH * cropSession.view.scale;
    const minOffsetX = frame.left + frame.width - scaledW;
    const maxOffsetX = frame.left;
    const minOffsetY = frame.top + frame.height - scaledH;
    const maxOffsetY = frame.top;
    cropSession.view.offsetX = clamp(cropSession.view.offsetX, Math.min(minOffsetX, maxOffsetX), maxOffsetX);
    cropSession.view.offsetY = clamp(cropSession.view.offsetY, Math.min(minOffsetY, maxOffsetY), maxOffsetY);
  }

  function updateCropView() {
    if (!cropSession.open) return;
    const { scale, offsetX, offsetY } = cropSession.view;
    const width = cropSession.imgW * scale;
    const height = cropSession.imgH * scale;
    Object.assign(els.cropImage.style, {
      width: `${width}px`,
      height: `${height}px`,
      left: `${offsetX}px`,
      top: `${offsetY}px`,
    });
    const zoomPercent = Math.round((scale / cropSession.minScale) * 100);
    const sliderMin = Number(els.cropZoom.min) || 100;
    const sliderMax = Number(els.cropZoom.max) || 400;
    els.cropZoom.value = String(clamp(zoomPercent, sliderMin, sliderMax));
    els.cropZoomValue.textContent = `${zoomPercent}%`;
    const sourceWidth = Math.round(cropSession.frame.width / scale);
    const sourceHeight = Math.round(cropSession.frame.height / scale);
    els.cropSourceInfo.textContent = `${sourceWidth} × ${sourceHeight} 原图取景`;
  }

  function cropScaleAt(newScale, anchorX, anchorY) {
    const frame = cropSession.frame;
    const scale = clamp(newScale, cropSession.minScale, cropSession.maxScale);
    if (!Number.isFinite(scale) || scale <= 0) return;
    const focusX = Number.isFinite(anchorX) ? anchorX : frame.left + frame.width / 2;
    const focusY = Number.isFinite(anchorY) ? anchorY : frame.top + frame.height / 2;
    const sourceX = (focusX - cropSession.view.offsetX) / cropSession.view.scale;
    const sourceY = (focusY - cropSession.view.offsetY) / cropSession.view.scale;
    cropSession.view.scale = scale;
    cropSession.view.offsetX = focusX - sourceX * scale;
    cropSession.view.offsetY = focusY - sourceY * scale;
    clampCropSourceView();
    updateCropView();
  }

  function getCropRectFromView() {
    if (!cropSession.open || !cropSession.image) return null;
    const frame = cropSession.frame;
    const { scale, offsetX, offsetY } = cropSession.view;
    let x = (frame.left - offsetX) / scale;
    let y = (frame.top - offsetY) / scale;
    let width = frame.width / scale;
    let height = frame.height / scale;
    x = clamp(x, 0, cropSession.imgW);
    y = clamp(y, 0, cropSession.imgH);
    width = clamp(width, 1, cropSession.imgW - x);
    height = clamp(height, 1, cropSession.imgH - y);
    return { x, y, width, height };
  }

  async function applyCrop() {
    if (!cropSession.open) return;
    const mode = cropSession.mode;
    const info = cropSession.info;
    const rect = getCropRectFromView();
    if (!rect || !info) return;

    const unchanged =
      mode === 'recrop' &&
      state.crop &&
      Math.abs(state.crop.x - rect.x) < 1 &&
      Math.abs(state.crop.y - rect.y) < 1 &&
      Math.abs(state.crop.width - rect.width) < 1 &&
      Math.abs(state.crop.height - rect.height) < 1;

    closeCropModal({ afterApply: true });
    if (mode === 'upload') {
      await commitSource(info, rect);
      toast('图片已载入，输出画布为 2560 × 1344。', 'success');
    } else if (!unchanged) {
      state.crop = normalizeCrop(rect, state.image);
      updateImageMeta();
      queuePreview();
      markChanged();
      toast('裁切范围已更新。', 'success', 2400);
    }
  }

  function cropPointerDown(event) {
    if (!cropSession.open) return;
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    event.preventDefault();
    els.cropViewport.classList.add('is-dragging');
    els.cropViewport.setPointerCapture(event.pointerId);
    cropSession.drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: cropSession.view.offsetX,
      offsetY: cropSession.view.offsetY,
    };
  }

  function cropPointerMove(event) {
    const drag = cropSession.drag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    cropSession.view.offsetX = drag.offsetX + (event.clientX - drag.startX);
    cropSession.view.offsetY = drag.offsetY + (event.clientY - drag.startY);
    clampCropSourceView();
    updateCropView();
  }

  function cropPointerUp(event) {
    const drag = cropSession.drag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    cropSession.drag = null;
    els.cropViewport.classList.remove('is-dragging');
    try {
      els.cropViewport.releasePointerCapture(event.pointerId);
    } catch {
      /* noop */
    }
  }

  function bindCropEvents() {
    els.cropBtn.addEventListener('click', () => {
      if (!state.image) return;
      openCropModal(
        {
          image: state.image,
          url: state.imageURL,
          name: state.imageName,
          type: state.imageType,
        },
        'recrop'
      );
    });
    els.cropBtn2.addEventListener('click', () => els.cropBtn.click());
    els.cropCloseBtn.addEventListener('click', () => closeCropModal());
    els.cropApplyBtn.addEventListener('click', applyCrop);
    els.cropResetBtn.addEventListener('click', resetCropView);

    els.cropViewport.addEventListener('pointerdown', cropPointerDown);
    els.cropViewport.addEventListener('pointermove', cropPointerMove);
    els.cropViewport.addEventListener('pointerup', cropPointerUp);
    els.cropViewport.addEventListener('pointercancel', cropPointerUp);

    els.cropViewport.addEventListener(
      'wheel',
      (event) => {
        if (!cropSession.open) return;
        event.preventDefault();
        const rect = els.cropViewport.getBoundingClientRect();
        const anchorX = event.clientX - rect.left;
        const anchorY = event.clientY - rect.top;
        const factor = Math.exp(-event.deltaY * 0.0016);
        cropScaleAt(cropSession.view.scale * factor, anchorX, anchorY);
      },
      { passive: false }
    );

    els.cropZoom.addEventListener('input', () => {
      const percent = Number(els.cropZoom.value);
      cropScaleAt(cropSession.minScale * (percent / 100));
    });
    els.cropZoomOut.addEventListener('click', () => cropScaleAt(cropSession.view.scale * 0.86));
    els.cropZoomIn.addEventListener('click', () => cropScaleAt(cropSession.view.scale * 1.16));

    window.addEventListener('resize', () => {
      window.clearTimeout(cropResizeTimer);
      cropResizeTimer = window.setTimeout(() => {
        if (!cropSession.open) return;
        const current = getCropRectFromView();
        layoutCropModal();
        if (current) initCropView(current);
      }, 100);
    });

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        if (cropSession.open) {
          event.preventDefault();
          closeCropModal();
          return;
        }
        if (state.isExporting) return;
        if (state.selectedLayerId) {
          state.selectedLayerId = null;
          syncLayerCards();
          updateTextHitBoxes();
        }
      }
    });
  }

  /* ── Fonts ─────────────────────────────────────────────────── */

  let baseFontLoadPromise = null;

  function baseFontAvailable() {
    return document.fonts.check(BASE_FONT_SPEC, BASE_FONT_SAMPLE);
  }

  function withTimeout(promise, timeoutMs, message) {
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error(message)), timeoutMs);
      promise.then(
        (value) => {
          window.clearTimeout(timer);
          resolve(value);
        },
        (error) => {
          window.clearTimeout(timer);
          reject(error);
        }
      );
    });
  }

  function retryFontUrl(url, tag) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}retry=${tag}-${Date.now().toString(36)}`;
  }

  async function loadBaseFontFace(url, format, timeoutMs) {
    const face = new FontFace(
      BASE_FONT_FAMILY,
      `url("${new URL(url, document.baseURI).href}") format("${format}")`,
      { style: 'normal', weight: '700' }
    );
    await withTimeout(face.load(), timeoutMs, `Otsutome ${format} load timed out`);
    document.fonts.add(face);
    if (face.status !== 'loaded') {
      throw new Error(`Otsutome ${format} face ended in state ${face.status}`);
    }
  }

  function ensureBaseFontLoaded() {
    if (baseFontLoadPromise) return baseFontLoadPromise;

    // Load the face explicitly instead of waiting on a CSS @font-face.
    // WebKit on iPadOS can mark a CSS font face as errored on a slow network
    // and then leave document.fonts.ready pending forever. A FontFace load
    // has a clear success/failure state and can be retried safely.
    baseFontLoadPromise = (async () => {
      const attempts = [
        { url: BASE_FONT_WOFF2, format: 'woff2', timeout: 25000 },
        { url: retryFontUrl(BASE_FONT_WOFF2, 'woff2'), format: 'woff2', timeout: 25000 },
        { url: retryFontUrl(BASE_FONT_TTF, 'ttf'), format: 'truetype', timeout: 30000 },
      ];

      for (const attempt of attempts) {
        try {
          await loadBaseFontFace(attempt.url, attempt.format, attempt.timeout);
          return true;
        } catch (error) {
          console.warn(`Otsutome ${attempt.format} attempt failed:`, error);
        }
      }
      return false;
    })();

    return baseFontLoadPromise;
  }

  function runFontUpgradeBurst(initialFontReady) {
    // iPadOS can render the first Canvas frame with the fallback face even
    // after the webfont is loaded. Redraw synchronously several times so the
    // final frame, hit boxes and exported preview all use Otsutome.
    const redraw = () => {
      if (state.initialized) renderPreview();
    };
    redraw();
    window.setTimeout(redraw, 350);
    window.setTimeout(redraw, 1200);
    window.setTimeout(() => {
      redraw();
      document.documentElement.dataset.font = 'ready';
      if (!initialFontReady) {
        toast('Otsutome 字体已载入，画布已更新。', 'success', 2800);
      }
    }, 2400);
  }

  async function ensureFontsForLayers() {
    if (state.layers.some((layer) => layer.visible && layer.font === 'otsutome')) {
      await ensureBaseFontLoaded();
    }
    const loads = [];
    for (const layer of state.layers) {
      if (!layer.visible) continue;
      try {
        loads.push(
          document.fonts.load(
            `700 100px ${fontCssForLayer(layer)}`,
            String(layer.text || 'Karasu Houkaiin')
          )
        );
      } catch {
        /* noop */
      }
    }
    await Promise.allSettled(loads);
    try {
      await document.fonts.ready;
    } catch {
      /* noop */
    }
  }

  async function handleFontUpload(file) {
    if (!file) return;
    const targetId = fontTargetLayerId || state.selectedLayerId;
    const targetLayer = state.layers.find((layer) => layer.id === targetId) || selectedLayer();
    if (!targetLayer) return;

    try {
      toast('正在载入字体…', 'info', 1800);
      const buffer = await file.arrayBuffer();
      const family = `KHFont_${Date.now().toString(36)}`;
      const face = new FontFace(family, buffer, { weight: '700', style: 'normal' });
      await face.load();
      document.fonts.add(face);
      const cleanLabel = file.name.replace(/\.[^.]+$/, '').slice(0, 34) || '自定义字体';
      const font = {
        id: `custom-${Date.now()}`,
        label: cleanLabel,
        family,
        css: `"${family}"`,
        ps: `${cleanLabel.replace(/[^\w-]+/g, '') || 'CustomFont'}-Bold`,
        note: '上传',
      };
      state.customFonts.push(font);
      targetLayer.font = font.id;
      refreshAllFontSelects();
      await ensureFontsForLayers();
      updateTextHitBoxes();
      renderPreview();
      window.setTimeout(() => {
        if (state.initialized) renderPreview();
      }, 300);
      markChanged();
      toast(`字体「${cleanLabel}」已载入并应用到${targetLayer.name}。`, 'success', 3800);
    } catch (error) {
      console.error(error);
      toast('这个字体文件无法载入，请换一个 TTF / OTF / WOFF2 文件。', 'warn', 4300);
    } finally {
      fontTargetLayerId = null;
      els.fontInput.value = '';
    }
  }

  /* ── Export ────────────────────────────────────────────────── */

  function showBusy(title, status, eyebrow = 'RENDERING', progress = 5) {
    els.busyEyebrow.textContent = eyebrow;
    els.busyTitle.textContent = title;
    els.busyStatus.textContent = status;
    els.busyProgress.style.width = `${progress}%`;
    els.busyModal.classList.add('is-open');
    els.busyModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }

  function updateBusy(status, progress) {
    if (status) els.busyStatus.textContent = status;
    if (Number.isFinite(progress)) els.busyProgress.style.width = `${progress}%`;
  }

  function hideBusy() {
    els.busyModal.classList.remove('is-open');
    els.busyModal.setAttribute('aria-hidden', 'true');
    if (!els.cropModal.classList.contains('is-open')) {
      document.body.classList.remove('modal-open');
    }
  }

  function createFullCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = TARGET.width;
    canvas.height = TARGET.height;
    const ctx = canvas.getContext('2d', { alpha: false });
    renderScene(ctx, 1, TARGET.width, TARGET.height, { drawText: true, filters: true });
    return canvas;
  }

  function canvasToBlob(canvas, type = 'image/png') {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('画布导出失败。'));
      }, type);
    });
  }

  async function exportPNG() {
    if (!state.image || state.isExporting) return;
    state.isExporting = true;
    try {
      showBusy('正在生成 PNG', '准备字体与 2560 × 1344 画布…', 'PNG EXPORT', 8);
      await nextPaint();
      await ensureFontsForLayers();
      updateBusy('绘制影像处理与文字叠加…', 34);
      await nextPaint();
      const canvas = createFullCanvas();
      updateBusy('编码无损 PNG…', 74);
      await nextPaint();
      const blob = await canvasToBlob(canvas, 'image/png');
      const filename = `${fileBaseName()}_2560x1344.png`;
      downloadBlob(blob, filename);
      updateBusy('已完成，正在下载…', 100);
      await sleep(420);
      hideBusy();
      toast(`PNG 已导出 · ${filename}`, 'success', 4200);
      markChanged();
    } catch (error) {
      console.error(error);
      hideBusy();
      toast(`PNG 导出失败：${error.message || '未知错误'}`, 'warn', 5000);
    } finally {
      state.isExporting = false;
      await nextPaint();
      hideBusy();
    }
  }

  function psdFontName(layer) {
    return getFontDef(layer.font).ps || 'Arial-BoldMT';
  }

  function makePsdTextLayer(layer, copyIndex = 0, copyCount = 1) {
    const metrics = measureLayer(layer);
    const frame = getTextRasterFrame(layer, 1, TARGET.width, TARGET.height);
    if (!frame) return null;
    const { left, top, width, height } = frame;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: true });
    ctx.clearRect(0, 0, width, height);
    ctx.translate(-left, -top);
    drawTextLayer(ctx, layer, 1);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const anchorX =
      layer.align === 'right' ? Math.max(0, layer.x - metrics.advance) : layer.x;
    const fontName = psdFontName(layer);

    const copyLabel = copyCount > 1 ? ` · Overlay ${copyIndex + 1}/${copyCount}` : '';
    return {
      name: `${layer.short} ${layer.name} / ${firstLine(layer.text).slice(0, 42)}${copyLabel}`,
      canvas,
      left,
      top,
      right: left + width,
      bottom: top + height,
      blendMode: TEXT_BLEND_MODE,
      opacity: layer.visible ? 1 : 0,
      hidden: !layer.visible,
      text: {
        text: String(layer.text),
        transform: [1, 0, 0, 1, anchorX, layer.baseline],
        orientation: 'horizontal',
        antiAlias: 'smooth',
        gridding: 'none',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        style: {
          font: { name: fontName, script: 0, type: 1, synthetic: 0 },
          fontSize: layer.fontSize,
          fauxBold: false,
          fauxItalic: false,
          autoLeading: true,
          leading: layer.fontSize * (LINE_HEIGHT - 1),
          horizontalScale: 1,
          verticalScale: 1,
          tracking: Math.round(((layer.letterSpacing || 0) / layer.fontSize) * 1000),
          autoKerning: true,
          kerning: 0,
          baselineShift: 0,
          fillColor: { r: 255, g: 255, b: 255 },
          fillFlag: true,
          strokeFlag: false,
          language: 14,
        },
        paragraphStyle: {
          justification: 'left',
          autoLeading: 1.12,
          everyLineComposer: false,
        },
      },
    };
  }

  async function exportPSD() {
    if (!state.image || state.isExporting) return;
    if (!window.agPsd || typeof window.agPsd.writePsd !== 'function') {
      toast('PSD 引擎未能载入，请刷新页面后重试。', 'warn', 5000);
      return;
    }
    state.isExporting = true;
    try {
      showBusy('正在整理 PSD', '准备背景图层与可编辑文字层…', 'PSD EXPORT', 7);
      await nextPaint();
      await ensureFontsForLayers();
      updateBusy('绘制 2560 × 1344 背景…', 24);
      await nextPaint();

      const backgroundCanvas = document.createElement('canvas');
      backgroundCanvas.width = TARGET.width;
      backgroundCanvas.height = TARGET.height;
      const backgroundCtx = backgroundCanvas.getContext('2d', { alpha: false });
      backgroundCtx.fillStyle = '#0b0706';
      backgroundCtx.fillRect(0, 0, TARGET.width, TARGET.height);
      drawBackground(backgroundCtx, 1, TARGET.width, TARGET.height, true);

      updateBusy('生成文字图层与合成预览…', 47);
      await nextPaint();

      const compositeCanvas = createFullCanvas();
      const children = [
        {
          name: '背景 / Artwork',
          canvas: backgroundCanvas,
          left: 0,
          top: 0,
          right: TARGET.width,
          bottom: TARGET.height,
          blendMode: 'normal',
        },
      ];

      const overlayCopies = state.doubleOverlay ? 2 : 1;
      for (const layer of state.layers) {
        if (!layer.visible || !String(layer.text).trim()) continue;
        for (let copy = 0; copy < overlayCopies; copy += 1) {
          const textLayer = makePsdTextLayer(layer, copy, overlayCopies);
          if (textLayer) children.push(textLayer);
        }
      }

      const psd = {
        width: TARGET.width,
        height: TARGET.height,
        children,
        canvas: compositeCanvas,
        imageResources: {
          resolutionInfo: {
            horizontalResolution: 72,
            horizontalResolutionUnit: 'PPI',
            verticalResolution: 72,
            verticalResolutionUnit: 'PPI',
            widthUnit: 'Inches',
            heightUnit: 'Inches',
          },
        },
      };

      updateBusy('写入 PSD 图层与文字数据…', 68);
      await nextPaint();
      await sleep(30);

      const buffer = window.agPsd.writePsd(psd, {
        generateThumbnail: true,
        logMissingFeatures: false,
      });
      updateBusy('封装文件…', 94);
      await nextPaint();
      const blob = new Blob([buffer], { type: 'image/vnd.adobe.photoshop' });
      const filename = `${fileBaseName()}_2560x1344.psd`;
      const visibleTextLayers = children.length - 1;
      downloadBlob(blob, filename);
      updateBusy('已完成，正在下载…', 100);
      await sleep(500);
      hideBusy();
      toast(
        `PSD 已导出 · ${filename}（背景 + ${visibleTextLayers} 个可编辑文字层）`,
        'success',
        5200
      );
      if (state.glow) {
        window.setTimeout(() => {
          toast('提示：在 Photoshop 中编辑文字前，请先安装随附的 Otsutome Font。', 'info', 5600);
        }, 3800);
      }
      markChanged();
    } catch (error) {
      console.error(error);
      hideBusy();
      toast(`PSD 导出失败：${error.message || '未知错误'}`, 'warn', 5200);
    } finally {
      state.isExporting = false;
      await nextPaint();
      hideBusy();
    }
  }

  /* ── Import, compare, drag & drop ──────────────────────────── */

  function bindImportEvents() {
    els.importBtn.addEventListener('click', () => els.fileInput.click());
    els.fileInput.addEventListener('change', () => {
      const file = els.fileInput.files?.[0];
      if (file) handleIncomingFile(file);
    });
    els.fontInput.addEventListener('change', () => {
      const file = els.fontInput.files?.[0];
      if (file) handleFontUpload(file);
    });

    window.addEventListener('dragenter', (event) => {
      if (!event.dataTransfer || !Array.from(event.dataTransfer.types || []).includes('Files')) return;
      event.preventDefault();
      fileDragDepth += 1;
      els.dropOverlay.classList.add('is-active');
    });

    window.addEventListener('dragover', (event) => {
      if (!event.dataTransfer || !Array.from(event.dataTransfer.types || []).includes('Files')) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      els.dropOverlay.classList.add('is-active');
    });

    window.addEventListener('dragleave', (event) => {
      if (!event.dataTransfer) return;
      fileDragDepth = Math.max(0, fileDragDepth - 1);
      if (fileDragDepth === 0) {
        els.dropOverlay.classList.remove('is-active');
      }
    });

    window.addEventListener('drop', (event) => {
      if (!event.dataTransfer?.files?.length) return;
      event.preventDefault();
      fileDragDepth = 0;
      els.dropOverlay.classList.remove('is-active');
      const file = event.dataTransfer.files[0];
      if (file) handleIncomingFile(file);
    });

    window.addEventListener('paste', (event) => {
      if (isInputTarget(event.target)) return;
      const items = event.clipboardData?.items || [];
      for (const item of items) {
        if (item.type?.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            handleIncomingFile(file);
            return;
          }
        }
      }
    });
  }

  function bindCompare() {
    const start = (event) => {
      if (state.isExporting) return;
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      state.compare = true;
      els.compareBtn.classList.add('is-holding');
      els.textOverlay.style.visibility = 'hidden';
      try {
        els.compareBtn.setPointerCapture(event.pointerId);
      } catch {
        /* noop */
      }
      queuePreview();
    };
    const end = () => {
      if (!state.compare) return;
      state.compare = false;
      els.compareBtn.classList.remove('is-holding');
      els.textOverlay.style.visibility = '';
      queuePreview();
    };
    els.compareBtn.addEventListener('pointerdown', start);
    els.compareBtn.addEventListener('pointerup', end);
    els.compareBtn.addEventListener('pointercancel', end);
    els.compareBtn.addEventListener('lostpointercapture', end);
    window.addEventListener('pointerup', (event) => {
      if (event.target !== els.compareBtn) end();
    });
  }

  function syncGlowUI() {
    const hex = normalizeHex(state.glowColor) || '#f4371c';
    state.glowColor = hex;
    if (els.glowToggle) els.glowToggle.checked = state.glow;
    if (els.glowCard) els.glowCard.classList.toggle('is-muted', !state.glow);
    if (els.glowColorInput) els.glowColorInput.value = hex;
    if (els.glowHex) els.glowHex.textContent = hex.toUpperCase();

    let matchedPreset = false;
    if (els.glowSwatches) {
      for (const button of els.glowSwatches.querySelectorAll('.glow-swatch')) {
        const matches = String(button.dataset.color || '').toLowerCase() === hex;
        button.classList.toggle('is-active', matches);
        button.setAttribute('aria-pressed', matches ? 'true' : 'false');
        matchedPreset = matchedPreset || matches;
      }
    }
    const picker = els.glowColorInput?.closest('.glow-picker');
    if (picker) picker.classList.toggle('is-active', !matchedPreset);
  }

  function setGlowColor(value, { enable = true } = {}) {
    const hex = normalizeHex(value);
    if (!hex) return;
    state.glowColor = hex;
    if (enable) state.glow = true;
    syncGlowUI();
    queuePreview();
    markChanged();
  }

  function syncOverlayStackUI() {
    const enabled = state.doubleOverlay;
    if (els.doubleOverlayToggle) els.doubleOverlayToggle.checked = enabled;
    if (els.doubleOverlayRow) els.doubleOverlayRow.classList.toggle('is-active', enabled);
    const label = enabled ? 'OVERLAY ×2' : 'OVERLAY ×1';
    for (const tag of document.querySelectorAll('.blend-tag')) {
      tag.textContent = label;
    }
  }

  function bindTextEvents() {
    els.showAllTextBtn.addEventListener('click', () => {
      for (const layer of state.layers) layer.visible = true;
      syncLayerCards();
      updateTextHitBoxes();
      queuePreview();
      markChanged();
    });
    els.hideAllTextBtn.addEventListener('click', () => {
      for (const layer of state.layers) layer.visible = false;
      syncLayerCards();
      updateTextHitBoxes();
      queuePreview();
      markChanged();
    });
    if (els.doubleOverlayToggle) {
      els.doubleOverlayToggle.addEventListener('change', () => {
        state.doubleOverlay = els.doubleOverlayToggle.checked;
        syncOverlayStackUI();
        queuePreview();
        markChanged();
      });
    }
    els.glowToggle.addEventListener('change', () => {
      state.glow = els.glowToggle.checked;
      syncGlowUI();
      queuePreview();
      markChanged();
    });
    if (els.glowSwatches) {
      els.glowSwatches.addEventListener('click', (event) => {
        const button = event.target.closest('.glow-swatch');
        if (!button) return;
        setGlowColor(button.dataset.color, { enable: true });
      });
    }
    if (els.glowColorInput) {
      els.glowColorInput.addEventListener('input', () => {
        setGlowColor(els.glowColorInput.value, { enable: true });
      });
    }
    els.previewCanvas.addEventListener('pointerdown', () => {
      if (!state.compare) {
        state.selectedLayerId = null;
        syncLayerCards();
        updateTextHitBoxes();
      }
    });
    window.addEventListener('keydown', (event) => {
      if (cropSession.open) return;
      if (isInputTarget(event.target)) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (event.shiftKey) exportPSD();
        else exportPNG();
        return;
      }
      if (!state.selectedLayerId) return;
      const layer = selectedLayer();
      if (!layer || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        return;
      }
      event.preventDefault();
      const amount = event.shiftKey ? 10 : 1;
      if (event.key === 'ArrowLeft') layer.x -= amount;
      if (event.key === 'ArrowRight') layer.x += amount;
      if (event.key === 'ArrowUp') layer.baseline -= amount;
      if (event.key === 'ArrowDown') layer.baseline += amount;
      layer.x = Math.round(layer.x);
      layer.baseline = Math.round(layer.baseline);
      updateLayerMeta(layer);
      updateTextHitBoxes();
      queuePreview();
      markChanged();
    });
  }

  function bindExportButtons() {
    for (const button of [els.exportPngBtn, els.exportPngTile]) {
      button.addEventListener('click', exportPNG);
    }
    for (const button of [els.exportPsdBtn, els.exportPsdTile]) {
      button.addEventListener('click', exportPSD);
    }
  }

  function bindStageResize() {
    window.addEventListener('resize', () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        layoutStage();
        queuePreview();
      }, 90);
    });
    window.addEventListener('orientationchange', () => {
      window.setTimeout(() => {
        layoutStage();
        queuePreview();
      }, 220);
    });
  }

  /* ── Init ──────────────────────────────────────────────────── */

  async function init() {
    bindImportEvents();
    bindAdjustmentEvents();
    bindCropEvents();
    bindCompare();
    bindTextEvents();
    bindExportButtons();
    bindStageResize();

    buildTextHits();
    buildLayerCards();
    updateAdjustmentUI();
    syncGlowUI();
    syncOverlayStackUI();
    layoutStage();
    document.documentElement.dataset.font = 'loading';
    setCanvasLoading(true, '正在载入字体与画面');

    // Start the font request immediately and load the artwork in parallel.
    // Do not block the editor forever on a slow iPad font download; the
    // watcher below redraws as soon as the face becomes available.
    const fontTask = ensureBaseFontLoaded();

    try {
      const sample = await loadImage(SAMPLE_SRC);
      await Promise.race([fontTask, sleep(2000)]);
      const initialFontReady = baseFontAvailable();

      await commitSource(
        {
          image: sample,
          url: SAMPLE_SRC,
          name: SAMPLE_NAME,
          type: 'JPEG',
        },
        centeredCoverCrop(sample)
      );
      initialRenderDone = false;
      queuePreview();
      state.initialized = true;

      const slowFontNotice = window.setTimeout(() => {
        if (document.documentElement.dataset.font !== 'ready') {
          toast('Otsutome 字体仍在载入，完成后会自动更新画布。', 'info', 4200);
        }
      }, 10000);

      fontTask
        .then((ready) => {
          window.clearTimeout(slowFontNotice);
          if (!ready) {
            document.documentElement.dataset.font = 'error';
            toast('Otsutome 字体加载失败，请检查网络后刷新页面。', 'warn', 6000);
            return;
          }
          runFontUpgradeBurst(initialFontReady);
        })
        .catch((error) => {
          window.clearTimeout(slowFontNotice);
          console.warn('Otsutome font could not be applied:', error);
          document.documentElement.dataset.font = 'error';
          toast('Otsutome 字体加载失败，请检查网络后刷新页面。', 'warn', 6000);
        });
    } catch (error) {
      console.error(error);
      setCanvasLoading(false);
      toast('示例图片未能载入。请通过「导入图片」选择一张图片开始。', 'warn', 6000);
    }

    if (state.initialized) {
      window.setTimeout(() => {
        toast('示例已就绪 · 可直接拖拽文字，或重新裁切画面。', 'success', 3200);
      }, 650);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
