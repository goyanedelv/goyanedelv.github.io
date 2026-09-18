/* ============================================================
   Laboratorio RNA — utilidades compartidas
   Curso: Redes Neuronales Artificiales
   ============================================================ */
(function (global) {
    'use strict';

    // ---------------------------------------------------------
    // Paleta (espejo de las variables CSS, para uso en canvas)
    // ---------------------------------------------------------
    const PALETTE = {
        series: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#9085e9'],
        seq: ['#cde2fb', '#86b6ef', '#3987e5', '#1c5cab', '#0d366b'],
        divNeg: [57, 135, 229],   // azul
        divMid: [56, 56, 53],     // gris neutro
        divPos: [227, 73, 72],    // rojo
        surface: '#0b1220',
        grid: 'rgba(148, 163, 184, 0.16)',
        tick: '#94a3b8',
        ink: '#f8fafc',
        muted: '#64748b'
    };

    // ---------------------------------------------------------
    // KaTeX
    // ---------------------------------------------------------
    const KATEX_OPTS = {
        delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '\\[', right: '\\]', display: true },
            { left: '\\(', right: '\\)', display: false }
        ],
        throwOnError: false,
        trust: false
    };

    let katexReady = false;
    const katexQueue = [];

    function renderMath(el) {
        const target = el || document.body;
        if (!katexReady) { katexQueue.push(target); return; }
        if (global.renderMathInElement) {
            try { global.renderMathInElement(target, KATEX_OPTS); } catch (e) { /* no bloquea la página */ }
        }
    }

    // Llamado por el onload del script de auto-render de KaTeX.
    global.initKaTeX = function () {
        katexReady = true;
        renderMath(document.body);
        while (katexQueue.length) renderMath(katexQueue.shift());
    };

    // ---------------------------------------------------------
    // Formato numérico
    // ---------------------------------------------------------
    const fmt = (x, d) => {
        if (!isFinite(x)) return x > 0 ? '∞' : (x < 0 ? '−∞' : 'NaN');
        const n = (d === undefined ? 2 : d);
        const s = x.toFixed(n);
        return s === '-' + (0).toFixed(n) ? (0).toFixed(n) : s;
    };
    const fmtInt = (x) => Math.round(x).toLocaleString('es-CL');
    const sci = (x, d = 2) => {
        if (x === 0) return '0';
        const a = Math.abs(x);
        if (a >= 1e-3 && a < 1e5) return fmt(x, d);
        return x.toExponential(d).replace('e', '·10^');
    };

    // ---------------------------------------------------------
    // Escalas de color
    // ---------------------------------------------------------
    const lerp = (a, b, t) => a + (b - a) * t;
    const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

    function hexToRgb(hex) {
        const h = hex.replace('#', '');
        return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    const rgbStr = (c, a) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a === undefined ? 1 : a})`;

    /** Rampa secuencial azul: t ∈ [0,1] → color. t=0 se acerca a la superficie. */
    function seqColor(t) {
        const stops = PALETTE.seq.map(hexToRgb);
        const x = clamp(t, 0, 1) * (stops.length - 1);
        const i = Math.min(stops.length - 2, Math.floor(x));
        const f = x - i;
        return rgbStr([0, 1, 2].map(k => lerp(stops[i][k], stops[i + 1][k], f)));
    }

    /** Rampa divergente azul↔rojo con gris al medio: v ∈ [-m, m] → color. */
    function divColor(v, m) {
        const t = clamp(m === 0 ? 0 : v / m, -1, 1);
        const from = t < 0 ? PALETTE.divNeg : PALETTE.divPos;
        const f = Math.abs(t);
        return rgbStr([0, 1, 2].map(k => lerp(PALETTE.divMid[k], from[k], f)));
    }

    /** Tinta legible sobre un fondo dado (blanco o casi negro). */
    function inkOn(bgCss) {
        const m = bgCss.match(/\d+(\.\d+)?/g);
        if (!m) return PALETTE.ink;
        const [r, g, b] = m.map(Number);
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return lum > 0.58 ? '#0b1220' : '#f8fafc';
    }

    // ---------------------------------------------------------
    // Canvas con soporte HiDPI y redimensionado
    // ---------------------------------------------------------
    const canvasHooks = new Map();

    /**
     * Prepara un <canvas> para dibujo nítido: ajusta el buffer al tamaño CSS
     * multiplicado por devicePixelRatio y devuelve el contexto ya escalado.
     * Registra `draw` para re-ejecutarse al redimensionar la ventana.
     */
    function fitCanvas(canvas, draw) {
        if (typeof canvas === 'string') canvas = document.getElementById(canvas);
        if (!canvas) return null;
        if (draw) canvasHooks.set(canvas, draw);

        const dpr = Math.min(global.devicePixelRatio || 1, 2);
        const rect = canvas.getBoundingClientRect();
        // Si la pestaña está oculta el ancho es 0: conservamos el último válido.
        const cssW = rect.width || canvas._lastW || 450;
        const cssH = parseFloat(canvas.dataset.height || '0') || (cssW * (parseFloat(canvas.dataset.ratio || '0.62')));
        canvas._lastW = cssW;

        canvas.style.height = cssH + 'px';
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);

        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return { ctx, W: cssW, H: cssH };
    }

    function redrawAll() {
        canvasHooks.forEach((draw) => { try { draw(); } catch (e) { /* ignora */ } });
    }

    let resizeTimer = null;
    global.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(redrawAll, 120);
    });

    // ---------------------------------------------------------
    // Chart.js: tema y fábrica
    // ---------------------------------------------------------
    /**
     * Resuelve `var(--x)` a su valor real. El lienzo no entiende variables CSS:
     * hay que darle el color ya calculado.
     */
    const cssCache = new Map();
    function cssVar(name) {
        if (cssCache.has(name)) return cssCache.get(name);
        const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        cssCache.set(name, v || name);
        return v || name;
    }
    function resolveColor(c) {
        if (typeof c === 'string') {
            const m = c.match(/^var\((--[\w-]+)\)$/);
            return m ? cssVar(m[1]) : c;
        }
        if (Array.isArray(c)) return c.map(resolveColor);
        return c;
    }

    function applyChartTheme() {
        if (!global.Chart) return;
        const C = global.Chart;
        C.defaults.color = PALETTE.tick;
        C.defaults.font.family = "'Inter', sans-serif";
        C.defaults.font.size = 11;
        C.defaults.borderColor = PALETTE.grid;
        C.defaults.maintainAspectRatio = false;
        C.defaults.animation = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? false : { duration: 260 };
    }

    const chartRegistry = new Map();

    /**
     * Crea (o reemplaza) un gráfico Chart.js con los valores por defecto del
     * laboratorio: marcas finas, rejilla discreta, leyenda cuando hay ≥2 series
     * y tooltip activo. `type` y `data` son los de Chart.js.
     */
    function chart(canvasId, config) {
        if (!global.Chart) return null;
        const canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
        if (!canvas) return null;

        const prev = chartRegistry.get(canvas);
        if (prev) prev.destroy();

        const nSeries = (config.data.datasets || []).length;
        const isBar = config.type === 'bar';

        const base = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: isBar ? 'nearest' : 'index', intersect: isBar },
            plugins: {
                legend: {
                    display: nSeries >= 2,
                    labels: { color: PALETTE.tick, boxWidth: 12, boxHeight: 12, usePointStyle: true, pointStyle: 'rectRounded' }
                },
                tooltip: {
                    backgroundColor: '#111a2e',
                    borderColor: 'rgba(148,163,184,0.3)',
                    borderWidth: 1,
                    titleColor: PALETTE.ink,
                    bodyColor: PALETTE.tick,
                    padding: 9,
                    displayColors: nSeries >= 2
                }
            },
            scales: {
                x: {
                    ticks: { color: PALETTE.tick, maxRotation: 0, autoSkipPadding: 14 },
                    grid: { color: PALETTE.grid, display: !isBar, drawTicks: false },
                    border: { color: PALETTE.grid }
                },
                y: {
                    ticks: { color: PALETTE.tick },
                    grid: { color: PALETTE.grid, drawTicks: false },
                    border: { display: false }
                }
            }
        };

        // Marcas finas por defecto; los colores se resuelven a valores literales
        (config.data.datasets || []).forEach((ds, i) => {
            ['borderColor', 'backgroundColor', 'pointBackgroundColor', 'hoverBackgroundColor'].forEach(k => {
                if (ds[k] !== undefined) ds[k] = resolveColor(ds[k]);
            });
            if (ds.borderColor === undefined) ds.borderColor = PALETTE.series[i % PALETTE.series.length];
            if (config.type === 'line') {
                if (ds.borderWidth === undefined) ds.borderWidth = 2;
                if (ds.pointRadius === undefined) ds.pointRadius = 0;
                if (ds.pointHoverRadius === undefined) ds.pointHoverRadius = 4;
                if (ds.tension === undefined) ds.tension = 0.15;
                if (ds.backgroundColor === undefined) ds.backgroundColor = 'transparent';
            }
            if (isBar) {
                if (ds.backgroundColor === undefined) ds.backgroundColor = PALETTE.series[i % PALETTE.series.length];
                if (ds.borderRadius === undefined) ds.borderRadius = 4;
                if (ds.borderWidth === undefined) ds.borderWidth = 0;
                if (ds.borderSkipped === undefined) ds.borderSkipped = 'bottom';
            }
        });

        config.options = deepMerge(base, config.options || {});
        const c = new global.Chart(canvas.getContext('2d'), config);
        chartRegistry.set(canvas, c);
        return c;
    }

    function deepMerge(a, b) {
        const out = Array.isArray(a) ? a.slice() : Object.assign({}, a);
        Object.keys(b || {}).forEach(k => {
            const bv = b[k];
            if (bv && typeof bv === 'object' && !Array.isArray(bv) && out[k] && typeof out[k] === 'object') {
                out[k] = deepMerge(out[k], bv);
            } else {
                out[k] = bv;
            }
        });
        return out;
    }

    // ---------------------------------------------------------
    // Mapas de calor en DOM (matrices)
    // ---------------------------------------------------------
    /**
     * Dibuja una matriz como rejilla de celdas coloreadas.
     * opts: { rowLabels, colLabels, scale:'seq'|'div', max, digits, small,
     *         title, mask(r,c)->bool, cellClass(r,c)->string,
     *         onCell(r,c,v), tooltip(r,c,v)->string, showValues }
     */
    function heatmap(container, M, opts) {
        if (typeof container === 'string') container = document.getElementById(container);
        if (!container) return;
        opts = opts || {};
        const rows = M.length, cols = M[0].length;
        const digits = opts.digits === undefined ? 2 : opts.digits;
        const small = !!opts.small;
        const rowLabels = opts.rowLabels || null;
        const colLabels = opts.colLabels || null;
        // 'auto': divergente solo si hay signos distintos; si todo es ≥ 0, magnitud secuencial.
        let scale = opts.scale || 'seq';
        if (scale === 'auto') scale = M.some(row => row.some(v => v < 0)) ? 'div' : 'seq';
        const showValues = opts.showValues !== false;

        let max = opts.max;
        if (max === undefined) {
            max = 0;
            for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
                if (opts.mask && opts.mask(r, c)) continue;
                max = Math.max(max, Math.abs(M[r][c]));
            }
            if (max === 0) max = 1;
        }

        container.innerHTML = '';
        const wrap = document.createElement('div');
        wrap.className = 'matrix-wrap';

        if (opts.title) {
            const t = document.createElement('div');
            t.className = 'matrix-caption';
            t.textContent = opts.title;
            wrap.appendChild(t);
        }

        const grid = document.createElement('div');
        grid.className = 'matrix';
        grid.style.gridTemplateColumns = `repeat(${cols + (rowLabels ? 1 : 0)}, auto)`;

        const lblCls = 'matrix-label' + (small ? ' sm' : '');
        const cellCls = 'matrix-cell' + (small ? ' sm' : '');

        if (colLabels) {
            if (rowLabels) { const sp = document.createElement('div'); sp.className = lblCls; grid.appendChild(sp); }
            colLabels.forEach(l => {
                const d = document.createElement('div');
                d.className = lblCls; d.textContent = l;
                grid.appendChild(d);
            });
        }

        for (let r = 0; r < rows; r++) {
            if (rowLabels) {
                const d = document.createElement('div');
                d.className = lblCls; d.textContent = rowLabels[r];
                grid.appendChild(d);
            }
            for (let c = 0; c < cols; c++) {
                const v = M[r][c];
                const cell = document.createElement('div');
                const extra = opts.cellClass ? opts.cellClass(r, c, v) : '';
                cell.className = cellCls + (extra ? ' ' + extra : '');

                if (opts.mask && opts.mask(r, c)) {
                    cell.classList.add('masked');
                    cell.textContent = '−∞';
                    cell.title = `fila ${r + 1}, columna ${c + 1}: enmascarado (no puede atenderse)`;
                } else {
                    const bg = scale === 'div' ? divColor(v, max) : seqColor(Math.abs(v) / max);
                    cell.style.background = bg;
                    cell.style.color = inkOn(bg);
                    if (showValues) cell.textContent = fmt(v, digits);
                    cell.title = opts.tooltip ? opts.tooltip(r, c, v)
                        : `fila ${r + 1}, columna ${c + 1} = ${fmt(v, Math.max(digits, 3))}`;
                }

                if (opts.onCell) {
                    cell.classList.add('clickable');
                    cell.tabIndex = 0;
                    cell.setAttribute('role', 'button');
                    const fire = () => opts.onCell(r, c, v);
                    cell.addEventListener('click', fire);
                    cell.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); }
                    });
                }
                grid.appendChild(cell);
            }
        }

        wrap.appendChild(grid);
        container.appendChild(wrap);
    }

    /** Barra de escala de color, para acompañar a un heatmap. */
    function colorbar(container, lo, hi, scale) {
        if (typeof container === 'string') container = document.getElementById(container);
        if (!container) return;
        const stops = [];
        for (let i = 0; i <= 10; i++) {
            const t = i / 10;
            stops.push(scale === 'div' ? divColor(lerp(lo, hi, t), Math.max(Math.abs(lo), Math.abs(hi))) : seqColor(t));
        }
        container.className = 'colorbar';
        container.innerHTML = `<span>${fmt(lo, 2)}</span>
            <span class="colorbar-ramp" style="background:linear-gradient(90deg,${stops.join(',')})"></span>
            <span>${fmt(hi, 2)}</span>`;
    }

    // ---------------------------------------------------------
    // Pestañas accesibles con enlace profundo (#tabN)
    // ---------------------------------------------------------
    function initTabs(onSwitch) {
        const list = document.querySelector('.tabs');
        if (!list) return;
        const btns = Array.from(list.querySelectorAll('.tab-btn'));
        list.setAttribute('role', 'tablist');

        btns.forEach((btn, i) => {
            const panelId = btn.dataset.tab;
            const panel = document.getElementById(panelId);
            btn.setAttribute('role', 'tab');
            btn.id = 'tabbtn-' + panelId;
            btn.setAttribute('aria-controls', panelId);
            btn.setAttribute('aria-selected', 'false');
            btn.tabIndex = -1;
            if (panel) {
                panel.setAttribute('role', 'tabpanel');
                panel.setAttribute('aria-labelledby', btn.id);
                panel.tabIndex = 0;
            }
            btn.addEventListener('click', () => activate(i, true));
            btn.addEventListener('keydown', (e) => {
                let next = null;
                if (e.key === 'ArrowRight') next = (i + 1) % btns.length;
                else if (e.key === 'ArrowLeft') next = (i - 1 + btns.length) % btns.length;
                else if (e.key === 'Home') next = 0;
                else if (e.key === 'End') next = btns.length - 1;
                if (next !== null) { e.preventDefault(); activate(next, true); btns[next].focus(); }
            });
        });

        function activate(idx, updateHash) {
            btns.forEach((b, j) => {
                const on = j === idx;
                b.setAttribute('aria-selected', on ? 'true' : 'false');
                b.tabIndex = on ? 0 : -1;
                const p = document.getElementById(b.dataset.tab);
                if (p) p.classList.toggle('active', on);
            });
            if (updateHash) {
                const id = btns[idx].dataset.tab;
                if (global.history && global.history.replaceState) {
                    global.history.replaceState(null, '', '#' + id);
                }
            }
            renderMath();
            // El panel recién visible ya tiene ancho: recalcula lienzos y gráficos.
            requestAnimationFrame(() => {
                redrawAll();
                chartRegistry.forEach(c => { try { c.resize(); } catch (e) { /* ignora */ } });
                if (onSwitch) onSwitch(btns[idx].dataset.tab);
            });
        }

        const fromHash = btns.findIndex(b => '#' + b.dataset.tab === global.location.hash);
        activate(fromHash >= 0 ? fromHash : 0, false);
        Lab.activateTab = (id) => {
            const i = btns.findIndex(b => b.dataset.tab === id);
            if (i >= 0) activate(i, true);
        };
    }

    // ---------------------------------------------------------
    // Autoevaluación
    // ---------------------------------------------------------
    /**
     * questions: [{ q, opts:[...], answer:idx, why }]
     * Muestra retroalimentación inmediata y un marcador acumulado.
     */
    function quiz(container, questions, title) {
        if (typeof container === 'string') container = document.getElementById(container);
        if (!container) return;
        container.className = 'quiz';
        container.innerHTML = `<div class="card-title">${title || '🎯 Compruébalo'}</div>
            <p class="card-sub">Responde sin volver atrás: la retroalimentación explica el porqué, no solo el qué.</p>`;

        let answered = 0, correct = 0;
        const score = document.createElement('div');
        score.className = 'quiz-score';
        score.setAttribute('aria-live', 'polite');

        questions.forEach((item, qi) => {
            const block = document.createElement('div');
            block.className = 'quiz-q';

            const prompt = document.createElement('div');
            prompt.className = 'quiz-prompt';
            prompt.innerHTML = `${qi + 1}. ${item.q}`;
            block.appendChild(prompt);

            const optsEl = document.createElement('div');
            optsEl.className = 'quiz-opts';
            optsEl.setAttribute('role', 'group');

            const fb = document.createElement('div');
            fb.className = 'quiz-feedback';

            const buttons = item.opts.map((text, oi) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'quiz-opt';
                b.innerHTML = `<span class="mark">${String.fromCharCode(97 + oi)})</span><span>${text}</span>`;
                b.addEventListener('click', () => {
                    if (b.disabled) return;
                    const isRight = oi === item.answer;
                    buttons.forEach((bb, bi) => {
                        bb.disabled = true;
                        if (bi === item.answer) bb.classList.add('correct');
                        else if (bi === oi) bb.classList.add('wrong');
                    });
                    buttons[item.answer].querySelector('.mark').textContent = '✓';
                    if (!isRight) b.querySelector('.mark').textContent = '✗';
                    fb.innerHTML = `<strong>${isRight ? 'Correcto.' : 'No exactamente.'}</strong> ${item.why}`;
                    fb.style.borderLeftColor = isRight ? 'var(--ok)' : 'var(--bad)';
                    fb.classList.add('show');
                    renderMath(fb);
                    answered++; if (isRight) correct++;
                    score.textContent = `Llevas ${correct} de ${answered} respondidas (${questions.length} en total).`;
                });
                optsEl.appendChild(b);
                return b;
            });

            block.appendChild(optsEl);
            block.appendChild(fb);
            container.appendChild(block);
        });

        container.appendChild(score);
        renderMath(container);
    }

    // ---------------------------------------------------------
    // Álgebra lineal mínima
    // ---------------------------------------------------------
    const M = {
        zeros: (r, c) => Array.from({ length: r }, () => new Array(c).fill(0)),
        mul(A, B) {
            const n = A.length, m = B[0].length, k = B.length;
            const C = M.zeros(n, m);
            for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
                let s = 0;
                for (let t = 0; t < k; t++) s += A[i][t] * B[t][j];
                C[i][j] = s;
            }
            return C;
        },
        T: (A) => A[0].map((_, j) => A.map(row => row[j])),
        add: (A, B) => A.map((row, i) => row.map((v, j) => v + B[i][j])),
        scale: (A, s) => A.map(row => row.map(v => v * s)),
        matVec: (A, x) => A.map(row => row.reduce((s, v, j) => s + v * x[j], 0)),
        dot: (a, b) => a.reduce((s, v, i) => s + v * b[i], 0),
        norm: (a) => Math.sqrt(a.reduce((s, v) => s + v * v, 0)),
        cosine(a, b) {
            const na = M.norm(a), nb = M.norm(b);
            return (na && nb) ? M.dot(a, b) / (na * nb) : 0;
        },
        /** Resuelve A·x = b por eliminación gaussiana con pivoteo parcial. */
        solve(A, b) {
            const n = A.length;
            const Aug = A.map((row, i) => row.concat([b[i]]));
            for (let col = 0; col < n; col++) {
                let piv = col;
                for (let r = col + 1; r < n; r++) if (Math.abs(Aug[r][col]) > Math.abs(Aug[piv][col])) piv = r;
                if (Math.abs(Aug[piv][col]) < 1e-12) continue;
                [Aug[col], Aug[piv]] = [Aug[piv], Aug[col]];
                for (let r = 0; r < n; r++) {
                    if (r === col) continue;
                    const f = Aug[r][col] / Aug[col][col];
                    if (!f) continue;
                    for (let c = col; c <= n; c++) Aug[r][c] -= f * Aug[col][c];
                }
            }
            return Aug.map((row, i) => Math.abs(row[i]) < 1e-12 ? 0 : row[n] / row[i]);
        }
    };

    const softmax = (z, T) => {
        const t = (T === undefined || T === 0) ? 1 : T;
        const s = z.map(v => v / t);
        const mx = Math.max(...s.filter(isFinite));
        const e = s.map(v => isFinite(v) ? Math.exp(v - mx) : 0);
        const sum = e.reduce((a, b) => a + b, 0) || 1;
        return e.map(v => v / sum);
    };
    const sigmoid = (z) => 1 / (1 + Math.exp(-z));
    const relu = (z) => Math.max(0, z);
    const entropyBits = (p) => -p.reduce((s, v) => s + (v > 0 ? v * Math.log2(v) : 0), 0);

    /** Generador congruencial: aleatoriedad reproducible entre recargas. */
    function rng(seed) {
        let s = seed >>> 0 || 1;
        return function () {
            s = (s * 1664525 + 1013904223) >>> 0;
            return s / 4294967296;
        };
    }
    /** Normal estándar por Box–Muller, alimentada por `rand`. */
    function gauss(rand) {
        let u = 0, v = 0;
        while (u === 0) u = rand();
        while (v === 0) v = rand();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    // ---------------------------------------------------------
    // Cronómetro de animación con pausa/reanudación
    // ---------------------------------------------------------
    function ticker(stepFn, intervalMs) {
        let id = null;
        return {
            get running() { return id !== null; },
            start() { if (id === null) id = setInterval(stepFn, intervalMs || 120); },
            stop() { if (id !== null) { clearInterval(id); id = null; } },
            toggle() { this.running ? this.stop() : this.start(); return this.running; }
        };
    }

    // ---------------------------------------------------------
    // Cabecera / pie comunes
    // ---------------------------------------------------------
    const CLASSES = [
        { n: 1, file: 'clase01.html', short: 'C1: Fundamentos', title: 'Fundamentos y descenso de gradiente' },
        { n: 2, file: 'clase02.html', short: 'C2: Convoluciones', title: 'Convoluciones, normalización, ResNets y optimizadores' },
        { n: 3, file: 'clase03.html', short: 'C3: Secuencias', title: 'Secuencias y espacios latentes' },
        { n: 4, file: 'clase04.html', short: 'C4: Atención', title: 'Atención y Transformers' },
        { n: 5, file: 'clase05.html', short: 'C5: Lenguaje', title: 'Modelos de lenguaje y decodificación' },
        { n: 6, file: 'clase06.html', short: 'C6: Adaptación', title: 'Adaptación, alineación y agentes' }
    ];

    function buildChrome(current) {
        const nav = document.querySelector('nav .nav-links');
        if (nav) {
            nav.innerHTML = CLASSES.map(c =>
                `<a href="${c.file}" class="nav-link"${c.n === current ? ' aria-current="page"' : ''}>${c.short}</a>`
            ).join('');
        }
        const foot = document.querySelector('.lab-footer');
        if (foot) {
            const prev = CLASSES.find(c => c.n === current - 1);
            const next = CLASSES.find(c => c.n === current + 1);
            foot.innerHTML = `
                <div>${prev ? `<a href="${prev.file}">← ${prev.short}: ${prev.title}</a>` : '<span class="muted">Inicio del curso</span>'}</div>
                <div><a href="index.html">Todos los laboratorios</a></div>
                <div>${next ? `<a href="${next.file}">${next.short}: ${next.title} →</a>` : '<span class="muted">Fin del curso</span>'}</div>`;
        }
    }

    // ---------------------------------------------------------
    // Arranque
    // ---------------------------------------------------------
    function init(opts) {
        opts = opts || {};
        applyChartTheme();
        buildChrome(opts.classNumber);
        document.addEventListener('DOMContentLoaded', () => {
            if (opts.setup) opts.setup();
            initTabs(opts.onSwitch);
            renderMath();
        });
    }

    const Lab = {
        PALETTE, init, initTabs, renderMath, fitCanvas, redrawAll, chart, heatmap, colorbar,
        quiz, M, softmax, sigmoid, relu, entropyBits, rng, gauss, ticker,
        fmt, fmtInt, sci, seqColor, divColor, inkOn, clamp, lerp, CLASSES, cssVar
    };
    global.Lab = Lab;
})(window);
