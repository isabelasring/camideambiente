// Configuración de gráficas con Chart.js - Fondo blanco
const chartColors = {
    primary: 'rgba(59, 130, 246, 0.8)',
    secondary: 'rgba(99, 102, 241, 0.8)',
    success: 'rgba(34, 197, 94, 0.8)',
    warning: 'rgba(245, 158, 11, 0.8)',
    purple: 'rgba(139, 92, 246, 0.8)',
    teal: 'rgba(20, 184, 166, 0.8)',
    orange: 'rgba(249, 115, 22, 0.8)',
    pink: 'rgba(236, 72, 153, 0.8)',
    blue: 'rgba(59, 130, 246, 0.8)',
    grid: 'rgba(0, 0, 0, 0.08)',
    text: '#374151'
};

let geodatosMapInstance = null;
let geodatosBaseLayersControl = null;
const geodatosLayerCache = new Map();
const geodatosLoadingFiles = new Set();
const geodatosRawDataCache = new Map();
const geodatosActiveFilterByFile = new Map();
const geodatosDateRangeStateByFile = new Map();
const geodatosVizModeByFile = new Map();
let geodatosCurrentFilterFile = null;
let geodatosDateRangeApplyTimer = null;
let geodatosLegendCollapsed = false;
let geodatosPopupConfig = {};
let geodatosPopupConfigPromise = null;
const geodatosFileConfigs = {
    'Airbnb.json': {
        label: 'Airbnb 2025',
        color: '#f97316',
        radius: 5,
        weight: 1
    },
    'Hoteles.json': {
        label: 'Hoteles',
        color: '#10b981',
        radius: 5,
        weight: 1
    },
    'SRCasignado_1.js': {
        label: 'Airbnb 2024',
        color: '#22c55e',
        radius: 4,
        weight: 1
    },
    'Clasificacion_Marco_Comercio.geojson': {
        label: 'Comercio (geojson)',
        color: '#3b82f6',
        radius: 2,
        weight: 0,
        heavy: true
    },
    'Clasificacion_Marco_Comercio.json': {
        label: 'Comercio (json)',
        color: '#60a5fa',
        radius: 2,
        weight: 0,
        heavy: true,
        popupKeys: ['razon_social', 'actividad_economica', 'Tipologia_final', 'municipio']
    },
    'Clasificacion_Ruido_Quejas.geojson': {
        label: 'Ruido Quejas',
        color: '#ef4444',
        radius: 4,
        weight: 0,
        stroke: false,
        opacity: 1,
        fillOpacity: 1,
        heavy: true,
        colorByProperty: 'tipo_caso',
        colorMap: {
            'Perturbación por ruido en vivienda o unidad residencial': '#ff006e',
            'Perturbación por ruido en establecimiento': '#8338ec',
            'Perturbación por ruido en espacio público': '#06d6a0'
        },
        fallbackColors: ['#a855f7', '#14b8a6', '#22c55e', '#e11d48', '#84cc16']
    }
};

const geodatosLayerFilterPresets = {
    'Airbnb.json': [
        { id: 'all', label: 'Todos', predicate: () => true },
        { id: 'jacuzzi', label: 'Jacuzzi', predicate: f => /jacuzzi/i.test(f.properties?.title || '') },
        { id: 'poblado', label: 'El Poblado', predicate: f => /poblado/i.test(f.properties?.title || '') },
        { id: 'laureles', label: 'Laureles', predicate: f => /laureles/i.test(f.properties?.title || '') },
        { id: 'pool', label: 'Pool', predicate: f => /pool/i.test(f.properties?.title || '') }
    ],
    'SRCasignado_1.js': [
        { id: 'all', label: 'Todos', predicate: () => true },
        {
            id: 'economico',
            label: 'Económico (<= US$50)',
            predicate: f => {
                const n = geodatosToNumberOrNull(f.properties?.a_cost);
                return n !== null && n <= 50;
            }
        },
        {
            id: 'intermedio',
            label: 'Intermedio (US$51-128)',
            predicate: f => {
                const n = geodatosToNumberOrNull(f.properties?.a_cost);
                return n !== null && n > 50 && n <= 128;
            }
        },
        {
            id: 'premium',
            label: 'Premium (> US$128)',
            predicate: f => {
                const n = geodatosToNumberOrNull(f.properties?.a_cost);
                return n !== null && n > 128;
            }
        },
        {
            id: 'capacidad_1_2',
            label: 'Capacidad 1-2',
            predicate: f => {
                const n = geodatosToNumberOrNull(f.properties?.a_capacity);
                return n !== null && n >= 1 && n <= 2;
            }
        },
        {
            id: 'capacidad_4_mas',
            label: 'Capacidad 4+',
            predicate: f => {
                const n = geodatosToNumberOrNull(f.properties?.a_capacity);
                return n !== null && n >= 4;
            }
        },
        {
            id: 'rental_unit',
            label: 'Entire rental unit',
            predicate: f => String(f.properties?.a_roomType || '').trim() === 'Entire rental unit'
        },
        {
            id: 'serviced_apartment',
            label: 'Entire serviced apartment',
            predicate: f => String(f.properties?.a_roomType || '').trim() === 'Entire serviced apartment'
        },
        {
            id: 'loft_condo',
            label: 'Loft/Condo',
            predicate: f => {
                const t = String(f.properties?.a_roomType || '').trim();
                return t === 'Entire loft' || t === 'Entire condo';
            }
        },
        { id: 'mascotas_si', label: 'Acepta mascotas', predicate: f => String(f.properties?.a_pets || '').trim() === '1' },
        { id: 'ninos_si', label: 'Acepta niños', predicate: f => String(f.properties?.a_children || '').trim() === '1' },
        { id: 'fiesta_si', label: 'Permite fiesta', predicate: f => String(f.properties?.a_party || '').trim() === '1' },
        {
            id: 'rating_10',
            label: 'Rating 10',
            predicate: f => {
                const n = geodatosToNumberOrNull(f.properties?.a_rating);
                return n !== null && n >= 10;
            }
        },
        {
            id: 'minnight_1_2',
            label: 'Estancia mínima 1-2 noches',
            predicate: f => {
                const n = geodatosToNumberOrNull(f.properties?.a_minNight);
                return n !== null && n >= 1 && n <= 2;
            }
        }
    ],
    'Hoteles.json': [
        { id: 'all', label: 'Todos', predicate: () => true },
        {
            id: 'medellin',
            label: 'Medellín',
            predicate: f => (f.properties?.cod_mpio === '001') || String(f.properties?.Registro_8 || '').trim().toUpperCase() === 'MEDELLIN'
        },
        { id: 'activos', label: 'Activos', predicate: f => String(f.properties?.Registro_5 || '').trim().toUpperCase() === 'ACTIVO' },
        { id: 'tipo_hotel', label: 'Tipo HOTEL', predicate: f => String(f.properties?.Registro10 || '').trim().toUpperCase() === 'HOTEL' },
        { id: 'con_rnt', label: 'Con RNT', predicate: f => String(f.properties?.rnt || '').trim() !== '' }
    ],
    'Clasificacion_Marco_Comercio.geojson': [
        { id: 'all', label: 'Todos', predicate: () => true },
        { id: 'ber', label: 'Tipología BER', predicate: f => String(f.properties?.Tipologia_final || '').trim().toUpperCase() === 'BER' },
        { id: 'ier', label: 'Tipología IER', predicate: f => String(f.properties?.Tipologia_final || '').trim().toUpperCase() === 'IER' },
        { id: 'aer', label: 'Tipología AER', predicate: f => String(f.properties?.Tipologia_final || '').trim().toUpperCase() === 'AER' },
        { id: 'micro', label: 'Microempresa', predicate: f => String(f.properties?.desc_tamano_empresa || '').trim().toUpperCase() === 'MICRO' },
        { id: 'clasificados', label: 'Clasificados', predicate: f => !['', 'SIN CLASIFICAR'].includes(String(f.properties?.Tipologia_final || '').trim().toUpperCase()) }
    ],
    'Clasificacion_Ruido_Quejas.geojson': [
        { id: 'all', label: 'Todos', predicate: () => true },
        {
            id: 'vivienda',
            label: 'Vivienda',
            predicate: f => String(f.properties?.tipo_caso || '').includes('vivienda o unidad residencial')
        },
        {
            id: 'establecimiento',
            label: 'Establecimiento',
            predicate: f => String(f.properties?.tipo_caso || '').includes('establecimiento')
        },
        {
            id: 'espacio_publico',
            label: 'Espacio público',
            predicate: f => String(f.properties?.tipo_caso || '').includes('espacio público')
        },
        { id: 'positivo', label: 'Cierre positivo', predicate: f => String(f.properties?.cierre || '').trim().toUpperCase() === 'POSITIVO' },
        { id: 'negativo', label: 'Caso negativo', predicate: f => String(f.properties?.cierre || '').trim().toUpperCase() === 'CASO NEGATIVO' },
        { id: 'corregimientos', label: 'Corregimientos', predicate: f => String(f.properties?.zona || '').trim() === 'Corregimientos' }
    ]
};

function setGeodatosStatus(message) {
    const statusEl = document.getElementById('geodatosStatus');
    if (statusEl) statusEl.textContent = message;
}

function geodatosGetLayerLabel(file) {
    return (geodatosFileConfigs[file] && geodatosFileConfigs[file].label) || file;
}

function geodatosGetLayerControlLabel(file) {
    const cfg = geodatosFileConfigs[file] || {};
    const label = geodatosGetLayerLabel(file);
    const dotColor = cfg.color || '#9ca3af';
    return `<span class="geodatos-layer-control-label"><span class="geodatos-layer-control-dot" style="background:${dotColor}"></span>${label}</span>`;
}

function geodatosGetVizMode(file) {
    return geodatosVizModeByFile.get(file) || 'points';
}

function geodatosSupportsHeatmap(file) {
    return [
        'Clasificacion_Ruido_Quejas.geojson',
        'SRCasignado_1.js',
        'Airbnb.json',
        'Hoteles.json',
        'Clasificacion_Marco_Comercio.geojson'
    ].includes(file);
}

function geodatosRenderVizModeControl(file) {
    const wrap = document.getElementById('geodatosVizModeWrap');
    const select = document.getElementById('geodatosVizModeSelect');
    if (!wrap || !select) return;

    if (!file || !geodatosSupportsHeatmap(file)) {
        wrap.style.display = 'none';
        return;
    }

    wrap.style.display = '';
    select.value = geodatosGetVizMode(file);
    select.dataset.file = file;
    if (select.dataset.bound !== '1') {
        select.addEventListener('change', () => {
            const targetFile = select.dataset.file;
            if (!targetFile) return;
            geodatosVizModeByFile.set(targetFile, select.value || 'points');
            const filterId = geodatosActiveFilterByFile.get(targetFile) || 'all';
            applyGeodatosFilter(targetFile, filterId);
        });
        select.dataset.bound = '1';
    }
}

function geodatosNormalizeWeight(value, min, max) {
    if (!Number.isFinite(value)) return 0.35;
    if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return 0.65;
    const t = (value - min) / (max - min);
    return Math.max(0.15, Math.min(1, t));
}

function geodatosHeatWeightForFeature(file, feature) {
    const p = feature?.properties || {};
    const activeFilterId = geodatosActiveFilterByFile.get(file) || 'all';

    if (file === 'Clasificacion_Ruido_Quejas.geojson') {
        const cantidad = geodatosToNumberOrNull(p.cantidad) || 1;
        return Math.max(0.15, Math.min(1, cantidad / 5));
    }

    if (file === 'Airbnb.json') {
        // Dataset 2025 disponible aquí solo trae ubicación + metadatos mínimos (sin precio/capacidad)
        return 0.55;
    }

    if (file === 'Hoteles.json') {
        const camas = geodatosToNumberOrNull(p.camas);
        const habitaciones = geodatosToNumberOrNull(p.habitacion);
        const empleados = geodatosToNumberOrNull(p.num_emp);

        // Prioriza capacidad hotelera (camas/habitaciones); empleados aporta poco y suele venir vacío
        const camasW = camas === null ? 0.45 : geodatosNormalizeWeight(camas, 1, 200);
        const habW = habitaciones === null ? 0.45 : geodatosNormalizeWeight(habitaciones, 1, 120);
        const empW = empleados === null ? 0.35 : geodatosNormalizeWeight(empleados, 1, 100);
        return Math.max(0.2, Math.min(1, (camasW * 0.5) + (habW * 0.35) + (empW * 0.15)));
    }

    if (file === 'Clasificacion_Marco_Comercio.geojson') {
        const score = geodatosToNumberOrNull(p.Score);
        const tip = String(p.Tipologia_final || '').trim().toUpperCase();
        const size = String(p.desc_tamano_empresa || '').trim().toUpperCase();

        // Base por score de geocodificación
        let weight = score === null ? 0.5 : geodatosNormalizeWeight(score, 70, 100);
        // Bonus suave si está clasificado (no SIN CLASIFICAR)
        if (tip && tip !== 'SIN CLASIFICAR' && tip !== 'N/D') weight += 0.1;
        // Bonus por tamaño de empresa
        if (size === 'GRANDE') weight += 0.15;
        else if (size === 'MEDIANA') weight += 0.1;
        else if (size === 'PEQUEÑA') weight += 0.05;
        return Math.max(0.2, Math.min(1, weight));
    }

    if (file === 'SRCasignado_1.js') {
        const cost = geodatosToNumberOrNull(p.a_cost);
        const capacity = geodatosToNumberOrNull(p.a_capacity);
        const rating = geodatosToNumberOrNull(p.a_rating);

        // Peso inteligente según el filtro activo cuando hay métrica relevante
        if (['economico', 'intermedio', 'premium'].includes(activeFilterId)) {
            if (cost === null) return 0.35;
            // En precio hacemos peso por magnitud del precio para ver hotspots de mayor valor
            return geodatosNormalizeWeight(cost, 30, 400);
        }
        if (['capacidad_1_2', 'capacidad_4_mas'].includes(activeFilterId)) {
            if (capacity === null) return 0.35;
            return geodatosNormalizeWeight(capacity, 1, 16);
        }
        if (activeFilterId === 'rating_10') {
            if (rating === null) return 0.35;
            return geodatosNormalizeWeight(rating, 1, 10);
        }

        // General: combinación suave de capacidad y costo, si existen
        const capW = capacity === null ? 0.5 : geodatosNormalizeWeight(capacity, 1, 16);
        const costW = cost === null ? 0.5 : geodatosNormalizeWeight(cost, 30, 400);
        return Math.max(0.2, Math.min(1, (capW * 0.55) + (costW * 0.45)));
    }

    return 0.55;
}

function geodatosHeatConfigForFile(file) {
    if (file === 'Clasificacion_Ruido_Quejas.geojson') {
        return {
            radius: 18,
            blur: 16,
            minOpacity: 0.35,
            gradient: {
                0.15: '#0ea5e9',
                0.35: '#22c55e',
                0.55: '#eab308',
                0.75: '#f97316',
                1.0: '#ef4444'
            }
        };
    }

    if (file === 'SRCasignado_1.js') {
        return {
            radius: 20,
            blur: 18,
            minOpacity: 0.32,
            gradient: {
                0.15: '#1d4ed8',
                0.35: '#06b6d4',
                0.55: '#22c55e',
                0.75: '#f59e0b',
                1.0: '#ef4444'
            }
        };
    }

    if (file === 'Airbnb.json') {
        return {
            radius: 18,
            blur: 15,
            minOpacity: 0.3,
            gradient: {
                0.2: '#312e81',
                0.4: '#7c3aed',
                0.6: '#ec4899',
                0.8: '#f97316',
                1.0: '#fde047'
            }
        };
    }

    if (file === 'Hoteles.json') {
        return {
            radius: 17,
            blur: 14,
            minOpacity: 0.28,
            gradient: {
                0.15: '#0ea5e9',
                0.35: '#10b981',
                0.55: '#84cc16',
                0.75: '#f59e0b',
                1.0: '#ef4444'
            }
        };
    }

    if (file === 'Clasificacion_Marco_Comercio.geojson') {
        return {
            radius: 14,
            blur: 13,
            minOpacity: 0.24,
            gradient: {
                0.15: '#1d4ed8',
                0.35: '#2563eb',
                0.55: '#06b6d4',
                0.75: '#22c55e',
                1.0: '#fde047'
            }
        };
    }

    return { radius: 18, blur: 16, minOpacity: 0.35 };
}

function geodatosGetFilterPresets(file) {
    return geodatosLayerFilterPresets[file] || [{ id: 'all', label: 'Todos', predicate: () => true }];
}

function geodatosGetLoadedFilesForFiltering() {
    return Array.from(geodatosRawDataCache.keys());
}

function geodatosPct(n, d) {
    if (!d || !Number.isFinite(n) || !Number.isFinite(d)) return '0.0';
    return ((n / d) * 100).toFixed(1);
}

function geodatosComputeComercioIndicators(data, groupByField) {
    const rowsMap = new Map();
    const features = Array.isArray(data && data.features) ? data.features : [];
    const targetTypes = ['AER', 'IER', 'ERAA', 'BER'];

    for (const f of features) {
        const p = f.properties || {};
        const group = String(p[groupByField] ?? 'N/D').trim() || 'N/D';
        const tip = String(p.Tipologia_final ?? 'N/D').trim() || 'N/D';

        if (!rowsMap.has(group)) {
            rowsMap.set(group, {
                group,
                total: 0,
                clasificados: 0,
                sinClasif: 0,
                AER: 0,
                IER: 0,
                ERAA: 0,
                BER: 0
            });
        }

        const row = rowsMap.get(group);
        row.total += 1;

        const normalizedTip = tip.toUpperCase();
        if (targetTypes.includes(normalizedTip)) {
            row[normalizedTip] += 1;
            row.clasificados += 1;
        } else if (normalizedTip === 'SIN CLASIFICAR' || normalizedTip === 'N/D' || normalizedTip === '') {
            row.sinClasif += 1;
        } else {
            // Otros tipos clasificados no contemplados explícitamente
            row.clasificados += 1;
        }
    }

    return Array.from(rowsMap.values()).sort((a, b) => b.total - a.total);
}

function geodatosToNumberOrNull(value) {
    const text = String(value ?? '').trim();
    if (!text || ['nan', 'null', 'undefined'].includes(text.toLowerCase())) return null;
    const n = Number(text.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
}

function geodatosComputeAirbnb2024Indicators(data) {
    const features = Array.isArray(data && data.features) ? data.features : [];
    const groups = new Map();

    const ensure = (roomType) => {
        const key = roomType || 'N/D';
        if (!groups.has(key)) {
            groups.set(key, {
                roomType: key,
                total: 0,
                costSum: 0,
                costN: 0,
                ratingSum: 0,
                ratingN: 0,
                capacitySum: 0,
                capacityN: 0,
                minNightSum: 0,
                minNightN: 0,
                maxNightSum: 0,
                maxNightN: 0,
                petsYes: 0,
                childrenYes: 0,
                partyYes: 0
            });
        }
        return groups.get(key);
    };

    for (const f of features) {
        const p = f.properties || {};
        const row = ensure(String(p.a_roomType || '').trim() || 'N/D');
        row.total += 1;

        const cost = geodatosToNumberOrNull(p.a_cost);
        if (cost !== null && cost > 0) { row.costSum += cost; row.costN += 1; }

        const rating = geodatosToNumberOrNull(p.a_rating);
        if (rating !== null && rating > 0) { row.ratingSum += rating; row.ratingN += 1; }

        const cap = geodatosToNumberOrNull(p.a_capacity);
        if (cap !== null && cap > 0) { row.capacitySum += cap; row.capacityN += 1; }

        const minNight = geodatosToNumberOrNull(p.a_minNight);
        if (minNight !== null && minNight > 0) { row.minNightSum += minNight; row.minNightN += 1; }

        const maxNight = geodatosToNumberOrNull(p.a_maxNight);
        if (maxNight !== null && maxNight > 0) { row.maxNightSum += maxNight; row.maxNightN += 1; }

        if (String(p.a_pets ?? '').trim() === '1') row.petsYes += 1;
        if (String(p.a_children ?? '').trim() === '1') row.childrenYes += 1;
        if (String(p.a_party ?? '').trim() === '1') row.partyYes += 1;
    }

    return Array.from(groups.values())
        .map(r => ({
            ...r,
            avgCost: r.costN ? (r.costSum / r.costN) : null,
            avgRating: r.ratingN ? (r.ratingSum / r.ratingN) : null,
            avgCapacity: r.capacityN ? (r.capacitySum / r.capacityN) : null,
            avgMinNight: r.minNightN ? (r.minNightSum / r.minNightN) : null,
            avgMaxNight: r.maxNightN ? (r.maxNightSum / r.maxNightN) : null
        }))
        .sort((a, b) => b.total - a.total);
}

function geodatosFmtNum(value, digits = 1) {
    if (value === null || value === undefined || !Number.isFinite(value)) return 'N/D';
    return Number(value).toLocaleString('es-CO', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    });
}

function geodatosRenderComercioIndicators(fileForFilters) {
    const panel = document.getElementById('geodatosIndicators');
    const titleEl = document.getElementById('geodatosIndicatorsTitle');
    const tableEl = document.getElementById('geodatosComercioTable');
    const noteEl = document.getElementById('geodatosIndicatorsNote');
    const groupSelect = document.getElementById('geodatosComercioGroupBy');
    const groupWrap = document.getElementById('geodatosComercioGroupByWrap');
    if (!panel || !tableEl || !noteEl || !groupSelect || !titleEl || !groupWrap) return;

    const comercioFile = 'Clasificacion_Marco_Comercio.geojson';
    const ruidoFile = 'Clasificacion_Ruido_Quejas.geojson';
    const airbnb2024File = 'SRCasignado_1.js';
    const isComercio = fileForFilters === comercioFile;
    const isRuido = fileForFilters === ruidoFile;
    const isAirbnb2024 = fileForFilters === airbnb2024File;

    if (!isComercio && !isRuido && !isAirbnb2024) {
        panel.style.display = 'none';
        tableEl.innerHTML = '';
        noteEl.textContent = '';
        return;
    }

    if (isRuido) {
        const rawData = geodatosRawDataCache.get(ruidoFile);
        if (!rawData) {
            panel.style.display = 'none';
            return;
        }

        const activeFilterId = geodatosActiveFilterByFile.get(ruidoFile) || 'all';
        const filteredData = geodatosBuildFilteredData(ruidoFile, rawData, activeFilterId);
        const feats = Array.isArray(filteredData.features) ? filteredData.features : [];
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const rowsMap = new Map();

        const keyForTipo = (tipo) => {
            const t = String(tipo || '');
            if (t.includes('vivienda o unidad residencial')) return 'vivienda';
            if (t.includes('espacio público')) return 'espacio_publico';
            if (t.includes('establecimiento')) return 'establecimiento';
            return null;
        };

        for (const f of feats) {
            const p = f.properties || {};
            const ts = Number(p.fecha);
            if (!Number.isFinite(ts)) continue;
            const d = new Date(ts);
            const month = d.getMonth();
            if (!rowsMap.has(month)) {
                rowsMap.set(month, {
                    month,
                    vivienda: 0,
                    espacio_publico: 0,
                    establecimiento: 0,
                    total: 0
                });
            }
            const row = rowsMap.get(month);
            const tipoKey = keyForTipo(p.tipo_caso);
            if (tipoKey) row[tipoKey] += Number(p.cantidad) || 1;
            row.total += Number(p.cantidad) || 1;
        }

        const rows = Array.from(rowsMap.values()).sort((a, b) => a.month - b.month);
        titleEl.textContent = 'Indicadores dinámicos (Ruido Quejas)';
        groupWrap.style.display = 'none';
        noteEl.textContent = `Tabla mensual por tipo de caso con filtros actuales (${feats.length.toLocaleString('es-CO')} registros).`;

        const header = `
            <thead>
                <tr>
                    <th>Mes</th>
                    <th>Vivienda / Unidad residencial</th>
                    <th>Espacio público</th>
                    <th>Establecimiento</th>
                    <th>Total mensual</th>
                </tr>
            </thead>
        `;
        const body = rows.map(r => `
            <tr>
                <td>${monthNames[r.month]}</td>
                <td>${r.vivienda.toLocaleString('es-CO')}</td>
                <td>${r.espacio_publico.toLocaleString('es-CO')}</td>
                <td>${r.establecimiento.toLocaleString('es-CO')}</td>
                <td>${r.total.toLocaleString('es-CO')}</td>
            </tr>
        `).join('');

        tableEl.innerHTML = header + `<tbody>${body}</tbody>`;
        panel.style.display = '';
        return;
    }

    if (isAirbnb2024) {
        const rawData = geodatosRawDataCache.get(airbnb2024File);
        if (!rawData) {
            panel.style.display = 'none';
            return;
        }

        const activeFilterId = geodatosActiveFilterByFile.get(airbnb2024File) || 'all';
        const filteredData = geodatosBuildFilteredData(airbnb2024File, rawData, activeFilterId);
        const rows = geodatosComputeAirbnb2024Indicators(filteredData);
        const totalListings = Array.isArray(filteredData.features) ? filteredData.features.length : 0;

        titleEl.textContent = 'Indicadores dinámicos (Airbnb 2024)';
        groupWrap.style.display = 'none';
        noteEl.textContent = `Estadísticas agrupadas por tipo de alojamiento (${totalListings.toLocaleString('es-CO')} anuncios con filtros actuales).`;

        const header = `
            <thead>
                <tr>
                    <th>Tipo</th>
                    <th>Anuncios</th>
                    <th>Costo prom (US)</th>
                    <th>Rating prom</th>
                    <th>Capacidad prom</th>
                    <th>MinNight prom</th>
                    <th>MaxNight prom</th>
                    <th>% Mascotas</th>
                    <th>% Niños</th>
                    <th>% Fiesta</th>
                </tr>
            </thead>
        `;

        const body = rows.map(r => `
            <tr>
                <td>${geodatosEscapeHtml(r.roomType)}</td>
                <td>${r.total.toLocaleString('es-CO')}</td>
                <td>${geodatosFmtNum(r.avgCost, 1)}</td>
                <td>${geodatosFmtNum(r.avgRating, 1)}</td>
                <td>${geodatosFmtNum(r.avgCapacity, 1)}</td>
                <td>${geodatosFmtNum(r.avgMinNight, 1)}</td>
                <td>${geodatosFmtNum(r.avgMaxNight, 1)}</td>
                <td>${geodatosPct(r.petsYes, r.total)}%</td>
                <td>${geodatosPct(r.childrenYes, r.total)}%</td>
                <td>${geodatosPct(r.partyYes, r.total)}%</td>
            </tr>
        `).join('');

        tableEl.innerHTML = header + `<tbody>${body}</tbody>`;
        panel.style.display = '';
        return;
    }

    const rawData = geodatosRawDataCache.get(comercioFile);
    if (!rawData) {
        panel.style.display = 'none';
        return;
    }

    const activeFilterId = geodatosActiveFilterByFile.get(comercioFile) || 'all';
    const filteredData = geodatosBuildFilteredData(comercioFile, rawData, activeFilterId);
    const groupByField = groupSelect.value || 'desc_tamano_empresa';
    const rows = geodatosComputeComercioIndicators(filteredData, groupByField);

    const totalRows = rows.length;
    const featuresCount = Array.isArray(filteredData.features) ? filteredData.features.length : 0;
    titleEl.textContent = 'Indicadores dinámicos (Comercio)';
    groupWrap.style.display = '';
    noteEl.textContent = `No hay campo de comuna en este dataset. Tabla agrupada por "${groupByField}" (${featuresCount.toLocaleString('es-CO')} registros, ${totalRows} grupos).`;

    const header = `
        <thead>
            <tr>
                <th>${groupByField}</th>
                <th>Total</th>
                <th>Clasificados</th>
                <th>AER</th>
                <th>%AER</th>
                <th>IER</th>
                <th>%IER</th>
                <th>ERAA</th>
                <th>%ERAA</th>
                <th>BER</th>
                <th>%BER</th>
                <th>Sin clasif.</th>
            </tr>
        </thead>
    `;

    const body = rows.map(r => `
        <tr>
            <td>${geodatosEscapeHtml(r.group)}</td>
            <td>${r.total.toLocaleString('es-CO')}</td>
            <td>${r.clasificados.toLocaleString('es-CO')}</td>
            <td>${r.AER.toLocaleString('es-CO')}</td>
            <td>${geodatosPct(r.AER, r.clasificados)}%</td>
            <td>${r.IER.toLocaleString('es-CO')}</td>
            <td>${geodatosPct(r.IER, r.clasificados)}%</td>
            <td>${r.ERAA.toLocaleString('es-CO')}</td>
            <td>${geodatosPct(r.ERAA, r.clasificados)}%</td>
            <td>${r.BER.toLocaleString('es-CO')}</td>
            <td>${geodatosPct(r.BER, r.clasificados)}%</td>
            <td>${r.sinClasif.toLocaleString('es-CO')}</td>
        </tr>
    `).join('');

    tableEl.innerHTML = header + `<tbody>${body}</tbody>`;
    panel.style.display = '';

    if (groupSelect.dataset.bound !== '1') {
        groupSelect.addEventListener('change', () => {
            geodatosRenderComercioIndicators(geodatosCurrentFilterFile);
        });
        groupSelect.dataset.bound = '1';
    }
}

function geodatosRenderFilterLayerSelect(preferredFile) {
    const panel = document.getElementById('geodatosFilters');
    const selectEl = document.getElementById('geodatosFilterLayerSelect');
    if (!panel || !selectEl) return null;

    const files = geodatosGetLoadedFilesForFiltering();
    if (!files.length) {
        panel.style.display = 'none';
        selectEl.innerHTML = '';
        geodatosCurrentFilterFile = null;
        return null;
    }

    let selectedFile = preferredFile || geodatosCurrentFilterFile;
    if (!selectedFile || !files.includes(selectedFile)) selectedFile = files[0];
    geodatosCurrentFilterFile = selectedFile;

    selectEl.innerHTML = files.map(file => {
        const layer = geodatosLayerCache.get(file);
        const visible = !!(layer && geodatosMapInstance && geodatosMapInstance.hasLayer(layer));
        const suffix = visible ? ' (visible)' : ' (oculta)';
        return `<option value="${file}" ${file === selectedFile ? 'selected' : ''}>${geodatosGetLayerLabel(file)}${suffix}</option>`;
    }).join('');

    if (selectEl.dataset.bound !== '1') {
        selectEl.addEventListener('change', () => {
            geodatosCurrentFilterFile = selectEl.value || null;
            geodatosRenderFilterButtons(geodatosCurrentFilterFile);
            geodatosRenderDateRangeControls(geodatosCurrentFilterFile);
            geodatosRenderLegend(geodatosCurrentFilterFile);
            geodatosRenderComercioIndicators(geodatosCurrentFilterFile);
        });
        selectEl.dataset.bound = '1';
    }

    return selectedFile;
}

function geodatosFormatShortDateMs(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 'N/D';
    return new Date(n).toLocaleString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function geodatosRenderFilterButtons(file) {
    const panel = document.getElementById('geodatosFilters');
    const titleEl = document.getElementById('geodatosFiltersTitle');
    const selectEl = document.getElementById('geodatosFilterSelect');
    if (!panel || !titleEl || !selectEl) return;

    const selectedFile = geodatosRenderFilterLayerSelect(file);
    const presets = selectedFile ? geodatosGetFilterPresets(selectedFile) : [];
    if (!selectedFile || !presets.length) {
        selectEl.innerHTML = '';
        return;
    }

    panel.style.display = '';
    titleEl.textContent = `Filtros: ${geodatosGetLayerLabel(selectedFile)}`;
    geodatosRenderVizModeControl(selectedFile);
    const activeFilterId = geodatosActiveFilterByFile.get(selectedFile) || 'all';
    selectEl.innerHTML = presets.map(preset => (
        `<option value="${preset.id}" ${preset.id === activeFilterId ? 'selected' : ''}>${preset.label}</option>`
    )).join('');
    selectEl.dataset.file = selectedFile;
    if (selectEl.dataset.bound !== '1') {
        selectEl.addEventListener('change', () => {
            const targetFile = selectEl.dataset.file;
            const filterId = selectEl.value;
            if (targetFile && filterId) applyGeodatosFilter(targetFile, filterId);
        });
        selectEl.dataset.bound = '1';
    }
}

function geodatosRenderLegend(file) {
    const panel = document.getElementById('geodatosLegend');
    const titleEl = document.getElementById('geodatosLegendTitle');
    const itemsEl = document.getElementById('geodatosLegendItems');
    if (!panel || !titleEl || !itemsEl) return;

    const visibleLegendLayers = Array.from(geodatosLayerCache.entries())
        .filter(([layerFile, layer]) => {
            const cfg = geodatosFileConfigs[layerFile];
            return !!(
                cfg &&
                cfg.colorMap &&
                cfg.colorByProperty &&
                geodatosMapInstance &&
                layer &&
                geodatosMapInstance.hasLayer(layer)
            );
        })
        .map(([layerFile]) => layerFile);

    if (!visibleLegendLayers.length) {
        panel.style.display = 'none';
        itemsEl.innerHTML = '';
        return;
    }

    panel.style.display = '';
    titleEl.textContent = visibleLegendLayers.length === 1 ? 'Leyenda' : 'Leyenda (capas visibles)';

    itemsEl.innerHTML = visibleLegendLayers.map(layerFile => {
        const cfg = geodatosFileConfigs[layerFile];
        const header = `<div class="geodatos-legend-group-title">${geodatosGetLayerLabel(layerFile)} <span style="opacity:.7;">(${cfg.colorByProperty})</span></div>`;
        const items = Object.entries(cfg.colorMap).map(([label, color]) => (
            `<div class="geodatos-legend-item"><span class="geodatos-legend-dot" style="background:${color}"></span><span>${label}</span></div>`
        )).join('');
        return `<div class="geodatos-legend-group">${header}<div class="geodatos-legend-items">${items}</div></div>`;
    }).join('');
}

function bindGeodatosLegendToggle() {
    const panel = document.getElementById('geodatosLegend');
    const btn = document.getElementById('geodatosLegendToggle');
    if (!panel || !btn || btn.dataset.bound === '1') return;

    const sync = () => {
        panel.classList.toggle('is-collapsed', geodatosLegendCollapsed);
        btn.textContent = geodatosLegendCollapsed ? '+' : '−';
        btn.setAttribute('aria-expanded', geodatosLegendCollapsed ? 'false' : 'true');
        btn.setAttribute('title', geodatosLegendCollapsed ? 'Expandir leyenda' : 'Contraer leyenda');
    };

    btn.addEventListener('click', () => {
        geodatosLegendCollapsed = !geodatosLegendCollapsed;
        sync();
    });

    btn.dataset.bound = '1';
    sync();
}

function geodatosEnsureDateRangeState(file) {
    if (file !== 'Clasificacion_Ruido_Quejas.geojson') return null;
    if (geodatosDateRangeStateByFile.has(file)) return geodatosDateRangeStateByFile.get(file);
    const data = geodatosRawDataCache.get(file);
    if (!data || !Array.isArray(data.features)) return null;

    const values = data.features
        .map(f => Number(f.properties?.fecha))
        .filter(v => Number.isFinite(v))
        .sort((a, b) => a - b);
    if (!values.length) return null;

    const state = {
        min: values[0],
        max: values[values.length - 1],
        selectedMin: values[0],
        selectedMax: values[values.length - 1]
    };
    geodatosDateRangeStateByFile.set(file, state);
    return state;
}

function geodatosRenderDateRangeControls(file) {
    const panel = document.getElementById('geodatosDateRange');
    const minInput = document.getElementById('geodatosDateMin');
    const maxInput = document.getElementById('geodatosDateMax');
    const minLabel = document.getElementById('geodatosDateMinLabel');
    const maxLabel = document.getElementById('geodatosDateMaxLabel');
    const minBubble = document.getElementById('geodatosDateMinBubble');
    const maxBubble = document.getElementById('geodatosDateMaxBubble');
    const fillEl = document.getElementById('geodatosDateRangeFill');
    const monthGridEl = document.getElementById('geodatosDateMonthGrid');
    const applyBtn = document.getElementById('geodatosDateApply');
    const resetBtn = document.getElementById('geodatosDateReset');
    if (!panel || !minInput || !maxInput || !minLabel || !maxLabel || !applyBtn || !resetBtn || !minBubble || !maxBubble || !fillEl || !monthGridEl) return;

    if (file !== 'Clasificacion_Ruido_Quejas.geojson') {
        panel.style.display = 'none';
        return;
    }

    const state = geodatosEnsureDateRangeState(file);
    if (!state) {
        panel.style.display = 'none';
        return;
    }

    panel.style.display = '';
    const dayStep = 24 * 60 * 60 * 1000;

    minInput.min = String(state.min);
    minInput.max = String(state.max);
    maxInput.min = String(state.min);
    maxInput.max = String(state.max);
    minInput.step = String(dayStep);
    maxInput.step = String(dayStep);
    minInput.value = String(state.selectedMin);
    maxInput.value = String(state.selectedMax);

    minLabel.textContent = `Desde: ${geodatosFormatShortDateMs(state.selectedMin)}`;
    maxLabel.textContent = `Hasta: ${geodatosFormatShortDateMs(state.selectedMax)}`;
    const updateSliderVisuals = () => {
        const range = Math.max(1, state.max - state.min);
        const minPct = ((state.selectedMin - state.min) / range) * 100;
        const maxPct = ((state.selectedMax - state.min) / range) * 100;
        fillEl.style.left = `${Math.max(0, minPct)}%`;
        fillEl.style.width = `${Math.max(0, maxPct - minPct)}%`;
        minBubble.style.left = `${Math.max(0, minPct)}%`;
        maxBubble.style.left = `${Math.max(0, maxPct)}%`;
        minBubble.textContent = geodatosFormatShortDateMs(state.selectedMin);
        maxBubble.textContent = geodatosFormatShortDateMs(state.selectedMax);
    };

    const renderMonthGrid = () => {
        const startDate = new Date(state.min);
        const endDate = new Date(state.max);
        const startMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1).getTime();
        const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1).getTime();
        const range = Math.max(1, state.max - state.min);
        const items = [];

        for (let ts = startMonth; ts <= endMonth; ) {
            const pct = ((ts - state.min) / range) * 100;
            if (pct >= 0 && pct <= 100) {
                const d = new Date(ts);
                const monthLabel = d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' });
                items.push(
                    `<div class="geodatos-date-range-month-tick" style="left:${pct}%;"></div>` +
                    `<div class="geodatos-date-range-month-label" style="left:${pct}%;"><span>${monthLabel}</span></div>`
                );
            }
            const d = new Date(ts);
            ts = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
        }

        monthGridEl.innerHTML = items.join('');
    };

    updateSliderVisuals();
    renderMonthGrid();

    if (minInput.dataset.bound !== '1') {
        const syncLabels = () => {
            const currentFile = 'Clasificacion_Ruido_Quejas.geojson';
            const s = geodatosDateRangeStateByFile.get(currentFile);
            if (!s) return;
            let minVal = Number(minInput.value);
            let maxVal = Number(maxInput.value);
            if (minVal > maxVal) {
                if (document.activeElement === minInput) maxVal = minVal;
                else minVal = maxVal;
            }
            s.selectedMin = minVal;
            s.selectedMax = maxVal;
            minInput.value = String(minVal);
            maxInput.value = String(maxVal);
            minLabel.textContent = `Desde: ${geodatosFormatShortDateMs(minVal)}`;
            maxLabel.textContent = `Hasta: ${geodatosFormatShortDateMs(maxVal)}`;
            updateSliderVisuals();

            // Filtro dinámico con debounce para no recalcular en cada pixel del drag
            if (geodatosDateRangeApplyTimer) clearTimeout(geodatosDateRangeApplyTimer);
            geodatosDateRangeApplyTimer = setTimeout(() => {
                const filterId = geodatosActiveFilterByFile.get(currentFile) || 'all';
                applyGeodatosFilter(currentFile, filterId);
            }, 180);
        };

        minInput.addEventListener('input', syncLabels);
        maxInput.addEventListener('input', syncLabels);
        applyBtn.addEventListener('click', () => {
            const fileKey = 'Clasificacion_Ruido_Quejas.geojson';
            const filterId = geodatosActiveFilterByFile.get(fileKey) || 'all';
            applyGeodatosFilter(fileKey, filterId);
        });
        resetBtn.addEventListener('click', () => {
            const fileKey = 'Clasificacion_Ruido_Quejas.geojson';
            const s = geodatosEnsureDateRangeState(fileKey);
            if (!s) return;
            s.selectedMin = s.min;
            s.selectedMax = s.max;
            geodatosRenderDateRangeControls(fileKey);
            const filterId = geodatosActiveFilterByFile.get(fileKey) || 'all';
            applyGeodatosFilter(fileKey, filterId);
        });
        minInput.dataset.bound = '1';
    }
}

async function loadGeodatosPopupConfig() {
    if (geodatosPopupConfigPromise) return geodatosPopupConfigPromise;

    geodatosPopupConfigPromise = fetch('/geodatos-popup-config.json')
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(data => {
            geodatosPopupConfig = (data && typeof data === 'object') ? data : {};
            return geodatosPopupConfig;
        })
        .catch(error => {
            console.error('No se pudo cargar geodatos-popup-config.json:', error);
            geodatosPopupConfig = {};
            return geodatosPopupConfig;
        });

    return geodatosPopupConfigPromise;
}

function updateGeodatosButtonsState() {
    document.querySelectorAll('.geodatos-layer-btn[data-file]').forEach(btn => {
        const file = btn.getAttribute('data-file');
        const layer = geodatosLayerCache.get(file);
        const isVisible = !!(layer && geodatosMapInstance && geodatosMapInstance.hasLayer(layer));
        btn.classList.toggle('is-active', isVisible);
        btn.classList.toggle('is-loading', geodatosLoadingFiles.has(file));
    });
}

function geodatosFeatureCount(data) {
    if (!data) return 0;
    if (Array.isArray(data.features)) return data.features.length;
    if (Array.isArray(data)) return data.length;
    return 0;
}

function geodatosNormalizeInputToGeoJSON(data) {
    if (!data || typeof data !== 'object') return null;

    if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
        return data;
    }

    // ArcGIS/Esri JSON FeatureSet -> GeoJSON FeatureCollection
    if (Array.isArray(data.features)) {
        const esriFeatures = data.features;
        const maybeEsri = esriFeatures.length === 0 || esriFeatures.some(f => f && (f.attributes || f.geometry));
        if (maybeEsri) {
            return {
                type: 'FeatureCollection',
                features: esriFeatures.map((feature, index) => {
                    const attrs = feature && feature.attributes ? feature.attributes : {};
                    const geom = feature && feature.geometry ? feature.geometry : null;

                    let geometry = null;
                    if (geom && geodatosIsValidNumber(geom.x) && geodatosIsValidNumber(geom.y)) {
                        geometry = {
                            type: 'Point',
                            coordinates: [geom.x, geom.y]
                        };
                    } else if (geom && Array.isArray(geom.rings)) {
                        geometry = {
                            type: 'Polygon',
                            coordinates: geom.rings
                        };
                    } else if (geom && Array.isArray(geom.paths)) {
                        geometry = geom.paths.length === 1
                            ? { type: 'LineString', coordinates: geom.paths[0] }
                            : { type: 'MultiLineString', coordinates: geom.paths };
                    }

                    return {
                        type: 'Feature',
                        id: attrs.OBJECTID ?? attrs.objectid ?? index,
                        properties: attrs,
                        geometry
                    };
                })
            };
        }
    }

    return null;
}

function geodatosParseJsWrappedGeoJSON(text) {
    if (typeof text !== 'string') return null;
    const trimmed = text.trim();
    if (!trimmed) return null;

    // Caso típico qgis2web: var json_LAYER = {...};
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace < 0 || lastBrace <= firstBrace) return null;

    const jsonCandidate = trimmed.slice(firstBrace, lastBrace + 1);
    try {
        return JSON.parse(jsonCandidate);
    } catch (e) {
        return null;
    }
}

async function geodatosFetchSourceData(file) {
    const response = await fetch(`/geodatos/${encodeURIComponent(file)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const isJsWrapper = /\.js($|\?)/i.test(file);
    if (isJsWrapper) {
        const text = await response.text();
        const parsed = geodatosParseJsWrappedGeoJSON(text);
        if (!parsed) throw new Error('No se pudo extraer GeoJSON desde archivo JS');
        return parsed;
    }

    return response.json();
}

function geodatosBuildFilteredData(file, data, filterId) {
    if (!data || !Array.isArray(data.features)) return data;
    const presets = geodatosGetFilterPresets(file);
    const preset = presets.find(p => p.id === filterId) || presets[0];
    const dateState = geodatosDateRangeStateByFile.get(file);
    const hasDateFilter = file === 'Clasificacion_Ruido_Quejas.geojson'
        && dateState
        && (dateState.selectedMin > dateState.min || dateState.selectedMax < dateState.max);

    if ((!preset || preset.id === 'all') && !hasDateFilter) return data;

    const filteredFeatures = data.features.filter(feature => {
        try {
            const presetOk = (!preset || preset.id === 'all') ? true : !!preset.predicate(feature);
            if (!presetOk) return false;
            if (!hasDateFilter) return true;
            const ts = Number(feature.properties?.fecha);
            if (!Number.isFinite(ts)) return false;
            return ts >= dateState.selectedMin && ts <= dateState.selectedMax;
        } catch (e) {
            return true;
        }
    });

    return { ...data, features: filteredFeatures };
}

function geodatosIsValidNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}

function geodatosHasValidGeometry(geometry) {
    if (!geometry || !geometry.type) return false;

    const hasValidCoordinatePair = (coord) => (
        Array.isArray(coord) &&
        coord.length >= 2 &&
        geodatosIsValidNumber(coord[0]) &&
        geodatosIsValidNumber(coord[1])
    );

    const checkCoords = (coords) => {
        if (!Array.isArray(coords)) return false;
        if (coords.length === 0) return false;
        if (typeof coords[0] === 'number') return hasValidCoordinatePair(coords);
        return coords.every(checkCoords);
    };

    return checkCoords(geometry.coordinates);
}

function geodatosDisplayValue(value) {
    if (value === null || value === undefined || value === '') return 'N/D';
    if (typeof value === 'string' && ['nan', 'null', 'undefined'].includes(value.trim().toLowerCase())) return 'N/D';
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    return String(value);
}

function geodatosEscapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function geodatosFormatDateMs(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return geodatosDisplayValue(value);
    return new Date(n).toLocaleString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function geodatosFormatDateIso(value) {
    const text = String(value || '').trim();
    if (!text) return 'N/D';
    const d = new Date(text);
    if (Number.isNaN(d.getTime())) return geodatosDisplayValue(value);
    return d.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function geodatosFormatByType(value, type) {
    if (value === null || value === undefined || value === '') return 'N/D';

    switch (type) {
        case 'datetime_ms':
            return geodatosFormatDateMs(value);
        case 'date_iso':
            return geodatosFormatDateIso(value);
        case 'integer': {
            const n = Number(value);
            return Number.isFinite(n) ? n.toLocaleString('es-CO') : geodatosDisplayValue(value);
        }
        case 'coord': {
            const n = Number(value);
            return Number.isFinite(n) ? n.toFixed(6) : geodatosDisplayValue(value);
        }
        default:
            return geodatosDisplayValue(value);
    }
}

function geodatosFormatValueHtml(value, type) {
    if (value === null || value === undefined || value === '') return 'N/D';

    if (type === 'email') {
        const text = String(value).trim();
        if (!text || text === 'N/D') return 'N/D';
        const safeText = geodatosEscapeHtml(text);
        return `<a href="mailto:${safeText}" style="color:#93c5fd;">${safeText}</a>`;
    }

    if (type === 'url') {
        const text = String(value).trim();
        if (!text) return 'N/D';
        const safeUrl = geodatosEscapeHtml(text);
        return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="color:#93c5fd;">Abrir enlace</a>`;
    }

    return geodatosEscapeHtml(geodatosFormatByType(value, type));
}

function geodatosPopupHtml(feature, file) {
    const props = feature && feature.properties ? feature.properties : {};

    if (file === 'SRCasignado_1.js') {
        const hostName = geodatosDisplayValue(props.a_hostName);
        const hostUrlRaw = geodatosDisplayValue(props.a_hostUrl);
        const hostImgRaw = geodatosDisplayValue(props.a_hostPict);
        const hostUrl = hostUrlRaw !== 'N/D' ? geodatosEscapeHtml(hostUrlRaw) : '';
        const hostImg = hostImgRaw !== 'N/D' ? geodatosEscapeHtml(hostImgRaw) : '';

        const rows = [
            ['Rating', props.a_rating],
            ['Costo (US)', props.a_cost],
            ['Capacidad', props.a_capacity],
            ['Tipo', props.a_roomType],
            ['Baños', props.a_bathroom],
            ['MaxNight', props.a_maxNight],
            ['MinNight', props.a_minNight],
            ['Niños', props.a_children],
            ['Fiesta', props.a_party],
            ['Mascotas', props.a_pets],
            ['Capacidad 2', props.a_capaci_1]
        ].map(([label, value]) => (
            `<div style="display:contents;">
                <div style="font-weight:700;">${geodatosEscapeHtml(label)}</div>
                <div>${geodatosEscapeHtml(geodatosDisplayValue(value))}</div>
            </div>`
        )).join('');

        const hostLink = hostUrl
            ? `<div style="margin:0.35rem 0 0.45rem 0;"><a href="${hostUrl}" target="_blank" rel="noopener noreferrer" style="color:#93c5fd;word-break:break-all;">${geodatosEscapeHtml(hostUrlRaw.replace(/^https?:\/\//i, ''))}</a></div>`
            : '';

        const imageHtml = hostImg
            ? `<div style="margin:0.45rem 0 0.5rem 0;"><img src="${hostImg}" alt="Host" style="width:100%;max-width:210px;aspect-ratio:1/1;object-fit:cover;border-radius:999px;border:1px solid rgba(255,255,255,.14);display:block;" onerror="this.style.display='none'"></div>`
            : '';

        return `
            <div style="max-width:230px;line-height:1.3;">
                <div style="font-weight:700;margin-bottom:0.25rem;">Host Name: ${geodatosEscapeHtml(hostName)}</div>
                ${imageHtml}
                ${hostLink}
                <div style="display:grid;grid-template-columns:auto 1fr;column-gap:0.55rem;row-gap:0.12rem;align-items:start;">
                    ${rows}
                </div>
            </div>
        `;
    }

    const popupCfg = geodatosPopupConfig[file];
    const fields = popupCfg && Array.isArray(popupCfg.fields) && popupCfg.fields.length
        ? popupCfg.fields
        : Object.keys(props).map(key => ({ key, label: key }));

    const rows = fields.map(field => {
        const key = typeof field === 'string' ? field : field.key;
        const label = typeof field === 'string' ? field : (field.label || field.key);
        const type = typeof field === 'string' ? undefined : field.type;
        const rawValue = props[key];
        return `<div><strong>${geodatosEscapeHtml(label)}:</strong> ${geodatosFormatValueHtml(rawValue, type)}</div>`;
    }).join('');

    return `<div style="max-width:320px;line-height:1.35;">${rows || '<div>Sin propiedades</div>'}</div>`;
}

function geodatosColorForFeature(feature, cfg) {
    if (!cfg || !cfg.colorByProperty) return cfg.color || '#3b82f6';
    const props = feature && feature.properties ? feature.properties : {};
    const keyValue = props[cfg.colorByProperty];
    if (!keyValue) return cfg.color || '#3b82f6';

    if (cfg.colorMap && cfg.colorMap[keyValue]) return cfg.colorMap[keyValue];

    const palette = Array.isArray(cfg.fallbackColors) && cfg.fallbackColors.length
        ? cfg.fallbackColors
        : ['#a855f7', '#14b8a6', '#22c55e', '#e11d48'];

    let hash = 0;
    const text = String(keyValue);
    for (let i = 0; i < text.length; i++) hash = ((hash << 5) - hash) + text.charCodeAt(i);
    return palette[Math.abs(hash) % palette.length];
}

function createGeodatosLayer(data, file) {
    const cfg = geodatosFileConfigs[file] || {};
    const rawFeatures = Array.isArray(data && data.features) ? data.features : [];
    const validFeatures = rawFeatures.filter(feature => geodatosHasValidGeometry(feature && feature.geometry));
    const invalidCount = rawFeatures.length - validFeatures.length;
    const normalizedData = { ...data, features: validFeatures };
    const featureTotal = validFeatures.length;
    const vizMode = geodatosGetVizMode(file);

    if (vizMode === 'heatmap' && geodatosSupportsHeatmap(file) && typeof L !== 'undefined' && typeof L.heatLayer === 'function') {
        const heatPoints = validFeatures
            .map(feature => {
                const coords = feature?.geometry?.coordinates;
                if (!Array.isArray(coords) || coords.length < 2) return null;
                const lng = Number(coords[0]);
                const lat = Number(coords[1]);
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
                const intensity = geodatosHeatWeightForFeature(file, feature);
                return [lat, lng, intensity];
            })
            .filter(Boolean);
        const heatCfg = geodatosHeatConfigForFile(file);
        const layer = L.heatLayer(heatPoints, {
            radius: heatCfg.radius ?? 18,
            blur: heatCfg.blur ?? 16,
            maxZoom: 17,
            minOpacity: heatCfg.minOpacity ?? 0.35,
            gradient: heatCfg.gradient
        });
        layer.__featureCount = featureTotal;
        layer.__invalidFeatureCount = invalidCount;
        layer.__vizMode = 'heatmap';
        return layer;
    }

    const layer = L.geoJSON(normalizedData, {
        pointToLayer(feature, latlng) {
            const featureColor = geodatosColorForFeature(feature, cfg);
            return L.circleMarker(latlng, {
                radius: cfg.radius || 4,
                color: featureColor,
                fillColor: featureColor,
                stroke: cfg.stroke === undefined ? true : cfg.stroke,
                opacity: cfg.opacity === undefined ? 1 : cfg.opacity,
                fillOpacity: cfg.fillOpacity === undefined ? (cfg.heavy ? 0.45 : 0.75) : cfg.fillOpacity,
                weight: cfg.weight === undefined ? 1 : cfg.weight
            });
        },
        style() {
            return {
                color: cfg.color || '#3b82f6',
                weight: 1,
                opacity: 0.8,
                fillOpacity: 0.25
            };
        },
        onEachFeature(feature, layer) {
            layer.bindPopup(geodatosPopupHtml(feature, file), { maxWidth: 420 });
        }
    });

    layer.__featureCount = featureTotal;
    layer.__invalidFeatureCount = invalidCount;
    layer.__vizMode = 'points';
    return layer;
}

function geodatosReplaceLayer(file, newLayer, shouldBeVisible) {
    const oldLayer = geodatosLayerCache.get(file);
    if (oldLayer && geodatosMapInstance && geodatosMapInstance.hasLayer(oldLayer)) {
        geodatosMapInstance.removeLayer(oldLayer);
    }
    if (oldLayer && geodatosBaseLayersControl) {
        geodatosBaseLayersControl.removeLayer(oldLayer);
    }

    geodatosLayerCache.set(file, newLayer);

    if (geodatosBaseLayersControl) {
        geodatosBaseLayersControl.addOverlay(newLayer, geodatosGetLayerControlLabel(file));
    }

    if (shouldBeVisible && geodatosMapInstance) {
        newLayer.addTo(geodatosMapInstance);
    }
}

function applyGeodatosFilter(file, filterId) {
    const map = initGeodatosMap();
    if (!map) return;

    const rawData = geodatosRawDataCache.get(file);
    if (!rawData) {
        setGeodatosStatus(`Primero carga la capa ${geodatosGetLayerLabel(file)} para aplicar filtros.`);
        return;
    }

    geodatosActiveFilterByFile.set(file, filterId);
    geodatosCurrentFilterFile = file;

    const previousLayer = geodatosLayerCache.get(file);
    const isVisible = !!(previousLayer && map.hasLayer(previousLayer));
    const filteredData = geodatosBuildFilteredData(file, rawData, filterId);
    const newLayer = createGeodatosLayer(filteredData, file);
    geodatosReplaceLayer(file, newLayer, isVisible || !previousLayer);

    const filterPreset = geodatosGetFilterPresets(file).find(p => p.id === filterId);
    const label = filterPreset ? filterPreset.label : filterId;
    const total = newLayer.__featureCount ?? geodatosFeatureCount(filteredData);
    const invalidCount = newLayer.__invalidFeatureCount || 0;
    const invalidMsg = invalidCount > 0 ? ` | omitidas ${invalidCount.toLocaleString('es-CO')} inválidas` : '';
    setGeodatosStatus(`Filtro aplicado (${geodatosGetLayerLabel(file)}): ${label} (${total.toLocaleString('es-CO')} features)${invalidMsg}`);

    geodatosRenderFilterButtons(file);
    geodatosRenderDateRangeControls(file);
    geodatosRenderLegend(file);
    geodatosRenderComercioIndicators(geodatosCurrentFilterFile);
    updateGeodatosButtonsState();
}

async function toggleGeodatosFileLayer(file) {
    const map = initGeodatosMap();
    if (!map) return;
    await loadGeodatosPopupConfig();

    const cfg = geodatosFileConfigs[file] || { label: file };
    const existingLayer = geodatosLayerCache.get(file);

    if (existingLayer) {
        if (map.hasLayer(existingLayer)) {
            map.removeLayer(existingLayer);
            setGeodatosStatus(`Capa ocultada: ${cfg.label}`);
        } else {
            existingLayer.addTo(map);
            setGeodatosStatus(`Capa visible: ${cfg.label}`);
        }
        geodatosCurrentFilterFile = file;
        geodatosRenderFilterButtons(file);
        geodatosRenderDateRangeControls(file);
        geodatosRenderLegend(file);
        geodatosRenderComercioIndicators(geodatosCurrentFilterFile);
        updateGeodatosButtonsState();
        return;
    }

    if (geodatosLoadingFiles.has(file)) return;

    geodatosLoadingFiles.add(file);
    updateGeodatosButtonsState();
    setGeodatosStatus(`Cargando ${cfg.label}...${cfg.heavy ? ' (archivo grande, puede tardar)' : ''}`);

    try {
        const rawData = await geodatosFetchSourceData(file);
        const data = geodatosNormalizeInputToGeoJSON(rawData);
        if (!data || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
            throw new Error('Formato no soportado (se esperaba GeoJSON FeatureCollection)');
        }

        geodatosRawDataCache.set(file, data);
        const activeFilterId = geodatosActiveFilterByFile.get(file) || 'all';
        const filteredData = geodatosBuildFilteredData(file, data, activeFilterId);
        const layer = createGeodatosLayer(filteredData, file);
        geodatosLayerCache.set(file, layer);
        layer.addTo(map);

        if (geodatosBaseLayersControl) {
            geodatosBaseLayersControl.addOverlay(layer, geodatosGetLayerControlLabel(file));
        }

        const featureTotal = layer.__featureCount ?? geodatosFeatureCount(data);
        const invalidCount = layer.__invalidFeatureCount || 0;
        const invalidMsg = invalidCount > 0
            ? ` | omitidas ${invalidCount.toLocaleString('es-CO')} inválidas`
            : '';
        setGeodatosStatus(`Cargada: ${cfg.label} (${featureTotal.toLocaleString('es-CO')} features)${invalidMsg}`);
        geodatosCurrentFilterFile = file;
        geodatosRenderFilterButtons(file);
        geodatosRenderDateRangeControls(file);
        geodatosRenderLegend(file);
        geodatosRenderComercioIndicators(geodatosCurrentFilterFile);
    } catch (error) {
        console.error(`Error cargando ${file}:`, error);
        setGeodatosStatus(`Error cargando ${cfg.label}: ${error.message}`);
    } finally {
        geodatosLoadingFiles.delete(file);
        updateGeodatosButtonsState();
    }
}

function bindGeodatosLayerButtons() {
    document.querySelectorAll('.geodatos-layer-btn[data-file]').forEach(btn => {
        if (btn.dataset.bound === '1') return;
        btn.dataset.bound = '1';
        btn.addEventListener('click', () => {
            const file = btn.getAttribute('data-file');
            if (file) toggleGeodatosFileLayer(file);
        });
    });
    updateGeodatosButtonsState();
}

function initGeodatosMap() {
    if (geodatosMapInstance || typeof L === 'undefined') return geodatosMapInstance;

    const mapEl = document.getElementById('geodatosMap');
    if (!mapEl) return null;

    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    });

    const cartoLight = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    });

    const esriSatellite = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
            maxZoom: 19,
            attribution: 'Tiles &copy; Esri'
        }
    );

    geodatosMapInstance = L.map(mapEl, {
        center: [6.2442, -75.5812], // Medellin
        zoom: 12,
        preferCanvas: true,
        layers: [cartoLight]
    });

    geodatosBaseLayersControl = L.control.layers(
        {
            'OpenStreetMap': osm,
            'Carto Light': cartoLight,
            'ESRI Satélite': esriSatellite
        },
        {},
        { collapsed: false }
    ).addTo(geodatosMapInstance);

    L.marker([6.2442, -75.5812])
        .addTo(geodatosMapInstance)
        .bindPopup('Medellín');

    bindGeodatosLayerButtons();

    return geodatosMapInstance;
}

// Gráfica de Engagement por Mes
const engagementCtx = document.getElementById('engagementChart');
if (engagementCtx) {
    new Chart(engagementCtx, {
        type: 'bar',
        data: {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            datasets: [{
                label: 'Engagement',
                data: [12500, 18900, 15200, 21000, 18500, 24000, 22000, 28000, 26500, 31000, 29500, 35000],
                backgroundColor: chartColors.primary,
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    padding: 12,
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    cornerRadius: 8
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: chartColors.grid },
                    ticks: { color: chartColors.text, font: { size: 11 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: chartColors.text, font: { size: 11 } }
                }
            }
        }
    });
}

// Tabs: followers / profiles / posts / images (desde sidebar)
document.addEventListener('DOMContentLoaded', () => {
    const tabBtns = document.querySelectorAll('.sidebar-subitem[data-tab]');
    const views = document.querySelectorAll('.dashboard-view[data-view]');
    const mainContentEl = document.querySelector('.main-content');
    bindGeodatosLayerButtons();
    bindGeodatosLegendToggle();
    loadGeodatosPopupConfig();
    geodatosRenderFilterButtons(null);
    geodatosRenderDateRangeControls(null);
    geodatosRenderLegend(null);
    geodatosRenderComercioIndicators(null);

    function syncGeodatosLayout(viewId) {
        if (!mainContentEl) return;
        mainContentEl.classList.toggle('is-geodatos-active', viewId === 'geodatos');
    }

    document.querySelectorAll('.sidebar-item-expandable .sidebar-item-main').forEach(mainBtn => {
        mainBtn.addEventListener('click', () => {
            mainBtn.closest('.sidebar-item-expandable').classList.toggle('expanded');
        });
    });

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const viewId = btn.getAttribute('data-tab');
            syncGeodatosLayout(viewId);
            tabBtns.forEach(b => b.classList.toggle('active', b === btn));
            const hasView = document.querySelector('.dashboard-view[data-view="' + viewId + '"]');
            views.forEach(v => {
                v.style.display = (v.getAttribute('data-view') === viewId || (!hasView && v.getAttribute('data-view') === 'followers')) ? '' : 'none';
            });
            if (viewId === 'profiles') {
                if (window.ChartDistribucionUsuariosComentarios && window.ChartDistribucionUsuariosComentarios.init) window.ChartDistribucionUsuariosComentarios.init();
                if (window.ChartDistribucionUsuariosComentariosFiltrado && window.ChartDistribucionUsuariosComentariosFiltrado.init) window.ChartDistribucionUsuariosComentariosFiltrado.init();
                if (window.ChartEmojisComentarios && window.ChartEmojisComentarios.update) {
                    requestAnimationFrame(() => { setTimeout(() => window.ChartEmojisComentarios.update(), 100); });
                }
                if (typeof Plotly !== 'undefined') {
                    requestAnimationFrame(() => {
                        setTimeout(() => {
                            ['chartDistribucionComentadoresRed', 'chartDistribucionUsuariosComentarios', 'chartDistribucionUsuariosComentariosFiltrado', 'chartTopProfilesComentadores'].forEach(id => {
                                const el = document.getElementById(id);
                                if (el && el.querySelector('.plot-container')) Plotly.Plots.resize(el);
                            });
                        }, 50);
                    });
                }
            }
            if (viewId === 'posts') {
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        if (window.ChartDistribucionHashtags && window.ChartDistribucionHashtags.load) {
                            window.ChartDistribucionHashtags.load();
                        }
                    }, 80);
                });
            }
            if (viewId === 'geodatos') {
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        const map = initGeodatosMap();
                        if (map) map.invalidateSize();
                    }, 80);
                });
            }
        });
    });

    // Si por alguna razón la vista inicial fuera geodatos en el futuro
    const initialGeodatosView = document.querySelector('.dashboard-view[data-view="geodatos"]');
    if (initialGeodatosView && initialGeodatosView.style.display !== 'none') {
        syncGeodatosLayout('geodatos');
        const map = initGeodatosMap();
        if (map) {
            requestAnimationFrame(() => map.invalidateSize());
        }
    } else {
        const activeTab = document.querySelector('.sidebar-subitem.active[data-tab]');
        syncGeodatosLayout(activeTab ? activeTab.getAttribute('data-tab') : 'followers');
    }

    // Animación de entrada para las tarjetas
    const cards = document.querySelectorAll('.glass');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });

    // Efecto hover mejorado en botones
    const buttons = document.querySelectorAll('.btn, .btn-small');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });

    window.addEventListener('resize', () => {
        if (!geodatosMapInstance) return;
        requestAnimationFrame(() => geodatosMapInstance.invalidateSize());
    });
});
