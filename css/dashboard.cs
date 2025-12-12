:root {
    --primary: #1e293b;
    --secondary: #0f172a;
    --accent: #3b82f6;
    --light: #f1f5f9;
    --dark: #0f172a;
    --danger: #ef4444;
    --success: #10b981;
    --warning: #f59e0b;
    --info: #0ea5e9;
    --border: #334155;
    --card-bg: #1e293b;
    --hover: #334155;
    --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Tajawal', sans-serif;
    background-color: var(--secondary);
    color: var(--light);
    direction: rtl;
}

a {
    text-decoration: none;
    color: var(--light);
}

/* App Container */
.app-container {
    display: flex;
    min-height: 100vh;
}

/* Sidebar */
.sidebar {
    width: 280px;
    background-color: var(--primary);
    border-left: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 100;
}

.sidebar-header {
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.logo {
    display: flex;
    align-items: center;
    gap: 12px;
}

.logo img {
    height: 32px;
    width: 32px;
}

.logo span {
    font-weight: 700;
    font-size: 20px;
    color: var(--light);
}

.mobile-toggle {
    display: none;
    background: none;
    border: none;
    color: var(--light);
    font-size: 18px;
    cursor: pointer;
}

.user-profile {
    padding: 0 20px 20px 20px;
    display: flex;
    align-items: center;
    gap: 15px;
}

.user-avatar {
    position: relative;
}

.user-avatar img {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--accent);
}

.status-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: var(--success);
    position: absolute;
    bottom: 0;
    right: 0;
    border: 2px solid var(--primary);
}

.status-indicator.online {
    background-color: var(--success);
}

.status-indicator.offline {
    background-color: var(--danger);
}

.status-indicator.away {
    background-color: var(--warning);
}

.user-info {
    display: flex;
    flex-direction: column;
}

.user-name {
    font-weight: 700;
    font-size: 16px;
    color: var(--light);
}

.user-role {
    font-size: 13px;
    color: rgba(241, 245, 249, 0.7);
}

.sidebar-divider {
    height: 1px;
    background-color: var(--border);
    margin: 0 20px;
}

.sidebar-nav {
    padding: 20px 0;
    flex-grow: 1;
    overflow-y: auto;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 14px 20px;
    color: var(--light);
    transition: all 0.3s ease;
    position: relative;
}

.nav-item:hover {
    background-color: var(--hover);
}

.nav-item.active {
    background-color: rgba(59, 130, 246, 0.1);
    border-right: 3px solid var(--accent);
}

.nav-item.active i {
    color: var(--accent);
}

.nav-badge {
    background-color: var(--accent);
    color: #fff;
    font-size: 12px;
    font-weight: 500;
    padding: 2px 6px;
    border-radius: 10px;
    margin-right: auto;
}

.nav-badge.danger {
    background-color: var(--danger);
}

.system-status {
    padding: 20px;
    background-color: rgba(15, 23, 42, 0.5);
    border-radius: 8px;
    margin: 0 20px;
}

.status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.status-item:last-child {
    margin-bottom: 0;
}

.status-label {
    font-size: 13px;
    color: rgba(241, 245, 249, 0.7);
}

.status-value {
    font-size: 13px;
    font-weight: 500;
}

.text-success {
    color: var(--success);
}

.signal-strength {
    display: flex;
    gap: 2px;
}

.signal-bar {
    width: 4px;
    height: 12px;
    background-color: rgba(241, 245, 249, 0.2);
    border-radius: 2px;
}

.signal-bar.active {
    background-color: var(--success);
}

.sidebar-footer {
    padding: 20px;
    border-top: 1px solid var(--border);
}

.footer-links {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-bottom: 15px;
}

.footer-links a {
    font-size: 16px;
    color: rgba(241, 245, 249, 0.7);
    transition: all 0.3s ease;
}

.footer-links a:hover {
    color: var(--accent);
}

.version-info {
    text-align: center;
    font-size: 12px;
    color: rgba(241, 245, 249, 0.5);
}

/* Main Content */
.main-content {
    flex-grow: 1;
    margin-right: 280px;
    transition: all 0.3s ease;
    min-height: 100vh;
}

.main-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 30px;
    border-bottom: 1px solid var(--border);
}

.header-title h1 {
    font-size: 24px;
    font-weight: 700;
    color: var(--light);
    margin-bottom: 5px;
}

.breadcrumb {
    font-size: 14px;
    color: rgba(241, 245, 249, 0.7);
}

.breadcrumb a {
    color: var(--accent);
    transition: all 0.3s ease;
}

.breadcrumb a:hover {
    text-decoration: underline;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 20px;
}

.search-bar {
    position: relative;
    width: 300px;
}

.search-bar i {
    position: absolute;
    top: 50%;
    right: 15px;
    transform: translateY(-50%);
    color: rgba(241, 245, 249, 0.7);
}

.search-bar input {
    width: 100%;
    padding: 10px 15px 10px 40px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background-color: rgba(30, 41, 59, 0.5);
    color: var(--light);
    font-size: 14px;
    outline: none;
    transition: all 0.3s ease;
}

.search-bar input:focus {
    border-color: var(--accent);
    background-color: rgba(30, 41, 59, 0.8);
}

.actions-buttons {
    display: flex;
    align-items: center;
    gap: 15px;
}

.header-btn {
    background: none;
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--light);
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
}

.header-btn:hover {
    background-color: var(--hover);
}

.header-btn .badge {
    position: absolute;
    top: -5px;
    left: -5px;
    background-color: var(--danger);
    color: #fff;
    font-size: 11px;
    font-weight: 500;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--secondary);
}

.profile-btn {
    width: 40px;
    height: 40px;
    padding: 0;
    overflow: hidden;
}

.profile-btn img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* System Status Bar */
.system-status-bar {
    background-color: var(--primary);
    padding: 12px 30px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border);
}

.status-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    padding: 5px 10px;
    border-radius: 20px;
    background-color: rgba(15, 23, 42, 0.5);
}

.status-pill i {
    color: var(--success);
}

.status-pills-container {
    display: flex;
    align-items: center;
    gap: 15px;
    flex-wrap: wrap;
}

.badge {
    background-color: var(--accent);
    color: #fff;
    font-size: 12px;
    font-weight: 500;
    padding: 2px 6px;
    border-radius: 10px;
    display: inline-block;
}

.badge.success {
    background-color: var(--success);
}

.badge.danger {
    background-color: var(--danger);
}

.badge.warning {
    background-color: var(--warning);
}

.date-time {
    white-space: nowrap;
}

/* Dashboard Container */
.dashboard-container {
    padding: 30px;
}

/* Stats Row */
.stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 20px;
}

.stat-card {
    background-color: var(--card-bg);
    border-radius: 12px;
    padding: 20px;
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
}

.stat-icon {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    margin-bottom: 15px;
}

.bg-accent {
    background-color: rgba(59, 130, 246, 0.1);
    color: var(--accent);
}

.bg-danger {
    background-color: rgba(239, 68, 68, 0.1);
    color: var(--danger);
}

.bg-warning {
    background-color: rgba(245, 158, 11, 0.1);
    color: var(--warning);
}

.bg-success {
    background-color: rgba(16, 185, 129, 0.1);
    color: var(--success);
}

.bg-info {
    background-color: rgba(14, 165, 233, 0.1);
    color: var(--info);
}

.stat-info {
    margin-bottom: 15px;
}

.stat-info h3 {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 5px;
}

.stat-info p {
    font-size: 14px;
    color: rgba(241, 245, 249, 0.7);
}

.stat-progress {
    margin-top: auto;
}

.progress-bar {
    width: 100%;
    height: 6px;
    background-color: rgba(241, 245, 249, 0.1);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 8px;
}

.progress-fill {
    height: 100%;
    border-radius: 3px;
}

.progress-text {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: rgba(241, 245, 249, 0.7);
}

/* Card */
.card {
    background-color: var(--card-bg);
    border-radius: 12px;
    box-shadow: var(--shadow);
    margin-bottom: 20px;
}

.card-header {
    padding: 20px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.card-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 700;
    font-size: 16px;
}

.card-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    background-color: rgba(15, 23, 42, 0.5);
}

.card-actions {
    display: flex;
    align-items: center;
    gap: 15px;
}

.card-filter select {
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background-color: rgba(15, 23, 42, 0.5);
    color: var(--light);
    font-size: 14px;
    outline: none;
    transition: all 0.3s ease;
    cursor: pointer;
}

.card-filter select:focus {
    border-color: var(--accent);
}

.card-action-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background-color: rgba(15, 23, 42, 0.5);
    color: var(--light);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
}

.card-action-btn:hover {
    background-color: var(--hover);
    border-color: var(--accent);
}

.card-body {
    padding: 20px;
}

.card-footer {
    padding: 15px 20px;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: flex-end;
    gap: 15px;
}

/* Map Card */
.map-card {
    height: 600px;
    position: relative;
}

.map-card .card-body {
    padding: 0;
    height: calc(100% - 62px);
    position: relative;
    overflow: hidden;
}

#map {
    width: 100%;
    height: 100%;
    background-color: #0f172a;
    border-radius: 0 0 12px 12px;
}

.map-legend {
    position: absolute;
    top: 20px;
    left: 20px;
    background-color: rgba(15, 23, 42, 0.8);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 15px;
    backdrop-filter: blur(10px);
    z-index: 10;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    min-width: 180px;
}

.map-legend-header {
    font-size: 14px;
    font-weight: 500;
    color: var(--light);
    border-bottom: 1px solid var(--border);
    padding-bottom: 8px;
    margin-bottom: 10px;
}

.map-legend-item {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
    font-size: 12px;
}

.map-legend-color {
    width: 15px;
    height: 15px;
    border-radius: 3px;
}

.map-overlay {
    position: absolute;
    bottom: 20px;
    left: 20px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 300px;
}

.map-control {
    background-color: rgba(15, 23, 42, 0.8);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px;
    backdrop-filter: blur(10px);
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.map-control-header {
    font-size: 13px;
    font-weight: 500;
    color: var(--light);
    margin-bottom: 5px;
    border-bottom: 1px solid var(--border);
    padding-bottom: 8px;
}

.map-control-toggle {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.map-toggle-btn {
    padding: 8px 12px;
    border-radius: 6px;
    border: none;
    background-color: rgba(30, 41, 59, 0.9);
    color: var(--light);
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 5px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    flex: 1;
    min-width: 80px;
    justify-content: center;
}

.map-toggle-btn.active {
    background-color: var(--accent);
    color: white;
}

.map-toggle-btn:hover:not(.active) {
    background-color: var(--hover);
}

.drone-list-mini {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.drone-item-mini {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 6px;
    background-color: rgba(30, 41, 59, 0.9);
    cursor: pointer;
    transition: all 0.3s ease;
}

.drone-item-mini:hover {
    background-color: var(--hover);
}

.drone-item-mini.active {
    border-left: 3px solid var(--success);
}

.drone-item-mini.warning {
    border-left: 3px solid var(--warning);
}

.drone-item-mini.danger {
    border-left: 3px solid var(--danger);
}

.drone-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
}

.drone-dot.active {
    background-color: var(--success);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

.drone-dot.warning {
    background-color: var(--warning);
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
}

.drone-dot.danger {
    background-color: var(--danger);
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}

.live-threat-notification {
    position: absolute;
    top: 20px;
    right: 20px;
    background-color: rgba(239, 68, 68, 0.9);
    border-radius: 8px;
    padding: 15px;
    display: flex;
    align-items: center;
    gap: 15px;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    backdrop-filter: blur(10px);
    z-index: 10;
    max-width: 400px;
    animation: pulse-notification 2s infinite alternate;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

@keyframes pulse-notification {
    0% {
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }
    100% {
        box-shadow: 0 4px 20px rgba(239, 68, 68, 0.6);
    }
}

.threat-icon {
    font-size: 24px;
    color: #fff;
}

.threat-details {
    flex-grow: 1;
}

.threat-title {
    font-weight: 700;
    margin-bottom: 5px;
    font-size: 14px;
}

.threat-location {
    font-size: 12px;
    opacity: 0.9;
}

.threat-view-btn {
    background-color: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    padding: 8px 15px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
}

.threat-view-btn:hover {
    background-color: rgba(255, 255, 255, 0.3);
}

.map-drone-details {
    position: absolute;
    top: 20px;
    right: 20px;
    background-color: rgba(15, 23, 42, 0.9);
    border: 1px solid var(--border);
    border-radius: 8px;
    width: 300px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(10px);
    z-index: 9;
    display: none;
}

.drone-details-header {
    padding: 12px 15px;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 500;
}

.close-details-btn {
    background: none;
    border: none;
    color: var(--light);
    cursor: pointer;
    transition: all 0.3s ease;
}

.close-details-btn:hover {
    color: var(--danger);
}

.drone-details-content {
    padding: 15px;
}

.drone-detail-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 13px;
}

.detail-label {
    color: rgba(241, 245, 249, 0.7);
}

.detail-value {
    font-weight: 500;
}

.drone-details-actions {
    padding: 15px;
    display: flex;
    gap: 10px;
    border-top: 1px solid var(--border);
}

.drone-action-btn {
    flex: 1;
    padding: 8px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background-color: rgba(30, 41, 59, 0.9);
    color: var(--light);
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
}

.drone-action-btn:hover {
    background-color: var(--hover);
    border-color: var(--accent);
}

.map-grid-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: 50px 50px;
    background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
    pointer-events: none;
    z-index: 2;
    opacity: 0.5;
}

.map-coordinates {
    position: absolute;
    bottom: 20px;
    right: 20px;
    background-color: rgba(15, 23, 42, 0.8);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 15px;
    font-size: 12px;
    display: flex;
    gap: 15px;
    backdrop-filter: blur(10px);
    z-index: 10;
}

/* Fullscreen Map Styles */
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

/* Responsive Map Adjustments */
@media (max-width: 768px) {
    .map-legend, .map-coordinates {
        font-size: 10px;
    }
    
    .map-legend {
        max-width: 150px;
    }
    
    .map-overlay {
        max-width: 200px;
    }
    
    .map-toggle-btn {
        padding: 6px 8px;
        font-size: 10px;
    }
    
    .live-threat-notification {
        max-width: 280px;
        padding: 10px;
    }
    
    .threat-icon {
        font-size: 18px;
    }
    
    .threat-title {
        font-size: 12px;
    }
    
    .threat-location {
        font-size: 10px;
    }
    
    .threat-view-btn {
        padding: 6px 10px;
        font-size: 10px;
    }
    
    .map-drone-details {
        width: 250px;
    }
}

/* Cards Row */
.cards-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
}

/* Drones List */
.drones-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
    max-height: 400px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--border) var(--card-bg);
}

.drones-list::-webkit-scrollbar {
    width: 6px;
}

.drones-list::-webkit-scrollbar-track {
    background: var(--card-bg);
}

.drones-list::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 3px;
}

.drone-item {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px;
    border-radius: 8px;
    background-color: rgba(30, 41, 59, 0.5);
    transition: all 0.3s ease;
    border: 1px solid transparent;
}

.drone-item:hover {
    background-color: rgba(30, 41, 59, 0.8);
    border-color: var(--border);
}

.drone-item.warning {
    border-right: 3px solid var(--warning);
}

.drone-item.danger {
    border-right: 3px solid var(--danger);
}

.drone-item.charging {
    border-right: 3px solid var(--info);
}

.drone-item.maintenance {
    border-right: 3px solid var(--accent);
}

.drone-icon {
    width: 50px;
    height: 50px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    flex-shrink: 0;
}

.drone-info {
    flex-grow: 1;
}

.drone-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.drone-title h3 {
    font-size: 16px;
    font-weight: 700;
}

.drone-status {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
}

.drone-status.active {
    background-color: rgba(16, 185, 129, 0.1);
    color: var(--success);
}

.drone-status.warning {
    background-color: rgba(245, 158, 11, 0.1);
    color: var(--warning);
}

.drone-status.charging {
    background-color: rgba(14, 165, 233, 0.1);
    color: var(--info);
}

.drone-status.maintenance {
    background-color: rgba(59, 130, 246, 0.1);
    color: var(--accent);
}

.drone-details {
    display: flex;
    gap: 15px;
    margin-bottom: 10px;
}

.detail-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 13px;
    color: rgba(241, 245, 249, 0.7);
}

.drone-progress {
    width: 100%;
}

.progress-label {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: rgba(241, 245, 249, 0.7);
    margin-bottom: 5px;
}

.drone-actions {
    display: flex;
    gap: 5px;
}

/* Alerts List */
.alerts-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
    max-height: 400px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--border) var(--card-bg);
}

.alerts-list::-webkit-scrollbar {
    width: 6px;
}

.alerts-list::-webkit-scrollbar-track {
    background: var(--card-bg);
}

.alerts-list::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 3px;
}

.alert-item {
    display: flex;
    gap: 15px;
    padding: 15px;
    border-radius: 8px;
    background-color: rgba(30, 41, 59, 0.5);
    transition: all 0.3s ease;
    border: 1px solid transparent;
    position: relative;
}

.alert-item:hover {
    background-color: rgba(30, 41, 59, 0.8);
    border-color: var(--border);
}

.alert-priority {
    width: 4px;
    border-radius: 2px;
    margin-right: 10px;
}

.alert-priority.high {
    background-color: var(--danger);
}

.alert-priority.medium {
    background-color: var(--warning);
}

.alert-priority.low {
    background-color: var(--accent);
}

.alert-content {
    flex-grow: 1;
}

.alert-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.alert-header h3 {
    font-size: 16px;
    font-weight: 700;
}

.alert-time {
    font-size: 12px;
    color: rgba(241, 245, 249, 0.7);
}

.alert-description {
    font-size: 13px;
    margin-bottom: 10px;
    line-height: 1.4;
}

.alert-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.alert-tags {
    display: flex;
    gap: 5px;
}

.tag {
    padding: 3px 8px;
    background-color: rgba(30, 41, 59, 0.8);
    border-radius: 4px;
    font-size: 11px;
    white-space: nowrap;
}

.alert-location {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: rgba(241, 245, 249, 0.7);
}

.alert-actions {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

/* Analytics Chart */
.analytics-chart {
    width: 100%;
    height: 250px;
    margin-bottom: 20px;
}

.analytics-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 15px;
}

.stat-box {
    background-color: rgba(30, 41, 59, 0.5);
    border-radius: 8px;
    padding: 15px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.stat-title {
    font-size: 13px;
    color: rgba(241, 245, 249, 0.7);
    margin-bottom: 8px;
}

.stat-value {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 8px;
}

.stat-change {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 500;
}

.stat-change.positive {
    color: var(--success);
}

.stat-change.negative {
    color: var(--danger);
}

/* Activity Timeline */
.activity-timeline {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 20px;
}

.timeline-item {
    display: flex;
    gap: 15px;
}

.timeline-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
    margin-top: 5px;
}

.timeline-content {
    background-color: rgba(30, 41, 59, 0.5);
    border-radius: 8px;
    padding: 15px;
    flex-grow: 1;
}

.timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.timeline-header h3 {
    font-size: 15px;
    font-weight: 600;
}

.timeline-time {
    font-size: 12px;
    color: rgba(241, 245, 249, 0.7);
}

.timeline-description {
    font-size: 13px;
    margin-bottom: 10px;
    line-height: 1.4;
}

.timeline-meta {
    font-size: 12px;
    color: rgba(241, 245, 249, 0.7);
    display: flex;
    gap: 10px;
}

.timeline-user, .timeline-system {
    display: flex;
    align-items: center;
    gap: 5px;
}

/* Buttons */
.btn {
    padding: 10px 15px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.btn-sm {
    padding: 6px 10px;
    font-size: 12px;
    border-radius: 6px;
}

.btn-accent {
    background-color: var(--accent);
    color: #fff;
    border: none;
}

.btn-accent:hover {
    background-color: #2563eb;
}

.btn-outline {
    background-color: transparent;
    color: var(--light);
    border: 1px solid var(--border);
}

.btn-outline:hover {
    background-color: var(--hover);
    border-color: var(--accent);
}

.btn-outline.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-outline.disabled:hover {
    background-color: transparent;
    border-color: var(--border);
}

/* Responsive */
@media (max-width: 1200px) {
    .stats-row {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .analytics-stats {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 992px) {
    .cards-row {
        grid-template-columns: 1fr;
    }
    
    .search-bar {
        width: 200px;
    }
}

@media (max-width: 768px) {
    .sidebar {
        transform: translateX(100%);
        width: 100%;
    }
    
    .sidebar.active {
        transform: translateX(0);
    }
    
    .main-content {
        margin-right: 0;
    }
    
    .mobile-toggle {
        display: block;
    }
    
    .stats-row {
        grid-template-columns: 1fr;
    }
    
    .header-actions {
        gap: 10px;
    }
    
    .search-bar {
        display: none;
    }
    
    .status-pills-container {
        display: none;
    }
    
    .analytics-stats {
        grid-template-columns: 1fr;
    }
    
    .system-status-bar {
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;
    }
}

/* Dark Scrollbar */
::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-track {
    background: var(--secondary);
}

::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: var(--hover);
}