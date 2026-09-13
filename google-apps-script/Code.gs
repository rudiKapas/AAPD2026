/**
 * AAPD 2026 photo-feed endpoint for the static event gallery.
 *
 * Deploy this project as a Google Apps Script web app:
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * The public endpoint exposes only file metadata and image URLs from the four
 * configured public Photos folders. Video folders are not scanned.
 */
const GALLERY_CONFIG = Object.freeze({
  indexFolderId: '1c_EFuO5DGaAaozb6bMbbWZ8UZ286Jt8Y',
  indexFileName: '.gallery-index.json',
  refreshMinutes: 5,
  days: [
    { id: '2026-09-30', folderId: '1ha3AjlZwF8kLS2d9kIKTSVN_ZvJWjAIH' },
    { id: '2026-10-01', folderId: '1Z7n2Y_65dJcZjHJFyuRL8vaME1xFBuMn' },
    { id: '2026-10-02', folderId: '1Hsnuhj6cjBQCU-WIUNbI_NXUTbSWQRNj' },
    { id: '2026-10-03', folderId: '1ov9mrn98i__dg6oGcwkbAHtRLTDKjBXM' }
  ]
});

function doGet(event) {
  const callback = String((event && event.parameter && event.parameter.callback) || '');
  if (!/^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(callback)) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: 'Invalid callback' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const payload = getGalleryIndex_();
    return ContentService
      .createTextOutput(callback + '(' + JSON.stringify(payload) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } catch (error) {
    const payload = { ok: false, error: 'Gallery feed temporarily unavailable' };
    console.error(error && error.stack ? error.stack : error);
    return ContentService
      .createTextOutput(callback + '(' + JSON.stringify(payload) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
}

function getGalleryIndex_() {
  const properties = PropertiesService.getScriptProperties();
  const refreshedAt = Number(properties.getProperty('galleryIndexRefreshedAt') || 0);
  const maxAge = GALLERY_CONFIG.refreshMinutes * 60 * 1000;
  const isFresh = Date.now() - refreshedAt < maxAge;

  if (isFresh) {
    const stored = readStoredIndex_();
    if (stored) return stored;
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    const stored = readStoredIndex_();
    if (stored) return stored;
    throw new Error('Gallery index is currently being refreshed');
  }

  try {
    const refreshedAgain = Number(properties.getProperty('galleryIndexRefreshedAt') || 0);
    if (Date.now() - refreshedAgain < maxAge) {
      const stored = readStoredIndex_();
      if (stored) return stored;
    }

    const index = buildGalleryIndex_();
    storeIndex_(index);
    properties.setProperty('galleryIndexRefreshedAt', String(Date.now()));
    return index;
  } finally {
    lock.releaseLock();
  }
}

function buildGalleryIndex_() {
  const days = GALLERY_CONFIG.days.map(day => {
    const files = DriveApp.getFolderById(day.folderId).getFiles();
    const photos = [];

    while (files.hasNext()) {
      const file = files.next();
      const mimeType = file.getMimeType();
      if (!mimeType || mimeType.indexOf('image/') !== 0) continue;

      const id = file.getId();
      photos.push({
        id: id,
        name: file.getName(),
        mimeType: mimeType,
        createdAt: file.getDateCreated().toISOString(),
        size: file.getSize(),
        thumbnailUrl: 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w1200',
        fullUrl: 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w2400'
      });
    }

    photos.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { id: day.id, photos: photos };
  });

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    days: days
  };
}

function readStoredIndex_() {
  const fileId = PropertiesService.getScriptProperties().getProperty('galleryIndexFileId');
  if (!fileId) return null;

  try {
    return JSON.parse(DriveApp.getFileById(fileId).getBlob().getDataAsString());
  } catch (error) {
    console.warn('Stored gallery index could not be read; rebuilding it.');
    return null;
  }
}

function storeIndex_(index) {
  const properties = PropertiesService.getScriptProperties();
  const content = JSON.stringify(index);
  const fileId = properties.getProperty('galleryIndexFileId');

  if (fileId) {
    try {
      DriveApp.getFileById(fileId).setContent(content);
      return;
    } catch (error) {
      console.warn('Existing gallery index could not be updated; creating a replacement.');
    }
  }

  const folder = DriveApp.getFolderById(GALLERY_CONFIG.indexFolderId);
  const file = folder.createFile(GALLERY_CONFIG.indexFileName, content, MimeType.PLAIN_TEXT);
  properties.setProperty('galleryIndexFileId', file.getId());
}

/** Run manually in Apps Script to rebuild the feed immediately. */
function refreshGalleryIndex() {
  const index = buildGalleryIndex_();
  storeIndex_(index);
  PropertiesService.getScriptProperties().setProperty('galleryIndexRefreshedAt', String(Date.now()));
  console.log('Gallery index refreshed: ' + index.generatedAt);
}
