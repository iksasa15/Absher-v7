// Charts & Analytics Visualizations

// Analytics Chart
const ctx = document.getElementById('threatAnalyticsChart').getContext('2d');
const threatAnalyticsChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['6:00', '8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '24:00'],
        datasets: [
            {
                label: 'تهديدات عالية الخطورة',
                data: [1, 2, 0, 1, 3, 2, 1, 4, 2, 1],
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            },
            {
                label: 'تهديدات متوسطة الخطورة',
                data: [3, 2, 4, 5, 2, 3, 4, 6, 3, 2],
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            },
            {
                label: 'تهديدات منخفضة الخطورة',
                data: [5, 7, 6, 4, 8, 9, 7, 5, 4, 6],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false
        },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#f1f5f9',
                    font: {
                        family: 'Tajawal'
                    }
                }
            },
            tooltip: {
                rtl: true,
                bodyFont: {
                    family: 'Tajawal'
                },
                titleFont: {
                    family: 'Tajawal'
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: '#f1f5f9'
                }
            },
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: '#f1f5f9'
                }
            }
        }
    }
});

// Create radar points
function createRadarPoints() {
    const radar = document.querySelector('.radar-container');
    const pointCount = 20;
    
    // Clear existing points
    const existingPoints = radar.querySelectorAll('.radar-point');
    existingPoints.forEach(point => point.remove());
    
    for (let i = 0; i < pointCount; i++) {
        const point = document.createElement('div');
        point.classList.add('radar-point');
        
        const size = Math.random() * 3 + 2;
        const distance = Math.random() * 40 + 10;
        const angle = Math.random() * Math.PI * 2;
        const x = 50 + distance * Math.cos(angle);
        const y = 50 + distance * Math.sin(angle);
        
        point.style.position = 'absolute';
        point.style.width = `${size}px`;
        point.style.height = `${size}px`;
        point.style.backgroundColor = i % 5 === 0 ? '#ef4444' : '#3b82f6';
        point.style.borderRadius = '50%';
        point.style.left = `${x}%`;
        point.style.top = `${y}%`;
        point.style.opacity = Math.random() * 0.5 + 0.3;
        
        radar.appendChild(point);
        
        // Animate points
        setInterval(() => {
            const newDistance = distance + (Math.random() - 0.5) * 2;
            const newAngle = angle + (Math.random() - 0.5) * 0.1;
            const newX = 50 + newDistance * Math.cos(newAngle);
            const newY = 50 + newDistance * Math.sin(newAngle);
            
            point.style.left = `${newX}%`;
            point.style.top = `${newY}%`;
            point.style.opacity = Math.random() * 0.5 + 0.3;
        }, 2000 + Math.random() * 2000);
    }
}

// Initialize radar
createRadarPoints();