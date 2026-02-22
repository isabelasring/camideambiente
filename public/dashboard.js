// Configuración de gráficas con Chart.js

// Colores personalizados - Blanco y grises
const chartColors = {
    primary: 'rgba(255, 255, 255, 0.8)',
    secondary: 'rgba(255, 255, 255, 0.6)',
    success: 'rgba(255, 255, 255, 0.7)',
    warning: 'rgba(255, 255, 255, 0.5)',
    danger: 'rgba(255, 255, 255, 0.4)',
    purple: 'rgba(255, 255, 255, 0.55)',
    teal: 'rgba(255, 255, 255, 0.65)',
    orange: 'rgba(255, 255, 255, 0.45)',
    pink: 'rgba(255, 255, 255, 0.5)',
    blue: 'rgba(255, 255, 255, 0.6)'
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
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    borderWidth: 1,
                    cornerRadius: 8
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: {
                            size: 11
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
}

// Gráfica de Dona - Distribución de Seguidores
const followersCtx = document.getElementById('followersChart');
if (followersCtx) {
    new Chart(followersCtx, {
        type: 'doughnut',
        data: {
            labels: ['18-24 años', '25-34 años', '35-44 años', '45-54 años', '55+ años'],
            datasets: [{
                data: [35.2, 28.5, 18.3, 12.1, 5.9],
                backgroundColor: [
                    'rgba(255, 255, 255, 0.9)',
                    'rgba(255, 255, 255, 0.7)',
                    'rgba(255, 255, 255, 0.5)',
                    'rgba(255, 255, 255, 0.4)',
                    'rgba(255, 255, 255, 0.3)'
                ],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        padding: 15,
                        font: {
                            size: 12
                        },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: chartColors.primary,
                    borderWidth: 1,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed + '%';
                        }
                    }
                }
            }
        }
    });
}

// Gráfica de Top Reels
const reelsCtx = document.getElementById('reelsChart');
if (reelsCtx) {
    new Chart(reelsCtx, {
        type: 'bar',
        data: {
            labels: ['Reel 1', 'Reel 2', 'Reel 3', 'Reel 4', 'Reel 5', 'Reel 6', 'Reel 7', 'Reel 8', 'Reel 9', 'Reel 10'],
            datasets: [{
                label: 'Visualizaciones (K)',
                data: [450, 380, 320, 290, 265, 240, 220, 200, 185, 170],
                backgroundColor: function(context) {
                    const index = context.dataIndex;
                    return index === 0 ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.2)';
                },
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: chartColors.primary,
                    borderWidth: 1,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            return context.parsed.x + 'K visualizaciones';
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
}

// Datos de ejemplo para posts
const postsData = [
    { title: 'Post sobre política ambiental', comments: '2.5K', change: '+15.2%' },
    { title: 'Anuncio importante', comments: '1.8K', change: '+8.5%' },
    { title: 'Evento comunitario', comments: '1.5K', change: '+12.1%' },
    { title: 'Mensaje a seguidores', comments: '1.2K', change: '+5.3%' },
    { title: 'Actualización de proyecto', comments: '980', change: '+9.8%' },
    { title: 'Agradecimiento', comments: '850', change: '+7.2%' }
];

// Renderizar lista de posts
const postsList = document.getElementById('postsList');
if (postsList) {
    postsData.forEach((post, index) => {
        const postItem = document.createElement('div');
        postItem.className = 'post-item';
        postItem.innerHTML = `
            <div class="post-info">
                <span class="post-title">${post.title}</span>
                <span class="post-meta">Post #${index + 1}</span>
            </div>
            <div class="post-stats">
                <div class="post-value">${post.comments}</div>
                <div class="post-change">${post.change}</div>
            </div>
        `;
        postsList.appendChild(postItem);
    });
}

// Datos de ejemplo para seguidores
const followersData = [
    { name: 'María González', location: 'Bogotá, Colombia', joined: 'Hace 2 días' },
    { name: 'Carlos Rodríguez', location: 'Medellín, Colombia', joined: 'Hace 3 días' },
    { name: 'Ana Martínez', location: 'Cali, Colombia', joined: 'Hace 4 días' },
    { name: 'Luis Fernández', location: 'Barranquilla, Colombia', joined: 'Hace 5 días' },
    { name: 'Sofia López', location: 'Bucaramanga, Colombia', joined: 'Hace 6 días' },
    { name: 'Diego Ramírez', location: 'Pereira, Colombia', joined: 'Hace 1 semana' }
];

// Renderizar lista de seguidores
const followersList = document.getElementById('followersList');
if (followersList) {
    followersData.forEach((follower) => {
        const followerItem = document.createElement('div');
        followerItem.className = 'follower-item';
        followerItem.innerHTML = `
            <div class="follower-info">
                <span class="follower-name">${follower.name}</span>
                <span class="follower-meta">${follower.location} • ${follower.joined}</span>
            </div>
            <div class="follower-stats">
                <div class="follower-value">Nuevo</div>
            </div>
        `;
        followersList.appendChild(followerItem);
    });
}

// Efectos interactivos
document.addEventListener('DOMContentLoaded', () => {
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
