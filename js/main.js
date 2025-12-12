// Main JavaScript File

// Update current time and date
function updateTime() {
    const now = new Date();
    const options = { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    };
    
    document.querySelector('.user-role').textContent = new Intl.DateTimeFormat('ar-SA', options).format(now);
}

// Update time every minute
updateTime();
setInterval(updateTime, 60000);

// Handle notifications and alerts
document.querySelector('.header-icon .fa-bell').parentElement.addEventListener('click', function() {
    alert('سيتم عرض التنبيهات الأخيرة هنا');
});

// Handle settings
document.querySelector('.header-icon .fa-cog').parentElement.addEventListener('click', function() {
    alert('سيتم فتح إعدادات النظام هنا');
});

// Handle search
document.querySelector('.search-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        alert(`سيتم البحث عن: ${this.value}`);
        this.value = '';
    }
});

// Handle card refresh buttons
document.querySelectorAll('.card-action-btn[title="تحديث"]').forEach(button => {
    button.addEventListener('click', function() {
        const card = this.closest('.card');
        
        // Add refresh animation
        this.querySelector('i').classList.add('fa-spin');
        
        // Simulate refresh after 1 second
        setTimeout(() => {
            this.querySelector('i').classList.remove('fa-spin');
            
            // Handle specific card refreshes
            if (card.querySelector('.radar-container')) {
                createRadarPoints(); // Refresh radar
            }
            
            if (card.querySelector('.drone-list')) {
                // Update random battery levels
                card.querySelectorAll('.battery-fill').forEach(batteryFill => {
                    const currentWidth = parseInt(batteryFill.style.width);
                    const newWidth = Math.max(0, Math.min(100, currentWidth + (Math.random() > 0.5 ? -5 : 5)));
                    batteryFill.style.width = `${newWidth}%`;
                    
                    // Update battery class based on level
                    batteryFill.classList.remove('battery-high', 'battery-medium', 'battery-low');
                    if (newWidth > 70) {
                        batteryFill.classList.add('battery-high');
                    } else if (newWidth > 30) {
                        batteryFill.classList.add('battery-medium');
                    } else {
                        batteryFill.classList.add('battery-low');
                    }
                    
                    // Update battery text
                    const batteryText = batteryFill.parentElement.nextElementSibling;
                    if (batteryText) {
                        const minutes = Math.floor(newWidth / 100 * 60);
                        batteryText.textContent = `${newWidth}% - ${minutes} دقيقة متبقية`;
                    }
                });
            }
        }, 1000);
    });
});