"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import { type Map as LeafletMap } from "leaflet";
import { HazardLegendItem, HazardPolygon } from "@/lib/hazardZones";
import { featureLayer, FeatureLayer } from "esri-leaflet";
import { handleLegendExtraction, styleLayer } from "@/lib/map/styles";
import { toast } from "sonner";
import { Layers, stateLayerMapping, Styles } from "@/lib/map/layers";
import { coordToAUState } from "@/lib/utils";

type LatLng = {
  lat: number;
  lng: number;
};

export type MapViewType = "default" | "satellite" | "terrain";

export type SearchResult = {
  title: string;
  description: string;
  yield: string;
  gradientFrom: string;
  gradientTo: string;
  yieldColor: string;
  lat: number;
  lng: number;
};

type MapContextType = {
  currentView: MapViewType;
  currentLayer?: Layers;
  setCenter: (coords: LatLng, zoom?: number) => void;
  registerMap: (map: LeafletMap) => void;
  setMapLayer: (layerId?: Layers) => void;
  results: SearchResult[];
  polygons: HazardPolygon[];
  legends: HazardLegendItem[];
  setResults: (results: SearchResult[]) => void;
  setPolygons: (polygons: HazardPolygon[]) => void;
  setLegends: (legends: HazardLegendItem[]) => void;
  setMapView: (view: MapViewType) => void;
};

export const MAP_VIEW_URLS: Record<MapViewType, string> = {
  default: "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
  satellite:
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  terrain:
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
};

export const MAP_LABELS_OVERLAY =
  "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";

const MapContext = createContext<MapContextType | null>(null);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const mapRef = useRef<LeafletMap | null>(null);
  // Changed from single layer to array of layers for multi-URL support
  const layersRef = useRef<FeatureLayer[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [polygons, setPolygons] = useState<HazardPolygon[]>([]);
  const [legends, setLegends] = useState<HazardLegendItem[]>([]);
  const [currentLayer, setCurrentLayer] = useState<Layers | undefined>();
  const [mapView, setMapView] = useState<MapViewType>("default");

  const registerMap = useCallback((map: LeafletMap) => {
    mapRef.current = map;
  }, []);

  const setCenter = useCallback((coords: LatLng, zoom = 14) => {
    mapRef.current?.setView([coords.lat, coords.lng], zoom, {
      animate: true,
    });
  }, []);

  /**
   * Remove all existing feature layers from the map
   */
  const clearAllLayers = useCallback(() => {
    if (!mapRef.current) return;
    
    for (const layer of layersRef.current) {
      layer.remove();
      mapRef.current.removeLayer(layer);
    }
    layersRef.current = [];
    setCurrentLayer(undefined);
    setLegends([]);
  }, []);

  /**
   * Create a feature layer for a single URL
   */
  const createFeatureLayer = useCallback((url: string, legendData: Styles[]): FeatureLayer => {
    return featureLayer({
      url: url,
      style: (feature) => styleLayer(feature, legendData),
      minZoom: 10,
      simplifyFactor: 0.4,
      cacheLayers: true,
      ignoreRenderer: true,
    });
  }, []);

  const setMapLayer = useCallback(async (layerId?: Layers) => {
    if (!mapRef.current) {
      toast.error("Map is not Loaded yet.");
      return;
    }
    
    // Remove existing layers
    clearAllLayers();
    
    if (!layerId) {
      return; // if no layerId provided, just remove existing layers
    }
    
    const mapCenter = mapRef.current.getCenter();
    const auState = coordToAUState(mapCenter.lat, mapCenter.lng);
    console.log(`Setting Layer ${layerId} for State ${auState}`);
    
    if (!auState) {
      toast.error("Map out of supported area for this layer.");
      return;
    }
    
    const toastId = toast.loading("Loading map layers...");
    
    try {
      const layerData = stateLayerMapping[auState][layerId];
      setCurrentLayer(layerId);
      
      // Extract legends from all URLs (merged and deduplicated)
      const legendData = await handleLegendExtraction(layerData.urls);
      
      // Create and add feature layers for each URL
      const newLayers: FeatureLayer[] = [];
      
      for (const url of layerData.urls) {
        const layer = createFeatureLayer(url, legendData);
        layer.addTo(mapRef.current!);
        newLayers.push(layer);
      }
      
      layersRef.current = newLayers;
      
      // Set combined legends
      setLegends(
        legendData.map((item) => ({
          label: item.label,
          color: item.fillColor,
        }))
      );
      
      console.log(`Map Layers set to: ${layerData.name} (${layerData.urls.length} source(s))`);
    } catch (error) {
      console.error("Error setting map layers:", error);
      toast.error("Failed to load map layers.");
    } finally {
      toast.dismiss(toastId);
    }
  }, [clearAllLayers, createFeatureLayer]);

  const setView = useCallback((view: MapViewType) => {
    setMapView(view);
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup all layers on unmount
      for (const layer of layersRef.current) {
        layer.remove();
      }
    };
  }, []);

  // Spatially filter on moveend for all layers
  useEffect(() => {
    if (!mapRef.current || layersRef.current.length === 0) return;

    const updateSpatialFilter = () => {
      console.log("Updated Query for all layers");
      const bounds = mapRef.current!.getBounds();

      // Update spatial filter for all layers
      for (const layer of layersRef.current) {
        layer.query().bboxIntersects(bounds).where("1=1");
        layer.setWhere("1=1");
        layer.refresh();
      }
    };

    mapRef.current.on("moveend", updateSpatialFilter);
    updateSpatialFilter();

    return () => {
      mapRef.current?.off("moveend", updateSpatialFilter);
    };
  }, [layersRef.current.length]); // Re-run when layers change

  return (
    <MapContext.Provider
      value={{
        currentView: mapView,
        currentLayer,
        setCenter,
        registerMap,
        setMapLayer,
        results,
        setResults,
        polygons,
        legends,
        setPolygons,
        setLegends,
        setMapView: setView,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

export function useMap() {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error("useMap must be used within MapProvider");
  return ctx;
}
