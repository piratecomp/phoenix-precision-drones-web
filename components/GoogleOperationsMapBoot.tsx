"use client";

import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

declare global {
  interface Window {
    google?: any;
    __ppdGoogleMapsPromise?: Promise<void>;
  }
}

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();
  if (window.__ppdGoogleMapsPromise) return window.__ppdGoogleMapsPromise;

  window.__ppdGoogleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById("ppd-google-maps-script") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.id = "ppd-google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps script failed to load."));
    document.head.appendChild(script);
  });

  return window.__ppdGoogleMapsPromise;
}

function markerIcon(type: string) {
  const color = type === "pilot" ? "#54ff73" : type === "drone" ? "#4db5ff" : "#ff9b23";
  return {
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z",
    fillColor: color,
    fillOpacity: 0.95,
    strokeColor: "#101010",
    strokeWeight: 1.4,
    scale: 1.65,
    anchor: { x: 12, y: 24 },
  };
}

async function getMapPayload() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("ppd_get_live_operations_map");
  if (error) throw error;
  return data;
}

async function getMapConfig() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { allowed: false, auto_load: false, message: "Supabase client unavailable." };
  const { data, error } = await supabase.rpc("ppd_get_google_maps_runtime_config");
  if (error) throw error;
  return data;
}

async function recordMapLoad() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, allowed: false };
  const { data, error } = await supabase.rpc("ppd_record_google_maps_load", {
    p_context: { source: "portal_owner_map", version: "v24_cost_control" },
  });
  if (error) throw error;
  return data;
}

function addControlButton(container: HTMLElement, label: string, onClick: () => void, message?: string) {
  if (container.querySelector(".ppd-load-google-map-btn")) return;
  const wrap = document.createElement("div");
  wrap.className = "ppd-google-map-gate";
  const button = document.createElement("button");
  button.className = "ppd-load-google-map-btn";
  button.type = "button";
  button.textContent = label;
  button.onclick = onClick;
  const note = document.createElement("small");
  note.textContent = message || "Custom HUD map stays active until Google Maps is requested.";
  wrap.appendChild(button);
  wrap.appendChild(note);
  container.appendChild(wrap);
}

function addNote(container: HTMLElement, text: string) {
  if (container.querySelector(".ppd-google-map-missing-key")) return;
  const note = document.createElement("div");
  note.className = "ppd-google-map-missing-key";
  note.textContent = text;
  container.appendChild(note);
}

export default function GoogleOperationsMapBoot() {
  useEffect(() => {
    let cancelled = false;
    let observer: MutationObserver | null = null;

    async function renderGoogleMap(container: HTMLElement) {
      if (container.dataset.googleMapReady === "true" || container.dataset.googleMapLoading === "true") return;
      container.dataset.googleMapLoading = "true";

      const record = await recordMapLoad();
      if (!record?.allowed) {
        container.dataset.googleMapLoading = "false";
        addNote(container, record?.config?.message || "Google Maps usage is not allowed by current PPD settings.");
        return;
      }

      const apiKey =
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY ||
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

      if (!apiKey) {
        container.dataset.googleMapLoading = "false";
        addNote(container, "Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in Vercel to activate Google Maps.");
        return;
      }

      try {
        await loadGoogleMaps(apiKey);
        if (cancelled || !window.google?.maps) return;

        const payload = await getMapPayload().catch(() => null);
        const center = payload?.center || { lat: 33.4484, lng: -112.0740 };
        const mapCanvas = document.createElement("div");
        mapCanvas.className = "ppd-google-map-canvas";
        container.appendChild(mapCanvas);
        container.dataset.googleMapReady = "true";
        container.dataset.googleMapLoading = "false";

        const map = new window.google.maps.Map(mapCanvas, {
          center,
          zoom: payload?.zoom || 10,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#121212" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#121212" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#f5c37a" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#3b2414" }] },
            { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#ff8b1a" }, { weight: 0.5 }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#07131f" }] },
            { featureType: "poi", stylers: [{ visibility: "off" }] },
          ],
        });

        const bounds = new window.google.maps.LatLngBounds();
        const markers = [
          ...(payload?.jobs || []),
          ...(payload?.pilots || []),
          ...(payload?.drones || []),
        ];

        markers.forEach((item: any) => {
          const lat = Number(item.lat);
          const lng = Number(item.lng);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
          const position = { lat, lng };
          bounds.extend(position);
          const marker = new window.google.maps.Marker({
            position,
            map,
            title: item.title || item.label || item.type,
            icon: markerIcon(item.type || "job"),
          });
          const info = new window.google.maps.InfoWindow({
            content: `<div class="ppd-map-info"><strong>${item.title || item.label || "PPD Marker"}</strong><span>${item.type || "item"} · ${item.status || "tracked"}</span><small>${item.address || item.label || "Phoenix operations"}</small></div>`,
          });
          marker.addListener("click", () => info.open({ anchor: marker, map }));
        });

        if (markers.length > 1) map.fitBounds(bounds, 58);
      } catch (error) {
        container.dataset.googleMapLoading = "false";
        container.dataset.googleMapReady = "error";
        addNote(container, "Google Maps could not load. Check API key, Maps JavaScript API, domain restrictions, billing, and monthly PPD usage settings.");
      }
    }

    async function mountGate() {
      const container = document.querySelector<HTMLElement>(".portal-game-map-stage");
      if (!container || container.dataset.googleGateReady === "true") return;
      container.dataset.googleGateReady = "true";

      let config: any = null;
      try {
        config = await getMapConfig();
      } catch (err: any) {
        config = { allowed: false, auto_load: false, message: err?.message || "Map configuration unavailable." };
      }

      if (!config?.allowed) {
        addControlButton(container, "Google Map Disabled", () => {}, config?.message || "Google Maps is currently blocked by PPD cost-control settings.");
        return;
      }

      const remaining = config.monthly_remaining === null ? "unlimited" : `${config.monthly_remaining} loads left this month`;
      addControlButton(container, "Load Google Live Map", () => renderGoogleMap(container), remaining);

      if (config.auto_load) renderGoogleMap(container);
    }

    mountGate();
    observer = new MutationObserver(() => mountGate());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, []);

  return null;
}
