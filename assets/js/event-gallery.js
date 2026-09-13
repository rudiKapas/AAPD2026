(() => {
  'use strict';

  const CONFIG_URL = 'assets/data/event-gallery.json';
  const PAGE_SIZE = 24;
  const state = {
    config: null,
    activeDay: null,
    activeMedia: 'photos',
    photosByDay: new Map(),
    videosByDay: new Map(),
    visiblePhotos: [],
    renderedCount: 0,
    lightboxIndex: 0,
    feedAvailable: false
  };

  const elements = {};

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    cacheElements();
    bindStaticControls();
    try {
      const response = await fetch(CONFIG_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Configuration request failed (${response.status})`);
      state.config = await response.json();
      validateConfig(state.config);
      state.activeDay = getInitialDay();
      renderDayTabs();
      await loadGalleryFeed();
      updateSelectedDay();
      showActiveMedia();
    } catch (error) {
      console.error('AAPD gallery initialization failed:', error);
      elements.galleryStatus.textContent = 'Gallery temporarily unavailable';
      elements.photoEmpty.hidden = false;
      elements.photoEmpty.querySelector('h3').textContent = 'The gallery could not be loaded';
      elements.photoEmpty.querySelector('p').textContent = 'Please refresh the page or return later.';
      elements.driveFolderLink.hidden = true;
    }
  }

  function cacheElements() {
    ['dayTabs','galleryStatus','photosPanel','videosPanel','photoGrid','photoEmpty','driveFolderLink','driveFallback','driveFrame','driveFallbackLink','loadMore','videoGrid','videoEmpty','videoFolderLink','videoFallback','videoDriveFrame','videoFallbackLink','videoLightbox','videoLightboxClose','driveVideoPlayer','videoLightboxTitle','driveVideoLink','lightbox','lightboxClose','lightboxPrevious','lightboxNext','lightboxImage','lightboxCaption'].forEach(id => {
      elements[id] = document.getElementById(id);
    });
  }

  function bindStaticControls() {
    const navToggle = document.getElementById('navToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    navToggle?.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    document.addEventListener('pointerdown', event => {
      if (mobileMenu?.classList.contains('open') && !mobileMenu.contains(event.target) && !navToggle?.contains(event.target)) {
        mobileMenu.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });

    document.querySelectorAll('[data-media]').forEach(button => {
      button.addEventListener('click', () => {
        state.activeMedia = button.dataset.media;
        showActiveMedia();
      });
    });
    elements.loadMore.addEventListener('click', renderNextPhotoPage);
    elements.lightboxClose.addEventListener('click', closeLightbox);
    elements.lightboxPrevious.addEventListener('click', () => stepLightbox(-1));
    elements.lightboxNext.addEventListener('click', () => stepLightbox(1));
    elements.lightbox.addEventListener('click', event => { if (event.target === elements.lightbox) closeLightbox(); });
    elements.videoLightboxClose.addEventListener('click', closeVideoPlayer);
    elements.videoLightbox.addEventListener('click', event => { if (event.target === elements.videoLightbox) closeVideoPlayer(); });
    document.addEventListener('keydown', event => {
      if (!elements.videoLightbox.hidden && event.key === 'Escape') closeVideoPlayer();
      if (!elements.lightbox.hidden) {
        if (event.key === 'Escape') closeLightbox();
        if (event.key === 'ArrowLeft') stepLightbox(-1);
        if (event.key === 'ArrowRight') stepLightbox(1);
      }
    });
  }

  function validateConfig(config) {
    if (!config || !Array.isArray(config.days) || config.days.length === 0) throw new Error('No gallery days configured');
    config.days.forEach(day => {
      ['id','label','title','photoFolderId','photoFolderUrl','videoFolderId','videoFolderUrl'].forEach(key => {
        if (!day[key]) throw new Error(`Missing ${key} for gallery day`);
      });
    });
  }

  function getInitialDay() {
    const requested = new URLSearchParams(location.search).get('day');
    return state.config.days.find(day => day.id === requested) || state.config.days[0];
  }

  function renderDayTabs() {
    elements.dayTabs.replaceChildren(...state.config.days.map(day => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'day-tab';
      button.dataset.day = day.id;
      button.setAttribute('role', 'tab');
      button.innerHTML = `${escapeHtml(day.label)}<small>${escapeHtml(day.title)}</small>`;
      button.addEventListener('click', () => {
        state.activeDay = day;
        history.replaceState(null, '', `${location.pathname}?day=${encodeURIComponent(day.id)}`);
        updateSelectedDay();
      });
      return button;
    }));
  }

  function updateSelectedDay() {
    document.querySelectorAll('.day-tab').forEach(button => {
      const active = button.dataset.day === state.activeDay.id;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    elements.driveFolderLink.href = state.activeDay.photoFolderUrl;
    elements.driveFallbackLink.href = state.activeDay.photoFolderUrl;
    elements.videoFolderLink.href = state.activeDay.videoFolderUrl;
    elements.videoFallbackLink.href = state.activeDay.videoFolderUrl;
    renderPhotosForDay();
    renderVideosForDay();
    updateGalleryStatus();
  }

  async function loadGalleryFeed() {
    const endpoint = String(state.config.photoFeedUrl || '').trim();
    if (!endpoint) {
      elements.galleryStatus.textContent = 'Google Drive media view';
      return;
    }
    elements.galleryStatus.textContent = 'Updating event media…';
    try {
      const payload = await loadJsonp(endpoint);
      if (!payload || !payload.ok || !Array.isArray(payload.days)) throw new Error('Invalid gallery feed');
      payload.days.forEach(day => {
        state.photosByDay.set(day.id, Array.isArray(day.photos) ? day.photos : []);
        state.videosByDay.set(day.id, Array.isArray(day.videos) ? day.videos : []);
      });
      state.feedAvailable = true;
    } catch (error) {
      console.warn('Native gallery feed unavailable; using Drive folder views.', error);
      elements.galleryStatus.textContent = 'Google Drive media view';
    }
  }

  function updateGalleryStatus() {
    if (!state.feedAvailable || !state.activeDay) return;
    const items = state.activeMedia === 'photos'
      ? state.photosByDay.get(state.activeDay.id) || []
      : state.videosByDay.get(state.activeDay.id) || [];
    const noun = state.activeMedia === 'photos' ? 'photograph' : 'video';
    elements.galleryStatus.textContent = items.length
      ? `${items.length.toLocaleString()} official ${noun}${items.length === 1 ? '' : 's'}`
      : `${noun[0].toUpperCase()}${noun.slice(1)}s will appear automatically`;
  }

  function loadJsonp(endpoint) {
    return new Promise((resolve, reject) => {
      const callbackName = `aapdGalleryCallback_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const script = document.createElement('script');
      const separator = endpoint.includes('?') ? '&' : '?';
      const timeout = setTimeout(() => cleanup(new Error('Photo feed timed out')), 15000);
      function cleanup(error, value) {
        clearTimeout(timeout);
        delete window[callbackName];
        script.remove();
        error ? reject(error) : resolve(value);
      }
      window[callbackName] = value => cleanup(null, value);
      script.onerror = () => cleanup(new Error('Photo feed failed to load'));
      script.src = `${endpoint}${separator}callback=${encodeURIComponent(callbackName)}`;
      document.head.appendChild(script);
    });
  }

  function renderPhotosForDay() {
    if (!state.activeDay || !elements.photoGrid) return;
    const hasNativeFeed = state.photosByDay.has(state.activeDay.id);
    state.visiblePhotos = state.photosByDay.get(state.activeDay.id) || [];
    state.renderedCount = 0;
    elements.photoGrid.replaceChildren();
    elements.photoGrid.classList.toggle('featured-layout', state.visiblePhotos.length >= 6);
    elements.loadMore.hidden = true;
    elements.photoEmpty.hidden = true;
    elements.driveFallback.hidden = true;

    if (!hasNativeFeed) {
      const frameUrl = `https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(state.activeDay.photoFolderId)}#grid`;
      if (elements.driveFrame.src !== frameUrl) elements.driveFrame.src = frameUrl;
      elements.driveFallback.hidden = false;
      return;
    }
    if (state.visiblePhotos.length === 0) {
      elements.photoEmpty.hidden = false;
      return;
    }
    renderNextPhotoPage();
  }

  function renderNextPhotoPage() {
    const next = state.visiblePhotos.slice(state.renderedCount, state.renderedCount + PAGE_SIZE);
    const fragment = document.createDocumentFragment();
    next.forEach((photo, offset) => {
      const index = state.renderedCount + offset;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'photo-card loading';
      button.setAttribute('aria-label', `Open ${photo.name || `photo ${index + 1}`}`);
      const image = document.createElement('img');
      image.src = photo.thumbnailUrl;
      image.alt = photo.alt || cleanFileName(photo.name) || `AAPD event photograph ${index + 1}`;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.addEventListener('load', () => button.classList.remove('loading'));
      image.addEventListener('error', () => button.remove());
      button.appendChild(image);
      button.addEventListener('click', () => openLightbox(index));
      fragment.appendChild(button);
    });
    elements.photoGrid.appendChild(fragment);
    state.renderedCount += next.length;
    elements.loadMore.hidden = state.renderedCount >= state.visiblePhotos.length;
  }

  function renderVideosForDay() {
    if (!state.activeDay || !elements.videoGrid) return;
    const hasNativeFeed = state.videosByDay.has(state.activeDay.id);
    const videos = state.videosByDay.get(state.activeDay.id) || [];
    elements.videoGrid.replaceChildren();
    elements.videoEmpty.hidden = true;
    elements.videoFallback.hidden = true;

    if (!hasNativeFeed) {
      const frameUrl = `https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(state.activeDay.videoFolderId)}#grid`;
      if (elements.videoDriveFrame.src !== frameUrl) elements.videoDriveFrame.src = frameUrl;
      elements.videoFallback.hidden = false;
      return;
    }
    if (videos.length === 0) {
      elements.videoEmpty.hidden = false;
      return;
    }

    const fragment = document.createDocumentFragment();
    videos.forEach((video, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'video-card';
      button.setAttribute('aria-label', `Play ${cleanFileName(video.name) || `video ${index + 1}`}`);

      const thumbnail = document.createElement('div');
      thumbnail.className = 'video-thumbnail';
      const image = document.createElement('img');
      image.src = video.thumbnailUrl;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      image.addEventListener('error', () => image.remove());
      thumbnail.append(image, createPlayIcon());

      const title = document.createElement('span');
      title.className = 'video-card-title';
      title.textContent = cleanFileName(video.name) || `Event video ${index + 1}`;
      button.append(thumbnail, title);
      button.addEventListener('click', () => openVideoPlayer(video));
      fragment.appendChild(button);
    });
    elements.videoGrid.appendChild(fragment);
  }

  function createPlayIcon() {
    const icon = document.createElement('span');
    icon.className = 'video-play-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '▶';
    return icon;
  }

  function showActiveMedia() {
    const showPhotos = state.activeMedia === 'photos';
    elements.photosPanel.hidden = !showPhotos;
    elements.videosPanel.hidden = showPhotos;
    updateGalleryStatus();
    document.querySelectorAll('[data-media]').forEach(button => {
      const active = button.dataset.media === state.activeMedia;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
  }

  function openVideoPlayer(video) {
    elements.driveVideoPlayer.src = video.previewUrl;
    elements.videoLightboxTitle.textContent = cleanFileName(video.name) || 'AAPD event video';
    elements.driveVideoLink.href = video.driveUrl;
    elements.videoLightbox.hidden = false;
    document.body.classList.add('lightbox-open');
    elements.videoLightboxClose.focus();
  }

  function closeVideoPlayer() {
    elements.videoLightbox.hidden = true;
    elements.driveVideoPlayer.src = '';
    document.body.classList.remove('lightbox-open');
  }

  function openLightbox(index) {
    state.lightboxIndex = index;
    updateLightbox();
    elements.lightbox.hidden = false;
    document.body.classList.add('lightbox-open');
    elements.lightboxClose.focus();
  }

  function updateLightbox() {
    const photo = state.visiblePhotos[state.lightboxIndex];
    if (!photo) return;
    elements.lightboxImage.src = photo.fullUrl || photo.thumbnailUrl;
    elements.lightboxImage.alt = photo.alt || cleanFileName(photo.name) || 'AAPD event photograph';
    elements.lightboxCaption.textContent = cleanFileName(photo.name);
    const moreThanOne = state.visiblePhotos.length > 1;
    elements.lightboxPrevious.hidden = !moreThanOne;
    elements.lightboxNext.hidden = !moreThanOne;
  }

  function stepLightbox(direction) {
    if (state.visiblePhotos.length < 2) return;
    state.lightboxIndex = (state.lightboxIndex + direction + state.visiblePhotos.length) % state.visiblePhotos.length;
    updateLightbox();
  }

  function closeLightbox() {
    elements.lightbox.hidden = true;
    elements.lightboxImage.src = '';
    document.body.classList.remove('lightbox-open');
  }

  function cleanFileName(name = '') {
    return name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]));
  }
})();
