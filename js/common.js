// Function to toggle the mobile menu
function toggleMenu() {
    const menu = document.getElementById('mobile-menu');
    const overlay = document.getElementById('mobile-menu-overlay');
    const body = document.body;

    menu.classList.toggle('open');
    overlay.classList.toggle('active');
    body.classList.toggle('menu-open');
}

function initializeEventListeners() {
    const overlay = document.getElementById('mobile-menu-overlay');
    overlay.addEventListener('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        toggleMenu();
    });

    // Prevent touchstart events on the body when menu is open
    document.body.addEventListener('touchstart', function(event) {
        const menu = document.getElementById('mobile-menu');
        const menuBtn = document.querySelector('.menu-btn');
        const overlay = document.getElementById('mobile-menu-overlay');

        if (document.body.classList.contains('menu-open')) {
            if (!menu.contains(event.target) && event.target !== menuBtn && event.target === overlay) {
                event.preventDefault();
                toggleMenu();
            } else if (!menu.contains(event.target) && event.target !== menuBtn && event.target !== overlay) {
                event.preventDefault();
            }
        }
    }, { passive: false });
}

function loadAndExecuteDataPrivacyAnalyzer(){
    var script = document.createElement('script');
    script.src = '../tests/DataPrivacyAnalyzer.js';
    
    document.body.appendChild(script);

    script.onload = function() {
        const results = DataPrivacyAnalyzer.analyze();
        console.log(results.report);
    };
}

// Add error event listener for unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
});

window.addEventListener('load', () => {    
    //Check for any local cache, session, and cookies misuse, and external resources.
    //Should be checked before each release.
    //loadAndExecuteDataPrivacyAnalyzer();
});

// Wait for the DOM to be fully loaded before initializing event listeners
document.addEventListener('DOMContentLoaded', initializeEventListeners);