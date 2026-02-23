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

// Tabs: followers / profiles / posts / images
document.addEventListener('DOMContentLoaded', () => {
    const tabBtns = document.querySelectorAll('.header-buttons .btn[data-tab]');
    const views = document.querySelectorAll('.dashboard-view[data-view]');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const viewId = btn.getAttribute('data-tab');
            tabBtns.forEach(b => b.classList.toggle('active', b === btn));
            const hasView = document.querySelector('.dashboard-view[data-view="' + viewId + '"]');
            views.forEach(v => {
                v.style.display = (v.getAttribute('data-view') === viewId || (!hasView && v.getAttribute('data-view') === 'followers')) ? '' : 'none';
            });
            if (viewId === 'profiles') {
                if (window.ChartDistribucionUsuariosComentarios && window.ChartDistribucionUsuariosComentarios.init) window.ChartDistribucionUsuariosComentarios.init();
                if (window.ChartDistribucionUsuariosComentariosFiltrado && window.ChartDistribucionUsuariosComentariosFiltrado.init) window.ChartDistribucionUsuariosComentariosFiltrado.init();
            }
        });
    });

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
});
