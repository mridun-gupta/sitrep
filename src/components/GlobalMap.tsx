'use client';

import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MlMap, MapLayerMouseEvent, ErrorEvent as MlErrorEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { HotspotSlim } from '@/lib/client-api';
import type { SignalPoint, SitrepEvent } from '@/lib/types';
import { timeAgo } from '@/lib/format';

/**
 * GlobalMap — the console's hero surface.
 *
 * Three data layers over a dark basemap:
 *   events   — clustered, colored by category, sized by severity
 *   signals  — heatmap of negative-toned news density (GDELT)
 *   hotspots — pulsing rings where independent sources converge
 */

const BASEMAP =
  process.env.NEXT_PUBLIC_BASEMAP_URL ??
  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// Self-hosted worker: bundler path resolution for maplibre's .mjs worker is
// unreliable across Turbopack/webpack — pin a vendored copy (scripts/sync-worker.mjs).
const WORKER_URL = '/vendor/maplibre-worker.js';
let workerSet = false;
function ensureWorker() {
  if (!workerSet) {
    maplibregl.setWorkerUrl(WORKER_URL);
    workerSet = true;
  }
}

const SEV_RADIUS = ['match', ['get', 'severity'],
  'critical', 9, 'high', 7, 'medium', 5.5, 'low', 4, 3] as const;

const CAT_COLOR = ['match', ['get', 'category'],
  'conflict', '#ef4444',
  'disaster', '#f0a92e',
  'humanitarian', '#a78bfa',
  'political', '#38bdf8',
  'economic', '#34d399',
  'cyber', '#f472b6',
  'infrastructure', '#94a3b8',
  'environment', '#4ade80',
  'military', '#fde047',
  'health', '#2dd4bf',
  '#64748b'] as const;

type LayerKey = 'events' | 'signals' | 'hotspots';
const LAYERS: { key: LayerKey; label: string }[] = [
  { key: 'events', label: 'Events' },
  { key: 'signals', label: 'Tension' },
  { key: 'hotspots', label: 'Hotspots' },
];

function toEventsGeo(events: SitrepEvent[]) {
  return {
    type: 'FeatureCollection' as const,
    features: events
      .filter((e) => e.location)
      .map((e) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [e.location!.lon, e.location!.lat] },
        properties: {
          id: e.id,
          title: e.title,
          category: e.category,
          severity: e.severity,
          source: e.sourceLabel,
          time: e.time,
          url: e.url ?? '',
          place: e.location!.name ?? '',
        },
      })),
  };
}

function toSignalsGeo(signals: SignalPoint[]) {
  return {
    type: 'FeatureCollection' as const,
    features: signals.map((s) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [s.lon, s.lat] },
      properties: { weight: Math.min(s.weight, 60), name: s.name },
    })),
  };
}

function toHotspotsGeo(hotspots: HotspotSlim[]) {
  return {
    type: 'FeatureCollection' as const,
    features: hotspots.map((h) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [h.lon, h.lat] },
      properties: {
        id: h.id, score: h.score, name: h.name ?? '',
        count: h.eventCount, cats: h.categories.join(', '),
        top: h.topTitles.join('\n'),
      },
    })),
  };
}

function popupEl(props: Record<string, string>): HTMLElement {
  // Build DOM with textContent — feed titles are untrusted data.
  const root = document.createElement('div');
  const title = document.createElement('div');
  title.style.cssText = 'font-weight:600;margin-bottom:4px;line-height:1.3';
  title.textContent = props.title;
  const meta = document.createElement('div');
  meta.style.cssText = 'font-family:var(--font-mono);font-size:10px;color:#97a1b3';
  meta.textContent = props.meta;
  root.append(title, meta);
  if (props.url) {
    const a = document.createElement('a');
    a.href = props.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = 'source ↗';
    a.style.cssText = 'color:#f0a92e;font-size:11px;display:inline-block;margin-top:4px';
    root.append(a);
  }
  return root;
}

export default function GlobalMap({
  events,
  signals,
  hotspots,
  flyTo,
}: {
  events: SitrepEvent[];
  signals: SignalPoint[];
  hotspots: HotspotSlim[];
  flyTo: { lat: number; lon: number; zoom?: number } | null;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MlMap | null>(null);
  const [ready, setReady] = useState(false);
  const [styleError, setStyleError] = useState(false);
  const [visible, setVisible] = useState<Record<LayerKey, boolean>>({
    events: true,
    signals: true,
    hotspots: true,
  });

  // ── Init once ────────────────────────────────────────────────────
  useEffect(() => {
    if (!container.current || map.current) return;
    ensureWorker();
    const m = new maplibregl.Map({
      container: container.current,
      style: BASEMAP,
      center: [15, 25],
      zoom: 1.6,
      minZoom: 1,
      maxZoom: 8,
      attributionControl: { compact: true },
    });
    m.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'bottom-right');
    // Test/debug handle (read-only use): window.__sitrepMap.isStyleLoaded()
    (window as unknown as { __sitrepMap?: MlMap }).__sitrepMap = m;

    // A blocked basemap (CSP/network) must surface, not render as a void.
    m.on('error', (e: MlErrorEvent) => {
      const msg = e.error?.message ?? '';
      if (msg.includes('Failed to fetch') || msg.includes('AJAXError') || msg.includes('style'))
        setStyleError(true);
    });

    m.on('load', () => {
      m.addSource('events', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterRadius: 42,
        clusterMaxZoom: 5,
      });
      m.addSource('signals', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      m.addSource('hotspots', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Tension heat — sits under everything.
      m.addLayer({
        id: 'lyr-signals',
        type: 'heatmap',
        source: 'signals',
        maxzoom: 6,
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 60, 1],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 6, 2.4],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 22, 6, 55],
          'heatmap-opacity': 0.55,
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0,0,0,0)',
            0.25, 'rgba(240,169,46,0.18)',
            0.55, 'rgba(240,169,46,0.4)',
            0.8, 'rgba(249,115,22,0.55)',
            1, 'rgba(239,68,68,0.7)',
          ],
        },
      });

      // Hotspot rings — cross-source convergence, the "pay attention" layer.
      m.addLayer({
        id: 'lyr-hotspots',
        type: 'circle',
        source: 'hotspots',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['get', 'score'], 0, 10, 60, 26, 200, 40],
          'circle-color': 'rgba(240,169,46,0.10)',
          'circle-stroke-color': '#f0a92e',
          'circle-stroke-width': 1.4,
          'circle-stroke-opacity': 0.85,
        },
      });

      // Clusters
      m.addLayer({
        id: 'lyr-clusters',
        type: 'circle',
        source: 'events',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#1b2230',
          'circle-stroke-color': '#28324a',
          'circle-stroke-width': 1,
          'circle-radius': ['step', ['get', 'point_count'], 11, 10, 14, 50, 18, 200, 23],
          'circle-opacity': 0.92,
        },
      });
      m.addLayer({
        id: 'lyr-cluster-count',
        type: 'symbol',
        source: 'events',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 10,
          'text-font': ['Open Sans Semibold'],
        },
        paint: { 'text-color': '#e6eaf2' },
      });

      // Event points
      m.addLayer({
        id: 'lyr-events',
        type: 'circle',
        source: 'events',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': SEV_RADIUS as never,
          'circle-color': CAT_COLOR as never,
          'circle-stroke-color': '#07090d',
          'circle-stroke-width': 1,
          'circle-opacity': 0.9,
        },
      });

      // Interactions
      m.on('click', 'lyr-clusters', (e: MapLayerMouseEvent) => {
        const f = e.features?.[0];
        if (!f) return;
        const clusterId = f.properties?.cluster_id as number;
        const src = m.getSource('events') as maplibregl.GeoJSONSource;
        src.getClusterExpansionZoom(clusterId).then((zoom: number) => {
          const [lon, lat] = (f.geometry as GeoJSON.Point).coordinates;
          m.easeTo({ center: [lon, lat], zoom: zoom + 0.4 });
        });
      });

      m.on('click', 'lyr-events', (e: MapLayerMouseEvent) => {
        const p = e.features?.[0]?.properties;
        if (!p) return;
        const [lon, lat] = (e.features![0].geometry as GeoJSON.Point).coordinates;
        new maplibregl.Popup({ closeButton: true, maxWidth: '300px' })
          .setLngLat([lon, lat])
          .setDOMContent(
            popupEl({
              title: String(p.title ?? ''),
              meta: `${p.source ?? ''} · ${p.category ?? ''}/${p.severity ?? ''} · ${timeAgo(String(p.time))} ago` +
                (p.place ? ` · ${p.place}` : ''),
              url: String(p.url ?? ''),
            }),
          )
          .addTo(m);
      });

      m.on('click', 'lyr-hotspots', (e: MapLayerMouseEvent) => {
        const p = e.features?.[0]?.properties;
        if (!p) return;
        const [lon, lat] = (e.features![0].geometry as GeoJSON.Point).coordinates;
        new maplibregl.Popup({ closeButton: true, maxWidth: '320px' })
          .setLngLat([lon, lat])
          .setDOMContent(
            popupEl({
              title: `Convergence: ${p.name || 'unlocated'}`,
              meta: `score ${p.score} · ${p.count} events · ${p.cats}\n${p.top}`,
              url: '',
            }),
          )
          .addTo(m);
      });

      for (const lyr of ['lyr-clusters', 'lyr-events', 'lyr-hotspots']) {
        m.on('mouseenter', lyr, () => (m.getCanvas().style.cursor = 'pointer'));
        m.on('mouseleave', lyr, () => (m.getCanvas().style.cursor = ''));
      }

      setReady(true);
    });

    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  // ── Data updates ─────────────────────────────────────────────────
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    (m.getSource('events') as maplibregl.GeoJSONSource)?.setData(toEventsGeo(events));
  }, [events, ready]);

  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    (m.getSource('signals') as maplibregl.GeoJSONSource)?.setData(toSignalsGeo(signals));
  }, [signals, ready]);

  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    (m.getSource('hotspots') as maplibregl.GeoJSONSource)?.setData(toHotspotsGeo(hotspots));
  }, [hotspots, ready]);

  useEffect(() => {
    const m = map.current;
    if (!m || !ready || !flyTo) return;
    m.flyTo({ center: [flyTo.lon, flyTo.lat], zoom: flyTo.zoom ?? 4, speed: 1.4 });
  }, [flyTo, ready]);

  // ── Layer visibility ─────────────────────────────────────────────
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    const apply = (key: LayerKey, ids: string[]) => {
      for (const id of ids) {
        if (m.getLayer(id)) {
          m.setLayoutProperty(id, 'visibility', visible[key] ? 'visible' : 'none');
        }
      }
    };
    apply('events', ['lyr-clusters', 'lyr-cluster-count', 'lyr-events']);
    apply('signals', ['lyr-signals']);
    apply('hotspots', ['lyr-hotspots']);
  }, [visible, ready]);

  return (
    <div className="relative h-full w-full">
      <div ref={container} className="absolute inset-0" />
      {/* Layer toggles */}
      <div className="absolute top-2 left-2 z-10 flex gap-1">
        {LAYERS.map((l) => (
          <button
            key={l.key}
            onClick={() => setVisible((v) => ({ ...v, [l.key]: !v[l.key] }))}
            className={`border px-2 py-1 font-mono text-[10px] tracking-wide backdrop-blur-sm transition-colors ${
              visible[l.key]
                ? 'border-accent/60 bg-accent/15 text-accent'
                : 'border-edge bg-bg/70 text-ink-3 hover:text-ink-2'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
      {/* Basemap failure notice — data layers may still work */}
      {styleError && !ready && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="border border-edge bg-panel px-4 py-3 text-center">
            <p className="font-mono text-[11px] text-sev-high">BASEMAP UNAVAILABLE</p>
            <p className="mt-1 font-mono text-[9px] text-ink-3">
              map style could not be fetched — check network/CSP
            </p>
          </div>
        </div>
      )}
      {/* Vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: 'inset 0 0 90px rgb(0 0 0 / 0.5)' }}
      />
    </div>
  );
}
