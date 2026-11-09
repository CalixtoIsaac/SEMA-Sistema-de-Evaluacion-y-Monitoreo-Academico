/**
 * Gráficas del Menú principal (#36 · HU-19) con Chart.js local (public/vendor).
 *
 * - Los colores salen de las variables CSS --chart-* (theme.css), nunca escritos aquí.
 * - Al cambiar de tema (evento "themechange") se vuelven a dibujar todas.
 * - Animaciones ≤ 300 ms, tooltips en español, nombres largos recortados con "…".
 *
 *   Graficas.dona(canvas, [{ estado:'correcto', label:'Correcto', valor: 8 }], { onClick })
 *   Graficas.barras(canvas, { labels, valores, estados, horizontal, completos, onClick, eje })
 *   Graficas.lineas(canvas, { labels, series: [{ label, valores, color:'linea'|'critico', eje:'y'|'y2', sufijo }] })
 */
const Graficas = (() => {
  const activas = new Set();
  const fmt = (n) => Number(n || 0).toLocaleString('es-MX');

  function css(nombre) {
    return getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
  }
  function color(estado) {
    return css(`--chart-${String(estado || 'sin-datos').replace('_', '-')}`) || css('--chart-sin-datos');
  }
  function recortar(texto, max = 26) {
    const t = String(texto || '');
    return t.length > max ? t.slice(0, max - 1) + '…' : t;
  }

  function base() {
    const text = css('--chart-text');
    const grid = css('--chart-grid');
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 250 },
      locale: 'es-MX',
      plugins: {
        legend: { display: false, labels: { color: text, font: { family: css('--font-sans') } } },
        tooltip: { padding: 10, cornerRadius: 8 }
      },
      scales: {
        x: { ticks: { color: text }, grid: { color: grid }, border: { color: grid } },
        y: { ticks: { color: text, precision: 0 }, grid: { color: grid }, border: { color: grid }, beginAtZero: true }
      }
    };
  }

  /** Crea una gráfica que se reconstruye sola al cambiar de tema. */
  function crear(canvas, construir) {
    if (typeof Chart === 'undefined') {
      canvas.replaceWith(Object.assign(document.createElement('p'), { className: 'muted', textContent: 'No se pudo cargar Chart.js.' }));
      return null;
    }
    const prev = Chart.getChart(canvas);
    if (prev) prev.destroy();
    const item = { canvas, construir, chart: new Chart(canvas, construir()) };
    activas.add(item);
    return item.chart;
  }

  window.addEventListener('themechange', () => {
    for (const item of [...activas]) {
      if (!item.canvas.isConnected) { item.chart.destroy(); activas.delete(item); continue; }
      item.chart.destroy();
      item.chart = new Chart(item.canvas, item.construir());
    }
  });

  // Texto al centro de la dona (total).
  const centro = {
    id: 'semaCentro',
    afterDraw(chart, _args, opts) {
      if (!opts || opts.texto == null) return;
      const { ctx, chartArea } = chart;
      const x = (chartArea.left + chartArea.right) / 2;
      const y = (chartArea.top + chartArea.bottom) / 2;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = css('--foreground');
      ctx.font = `700 24px ${css('--font-sans')}`;
      ctx.fillText(opts.texto, x, y + 2);
      ctx.fillStyle = css('--chart-text');
      ctx.font = `500 12px ${css('--font-sans')}`;
      ctx.fillText(opts.sub || '', x, y + 20);
      ctx.restore();
    }
  };

  function dona(canvas, items, { onClick, sub = 'alumnos' } = {}) {
    const visibles = items.filter((i) => i.valor > 0);
    const total = items.reduce((s, i) => s + i.valor, 0);
    return crear(canvas, () => {
      const cfg = base();
      delete cfg.scales;
      return {
        type: 'doughnut',
        data: {
          labels: visibles.map((i) => i.label),
          datasets: [{ data: visibles.map((i) => i.valor), backgroundColor: visibles.map((i) => color(i.estado)),
            borderColor: css('--card'), borderWidth: 2, hoverOffset: 6 }]
        },
        options: {
          ...cfg,
          cutout: '66%',
          onHover: (e, el) => { e.native.target.style.cursor = el.length && onClick ? 'pointer' : 'default'; },
          onClick: (_e, el) => { if (el.length && onClick) onClick(visibles[el[0].index].estado); },
          plugins: {
            ...cfg.plugins,
            semaCentro: { texto: fmt(total), sub },
            tooltip: { ...cfg.plugins.tooltip, callbacks: {
              label: (c) => ` ${c.label}: ${fmt(c.raw)} (${total ? Math.round(c.raw / total * 100) : 0} %)`
            } }
          }
        },
        plugins: [centro]
      };
    });
  }

  function barras(canvas, { labels, valores, estados, horizontal = false, completos, onClick, eje = 'Alumnos', sufijo = '' }) {
    return crear(canvas, () => {
      const cfg = base();
      const iEje = horizontal ? 'x' : 'y';
      cfg.scales[iEje].title = { display: !!eje, text: eje, color: css('--chart-text') };
      if (horizontal) {
        cfg.scales.y.ticks.callback = function (v) { return recortar(this.getLabelForValue(v)); };
        cfg.scales.y.grid.display = false;
        cfg.scales.x.beginAtZero = false;
      } else {
        cfg.scales.x.grid.display = false;
      }
      return {
        type: 'bar',
        data: { labels, datasets: [{ data: valores, backgroundColor: estados.map(color), borderRadius: 6, maxBarThickness: 46 }] },
        options: {
          ...cfg,
          indexAxis: horizontal ? 'y' : 'x',
          onHover: (e, el) => { e.native.target.style.cursor = el.length && onClick ? 'pointer' : 'default'; },
          onClick: (_e, el) => { if (el.length && onClick) onClick(el[0].index); },
          plugins: {
            ...cfg.plugins,
            tooltip: { ...cfg.plugins.tooltip, callbacks: {
              title: (c) => (completos ? completos[c[0].dataIndex] : c[0].label),
              label: (c) => ` ${fmt(c.raw)}${sufijo}`
            } }
          }
        }
      };
    });
  }

  function lineas(canvas, { labels, series }) {
    return crear(canvas, () => {
      const cfg = base();
      cfg.plugins.legend = { ...cfg.plugins.legend, display: series.length > 1, position: 'bottom' };
      cfg.scales.x.grid.display = false;
      cfg.scales.y.beginAtZero = false;
      const conDerecho = series.some((s) => s.eje === 'y2');
      if (conDerecho) {
        cfg.scales.y2 = { position: 'right', min: 0, suggestedMax: 20, ticks: { color: css('--chart-text'), callback: (v) => `${v} %` },
          grid: { display: false }, border: { color: css('--chart-grid') } };
      }
      return {
        type: 'line',
        data: {
          labels,
          datasets: series.map((s) => ({
            label: s.label, data: s.valores, yAxisID: s.eje || 'y',
            borderColor: color(s.color), backgroundColor: color(s.color),
            pointRadius: 4, pointHoverRadius: 6, tension: 0.25, spanGaps: true, borderWidth: 2
          }))
        },
        options: {
          ...cfg,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            ...cfg.plugins,
            tooltip: { ...cfg.plugins.tooltip, callbacks: {
              label: (c) => ` ${c.dataset.label}: ${c.raw == null ? '—' : Number(c.raw).toLocaleString('es-MX', { maximumFractionDigits: 1 })}${series[c.datasetIndex].sufijo || ''}`
            } }
          }
        }
      };
    });
  }

  return { dona, barras, lineas, color, recortar };
})();
