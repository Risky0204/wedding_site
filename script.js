// TIMEZONE SULTENG - WITA (GMT+8)
const INDONESIA_TIMEZONE = 'Asia/Makassar'; // Untuk Sulawesi Tengah
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyzuOI2ST4dkBkf2V4G8kss-kbNk0Xc7eyQMbJPB427UTUeFSDN-dBql4jkDPawwYcssQ/exec';

// Loading Screen
window.addEventListener('load', function() {
    setTimeout(() => {
        document.getElementById('loading').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loading').style.display = 'none';
        }, 500);
    }, 2000);
    
    loadWishesFromGoogleSheets();
});

// Countdown Timer dengan WITA
function updateCountdown() {
    // Set tanggal pernikahan dalam timezone WITA (GMT+8)
    const weddingDate = new Date('2025-06-22T10:00:00+08:00'); // +08:00 untuk WITA
    const now = new Date();
    const witaNow = new Date(now.toLocaleString("en-US", {timeZone: INDONESIA_TIMEZONE}));
    
    const distance = weddingDate.getTime() - witaNow.getTime();

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById('days').textContent = days.toString().padStart(2, '0');
    document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
    document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');

    if (distance < 0) {
        document.querySelector('.countdown-timer').innerHTML = '<h3>Hari Bahagia Telah Tiba!</h3>';
    }
}

setInterval(updateCountdown, 1000);
updateCountdown();

// Submit wish dengan timezone WITA
async function submitWish(event) {
    event.preventDefault();
    
    const name = document.getElementById('wishName').value.trim();
    const message = document.getElementById('wishMessage').value.trim();
    
    if (!name || !message) {
        alert('Mohon isi nama dan ucapan Anda');
        return;
    }
    
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
    submitBtn.disabled = true;

    try {
        // Gunakan waktu WITA Sulteng
        const now = new Date();
        const witaTime = new Date(now.toLocaleString("en-US", {timeZone: INDONESIA_TIMEZONE}));
        
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'addWish',
                name: name,
                message: message,
                timestamp: witaTime.toISOString()
            })
        });

        const data = await response.json();
        
        if (data.success) {
            alert(`Terima kasih ${name}! Ucapan Anda telah tersimpan.`);
            document.querySelector('.wishes-form').reset();
            await loadWishesFromGoogleSheets();
            
            document.querySelector('.wishes-display').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        } else {
            throw new Error(data.error || 'Gagal menyimpan ucapan');
        }
    } catch (error) {
        console.error('Error submitting wish:', error);
        alert('Maaf, terjadi kesalahan. Silakan coba lagi.');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Format time ago dengan WITA
function formatTimeAgo(dateString) {
    const now = new Date();
    const witaNow = new Date(now.toLocaleString("en-US", {timeZone: INDONESIA_TIMEZONE}));
    
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((witaNow - date) / 1000);
    
    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;
    return `${Math.floor(diffInSeconds / 2592000)} bulan yang lalu`;
}

// Load wishes from Google Sheets
async function loadWishesFromGoogleSheets() {
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getWishes`);
        const data = await response.json();
        
        if (data.success) {
            displayWishes(data.wishes);
            updateWishesCounter(data.wishes.length);
        } else {
            showError('Gagal memuat ucapan');
        }
    } catch (error) {
        console.error('Error loading wishes:', error);
        showError('Gagal memuat ucapan');
    }
}

// Display wishes
function displayWishes(wishes) {
    const wishesList = document.getElementById('wishesList');
    
    if (!wishes || wishes.length === 0) {
        wishesList.innerHTML = '<p class="no-wishes">Belum ada ucapan. Jadilah yang pertama!</p>';
        return;
    }
    
    const sortedWishes = wishes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    wishesList.innerHTML = '';
    
    sortedWishes.forEach((wish, index) => {
        const wishItem = document.createElement('div');
        wishItem.className = 'wish-item';
        wishItem.style.opacity = '0';
        wishItem.style.transform = 'translateY(20px)';
        
        const timeAgo = formatTimeAgo(wish.timestamp);
        
        wishItem.innerHTML = `
            <div class="wish-header">
                <strong>${escapeHtml(wish.name)}</strong>
                <span class="wish-date">${timeAgo}</span>
            </div>
            <p class="wish-text">${escapeHtml(wish.message)}</p>
        `;
        
        wishesList.appendChild(wishItem);
        
        setTimeout(() => {
            wishItem.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            wishItem.style.opacity = '1';
            wishItem.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function updateWishesCounter(count) {
    const counter = document.getElementById('wishesCounter');
    if (counter) {
        counter.textContent = `(${count})`;
    }
}

function showError(message) {
    const wishesList = document.getElementById('wishesList');
    wishesList.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
            <button onclick="loadWishesFromGoogleSheets()" class="retry-btn">Coba Lagi</button>
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Smooth Scrolling dan animasi lainnya
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

document.querySelector('.scroll-indicator').addEventListener('click', () => {
    document.querySelector('#countdown').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
});

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.slide-up, .event-card, .gallery-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(50px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const invitationCard = document.querySelector('.invitation-card');
    
    if (invitationCard && scrolled < window.innerHeight) {
        const moveAmount = scrolled * 0.1;
        invitationCard.style.transform = `translateY(${moveAmount}px)`;
        
        const opacity = Math.max(0, 1 - (scrolled / window.innerHeight) * 0.5);
        invitationCard.style.opacity = opacity;
    }
});

// Leaflet Map
let map;
const L = window.L;

function initMap() {
    const lat = -0.7253021121879414;
    const lng = 119.86676823379804;
    
    map = L.map('map').setView([lat, lng], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    const customIcon = L.divIcon({
        html: '<i class="fas fa-map-marker-alt" style="color: #d4af37; font-size: 2rem;"></i>',
        iconSize: [30, 30],
        className: 'custom-div-icon'
    });
    
    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
    
    marker.bindPopup(`
        <div style="text-align: center; padding: 10px;">
            <h3 style="margin: 0 0 10px 0; color: #d4af37;">Rumah Mempelai Wanita</h3>
            <p style="margin: 0; color: #666;">Jl. Andudana Kel. Baiya <br>Kec. Tawaeli</p>
        </div>
    `);
    
    marker.openPopup();
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initMap, 1000);
});

function openDirections() {
    const address = "Jl. Andudana, Baiya, Kec. Tawaeli, Kota Palu, Sulawesi Tengah 94352";
    const encodedAddress = encodeURIComponent(address);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(googleMapsUrl, '_blank');
}

// Music Player dan animasi lainnya tetap sama...
const musicToggle = document.getElementById('musicToggle');
const backgroundMusic = document.getElementById('backgroundMusic');
let isPlaying = false;

musicToggle.addEventListener('click', () => {
    if (isPlaying) {
        backgroundMusic.pause();
        musicToggle.innerHTML = '<i class="fas fa-music"></i>';
        musicToggle.classList.remove('playing');
    } else {
        backgroundMusic.play().catch(e => {
            console.log('Audio play failed:', e);
        });
        musicToggle.innerHTML = '<i class="fas fa-pause"></i>';
        musicToggle.classList.add('playing');
    }
    isPlaying = !isPlaying;
});

// Gallery, floating hearts, sparkles - kode sama seperti sebelumnya...