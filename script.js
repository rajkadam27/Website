// --- Config ---
const CONFIG = {
    typingSpeed: 30,
    transitionSpeed: 1000,
    // Local File Path (Relative to index.html)
    audioUrl: 'Photos/Dooron Dooron Unplugged Paresh Pahuja 128 Kbps.mp3',
    startTime: 67, // 1 min 07 sec
    loopDuration: 30, // 30 seconds
};

// Calculated End Time
const endTime = CONFIG.startTime + CONFIG.loopDuration;

// --- State ---
let currentIdx = 0;
let isAnimating = false;
let typeInterval;
let audio = new Audio(CONFIG.audioUrl);
let isAudioReady = false;
const todayStr = new Date().toISOString().split('T')[0];

// --- Elements ---
const introContainer = document.getElementById('cinematic-intro');
const clickHint = document.querySelector('.click-hint');
const appStage = document.getElementById('app-stage');
const cubeContainer = document.getElementById('cube-container');
const progressLine = document.getElementById('progress-line');
const musicBtn = document.getElementById('music-btn');

// --- Audio Logic (HTML5) ---
// Preload
audio.preload = 'auto';
audio.loop = false; // We handle looping manually for the specific segment

audio.addEventListener('canplaythrough', () => {
    console.log("Audio Loaded");
    isAudioReady = true;
    if (clickHint) {
        clickHint.innerHTML = "Tap to Open ❤️";
        clickHint.style.opacity = 1;
        clickHint.classList.add('ready');
    }
    if (musicBtn) musicBtn.innerHTML = '🔇 Play Music';
});

audio.addEventListener('error', (e) => {
    console.error("Audio Error", e);
    if (clickHint) {
        clickHint.innerHTML = "Tap to Open (Audio Error) 💔";
        clickHint.style.opacity = 1;
        clickHint.classList.add('ready');
    }
    if (musicBtn) musicBtn.innerHTML = '❌ Audio Missing';
});

// Loop Logic
audio.addEventListener('timeupdate', () => {
    if (audio.currentTime >= endTime) {
        audio.currentTime = CONFIG.startTime;
    }
});

function toggleAudio() {
    if (!isAudioReady) return;
    if (!audio.paused) {
        audio.pause();
        musicBtn.innerHTML = '⏸ Paused';
    } else {
        audio.play();
        musicBtn.innerHTML = '🎵 Playing';
    }
}

// --- Intro Sequence ---
document.addEventListener('DOMContentLoaded', () => {
    // Initial text
    if (clickHint && !isAudioReady) {
        clickHint.innerHTML = "Loading Music... ⏳";
    }

    introContainer.addEventListener('click', handleInteraction);
    introContainer.addEventListener('touchstart', handleInteraction);

    if (musicBtn) {
        musicBtn.addEventListener('click', toggleAudio);
        musicBtn.addEventListener('touchstart', (e) => { e.stopPropagation(); toggleAudio(); });
    }
});

let sequenceStarted = false;
function handleInteraction(e) {
    if (sequenceStarted) return;
    sequenceStarted = true;

    // 1. Play Audio Immediately
    if (isAudioReady) {
        try {
            audio.currentTime = CONFIG.startTime;
            audio.volume = 1.0;
            audio.play().then(() => {
                if (musicBtn) musicBtn.innerHTML = '🎵 Playing';
            }).catch(err => console.error("Play prevented", err));
        } catch (err) { console.error(err); }
    }

    // 2. Start Visuals
    startVisualSequence();
}

async function startVisualSequence() {
    document.querySelector('.click-hint').style.opacity = 0;
    const texts = ["A Story...", "Of a Love...", "Written in the Stars...", "For Vaibhavi ❤️"];
    const layer = document.querySelector('.intro-text-layer');
    for (const text of texts) {
        layer.innerText = text;
        layer.classList.remove('hidden');
        layer.classList.add('visible');
        await wait(1500);
        layer.classList.remove('visible');
        layer.classList.add('hidden');
        await wait(500);
    }
    introContainer.style.opacity = 0;
    setTimeout(() => {
        introContainer.style.display = 'none';
        appStage.style.display = 'block';
        void appStage.offsetWidth;
        appStage.style.opacity = 1;
        initApp();
    }, 1000);
}

// --- App Logic & Locking ---
function isLocked(dateStr) {
    return dateStr > todayStr;
}

function initApp() {
    renderSlides();
    updateView(0);
}

function renderSlides() {
    cubeContainer.innerHTML = '';

    data.days.forEach((day, i) => {
        const slide = document.createElement('div');
        slide.className = 'slide';

        if (isLocked(day.date)) {
            // RENDER LOCKED SLIDE
            slide.innerHTML = `
                <div class="bg-layer-blur" style="background:#000; filter:blur(0);"></div>
                <div class="locked-content">
                    <div class="lock-icon">🔒</div>
                    <div class="lock-text">Locked</div>
                    <div class="lock-date">Opens on ${day.title}</div>
                    <div class="lock-date" style="font-size:0.8rem; opacity:0.5">${day.date}</div>
                </div>
            `;
        } else {
            // RENDER NORMAL SLIDE
            slide.innerHTML = `
                <img src="${day.image}" class="bg-layer-blur">
                <img src="${day.image}" class="fg-layer-contain">
                <div class="content-wrapper">
                    <h1 class="super-title">${day.title}</h1>
                    <div class="emotional-text" id="text-${i}"></div>
                    <div class="question-text" id="q-${i}"></div>
                    <div class="btn-container" id="btn-c-${i}">
                        <button class="action-btn" onclick="sendAnswer('${day.title}', '${day.date}')">Yes, Forever!</button>
                    </div>
                </div>
            `;
        }
        cubeContainer.appendChild(slide);
    });

    const gallerySlide = document.createElement('div');
    gallerySlide.className = 'slide';
    gallerySlide.innerHTML = `
        <div class="bg-layer-blur" style="background:#111"></div>
        <div class="content-wrapper" style="height:100%; justify-content:center; background:radial-gradient(circle, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.95) 100%);">
            <h1 class="super-title">Our Memories</h1>
            <div class="premium-gallery">
                ${data.photos.map(src => `<img src="${src}" class="gallery-thumb" onclick="window.open('${src}')">`).join('')}
            </div>
        </div>
    `;
    cubeContainer.appendChild(gallerySlide);
}

// --- Navigation ---
function goNext() {
    if (isAnimating) return;
    if (currentIdx >= data.days.length) return;
    changeSlide(currentIdx + 1);
}

function goPrev() {
    if (isAnimating) return;
    if (currentIdx <= 0) return;
    changeSlide(currentIdx - 1);
}

function changeSlide(newIdx) {
    isAnimating = true;
    const dir = newIdx > currentIdx ? 1 : -1;
    const currentSlide = cubeContainer.children[currentIdx];
    const nextSlide = cubeContainer.children[newIdx];

    Array.from(cubeContainer.children).forEach(s => {
        s.style.transition = 'none';
        s.style.transform = 'translateZ(-1000px) rotateY(180deg)';
        s.style.opacity = 0;
        s.classList.remove('active');
    });

    // Hide previous question
    const q = nextSlide.querySelector('.question-text');
    if (q) q.classList.remove('visible');

    currentSlide.style.opacity = 1;
    currentSlide.style.transform = 'translateZ(0) rotateY(0deg)';

    const startNextDeg = dir === 1 ? 90 : -90;
    nextSlide.style.opacity = 1;
    nextSlide.style.transform = `translateZ(50vw) rotateY(${startNextDeg}deg)`;

    void cubeContainer.offsetWidth; // Reflow

    currentSlide.style.transition = `all ${CONFIG.transitionSpeed}ms cubic-bezier(0.645, 0.045, 0.355, 1)`;
    nextSlide.style.transition = `all ${CONFIG.transitionSpeed}ms cubic-bezier(0.645, 0.045, 0.355, 1)`;

    const endCurrentDeg = dir === 1 ? -90 : 90;
    currentSlide.style.transform = `translateZ(50vw) rotateY(${endCurrentDeg}deg) opacity(0)`;
    nextSlide.style.transform = 'translateZ(0) rotateY(0deg)';

    currentIdx = newIdx;
    updateProgress();

    setTimeout(() => {
        nextSlide.classList.add('active');
        isAnimating = false;

        // Only run typing if NOT locked
        if (currentIdx < data.days.length && !isLocked(data.days[currentIdx].date)) {
            runSlideSequence(currentIdx);
        }
    }, CONFIG.transitionSpeed);
}

function runSlideSequence(idx) {
    const lang = getLang();
    const dayData = data.days[idx];
    typeText(idx, dayData.messages[lang], () => {
        setTimeout(() => {
            const qEl = document.getElementById(`q-${idx}`);
            if (qEl) {
                qEl.innerText = dayData.question[lang];
                qEl.classList.add('visible');
            }
        }, 300);
    });
}

function typeText(idx, text, callback) {
    const el = document.getElementById(`text-${idx}`);
    if (!el) return;
    clearInterval(typeInterval);
    el.innerHTML = '';
    let i = 0;
    el.innerHTML = '<span class="cursor-blink"></span>';
    typeInterval = setInterval(() => {
        if (i < text.length) {
            el.innerHTML = text.substring(0, i + 1) + '<span class="cursor-blink"></span>';
            i++;
        } else {
            clearInterval(typeInterval);
            if (callback) callback();
        }
    }, CONFIG.typingSpeed);
}

const wait = ms => new Promise(r => setTimeout(r, ms));
const getLang = () => document.getElementById('lang-select')?.value || 'en';
function updateProgress() { progressLine.style.width = `${((currentIdx) / data.days.length) * 100}%`; }
function genericEffect(emoji) {
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.innerText = emoji;
        p.style.cssText = `position:fixed; left:50%; top:50%; z-index:9999;font-size:2rem;transition:1s;`;
        document.body.appendChild(p);
        setTimeout(() => {
            p.style.transform = `translate(${(Math.random() - 0.5) * window.innerWidth}px,${(Math.random() - 0.5) * window.innerHeight}px) rotate(${Math.random() * 360}deg)`;
            p.style.opacity = 0;
        }, 10);
        setTimeout(() => p.remove(), 1000);
    }
}
window.changeLang = (lang) => {
    if (currentIdx < data.days.length && !isLocked(data.days[currentIdx].date)) {
        document.getElementById(`q-${currentIdx}`).classList.remove('visible');
        runSlideSequence(currentIdx);
    }
};

function sendAnswer(day, date) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://formsubmit.co/rajkadam7077@gmail.com';
    form.innerHTML = `
        <input type="hidden" name="_captcha" value="false">
        <input type="hidden" name="_subject" value="Answer: ${day}">
        <input type="hidden" name="Day" value="${day}">
        <input type="hidden" name="Date" value="${date}">
        <input type="hidden" name="Answer" value="Yes, Forever! ❤️">
    `;
    document.body.appendChild(form);
    form.submit();
}
