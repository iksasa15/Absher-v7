// Enhanced Map Functionality

// Initialize Map with advanced options
const map = L.map('map', {
    center: [24.7136, 46.6753], // Riyadh coordinates
    zoom: 15,
    zoomControl: false,
    attributionControl: false,
    minZoom: 12,
    maxZoom: 19
});

// Add dark theme map layer
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
}).addTo(map);

// Add zoom control to top-left
L.control.zoom({
    position: 'topleft'
}).addTo(map);

// Add scale control to bottom-left
L.control.scale({
    position: 'bottomleft',
    metric: true,
    imperial: false
}).addTo(map);

// Custom drone icon with different states
function createDroneIcon(status) {
    const colorMap = {
        'active': '#10b981',
        'warning': '#f59e0b',
        'danger': '#ef4444',
        'offline': '#94a3b8'
    };
    
    const color = colorMap[status] || colorMap.active;
    
    return L.divIcon({
        className: `custom-drone-icon drone-${status}`,
        html: `<div style="position: relative;">
                <div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 0 5px rgba(${status === 'active' ? '16, 185, 129' : status === 'warning' ? '245, 158, 11' : status === 'danger' ? '239, 68, 68' : '148, 163, 184'}, 0.3), 0 0 0 10px rgba(${status === 'active' ? '16, 185, 129' : status === 'warning' ? '245, 158, 11' : status === 'danger' ? '239, 68, 68' : '148, 163, 184'}, 0.1); animation: pulse 2s infinite;"></div>
                <div style="position: absolute; top: -22px; right: -10px; background-color: rgba(15, 23, 42, 0.8); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 4px; padding: 2px 5px; font-size: 10px; white-space: nowrap;">طائرة #__ID__</div>
               </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
}

// Add drones to map with enhanced data
const drones = [
    { 
        id: 1, 
        latlng: [24.7136, 46.6853], 
        name: "طائرة #1", 
        status: "active", 
        battery: 85,
        altitude: 120,
        speed: 35,
        mission: "مراقبة روتينية - القطاع الشرقي",
        objects_detected: "3 أشخاص (1 تهديد محتمل)"
    },
    { 
        id: 2, 
        latlng: [24.7236, 46.6653], 
        name: "طائرة #2", 
        status: "active", 
        battery: 55,
        altitude: 100,
        speed: 28,
        mission: "مهمة تأمين - القطاع الشمالي",
        objects_detected: "0 أشخاص (1 جسم مشبوه)"
    },
    { 
        id: 3, 
        latlng: [24.7036, 46.6753], 
        name: "طائرة #3", 
        status: "warning", 
        battery: 15,
        altitude: 90,
        speed: 42,
        mission: "عائدة للشحن - من القطاع الغربي",
        objects_detected: "2 أشخاص (0 تهديدات)"
    },
    { 
        id: 4, 
        latlng: [24.7186, 46.6553], 
        name: "طائرة #4", 
        status: "active", 
        battery: 75,
        altitude: 150,
        speed: 30,
        mission: "استطلاع - القطاع الجنوبي",
        objects_detected: "1 مركبة (مصرح بها)"
    }
];

// Add drones to map
const droneMarkers = [];
drones.forEach(drone => {
    const icon = createDroneIcon(drone.status);
    
    // Replace ID in HTML
    icon.options.html = icon.options.html.replace('__ID__', drone.id);
    
    const marker = L.marker(drone.latlng, { icon: icon }).addTo(map);
    
    // Enhanced popup with more information
    marker.bindPopup(`
        <div style="text-align: center; direction: rtl; min-width: 180px;">
            <div style="font-weight: 700; margin-bottom: 5px; font-size: 14px;">${drone.name}</div>
            <div style="margin-bottom: 10px; font-size: 12px; color: ${drone.status === 'active' ? '#10b981' : drone.status === 'warning' ? '#f59e0b' : '#ef4444'}">
                <i class="fas fa-circle" style="font-size: 8px;"></i> 
                ${drone.status === 'active' ? 'نشطة' : drone.status === 'warning' ? 'تحذير - بطارية منخفضة' : 'خطر'}
            </div>
            <div style="display: grid; grid-template-columns: auto auto; gap: 5px; text-align: right; margin-bottom: 10px; font-size: 12px;">
                <div>البطارية:</div>
                <div><strong>${drone.battery}%</strong></div>
                <div>الارتفاع:</div>
                <div><strong>${drone.altitude} متر</strong></div>
                <div>السرعة:</div>
                <div><strong>${drone.speed} كم/س</strong></div>
            </div>
            <button onclick="showDroneDetails(${drone.id})" style="width: 100%; padding: 5px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">عرض التفاصيل</button>
        </div>
    `);
    
    // Add marker to array
    droneMarkers.push({ marker, drone });
});

// Add enhanced sensitive zones (polygons)
const sensitiveZones = [
    {
        name: "منطقة حظر القطاع الشرقي",
        description: "منطقة عسكرية محظورة - ممنوع الاقتراب",
        risk_level: "عالي",
        coordinates: [
            [24.7156, 46.6793],
            [24.7176, 46.6793],
            [24.7176, 46.6823],
            [24.7156, 46.6823]
        ]
    },
    {
        name: "محطة الطاقة المركزية",
        description: "منشأة حيوية - تحتاج إلى تصريح خاص",
        risk_level: "متوسط",
        coordinates: [
            [24.7086, 46.6683],
            [24.7106, 46.6683],
            [24.7106, 46.6713],
            [24.7086, 46.6713]
        ]
    },
    {
        name: "المركز الإداري الرئيسي",
        description: "منطقة مراقبة مشددة - مسموح للطائرات المصرح لها فقط",
        risk_level: "متوسط",
        coordinates: [
            [24.7216, 46.6853],
            [24.7236, 46.6853],
            [24.7236, 46.6873],
            [24.7216, 46.6873]
        ]
    }
];

const sensitiveZonePolygons = [];
sensitiveZones.forEach(zone => {
    const polygon = L.polygon(zone.coordinates, {
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.2,
        weight: 2
    }).addTo(map);
    
    polygon.bindPopup(`
        <div style="text-align: center; direction: rtl; min-width: 200px;">
            <div style="font-weight: 700; margin-bottom: 5px; font-size: 14px; color: #ef4444;">${zone.name}</div>
            <div style="margin-bottom: 8px; font-size: 12px;">${zone.description}</div>
            <div style="font-size: 12px; background-color: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 5px; border-radius: 4px;">
                مستوى الخطورة: ${zone.risk_level}
            </div>
        </div>
    `);
    
    sensitiveZonePolygons.push(polygon);
});

// Add enhanced blind spots (circles)
const blindSpots = [
    { 
        name: "المنطقة الجبلية - القطاع الغربي", 
        reason: "تضاريس مرتفعة تعيق الاتصال",
        latlng: [24.7126, 46.6723], 
        radius: 100 
    },
    { 
        name: "منطقة التشويش المحتمل", 
        reason: "تداخل إشارات غير معروف المصدر",
        latlng: [24.7196, 46.6653], 
        radius: 80 
    }
];

const blindSpotCircles = [];
blindSpots.forEach(spot => {
    const circle = L.circle(spot.latlng, {
        color: '#1e293b',
        fillColor: '#000',
        fillOpacity: 0.3,
        weight: 2,
        dashArray: '5, 10',
        radius: spot.radius
    });
    
    circle.bindPopup(`
        <div style="text-align: center; direction: rtl; min-width: 180px;">
            <div style="font-weight: 700; margin-bottom: 5px; font-size: 14px;">${spot.name}</div>
            <div style="margin-bottom: 8px; font-size: 12px;">${spot.reason}</div>
            <div style="font-size: 12px; background-color: rgba(148, 163, 184, 0.1); color: #94a3b8; padding: 5px; border-radius: 4px;">
                نطاق التغطية: ${spot.radius} متر
            </div>
        </div>
    `);
    
    blindSpotCircles.push(circle);
});

// Add enhanced flight paths (polylines with animated arrows)
const flightPaths = [
    {
        drone_id: 1,
        color: "#3b82f6",
        coordinates: [
            [24.7136, 46.6853],
            [24.7156, 46.6823],
            [24.7176, 46.6793],
            [24.7196, 46.6763]
        ]
    },
    {
        drone_id: 2,
        color: "#3b82f6",
        coordinates: [
            [24.7236, 46.6653],
            [24.7216, 46.6683],
            [24.7196, 46.6713],
            [24.7176, 46.6743]
        ]
    },
    {
        drone_id: 3,
        color: "#f59e0b",
        coordinates: [
            [24.7036, 46.6753],
            [24.7056, 46.6743],
            [24.7076, 46.6733],
            [24.7096, 46.6723]
        ]
    },
    {
        drone_id: 4,
        color: "#3b82f6",
        coordinates: [
            [24.7186, 46.6553],
            [24.7166, 46.6583],
            [24.7146, 46.6613],
            [24.7126, 46.6643]
        ]
    }
];

// Create custom arrowhead decorator
const flightPathLines = [];
flightPaths.forEach((path) => {
    // Add the main path
    const polyline = L.polyline(path.coordinates, {
        color: path.color,
        weight: 3,
        opacity: 0.7
    }).addTo(map);
    
    // Add arrowheads
    const arrowOffset = 25;
    const arrowLength = 15;
    const arrowAngle = 45;
    
    // Calculate arrowhead positions
    for (let i = 0; i < path.coordinates.length - 1; i++) {
        const start = path.coordinates[i];
        const end = path.coordinates[i + 1];
        
        // Calculate the angle of the line
        const angle = Math.atan2(end[0] - start[0], end[1] - start[1]) * 180 / Math.PI;
        
        // Calculate the midpoint for arrow placement
        const midLat = (start[0] + end[0]) / 2;
        const midLng = (start[1] + end[1]) / 2;
        
        // Create arrowhead polylines
        const arrowLeft = L.polyline([
            [midLat, midLng],
            [
                midLat + arrowLength / 111000 * Math.sin((angle - arrowAngle) * Math.PI / 180),
                midLng + arrowLength / 111000 * Math.cos((angle - arrowAngle) * Math.PI / 180) / Math.cos(midLat * Math.PI / 180)
            ]
        ], {
            color: path.color,
            weight: 3,
            opacity: 0.7
        }).addTo(map);
        
        const arrowRight = L.polyline([
            [midLat, midLng],
            [
                midLat + arrowLength / 111000 * Math.sin((angle + arrowAngle) * Math.PI / 180),
                midLng + arrowLength / 111000 * Math.cos((angle + arrowAngle) * Math.PI / 180) / Math.cos(midLat * Math.PI / 180)
            ]
        ], {
            color: path.color,
            weight: 3,
            opacity: 0.7
        }).addTo(map);
        
        flightPathLines.push(arrowLeft, arrowRight);
    }
    
    polyline.bindPopup(`مسار الطائرة رقم ${path.drone_id}`);
    flightPathLines.push(polyline);
});

// Add threat markers with enhanced styling
const threats = [
    { 
        id: 1,
        latlng: [24.7156, 46.6823], 
        type: 'high', 
        description: 'شخص مسلح',
        details: 'شخص يحمل سلاح ناري، يرتدي ملابس داكنة',
        time_detected: 'منذ 2 دقيقة',
        confidence: '95%'
    },
    { 
        id: 2,
        latlng: [24.7106, 46.6693], 
        type: 'medium', 
        description: 'حقيبة مشبوهة',
        details: 'حقيبة سوداء متروكة بدون مراقبة منذ 10 دقائق',
        time_detected: 'منذ 5 دقائق',
        confidence: '87%'
    },
    { 
        id: 3,
        latlng: [24.7186, 46.6553], 
        type: 'low', 
        description: 'سيارة غير مصرح بها',
        details: 'سيارة سوداء، لوحة رقم 1234 ABC في منطقة مقيدة',
        time_detected: 'منذ 25 دقيقة',
        confidence: '78%'
    }
];

const threatIcons = {
    high: L.divIcon({
        className: 'threat-icon-high',
        html: '<div style="display: flex; justify-content: center; align-items: center; width: 24px; height: 24px; background-color: rgba(239, 68, 68, 0.8); border-radius: 50%; box-shadow: 0 0 0 5px rgba(239, 68, 68, 0.3), 0 0 0 10px rgba(239, 68, 68, 0.1); animation: pulse 1s infinite;"><i class="fas fa-exclamation-triangle" style="color: white; font-size: 12px;"></i></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    }),
    medium: L.divIcon({
        className: 'threat-icon-medium',
        html: '<div style="display: flex; justify-content: center; align-items: center; width: 24px; height: 24px; background-color: rgba(245, 158, 11, 0.8); border-radius: 50%; box-shadow: 0 0 0 5px rgba(245, 158, 11, 0.3), 0 0 0 10px rgba(245, 158, 11, 0.1); animation: pulse 1.5s infinite;"><i class="fas fa-exclamation" style="color: white; font-size: 12px;"></i></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    }),
    low: L.divIcon({
        className: 'threat-icon-low',
        html: '<div style="display: flex; justify-content: center; align-items: center; width: 24px; height: 24px; background-color: rgba(59, 130, 246, 0.8); border-radius: 50%; box-shadow: 0 0 0 5px rgba(59, 130, 246, 0.3), 0 0 0 10px rgba(59, 130, 246, 0.1); animation: pulse 2s infinite;"><i class="fas fa-info" style="color: white; font-size: 12px;"></i></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    })
};

const threatMarkers = [];
threats.forEach(threat => {
    const marker = L.marker(threat.latlng, { icon: threatIcons[threat.type] }).addTo(map);
    
    marker.bindPopup(`
        <div style="text-align: center; direction: rtl; min-width: 220px;">
            <div style="font-weight: 700; margin-bottom: 5px; font-size: 14px; color: ${threat.type === 'high' ? '#ef4444' : (threat.type === 'medium' ? '#f59e0b' : '#3b82f6')};">
                ${threat.description}
            </div>
            <div style="margin-bottom: 8px; font-size: 12px;">${threat.details}</div>
            <div style="display: grid; grid-template-columns: auto auto; gap: 5px; text-align: right; margin-bottom: 10px; font-size: 12px;">
                <div>تم الرصد:</div>
                <div><strong>${threat.time_detected}</strong></div>
                <div>مستوى الثقة:</div>
                <div><strong>${threat.confidence}</strong></div>
            </div>
            <div style="font-size: 12px; background-color: rgba(${threat.type === 'high' ? '239, 68, 68' : (threat.type === 'medium' ? '245, 158, 11' : '59, 130, 246')}, 0.1); color: ${threat.type === 'high' ? '#ef4444' : (threat.type === 'medium' ? '#f59e0b' : '#3b82f6')}; padding: 5px; border-radius: 4px;">
                ${threat.type === 'high' ? 'خطورة عالية' : (threat.type === 'medium' ? 'خطورة متوسطة' : 'خطورة منخفضة')}
            </div>
        </div>
    `);
    
    threatMarkers.push(marker);
});

// Add patrol areas (rectangles)
const patrolAreas = [
    {
        name: "منطقة دورية #1 - القطاع الشرقي",
        status: "نشطة",
        drone_assigned: "طائرة #1",
        coordinates: [
            [24.7100, 46.6800],
            [24.7200, 46.6900]
        ]
    },
    {
        name: "منطقة دورية #2 - القطاع الشمالي",
        status: "نشطة",
        drone_assigned: "طائرة #2",
        coordinates: [
            [24.7200, 46.6600],
            [24.7300, 46.6700]
        ]
    },
    {
        name: "منطقة دورية #3 - القطاع الغربي",
        status: "معلقة مؤقتاً",
        drone_assigned: "طائرة #3 (عائدة للشحن)",
        coordinates: [
            [24.7000, 46.6700],
            [24.7100, 46.6800]
        ]
    },
    {
        name: "منطقة دورية #4 - القطاع الجنوبي",
        status: "نشطة",
        drone_assigned: "طائرة #4",
        coordinates: [
            [24.7150, 46.6500],
            [24.7250, 46.6600]
        ]
    }
];

const patrolAreaRectangles = [];
patrolAreas.forEach(area => {
    const status = area.status === "نشطة" ? "#10b981" : "#f59e0b";
    
    const rectangle = L.rectangle(area.coordinates, {
        color: status,
        fillColor: status,
        fillOpacity: 0.1,
        weight: 2,
        dashArray: '5, 10'
    });
    
    rectangle.bindPopup(`
        <div style="text-align: center; direction: rtl; min-width: 200px;">
            <div style="font-weight: 700; margin-bottom: 5px; font-size: 14px;">${area.name}</div>
            <div style="margin-bottom: 8px; font-size: 12px;">
                الحالة: <span style="color: ${area.status === "نشطة" ? '#10b981' : '#f59e0b'};">${area.status}</span>
            </div>
            <div style="font-size: 12px; background-color: rgba(30, 41, 59, 0.1); padding: 5px; border-radius: 4px;">
                ${area.drone_assigned}
            </div>
        </div>
    `);
    
    patrolAreaRectangles.push(rectangle);
});

// Show/hide patrol areas function
let patrolAreasVisible = false;
function togglePatrolAreas() {
    if (patrolAreasVisible) {
        patrolAreaRectangles.forEach(rect => map.removeLayer(rect));
    } else {
        patrolAreaRectangles.forEach(rect => map.addLayer(rect));
    }
    patrolAreasVisible = !patrolAreasVisible;
}

// Function to show drone details panel
function showDroneDetails(droneId) {
    const drone = drones.find(d => d.id === droneId);
    if (!drone) return;
    
    const detailsPanel = document.querySelector('.map-drone-details');
    const header = detailsPanel.querySelector('.drone-details-header span');
    const detailValues = detailsPanel.querySelectorAll('.detail-value');
    
    // Update header
    header.textContent = drone.name;
    
    // Update details
    detailValues[0].textContent = `${drone.latlng[0].toFixed(4)}, ${drone.latlng[1].toFixed(4)}`;
    detailValues[1].textContent = `${drone.altitude} متر`;
    detailValues[2].textContent = `${drone.speed} كم/ساعة`;
    detailValues[3].textContent = `${drone.battery}% (${Math.round(drone.battery / 100 * 60)} دقيقة متبقية)`;
    detailValues[4].textContent = drone.mission;
    detailValues[5].textContent = drone.objects_detected;
    
    // Show panel
    detailsPanel.style.display = 'block';
    
    // Hide threat notification
    document.querySelector('.live-threat-notification').style.display = 'none';
}

// Close drone details
document.querySelector('.close-details-btn').addEventListener('click', function() {
    document.querySelector('.map-drone-details').style.display = 'none';
    document.querySelector('.live-threat-notification').style.display = 'flex';
});

// Handle threat view button
document.querySelector('.threat-view-btn').addEventListener('click', function() {
    // Center on first threat and open its popup
    map.setView(threats[0].latlng, 16);
    setTimeout(() => {
        threatMarkers[0].openPopup();
    }, 500);
});

// Update coordinates display when mouse moves over map
map.on('mousemove', function(e) {
    document.querySelector('.map-coordinates span:first-child strong').textContent = `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`;
});

// Mini-drones list click handlers
document.querySelectorAll('.drone-item-mini').forEach(item => {
    item.addEventListener('click', function() {
        const droneId = parseInt(this.getAttribute('data-drone-id'));
        const drone = drones.find(d => d.id === droneId);
        if (drone) {
            map.setView(drone.latlng, 16);
            
            // Find matching marker and open popup
            const droneMarker = droneMarkers.find(dm => dm.drone.id === droneId);
            if (droneMarker) {
                setTimeout(() => {
                    droneMarker.marker.openPopup();
                }, 300);
            }
        }
    });
});

// Map toggle buttons functionality
document.querySelectorAll('.map-toggle-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        // Toggle active state
        this.classList.toggle('active');
        
        // Handle toggle actions
        if (this.querySelector('i').classList.contains('fa-drone')) {
            // Toggle drones visibility
            droneMarkers.forEach(dm => {
                if (this.classList.contains('active')) {
                    map.addLayer(dm.marker);
                } else {
                    map.removeLayer(dm.marker);
                }
            });
        }
        
        if (this.querySelector('i').classList.contains('fa-route')) {
            // Toggle flight paths visibility
            flightPathLines.forEach(line => {
                if (this.classList.contains('active')) {
                    map.addLayer(line);
                } else {
                    map.removeLayer(line);
                }
            });
        }
        
        if (this.querySelector('i').classList.contains('fa-exclamation-triangle')) {
            // Toggle sensitive zones visibility
            sensitiveZonePolygons.forEach(zone => {
                if (this.classList.contains('active')) {
                    map.addLayer(zone);
                } else {
                    map.removeLayer(zone);
                }
            });
        }
        
        if (this.querySelector('i').classList.contains('fa-eye-slash')) {
            // Toggle blind spots visibility
            blindSpotCircles.forEach(spot => {
                if (this.classList.contains('active')) {
                    map.addLayer(spot);
                } else {
                    map.removeLayer(spot);
                }
            });
        }
        
        if (this.querySelector('i').classList.contains('fa-crosshairs')) {
            // Toggle threats visibility
            threatMarkers.forEach(marker => {
                if (this.classList.contains('active')) {
                    map.addLayer(marker);
                } else {
                    map.removeLayer(marker);
                }
            });
        }
        
        if (this.querySelector('i').classList.contains('fa-border-all')) {
            // Toggle patrol areas
            togglePatrolAreas();
        }
        
        // Map type toggles
        if (this.querySelector('i').classList.contains('fa-satellite') && this.classList.contains('active')) {
            // Change to satellite map
            updateMapLayer('satellite');
            
            // Deactivate other map type buttons
            document.querySelectorAll('.map-toggle-btn i.fa-map, .map-toggle-btn i.fa-mountain').forEach(icon => {
                icon.parentElement.classList.remove('active');
            });
        }
        
        if (this.querySelector('i').classList.contains('fa-map') && this.classList.contains('active')) {
            // Change to street map
            updateMapLayer('streets');
            
            // Deactivate other map type buttons
            document.querySelectorAll('.map-toggle-btn i.fa-satellite, .map-toggle-btn i.fa-mountain').forEach(icon => {
                icon.parentElement.classList.remove('active');
            });
        }
        
        if (this.querySelector('i').classList.contains('fa-mountain') && this.classList.contains('active')) {
            // Change to terrain map
            updateMapLayer('terrain');
            
            // Deactivate other map type buttons
            document.querySelectorAll('.map-toggle-btn i.fa-satellite, .map-toggle-btn i.fa-map').forEach(icon => {
                icon.parentElement.classList.remove('active');
            });
        }
    });
});

// Function to update map layer
function updateMapLayer(type) {
    // Remove current tile layer
    map.eachLayer(layer => {
        if (layer instanceof L.TileLayer) {
            map.removeLayer(layer);
        }
    });
    
    // Add new layer based on type
    if (type === 'satellite') {
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Imagery &copy; Esri',
            maxZoom: 19
        }).addTo(map);
    } else if (type === 'streets') {
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);
    } else if (type === 'terrain') {
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Imagery &copy; Esri',
            maxZoom: 19
        }).addTo(map);
    } else {
        // Default dark theme
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);
    }
}

// Animate drones
function animateDrones() {
    // Every 300ms, update the drone positions
    setInterval(() => {
        drones.forEach((drone, index) => {
            // Don't move drones that are returning to base
            if (drone.status === "warning") {
                // Move towards center (simulating return to base)
                const centerLat = 24.7136;
                const centerLng = 46.6753;
                
                drone.latlng[0] += (centerLat - drone.latlng[0]) * 0.02;
                drone.latlng[1] += (centerLng - drone.latlng[1]) * 0.02;
            } else {
                // Small random movement for animation
                drone.latlng[0] += (Math.random() - 0.5) * 0.0002;
                drone.latlng[1] += (Math.random() - 0.5) * 0.0002;
            }
            
            // Update marker position
            if (droneMarkers[index] && droneMarkers[index].marker) {
                droneMarkers[index].marker.setLatLng(drone.latlng);
            }
        });
    }, 300);
}

// Start drone animation
animateDrones();

// Fullscreen button functionality
document.querySelector('.card-action-btn[title="عرض ملء الشاشة"]').addEventListener('click', function() {
    const mapCard = document.querySelector('.map-card');
    
    if (mapCard.classList.contains('fullscreen')) {
        // Exit fullscreen
        mapCard.classList.remove('fullscreen');
        this.innerHTML = '<i class="fas fa-expand"></i>';
        mapCard.style.position = 'relative';
        mapCard.style.zIndex = '1';
        mapCard.style.height = '600px';
    } else {
        // Enter fullscreen
        mapCard.classList.add('fullscreen');
        this.innerHTML = '<i class="fas fa-compress"></i>';
        mapCard.style.position = 'fixed';
        mapCard.style.top = '0';
        mapCard.style.left = '0';
        mapCard.style.width = '100%';
        mapCard.style.height = '100%';
        mapCard.style.zIndex = '1000';
        mapCard.style.borderRadius = '0';
    }
    
    // Trigger a resize event to update the map
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 100);
});

// Add CSS for fullscreen mode
const style = document.createElement('style');
style.innerHTML = `
.map-card.fullscreen {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    z-index: 1000 !important;
    border-radius: 0 !important;
}
.map-card.fullscreen .card-body {
    height: calc(100% - 62px) !important;
}
`;
document.head.appendChild(style);

// Expose showDroneDetails function globally (needed for popup buttons)
window.showDroneDetails = showDroneDetails;