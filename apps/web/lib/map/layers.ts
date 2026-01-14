export const enum AustralianState {
    NSW = "NSW",
    VIC = "VIC",
    QLD = "QLD",
    WA = "WA",
    SA = "SA",
    TAS = "TAS",
    NT = "NT",
    ACT = "ACT",
}

export type Layers = "LANDIND_ZONES" | "FLOOD_HAZARD" | "BUSHFIRE_HAZARD" | "LANDSLIDE_HAZARD" | "STORM_TIDE_HAZARD";

export type Styles = {
    label: string;
    idKey: string[];
    fillColor: string;
    strokeColor?: string;
};

type LayerStyles = Record<string, Styles>;

/** Layer configuration with support for multiple API URLs per layer */
export type LayerConfig = {
    name: string;
    /** Array of ArcGIS REST API URLs - data from all URLs will be fetched and rendered */
    urls: string[];
};

type LayerInfo = Record<Layers, LayerConfig>;

const NSW_LAYER_INFO: LayerInfo = {
    LANDIND_ZONES: {
        name: "NSW Land Zoning",
        urls: [
            "https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/EPI_Primary_Planning_Layers/MapServer/2",
        ],
    },
    FLOOD_HAZARD: {
        name: "NSW Flood Hazard",
        urls: [
            "https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/Hazard/MapServer/1",
        ],
    },
    BUSHFIRE_HAZARD: {
        name: "NSW Bushfire Hazard",
        urls: [
            "https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Hazards/Bushfire_Hazard/MapServer/0",
        ],
    },
    LANDSLIDE_HAZARD: {
        name: "NSW Landslide Hazard",
        urls: [
            "https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/Hazard/MapServer/2",
        ],
    },
    STORM_TIDE_HAZARD: {
        name: "NSW Storm Tide Hazard",
        urls: [
            "https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Hazards/Storm_Tide_Hazard/MapServer/0",
        ],
    },
};

const QLD_LAYER_INFO: LayerInfo = {
    LANDIND_ZONES: {
        name: "QLD Land Zoning",
        urls: [
            "https://arcgis.mackay.qld.gov.au/server/rest/services/Mackay_Region_Planning_Scheme_2017/3_MRPS_MPRS_Zones/MapServer/9",
            "https://maps.tr.qld.gov.au/arcgis/rest/services/External/External_PlanningScheme/MapServer/145",
        ],
    },
    FLOOD_HAZARD: {
        name: "QLD Flood Hazard",
        urls: [
            "https://maps.tr.qld.gov.au/arcgis/rest/services/External/External_PlanningScheme/MapServer/156",
            // Add more QLD flood hazard URLs here if needed
        ],
    },
    BUSHFIRE_HAZARD: {
        name: "QLD Bushfire Hazard",
        urls: [
            "https://maps.tr.qld.gov.au/arcgis/rest/services/External/External_PlanningScheme/MapServer/145",
            // Add more QLD bushfire hazard URLs here if needed
        ],
    },
    LANDSLIDE_HAZARD: {
        name: "QLD Landslide Hazard",
        urls: [
            "https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Hazards/Landslide_Hazard/MapServer/0",
        ],
    },
    STORM_TIDE_HAZARD: {
        name: "QLD Storm Tide Hazard",
        urls: [
            "https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Hazards/Storm_Tide_Hazard/MapServer/0",
        ],
    },
};

export const stateLayerMapping: Record<AustralianState, LayerInfo> = {
    [AustralianState.NSW]: NSW_LAYER_INFO,
    [AustralianState.VIC]: NSW_LAYER_INFO,
    [AustralianState.QLD]: QLD_LAYER_INFO,
    [AustralianState.WA]: NSW_LAYER_INFO,
    [AustralianState.SA]: NSW_LAYER_INFO,
    [AustralianState.TAS]: NSW_LAYER_INFO,
    [AustralianState.NT]: NSW_LAYER_INFO,
    [AustralianState.ACT]: NSW_LAYER_INFO,
}