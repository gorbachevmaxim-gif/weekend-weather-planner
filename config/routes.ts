
export interface RouteInfo {
    filename: string;
    direction: string;
    variant?: number;
}

export const CITY_ROUTES: Record<string, RouteInfo[]> = {
    "Alexandrov": [
        { filename: "Alexandrov_N_1.gpx", direction: "N", variant: 1 },
        { filename: "Alexandrov_N_2.gpx", direction: "N", variant: 2 }
    ],
    "Dubna": [
        { filename: "Dubna_N.gpx", direction: "N" },
        { filename: "Dubna_NE.gpx", direction: "NE" }
    ],
    "Istra": [
        { filename: "Istra_N.gpx", direction: "N" },
        { filename: "Istra_NW.gpx", direction: "NW" },
        { filename: "Istra_W.gpx", direction: "W" }
    ],
    "Kaluga": [
        { filename: "Kaluga_NW.gpx", direction: "NW" },
        { filename: "Kaluga_SE.gpx", direction: "SE" },
        { filename: "Kaluga_SW.gpx", direction: "SW" }
    ],
    "Kemer": [
        { filename: "Kemer_E.gpx", direction: "E" },
        { filename: "Kemer_N.gpx", direction: "N" },
        { filename: "Kemer_NE.gpx", direction: "NE" }
    ],
    "Kolomna": [
        { filename: "Kolomna_N.gpx", direction: "N" },
        { filename: "Kolomna_NE.gpx", direction: "NE" },
        { filename: "Kolomna_S.gpx", direction: "S" },
        { filename: "Kolomna_SE.gpx", direction: "SE" },
        { filename: "Kolomna_SW.gpx", direction: "SW" }
    ],
    "Kubinka": [
        { filename: "Kubinka_SW.gpx", direction: "SW" },
        { filename: "Kubinka_W_1.gpx", direction: "W", variant: 1 }
    ],
    "Moscow": [
        { filename: "Moscow_N.gpx", direction: "N" },
        { filename: "Moscow_NE.gpx", direction: "NE" },
        { filename: "Moscow_NW.gpx", direction: "NW" },
        { filename: "Moscow_S_1.gpx", direction: "S", variant: 1 },
        { filename: "Moscow_S_2.gpx", direction: "S", variant: 2 },
        { filename: "Moscow_SE.gpx", direction: "SE" },
        { filename: "Moscow_SW_1.gpx", direction: "SW", variant: 1 },
        { filename: "Moscow_SW_2.gpx", direction: "SW", variant: 2 },
        { filename: "Moscow_W.gpx", direction: "W" }
    ],
    "Mozhaysk": [
        { filename: "Mozhaysk_N.gpx", direction: "N" },
        { filename: "Mozhaysk_NW.gpx", direction: "NW" },
        { filename: "Mozhaysk_S.gpx", direction: "S" }
    ],
    "NaroFominsk": [
        { filename: "NaroFominsk_N.gpx", direction: "N" },
        { filename: "NaroFominsk_S.gpx", direction: "S" },
        { filename: "NaroFominsk_SW.gpx", direction: "SW" },
        { filename: "NaroFominsk_W.gpx", direction: "W" }
    ],
    "Obninsk": [
        { filename: "Obninsk_NW.gpx", direction: "NW" },
        { filename: "Obninsk_SW.gpx", direction: "SW" },
        { filename: "Obninsk_W.gpx", direction: "W" }
    ],
    "PavlovskyPosad": [
        { filename: "PavlovskyPosad_E.gpx", direction: "E" },
        { filename: "PavlovskyPosad_N.gpx", direction: "N" },
        { filename: "PavlovskyPosad_S.gpx", direction: "S" }
    ],
    "Podolsk": [
        { filename: "Podolsk_E.gpx", direction: "E" },
        { filename: "Podolsk_N.gpx", direction: "N" },
        { filename: "Podolsk_SE.gpx", direction: "SE" }
    ],
    "Pushkino": [
        { filename: "Pushkino_S.gpx", direction: "S" },
        { filename: "Pushkino_SW.gpx", direction: "SW" }
    ],
    "Ryazan": [
        { filename: "Ryazan_E.gpx", direction: "E" },
        { filename: "Ryazan_S.gpx", direction: "S" },
        { filename: "Ryazan_SE.gpx", direction: "SE" },
        { filename: "Ryazan_SW.gpx", direction: "SW" }
    ],
    "SergievPosad": [
        { filename: "SergievPosad_N.gpx", direction: "N" },
        { filename: "SergievPosad_SE.gpx", direction: "SE" },
        { filename: "SergievPosad_SW.gpx", direction: "SW" }
    ],
    "Serpukhov": [
        { filename: "Serpukhov_N.gpx", direction: "N" },
        { filename: "Serpukhov_NW.gpx", direction: "NW" },
        { filename: "Serpukhov_SW.gpx", direction: "SW" },
        { filename: "Serpukhov_W.gpx", direction: "W" }
    ],
    "Solnechnogorsk": [
        { filename: "Solnechnogorsk_N.gpx", direction: "N" },
        { filename: "Solnechnogorsk_NE.gpx", direction: "NE" },
        { filename: "Solnechnogorsk_NW.gpx", direction: "NW" },
        { filename: "Solnechnogorsk_S.gpx", direction: "S" },
        { filename: "Solnechnogorsk_SW.gpx", direction: "SW" }
    ],
    "Stupino": [
        { filename: "Stupino_S.gpx", direction: "S" },
        { filename: "Stupino_SW.gpx", direction: "SW" },
        { filename: "Stupino_W.gpx", direction: "W" }
    ],
    "Tula": [
        { filename: "Tula_N.gpx", direction: "N" },
        { filename: "Tula_S.gpx", direction: "S" },
        { filename: "Tula_SE.gpx", direction: "SE" },
        { filename: "Tula_SW.gpx", direction: "SW" },
        { filename: "Tula_W.gpx", direction: "W" }
    ],
    "Volokolamsk": [
        { filename: "Volokolamsk_S.gpx", direction: "S" },
        { filename: "Volokolamsk_SW.gpx", direction: "SW" }
    ],
    "Voskresensk": [
        { filename: "Voskresensk_N.gpx", direction: "N" },
        { filename: "Voskresensk_NW.gpx", direction: "NW" },
        { filename: "Voskresensk_S.gpx", direction: "S" },
        { filename: "Voskresensk_SW.gpx", direction: "SW" }
    ],
    "Yakhroma": [
        { filename: "Yakhroma_S.gpx", direction: "S" },
        { filename: "Yakhroma_W.gpx", direction: "W" }
    ],
    "Zavidovo": [
        { filename: "Zavidovo_N_1.gpx", direction: "N", variant: 1 },
        { filename: "Zavidovo_N_2.gpx", direction: "N", variant: 2 },
        { filename: "Zavidovo_SW.gpx", direction: "SW" },
        { filename: "Zavidovo_W.gpx", direction: "W" }
    ],
    "Zelenograd": [
        { filename: "Zelenograd_NW.gpx", direction: "NW" },
        { filename: "Zelenograd_SE.gpx", direction: "SE" }
    ],
    "Zhukovskyi": [
        { filename: "Zhukovskyi_NW.gpx", direction: "NW" }
    ],
    "Zvenigorod": [
        { filename: "Zvenigorod_S.gpx", direction: "S" },
        { filename: "Zvenigorod_SW.gpx", direction: "SW" },
        { filename: "Zvenigorod_W.gpx", direction: "W" }
    ]
};
