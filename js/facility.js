// Facility Management System for Interactive Map

// Store all facilities
let facilities = [];
let facilityCounter = 0;
let selectedFacility = null;
let drawingMode = null;
let tempDrawingPoints = [];
let tempDrawingLayer = null;

// ==================== AUTO-SAVE FUNCTIONALITY ====================
// Save facilities to localStorage automatically
function autoSaveFacilities() {
    try {
        const data = facilities.map(f => ({
            id: f.id,
            name: f.name,
            type: f.type,
            center: f.center,
            dimensions: f.dimensions,
            area: f.area,
            perimeter: f.perimeter,
            radius: f.radius || null,
            coordinates: f.coordinates ? f.coordinates.map(c => ({
                lat: c.lat !== undefined ? c.lat : c[0],
                lng: c.lng !== undefined ? c.lng : c[1]
            })) : []
        }));

        localStorage.setItem('rasd_facilities', JSON.stringify(data));
        console.log(`تم الحفظ التلقائي: ${facilities.length} منشأة`);
    } catch (e) {
        console.error('خطأ في الحفظ التلقائي:', e);
    }
}

// Load facilities from localStorage on page load
function loadFacilitiesFromStorage() {
    try {
        const saved = localStorage.getItem('rasd_facilities');
        if (!saved) return;

        const data = JSON.parse(saved);
        if (!data || data.length === 0) return;

        data.forEach(f => {
            if (f.coordinates && f.coordinates.length > 0) {
                const coords = f.coordinates.map(c => [c.lat, c.lng]);

                // Create polygon layer
                const polygon = L.polygon(coords, {
                    color: '#10b981',
                    fillColor: '#10b981',
                    fillOpacity: 0.2,
                    weight: 2,
                    bubblingMouseEvents: false
                }).addTo(map);

                // Recreate facility object
                const facility = {
                    id: f.id,
                    name: f.name,
                    type: f.type,
                    coordinates: coords,
                    center: f.center,
                    dimensions: f.dimensions,
                    area: f.area,
                    perimeter: f.perimeter,
                    layer: polygon
                };

                // Add tooltip
                polygon.bindTooltip(`
                    <div style="text-align: center;">
                        <strong>${f.name}</strong><br>
                        <small>العرض: ${f.dimensions.width.toFixed(1)}م × الطول: ${f.dimensions.height.toFixed(1)}م</small>
                    </div>
                `, {
                    permanent: false,
                    className: 'facility-tooltip',
                    direction: 'top'
                });

                // Add click handler
                polygon.on('click', function () {
                    selectFacility(f.id);
                });

                facilities.push(facility);

                // Update facility counter
                facilityCounter = Math.max(facilityCounter, facilities.length);
            }
        });

        updateFacilityList();
        console.log(`تم تحميل ${facilities.length} منشأة من التخزين`);
    } catch (e) {
        console.error('خطأ في تحميل المنشآت:', e);
    }
}

// Initialize facility management system
function initFacilityManagement() {
    // Panel toggle functionality
    const toggleBtn = document.getElementById('toggleFacilityPanel');
    const facilityPanel = document.getElementById('facilityPanel');

    if (toggleBtn && facilityPanel) {
        toggleBtn.addEventListener('click', function () {
            facilityPanel.classList.toggle('collapsed');
            const icon = this.querySelector('i');
            if (facilityPanel.classList.contains('collapsed')) {
                icon.className = 'fas fa-plus';
            } else {
                icon.className = 'fas fa-minus';
            }
        });
    }

    // Drawing tools event listeners
    const drawRectBtn = document.getElementById('drawRectangleTool');
    const drawPolyBtn = document.getElementById('drawPolygonTool');
    const selectBtn = document.getElementById('selectFacilityTool');
    const clearAllBtn = document.getElementById('clearAllFacilities');
    const cancelDrawingBtn = document.getElementById('cancelDrawing');

    if (drawRectBtn) {
        drawRectBtn.addEventListener('click', function () {
            activateDrawingMode('rectangle', this);
        });
    }

    if (drawPolyBtn) {
        drawPolyBtn.addEventListener('click', function () {
            activateDrawingMode('polygon', this);
        });
    }

    if (selectBtn) {
        selectBtn.addEventListener('click', function () {
            activateSelectMode(this);
        });
    }

    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', function () {
            clearAllFacilitiesFromMap();
        });
    }

    if (cancelDrawingBtn) {
        cancelDrawingBtn.addEventListener('click', function () {
            cancelDrawing();
        });
    }

    // Load saved facilities from localStorage
    loadFacilitiesFromStorage();
}

// Activate drawing mode
function activateDrawingMode(mode, button) {
    // Cancel any existing drawing
    cancelDrawing();

    // Deactivate all tool buttons
    document.querySelectorAll('.facility-tool-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Activate current button
    button.classList.add('active');

    // Set drawing mode
    drawingMode = mode;
    tempDrawingPoints = [];

    // Show drawing indicator
    const indicator = document.getElementById('drawingModeIndicator');
    if (indicator) {
        indicator.classList.add('active');
        const text = mode === 'rectangle'
            ? 'وضع الرسم: انقر على نقطتين لتحديد المستطيل'
            : 'وضع الرسم: انقر على الخريطة لتحديد زوايا المنشأة (انقر مرتين للإنهاء)';
        indicator.querySelector('span').textContent = text;
    }

    // Change cursor
    document.getElementById('map').style.cursor = 'crosshair';

    // Add click handler to map
    map.on('click', handleMapClickForDrawing);
    map.on('dblclick', handleMapDoubleClickForDrawing);
}

// Activate select mode
function activateSelectMode(button) {
    cancelDrawing();

    document.querySelectorAll('.facility-tool-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    button.classList.add('active');

    document.getElementById('map').style.cursor = 'pointer';

    // Enable clicking on facilities to select them
    facilities.forEach(facility => {
        if (facility.layer) {
            facility.layer.on('click', function () {
                selectFacility(facility.id);
            });
        }
    });
}

// Handle map click for drawing
function handleMapClickForDrawing(e) {
    if (!drawingMode) return;

    tempDrawingPoints.push(e.latlng);

    // Draw temporary marker
    const marker = L.circleMarker(e.latlng, {
        radius: 6,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        color: '#fff',
        weight: 2
    }).addTo(map);

    if (!tempDrawingLayer) {
        tempDrawingLayer = L.layerGroup().addTo(map);
    }
    tempDrawingLayer.addLayer(marker);

    // For rectangle mode, complete after 2 points
    if (drawingMode === 'rectangle' && tempDrawingPoints.length === 2) {
        completeRectangleDrawing();
    }

    // For polygon, draw connecting lines
    if (drawingMode === 'polygon' && tempDrawingPoints.length > 1) {
        const line = L.polyline([
            tempDrawingPoints[tempDrawingPoints.length - 2],
            tempDrawingPoints[tempDrawingPoints.length - 1]
        ], {
            color: '#3b82f6',
            weight: 2,
            dashArray: '5, 5'
        });
        tempDrawingLayer.addLayer(line);
    }
}

// Handle double click to complete polygon
function handleMapDoubleClickForDrawing(e) {
    if (drawingMode === 'polygon' && tempDrawingPoints.length >= 3) {
        completePolygonDrawing();
    }
}

// Complete rectangle drawing
function completeRectangleDrawing() {
    if (tempDrawingPoints.length !== 2) return;

    const bounds = L.latLngBounds(tempDrawingPoints[0], tempDrawingPoints[1]);
    const name = `منشأة ${++facilityCounter}`;

    // Create rectangle from bounds
    const coordinates = [
        bounds.getNorthWest(),
        bounds.getNorthEast(),
        bounds.getSouthEast(),
        bounds.getSouthWest()
    ];

    addFacility(name, coordinates, 'rectangle');
    cancelDrawing();
}

// Complete polygon drawing
function completePolygonDrawing() {
    if (tempDrawingPoints.length < 3) return;

    const name = `منشأة ${++facilityCounter}`;
    addFacility(name, tempDrawingPoints, 'polygon');
    cancelDrawing();
}

// Cancel drawing
function cancelDrawing() {
    drawingMode = null;
    tempDrawingPoints = [];

    // Remove temporary layers
    if (tempDrawingLayer) {
        map.removeLayer(tempDrawingLayer);
        tempDrawingLayer = null;
    }

    // Hide indicator
    const indicator = document.getElementById('drawingModeIndicator');
    if (indicator) {
        indicator.classList.remove('active');
    }

    // Reset cursor
    const mapElement = document.getElementById('map');
    if (mapElement) {
        mapElement.style.cursor = '';
    }

    // Deactivate all tool buttons
    document.querySelectorAll('.facility-tool-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Remove map click handlers
    map.off('click', handleMapClickForDrawing);
    map.off('dblclick', handleMapDoubleClickForDrawing);
}

// Add a new facility
function addFacility(name, coordinates, type) {
    const id = Date.now();

    // Calculate area first to determine z-index based on size
    const area = calculateArea(coordinates);

    // Create polygon layer with bubblingMouseEvents: false to allow clicking on nested facilities
    const polygon = L.polygon(coordinates, {
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.2,
        weight: 2,
        bubblingMouseEvents: false  // Prevent click events from bubbling to layers below
    }).addTo(map);

    // Calculate facility info
    const center = calculateCenter(coordinates);
    const dimensions = calculateDimensions(coordinates);
    const perimeter = calculatePerimeter(coordinates);


    // Create facility object
    const facility = {
        id: id,
        name: name,
        type: type,
        coordinates: coordinates,
        center: center,
        dimensions: dimensions,
        area: area,
        perimeter: perimeter,
        layer: polygon
    };

    // Add tooltip
    polygon.bindTooltip(`
        <div style="text-align: center;">
            <strong>${name}</strong><br>
            <small>العرض: ${dimensions.width.toFixed(1)}م × الطول: ${dimensions.height.toFixed(1)}م</small>
        </div>
    `, {
        permanent: false,
        className: 'facility-tooltip',
        direction: 'top'
    });

    // Add click handler for selection
    polygon.on('click', function () {
        selectFacility(id);
    });

    // Add to facilities array
    facilities.push(facility);

    // Update UI
    updateFacilityList();
    selectFacility(id);

    // Auto-save to localStorage
    autoSaveFacilities();
}

// Calculate center of polygon
function calculateCenter(coordinates) {
    let totalLat = 0;
    let totalLng = 0;

    coordinates.forEach(coord => {
        if (coord.lat !== undefined) {
            totalLat += coord.lat;
            totalLng += coord.lng;
        } else {
            totalLat += coord[0];
            totalLng += coord[1];
        }
    });

    return {
        lat: totalLat / coordinates.length,
        lng: totalLng / coordinates.length
    };
}

// Calculate dimensions (bounding box)
function calculateDimensions(coordinates) {
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;

    coordinates.forEach(coord => {
        const lat = coord.lat !== undefined ? coord.lat : coord[0];
        const lng = coord.lng !== undefined ? coord.lng : coord[1];

        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
    });

    // Convert to meters (approximate)
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;

    // 1 degree latitude ≈ 111,000 meters
    // 1 degree longitude ≈ 111,000 * cos(latitude) meters
    const centerLat = (minLat + maxLat) / 2;
    const height = latDiff * 111000;
    const width = lngDiff * 111000 * Math.cos(centerLat * Math.PI / 180);

    return {
        width: width,
        height: height,
        minLat: minLat,
        maxLat: maxLat,
        minLng: minLng,
        maxLng: maxLng
    };
}

// Calculate area of polygon (in square meters)
function calculateArea(coordinates) {
    // Using shoelace formula with coordinate conversion
    let area = 0;
    const n = coordinates.length;

    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;

        const lat1 = coordinates[i].lat !== undefined ? coordinates[i].lat : coordinates[i][0];
        const lng1 = coordinates[i].lng !== undefined ? coordinates[i].lng : coordinates[i][1];
        const lat2 = coordinates[j].lat !== undefined ? coordinates[j].lat : coordinates[j][0];
        const lng2 = coordinates[j].lng !== undefined ? coordinates[j].lng : coordinates[j][1];

        area += (lng1 * lat2 - lng2 * lat1);
    }

    area = Math.abs(area) / 2;

    // Convert to square meters
    const centerLat = calculateCenter(coordinates).lat;
    const metersPerDegLat = 111000;
    const metersPerDegLng = 111000 * Math.cos(centerLat * Math.PI / 180);

    return area * metersPerDegLat * metersPerDegLng;
}

// Calculate perimeter of polygon (in meters)
function calculatePerimeter(coordinates) {
    let perimeter = 0;
    const n = coordinates.length;

    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;

        const lat1 = coordinates[i].lat !== undefined ? coordinates[i].lat : coordinates[i][0];
        const lng1 = coordinates[i].lng !== undefined ? coordinates[i].lng : coordinates[i][1];
        const lat2 = coordinates[j].lat !== undefined ? coordinates[j].lat : coordinates[j][0];
        const lng2 = coordinates[j].lng !== undefined ? coordinates[j].lng : coordinates[j][1];

        perimeter += calculateDistance(lat1, lng1, lat2, lng2);
    }

    return perimeter;
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

// Update facility list UI
function updateFacilityList() {
    const listContainer = document.getElementById('facilityList');
    const emptyState = document.getElementById('facilityEmptyState');

    if (!listContainer) return;

    // Clear existing items (except empty state)
    const existingItems = listContainer.querySelectorAll('.facility-item');
    existingItems.forEach(item => item.remove());

    if (facilities.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    // Add facility items
    facilities.forEach(facility => {
        const item = document.createElement('div');
        item.className = 'facility-item' + (selectedFacility && selectedFacility.id === facility.id ? ' selected' : '');
        item.setAttribute('data-facility-id', facility.id);

        item.innerHTML = `
            <div class="facility-item-header">
                <div class="facility-item-name">
                    <i class="fas fa-building"></i>
                    ${facility.name}
                </div>
                <div class="facility-item-actions">
                    <button class="facility-action-btn focus-btn" title="تركيز على المنشأة">
                        <i class="fas fa-crosshairs"></i>
                    </button>
                    <button class="facility-action-btn edit-btn" title="تعديل الاسم">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="facility-action-btn delete delete-btn" title="حذف">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
            <div class="facility-item-info">
                <div class="facility-info-row">
                    <span class="facility-info-label">الإحداثيات</span>
                    <span class="facility-info-value">${facility.center.lat.toFixed(4)}, ${facility.center.lng.toFixed(4)}</span>
                </div>
                <div class="facility-info-row">
                    <span class="facility-info-label">المساحة</span>
                    <span class="facility-info-value">${formatArea(facility.area)}</span>
                </div>
            </div>
        `;

        // Add event listeners
        item.addEventListener('click', function (e) {
            if (!e.target.closest('.facility-action-btn')) {
                selectFacility(facility.id);
            }
        });

        // Focus button
        item.querySelector('.focus-btn').addEventListener('click', function (e) {
            e.stopPropagation();
            focusOnFacility(facility.id);
        });

        // Edit button
        item.querySelector('.edit-btn').addEventListener('click', function (e) {
            e.stopPropagation();
            editFacilityName(facility.id);
        });

        // Delete button
        item.querySelector('.delete-btn').addEventListener('click', function (e) {
            e.stopPropagation();
            deleteFacility(facility.id);
        });

        listContainer.appendChild(item);
    });
}

// Select a facility
function selectFacility(id) {
    const facility = facilities.find(f => f.id === id);
    if (!facility) return;

    selectedFacility = facility;

    // Update layer styles
    facilities.forEach(f => {
        if (f.layer) {
            if (f.id === id) {
                f.layer.setStyle({
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.3,
                    weight: 3
                });
            } else {
                f.layer.setStyle({
                    color: '#10b981',
                    fillColor: '#10b981',
                    fillOpacity: 0.2,
                    weight: 2
                });
            }
        }
    });

    // Update list UI
    document.querySelectorAll('.facility-item').forEach(item => {
        if (parseInt(item.getAttribute('data-facility-id')) === id) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });

    // Show details panel
    showFacilityDetails(facility);

    // Update selected facility panel on index.html map
    updateSelectedFacilityPanel(facility);
}

// Update selected facility panel on map (for index.html)
function updateSelectedFacilityPanel(facility) {
    const panel = document.getElementById('selectedFacilityPanel');
    const titleEl = document.getElementById('selectedFacilityTitle');
    const coordsEl = document.getElementById('facilityCoords');
    const areaEl = document.getElementById('facilityAreaInfo');
    const goToBtn = document.getElementById('goToFacilityBtn');
    const deleteBtn = document.getElementById('deleteFacilityBtn');

    if (panel && titleEl && coordsEl && areaEl) {
        panel.style.display = 'block';
        titleEl.textContent = facility.name;
        coordsEl.textContent = `${facility.center.lat.toFixed(4)}, ${facility.center.lng.toFixed(4)}`;
        areaEl.textContent = formatArea(facility.area);

        // Setup go to facility button
        if (goToBtn) {
            // Remove previous event listener to avoid duplicates
            goToBtn.replaceWith(goToBtn.cloneNode(true));
            const newGoToBtn = document.getElementById('goToFacilityBtn');
            newGoToBtn.addEventListener('click', function () {
                goToSelectedFacility(facility);
            });
        }

        // Setup delete facility button
        if (deleteBtn) {
            // Remove previous event listener to avoid duplicates
            deleteBtn.replaceWith(deleteBtn.cloneNode(true));
            const newDeleteBtn = document.getElementById('deleteFacilityBtn');
            newDeleteBtn.addEventListener('click', function () {
                deleteSelectedFacility(facility.id);
            });
        }
    }
}

// Delete selected facility from panel
function deleteSelectedFacility(id) {
    if (confirm('هل أنت متأكد من حذف هذه المنشأة؟')) {
        const index = facilities.findIndex(f => f.id === id);
        if (index !== -1) {
            const facility = facilities[index];

            // Remove layer from map
            if (facility.layer) {
                map.removeLayer(facility.layer);
            }

            // Remove from array
            facilities.splice(index, 1);

            // Hide the panel
            const panel = document.getElementById('selectedFacilityPanel');
            if (panel) {
                panel.style.display = 'none';
            }

            // Clear selection
            selectedFacility = null;

            // Update facility list if exists
            updateFacilityList();

            // Show success message if showToast is available
            if (typeof showToast === 'function') {
                showToast('تم حذف المنشأة بنجاح', 'success');
            }

            // Auto-save to localStorage
            autoSaveFacilities();
        }
    }
}

// Go to selected facility on map
function goToSelectedFacility(facility) {
    if (!facility || !facility.layer) return;

    // Fly to the facility with animation
    map.flyToBounds(facility.layer.getBounds(), {
        padding: [50, 50],
        duration: 1,
        easeLinearity: 0.5
    });
}

// Show facility details
function showFacilityDetails(facility) {
    const detailsPanel = document.getElementById('facilityDetails');
    if (!detailsPanel) return;

    detailsPanel.style.display = 'block';

    document.getElementById('selectedFacilityName').textContent = facility.name;
    document.getElementById('selectedFacilityLat').textContent = `${facility.center.lat.toFixed(6)}`;
    document.getElementById('selectedFacilityLng').textContent = `${facility.center.lng.toFixed(6)}`;
    document.getElementById('selectedFacilityWidth').textContent = `${facility.dimensions.width.toFixed(1)} م`;
    document.getElementById('selectedFacilityHeight').textContent = `${facility.dimensions.height.toFixed(1)} م`;
    document.getElementById('selectedFacilityArea').textContent = formatArea(facility.area);
    document.getElementById('selectedFacilityPerimeter').textContent = `${facility.perimeter.toFixed(1)} متر`;
}

// Format area for display
function formatArea(area) {
    if (area >= 10000) {
        return `${(area / 10000).toFixed(2)} هكتار`;
    } else {
        return `${area.toFixed(1)} م²`;
    }
}

// Focus on a facility
function focusOnFacility(id) {
    const facility = facilities.find(f => f.id === id);
    if (!facility || !facility.layer) return;

    map.fitBounds(facility.layer.getBounds(), { padding: [50, 50] });
    selectFacility(id);
}

// Edit facility name
function editFacilityName(id) {
    const facility = facilities.find(f => f.id === id);
    if (!facility) return;

    const newName = prompt('أدخل اسم المنشأة الجديد:', facility.name);
    if (newName && newName.trim()) {
        facility.name = newName.trim();

        // Update tooltip
        if (facility.layer) {
            facility.layer.unbindTooltip();
            facility.layer.bindTooltip(`
                <div style="text-align: center;">
                    <strong>${facility.name}</strong><br>
                    <small>العرض: ${facility.dimensions.width.toFixed(1)}م × الطول: ${facility.dimensions.height.toFixed(1)}م</small>
                </div>
            `, {
                permanent: false,
                className: 'facility-tooltip',
                direction: 'top'
            });
        }

        updateFacilityList();
        if (selectedFacility && selectedFacility.id === id) {
            showFacilityDetails(facility);
        }

        // Auto-save to localStorage
        autoSaveFacilities();

        // Show success message
        if (typeof showToast === 'function') {
            showToast(`تم تغيير الاسم إلى: ${newName.trim()}`, 'success');
        }
    }
}

// Delete a facility
function deleteFacility(id) {
    const index = facilities.findIndex(f => f.id === id);
    if (index === -1) return;

    if (confirm('هل أنت متأكد من حذف هذه المنشأة؟')) {
        const facility = facilities[index];

        // Remove layer from map
        if (facility.layer) {
            map.removeLayer(facility.layer);
        }

        // Remove from array
        facilities.splice(index, 1);

        // Clear selection if deleted facility was selected
        if (selectedFacility && selectedFacility.id === id) {
            selectedFacility = null;
            document.getElementById('facilityDetails').style.display = 'none';
        }

        updateFacilityList();

        // Auto-save to localStorage
        autoSaveFacilities();
    }
}

// Clear all facilities
function clearAllFacilitiesFromMap() {
    if (facilities.length === 0) return;

    if (confirm('هل أنت متأكد من حذف جميع المنشآت؟')) {
        facilities.forEach(facility => {
            if (facility.layer) {
                map.removeLayer(facility.layer);
            }
        });

        facilities = [];
        selectedFacility = null;
        facilityCounter = 0;

        document.getElementById('facilityDetails').style.display = 'none';
        updateFacilityList();

        // Auto-save to localStorage
        autoSaveFacilities();
    }
}

// Add sample facilities
function addSampleFacilities() {
    // Sample facility 1 - Main Building
    const facility1Coords = [
        [24.7140, 46.6780],
        [24.7150, 46.6780],
        [24.7150, 46.6800],
        [24.7140, 46.6800]
    ];

    // Sample facility 2 - Secondary Building
    const facility2Coords = [
        [24.7170, 46.6720],
        [24.7180, 46.6720],
        [24.7180, 46.6735],
        [24.7170, 46.6735]
    ];

    // Sample facility 3 - Warehouse
    const facility3Coords = [
        [24.7100, 46.6750],
        [24.7115, 46.6750],
        [24.7115, 46.6770],
        [24.7100, 46.6770]
    ];

    facilityCounter = 0;
    addFacility('المبنى الرئيسي', facility1Coords, 'rectangle');
    addFacility('المبنى الإداري', facility2Coords, 'rectangle');
    addFacility('المستودع', facility3Coords, 'rectangle');

    // Deselect all after adding samples
    selectedFacility = null;
    document.getElementById('facilityDetails').style.display = 'none';

    facilities.forEach(f => {
        if (f.layer) {
            f.layer.setStyle({
                color: '#10b981',
                fillColor: '#10b981',
                fillOpacity: 0.2,
                weight: 2
            });
        }
    });

    document.querySelectorAll('.facility-item').forEach(item => {
        item.classList.remove('selected');
    });
}

// Export facilities data
function exportFacilitiesData() {
    const data = facilities.map(f => ({
        name: f.name,
        type: f.type,
        center: f.center,
        dimensions: f.dimensions,
        area: f.area,
        perimeter: f.perimeter,
        coordinates: f.coordinates.map(c => ({
            lat: c.lat !== undefined ? c.lat : c[0],
            lng: c.lng !== undefined ? c.lng : c[1]
        }))
    }));

    return JSON.stringify(data, null, 2);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    // Small delay to ensure map is initialized
    setTimeout(initFacilityManagement, 500);
});
