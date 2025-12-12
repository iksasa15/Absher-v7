// Video Feed Functionality

// Simulate bounding boxes movement in video feeds
function animateBoundingBoxes() {
    const boxes = document.querySelectorAll('.bounding-box');
    
    boxes.forEach(box => {
        const currentLeft = parseFloat(box.style.left);
        const currentTop = parseFloat(box.style.top);
        
        // Add small random movement
        const newLeft = Math.max(5, Math.min(75, currentLeft + (Math.random() - 0.5) * 5));
        const newTop = Math.max(30, Math.min(60, currentTop + (Math.random() - 0.5) * 3));
        
        box.style.left = `${newLeft}%`;
        box.style.top = `${newTop}%`;
    });
    
    setTimeout(animateBoundingBoxes, 2000);
}

// Start bounding box animation
animateBoundingBoxes();

// Toggle video feed fullscreen
document.querySelector('.card-action-btn[title="تبديل العرض"]').addEventListener('click', function() {
    const videoContainer = document.querySelector('.video-feeds-container');
    
    if (videoContainer.style.gridTemplateColumns === '1fr') {
        // Switch back to grid view
        videoContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
    } else {
        // Switch to single column view
        videoContainer.style.gridTemplateColumns = '1fr';
    }
});