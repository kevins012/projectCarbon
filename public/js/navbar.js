// Navbar functionality
document.addEventListener('DOMContentLoaded', function() {
    const navbar = document.getElementById('modernNavbar');
    const navbarToggle = document.getElementById('navbarToggle');
    const layoutContainer = document.querySelector('.layout-container');
    
    // Dropdown functionality
    const profileDropdown = document.getElementById('profileDropdown');
    const settingsDropdown = document.getElementById('settingsDropdown');
    const profileMenu = document.getElementById('profileMenu');
    const settingsMenu = document.getElementById('settingsMenu');
    
    // Mobile toggle
    if (navbarToggle) {
        navbarToggle.addEventListener('click', function() {
            navbar.classList.toggle('active');
            layoutContainer.classList.toggle('nav-open');
        });
    }
    
    // Dropdown toggle
    if (profileDropdown) {
        profileDropdown.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const isActive = this.parentElement.classList.contains('active');
            
            // Close all dropdowns
            document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
                dropdown.classList.remove('active');
            });
            
            // Toggle current dropdown
            if (!isActive) {
                this.parentElement.classList.add('active');
            }
        });
    }
    
    if (settingsDropdown) {
        settingsDropdown.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const isActive = this.parentElement.classList.contains('active');
            
            // Close all dropdowns
            document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
                dropdown.classList.remove('active');
            });
            
            // Toggle current dropdown
            if (!isActive) {
                this.parentElement.classList.add('active');
            }
        });
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function() {
        document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    });
    
    // Prevent dropdown close when clicking inside dropdown
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });
    
    // Set active menu based on current URL
    function setActiveMenu() {
        const currentPath = window.location.pathname;
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            if (item.getAttribute('href') === currentPath) {
                item.classList.add('active');
            }
        });
    }
    
    // Initialize
    setActiveMenu();
    
    // Add hover effects
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(5px)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });
});