/**
 * BONG STUDIO COMPRESSOR
 * PPT: JSZip + canvas image recompression
 * PDF: pdf-lib (pure JS, works from file://) + canvas JPEG recompression
 */

document.addEventListener('DOMContentLoaded', () => {

    // ═══════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════
    const state = {
        theme: safeLocalStorage('get', 'theme') || 'dark',
        lang: detectLanguage(),
        fileType: 'ppt',
        file: null,
        compressedBlob: null,
        isCompressing: false,
        pptQuality: 85,
        lastProgress: -1,
        stuckTimer: null,
        msgCycleInterval: null
    };

    function safeLocalStorage(op, key, value) {
        try {
            if (op === 'get') return localStorage.getItem(key);
            if (op === 'set') localStorage.setItem(key, value);
        } catch (e) { /* ignore – e.g. Safari file:// */ }
        return null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DOM ELEMENTS
    // ═══════════════════════════════════════════════════════════════════════
    const elements = {
        html: document.documentElement,
        themeToggle: document.getElementById('theme-toggle'),
        langToggle: document.getElementById('lang-toggle'),
        langText: document.querySelector('.lang-text'),
        dropzone: document.getElementById('dropzone'),
        fileInput: document.getElementById('file-input'),
        emptyState: document.querySelector('.empty-state'),
        // Screen 2 – file loaded
        fileScreenName: document.getElementById('file-screen-name'),
        fileScreenSize: document.getElementById('file-screen-size'),
        fileTypeBadge: document.getElementById('file-type-badge'),
        changeFileBtn: document.getElementById('change-file-btn'),
        // Screen 3 – compressing animation
        animStatus: document.getElementById('anim-status'),
        animPercent: document.getElementById('anim-percent'),
        // Screen 4 – results
        compressAnotherBtn: document.getElementById('compress-another-btn'),
        pptControls: document.getElementById('ppt-controls'),
        pdfControls: document.getElementById('pdf-controls'),
        qualitySlider: document.getElementById('quality-slider'),
        qualityValue: document.getElementById('quality-value'),
        pdfQualitySlider: document.getElementById('pdf-quality-slider'),
        pdfQualityValue: document.getElementById('pdf-quality-value'),
        removeMetadata: document.getElementById('remove-metadata'),
        convertPngToJpeg: document.getElementById('convert-png-to-jpeg'),
        compressBtn: document.getElementById('compress-btn'),
        btnText: document.querySelector('.btn-text'),
        loadingIcon: document.querySelector('.loading-icon'),
        statOriginal: document.getElementById('stat-original'),
        statFinal: document.getElementById('stat-final'),
        statReduction: document.getElementById('stat-reduction'),
        downloadBtn: document.getElementById('download-btn'),
        confettiCanvas: document.getElementById('confetti-canvas')
    };

    // ═══════════════════════════════════════════════════════════════════════
    // i18n
    // ═══════════════════════════════════════════════════════════════════════
    const i18n = {
        es: {
            title: 'Compresor de presentaciones', subtitle: 'Bong Studio',
            tagline: 'Compresión gratis, sin límites, 100% privado',
            dropzone: 'Arrastrá tu archivo acá',
            dropzoneOr: 'o hacé click para seleccionar',
            dropFormats: 'PDF · PPTX',
            compress: 'Comprimir {type}', download: 'Descargar',
            changeFile: 'Cambiar archivo', compressAnother: 'Comprimir otro',
            processing: 'Procesando...', working: 'Trabajando...',
            compressing: 'Comprimiendo imágenes...', optimizing: 'Optimizando estructura...',
            almostDone: '¡Listo!',
            quality: 'Calidad de compresión',
            imageQuality: 'Calidad de imágenes',
            maxCompression: 'Más compresión',
            betterQuality: 'Mejor calidad',
            maxDPI: 'Resolución máxima de imágenes',
            removeMetadata: 'Eliminar metadatos del documento',
            convertPngToJpeg: 'Convertir imágenes PNG a JPEG (más compresión)',
            originalSize: 'Tamaño original', finalSize: 'Tamaño final', reduction: 'Reducción',
            errorType: 'Formato no soportado. Por favor subí un PDF o PPTX.',
            errorSize: 'El archivo es demasiado grande (Max 200MB).',
            extracting: 'Extrayendo archivo...',
            findingImages: 'Buscando imágenes...',
            compressingImages: 'Comprimiendo {current}/{total} imágenes...',
            rebuilding: 'Reconstruyendo archivo...',
            noImages: 'No se encontraron imágenes JPEG para comprimir. Se aplicó compresión de estructura.',
            preparingPDF: 'Preparando PDF...',
            loadingEngine: 'Cargando motor PDF...',
            savingPDF: 'Guardando PDF comprimido...',
            errorPPT: 'Error al comprimir la presentación: ',
            errorPDF: 'Error al comprimir el PDF: ',
            errorNoPdfLib: 'pdf-lib no está disponible. Verificá tu conexión a internet.'
        },
        en: {
            title: 'Presentation Compressor', subtitle: 'Bong Studio',
            tagline: 'Free compression, no limits, 100% private',
            dropzone: 'Drag your file here',
            dropzoneOr: 'or click to select',
            dropFormats: 'PDF · PPTX',
            compress: 'Compress {type}', download: 'Download',
            changeFile: 'Change file', compressAnother: 'Compress another',
            processing: 'Processing...', working: 'Working...',
            compressing: 'Compressing images...', optimizing: 'Optimizing structure...',
            almostDone: 'Ready!',
            quality: 'Compression quality',
            imageQuality: 'Image quality',
            maxCompression: 'Max compression',
            betterQuality: 'Better quality',
            maxDPI: 'Max image resolution',
            removeMetadata: 'Remove document metadata',
            convertPngToJpeg: 'Convert PNG images to JPEG (more compression)',
            originalSize: 'Original size', finalSize: 'Final size', reduction: 'Reduction',
            errorType: 'Unsupported format. Please upload a PDF or PPTX.',
            errorSize: 'File is too large (Max 200MB).',
            extracting: 'Extracting file...',
            findingImages: 'Finding images...',
            compressingImages: 'Compressing {current}/{total} images...',
            rebuilding: 'Rebuilding file...',
            noImages: 'No JPEG images found to compress. Structure compression applied.',
            preparingPDF: 'Preparing PDF...',
            loadingEngine: 'Loading PDF engine...',
            savingPDF: 'Saving compressed PDF...',
            errorPPT: 'Error compressing presentation: ',
            errorPDF: 'Error compressing PDF: ',
            errorNoPdfLib: 'pdf-lib is not available. Check your internet connection.'
        }
    };

    function detectLanguage() {
        const stored = safeLocalStorage('get', 'lang');
        if (stored) return stored;
        return navigator.language.toLowerCase().startsWith('en') ? 'en' : 'es';
    }

    function t(key, vars = {}) {
        let text = i18n[state.lang]?.[key] || key;
        for (const [k, v] of Object.entries(vars)) text = text.replace(`{${k}}`, v);
        return text;
    }

    function updateLanguageUI() {
        elements.langText.textContent = state.lang.toUpperCase();
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const vars = JSON.parse(el.getAttribute('data-i18n-vars') || '{}');
            const text = t(key, vars);
            if (el.classList.contains('fade-text')) {
                el.style.opacity = 0;
                setTimeout(() => { el.textContent = text; el.style.opacity = 1; }, 150);
            } else {
                el.textContent = text;
            }
        });
        updateDynamicText();
    }

    function toggleLanguage() {
        state.lang = state.lang === 'es' ? 'en' : 'es';
        safeLocalStorage('set', 'lang', state.lang);
        updateLanguageUI();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // THEME
    // ═══════════════════════════════════════════════════════════════════════
    function initTheme() {
        if (!safeLocalStorage('get', 'theme') &&
            window.matchMedia?.('(prefers-color-scheme: light)').matches) {
            state.theme = 'light';
        }
        elements.html.setAttribute('data-theme', state.theme);
    }

    function toggleTheme() {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        elements.html.setAttribute('data-theme', state.theme);
        safeLocalStorage('set', 'theme', state.theme);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UI HELPERS
    // ═══════════════════════════════════════════════════════════════════════
    function setupRippleEffect() {
        document.querySelectorAll('.ripple-btn').forEach(btn => {
            btn.addEventListener('click', function (e) {
                if (this.disabled) return;
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
                ripple.classList.add('ripple');
                this.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);
            });
        });
    }

    function updateDynamicText() {
        const dropEl = document.querySelector('[data-i18n="dropzone"]');
        if (dropEl) dropEl.textContent = t('dropzone');
        const btnEl = document.querySelector('[data-i18n="compress"]');
        if (btnEl) btnEl.textContent = t('compress', { type: state.fileType.toUpperCase() });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SCREEN MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════
    let stopAnimation = null;

    function showScreen(name) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(`screen-${name}`);
        if (target) target.classList.add('active');

        if (name === 'compressing') {
            if (stopAnimation) stopAnimation();
            stopAnimation = startCompressionAnimation();
        } else {
            if (stopAnimation) { stopAnimation(); stopAnimation = null; }
        }
        if (typeof feather !== 'undefined') feather.replace();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FILE HANDLING
    // ═══════════════════════════════════════════════════════════════════════
    function setupDropzone() {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(ev =>
            elements.dropzone.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); })
        );
        ['dragenter', 'dragover'].forEach(ev =>
            elements.dropzone.addEventListener(ev, () => elements.dropzone.classList.add('dragging'))
        );
        ['dragleave', 'drop'].forEach(ev =>
            elements.dropzone.addEventListener(ev, () => elements.dropzone.classList.remove('dragging'))
        );
        elements.dropzone.addEventListener('drop', e => handleFiles(e.dataTransfer.files));
        elements.dropzone.addEventListener('click', () => elements.fileInput.click());
        elements.fileInput.addEventListener('change', e => handleFiles(e.target.files));
    }

    function handleFiles(files) {
        if (state.isCompressing || files.length === 0) return;
        validateAndSetFile(files[0]);
    }

    function validateAndSetFile(file) {
        const name = file.name.toLowerCase();
        let detectedType = null;
        if (name.endsWith('.pptx')) detectedType = 'ppt';
        else if (name.endsWith('.pdf')) detectedType = 'pdf';

        if (!detectedType) { alert(t('errorType')); return; }
        if (file.size > 200 * 1024 * 1024) { alert(t('errorSize')); return; }

        state.fileType = detectedType;
        state.file = file;
        state.compressedBlob = null;

        elements.fileScreenName.textContent = file.name;
        elements.fileScreenSize.textContent = formatFileSize(file.size);
        elements.fileTypeBadge.textContent = detectedType === 'ppt' ? 'PPTX' : 'PDF';
        elements.compressBtn.disabled = false;
        elements.pptControls.classList.toggle('hidden', detectedType !== 'ppt');
        elements.pdfControls.classList.toggle('hidden', detectedType !== 'pdf');
        updateDynamicText();

        showScreen('file');
    }

    function resetFileSelection() {
        state.file = null;
        state.compressedBlob = null;
        elements.fileInput.value = '';
        elements.compressBtn.disabled = true;
        showScreen('drop');
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PROGRESS UI (drives animation screen)
    // ═══════════════════════════════════════════════════════════════════════
    function updateProgressUI(percent, statusKey, vars = {}) {
        const rounded = Math.round(percent);
        if (elements.animPercent) elements.animPercent.textContent = `${rounded}%`;
        if (statusKey && elements.animStatus) {
            elements.animStatus.style.opacity = 0;
            setTimeout(() => {
                if (elements.animStatus) {
                    elements.animStatus.textContent = t(statusKey, vars);
                    elements.animStatus.style.opacity = 1;
                }
            }, 150);
        }
        if (rounded !== state.lastProgress) {
            state.lastProgress = rounded;
            clearTimeout(state.stuckTimer);
            state.stuckTimer = null;
        } else if (!state.stuckTimer) {
            state.stuckTimer = setTimeout(() => {
                if (!state.msgCycleInterval) startCyclingMessages();
            }, 2000);
        }
    }

    function startCyclingMessages() {
        const keys = ['working', 'compressing', 'optimizing'];
        let idx = 0;
        state.msgCycleInterval = setInterval(() => {
            idx = (idx + 1) % keys.length;
            if (elements.animStatus) {
                elements.animStatus.style.opacity = 0;
                setTimeout(() => {
                    if (elements.animStatus) {
                        elements.animStatus.textContent = t(keys[idx]);
                        elements.animStatus.style.opacity = 1;
                    }
                }, 150);
            }
        }, 2500);
    }

    function resetProgressState() {
        state.lastProgress = -1;
        clearTimeout(state.stuckTimer);
        state.stuckTimer = null;
        clearInterval(state.msgCycleInterval);
        state.msgCycleInterval = null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LOCK / UNLOCK UI
    // ═══════════════════════════════════════════════════════════════════════
    function lockUI() {
        state.isCompressing = true;
        elements.compressBtn.disabled = true;
        if (elements.animPercent) elements.animPercent.textContent = '0%';
        if (elements.animStatus) elements.animStatus.textContent = t('processing');
        resetProgressState();
        showScreen('compressing');
    }

    function unlockUI() {
        state.isCompressing = false;
        elements.compressBtn.disabled = false;
        updateDynamicText();
    }

    function finishCompression(originalSize, finalSize) {
        const reductionPercent = Math.round(((originalSize - finalSize) / originalSize) * 100);
        if (elements.animPercent) elements.animPercent.textContent = '100%';
        setTimeout(() => {
            unlockUI();
            showScreen('results');
            showResults(originalSize, finalSize, reductionPercent);
        }, 700);
    }

    function handleCompressionError(msgKey, err) {
        console.error(err);
        alert(t(msgKey) + err.message);
        resetProgressState();
        unlockUI();
        showScreen('file');
    }

    function startCompressionAnimation() { return () => {}; }

    // ═══════════════════════════════════════════════════════════════════════
    // COMPRESSION DISPATCHER
    // ═══════════════════════════════════════════════════════════════════════
    function startCompression() {
        if (!state.file || state.isCompressing) return;
        state.fileType === 'ppt' ? compressPPT() : compressPDF();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // IMAGE HELPERS (shared by PPT + PDF)
    // ═══════════════════════════════════════════════════════════════════════
    function hasTransparency(imageData) {
        const data = imageData.data;
        for (let i = 3; i < data.length; i += 4) {
            if (data[i] < 255) return true;
        }
        return false;
    }

    async function compressImageBlob(blob, filename, quality) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                const isPng = filename.toLowerCase().endsWith('.png');
                if (isPng && hasTransparency(ctx.getImageData(0, 0, canvas.width, canvas.height))) {
                    canvas.toBlob(b => resolve(b), 'image/png');
                } else {
                    canvas.toBlob(b => resolve(b), 'image/jpeg', quality / 100);
                }
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(blob);
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PPT COMPRESSION (JSZip)
    // ═══════════════════════════════════════════════════════════════════════
    async function compressPPT() {
        lockUI();
        const quality = parseInt(elements.qualitySlider.value);
        const originalSize = state.file.size;

        try {
            updateProgressUI(10, 'extracting');
            const zip = await JSZip.loadAsync(state.file);

            updateProgressUI(20, 'findingImages');
            const mediaFiles = [];
            zip.folder('ppt/media')?.forEach((relativePath, file) => {
                const lower = relativePath.toLowerCase();
                if (lower.endsWith('.png') || lower.endsWith('.jpg') ||
                    lower.endsWith('.jpeg') || lower.endsWith('.bmp')) {
                    mediaFiles.push({ path: 'ppt/media/' + relativePath, file });
                }
            });

            if (mediaFiles.length === 0) {
                unlockUI();
                showScreen('file');
                alert(t('noImages'));
                return;
            }

            let processed = 0;
            updateProgressUI(30, 'compressingImages', { current: 0, total: mediaFiles.length });

            for (const { path, file } of mediaFiles) {
                const blob = await file.async('blob');
                const filename = path.split('/').pop();
                try {
                    const compressed = await compressImageBlob(blob, filename, quality);
                    if (compressed && compressed.size < blob.size) zip.file(path, compressed);
                } catch (err) {
                    console.warn('Skipping', filename, err.message);
                }
                processed++;
                updateProgressUI(
                    30 + (processed / mediaFiles.length) * 60,
                    'compressingImages',
                    { current: processed, total: mediaFiles.length }
                );
            }

            updateProgressUI(90, 'rebuilding');
            state.compressedBlob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 9 }
            });

            finishCompression(originalSize, state.compressedBlob.size);
        } catch (err) {
            handleCompressionError('errorPPT', err);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PDF COMPRESSION (pdf-lib — pure JS, works from file://)
    //
    // Strategy:
    //  1. Load PDF with pdf-lib
    //  2. Find all JPEG images (DCTDecode filter) in the indirect object table
    //  3. For each image: draw on canvas → re-encode to JPEG at chosen quality
    //     and downsample if larger than max DPI cap
    //  4. Replace stream in PDF context if new bytes are smaller
    //  5. Save with useObjectStreams:true (compresses structure too)
    //  6. Preserves: text (selectable), links, annotations, colors,
    //     transparency masks, fonts — because pdf-lib never touches those
    // ═══════════════════════════════════════════════════════════════════════
    async function compressPDF() {
        if (typeof PDFLib === 'undefined') {
            alert(t('errorNoPdfLib'));
            return;
        }
        lockUI();
        const originalSize = state.file.size;

        try {
            updateProgressUI(10, 'preparingPDF');
            const arrayBuffer = await state.file.arrayBuffer();

            updateProgressUI(20, 'loadingEngine');
            const { PDFDocument, PDFName, PDFNumber } = PDFLib;

            const pdfDoc = await PDFDocument.load(arrayBuffer, {
                ignoreEncryption: true,
                updateMetadata: false
            });

            const quality = parseInt(elements.pdfQualitySlider.value);
            const maxDPI = parseInt(
                document.querySelector('input[name="pdf-dpi"]:checked')?.value || '72'
            );
            const removeMetadata = elements.removeMetadata?.checked ?? false;

            // Max pixel dimension per DPI tier (based on A4 long edge)
            const maxDimByDPI = { 72: 842, 100: 1170, 150: 1754, 200: 2340, 300: 9999 };
            const maxDim = maxDimByDPI[maxDPI] ?? 1754;

            // Optional: strip document metadata
            if (removeMetadata) {
                try {
                    pdfDoc.setTitle('');
                    pdfDoc.setAuthor('');
                    pdfDoc.setSubject('');
                    pdfDoc.setKeywords([]);
                    pdfDoc.setProducer('Bong Studio Compresor');
                    pdfDoc.setCreator('');
                } catch (e) { /* ignore if metadata ops not supported */ }
            }

            updateProgressUI(25, 'findingImages');

            // Helper: check if a PDF filter value (PDFName or PDFArray) includes DCTDecode
            function hasDCTFilter(filter) {
                if (!filter) return false;
                if (filter instanceof PDFName) return filter.toString() === '/DCTDecode';
                // PDFArray: [ /DCTDecode ] or [ /FlateDecode /DCTDecode ] etc.
                if (typeof filter.asArray === 'function') {
                    return filter.asArray().some(f => f instanceof PDFName && f.toString() === '/DCTDecode');
                }
                return false;
            }

            // Helper: check if a PDF filter value includes FlateDecode
            function hasFlateDecode(filter) {
                if (!filter) return false;
                if (filter instanceof PDFName) return filter.toString() === '/FlateDecode';
                if (typeof filter.asArray === 'function') {
                    return filter.asArray().some(f => f instanceof PDFName && f.toString() === '/FlateDecode');
                }
                return false;
            }

            // Collect JPEG image streams — scan both the indirect objects table
            // AND each page's XObject resources (catches more PDFs)
            const seenRefs = new Set();
            const images = [];

            function tryAddImage(ref, obj) {
                const key = ref?.toString?.() ?? String(obj);
                if (seenRefs.has(key)) return;
                if (!obj?.dict?.lookup || !(obj.contents instanceof Uint8Array)) return;
                const subtype = obj.dict.lookupMaybe(PDFName.of('Subtype'), PDFName);
                if (subtype?.toString() !== '/Image') return;
                const filter = obj.dict.lookup(PDFName.of('Filter'));
                if (!hasDCTFilter(filter)) return;
                const w = obj.dict.lookupMaybe(PDFName.of('Width'), PDFNumber)?.asNumber() ?? 0;
                const h = obj.dict.lookupMaybe(PDFName.of('Height'), PDFNumber)?.asNumber() ?? 0;
                if (w < 30 || h < 30) return;
                seenRefs.add(key);
                images.push({ ref, obj, w, h });
            }

            // Pass 1: enumerate all indirect objects
            for (const [ref, obj] of pdfDoc.context.enumerateIndirectObjects()) {
                tryAddImage(ref, obj);
            }

            // Pass 2: walk page XObjects (catches images not found in pass 1)
            for (const page of pdfDoc.getPages()) {
                try {
                    const res = page.node.lookup(PDFName.of('Resources'));
                    if (!res || typeof res.lookup !== 'function') continue;
                    const xObjs = res.lookup(PDFName.of('XObject'));
                    if (!xObjs || typeof xObjs.entries !== 'function') continue;
                    for (const [, ref] of xObjs.entries()) {
                        try {
                            const obj = pdfDoc.context.lookup(ref);
                            tryAddImage(ref, obj);
                        } catch (_) {}
                    }
                } catch (_) {}
            }

            // Optionally collect FlateDecode (PNG-type) RGB images for conversion to JPEG
            const flatImages = [];
            const convertPNG = elements.convertPngToJpeg?.checked ?? false;
            if (convertPNG && typeof DecompressionStream !== 'undefined') {
                for (const [ref, obj] of pdfDoc.context.enumerateIndirectObjects()) {
                    if (!obj?.dict?.lookup || !(obj.contents instanceof Uint8Array)) continue;
                    const key = ref?.toString?.() ?? String(ref);
                    if (seenRefs.has(key)) continue;
                    const subtype = obj.dict.lookupMaybe(PDFName.of('Subtype'), PDFName);
                    if (subtype?.toString() !== '/Image') continue;
                    const filter = obj.dict.lookup(PDFName.of('Filter'));
                    if (!hasFlateDecode(filter)) continue;
                    // Only DeviceRGB 8-bit (canvas always outputs RGB JPEG)
                    const colorSpace = obj.dict.lookup(PDFName.of('ColorSpace'));
                    if (!(colorSpace instanceof PDFName) || colorSpace.toString() !== '/DeviceRGB') continue;
                    const bpc = obj.dict.lookupMaybe(PDFName.of('BitsPerComponent'), PDFNumber)?.asNumber() ?? 8;
                    if (bpc !== 8) continue;
                    const w = obj.dict.lookupMaybe(PDFName.of('Width'), PDFNumber)?.asNumber() ?? 0;
                    const h = obj.dict.lookupMaybe(PDFName.of('Height'), PDFNumber)?.asNumber() ?? 0;
                    if (w < 30 || h < 30) continue;
                    seenRefs.add(key);
                    flatImages.push({ ref, obj, w, h });
                }
            }

            const totalImages = images.length + flatImages.length;
            let processed = 0;
            updateProgressUI(30, 'compressingImages', { current: 0, total: Math.max(totalImages, 1) });

            for (const { ref, obj, w, h } of images) {
                try {
                    await recompressJPEGStream(pdfDoc, ref, obj, w, h, quality, maxDim);
                } catch (err) {
                    console.warn('Skipping JPEG image at ref', ref.toString(), err.message);
                }
                processed++;
                updateProgressUI(
                    30 + (processed / Math.max(totalImages, 1)) * 60,
                    'compressingImages',
                    { current: processed, total: Math.max(totalImages, 1) }
                );
            }

            for (const { ref, obj, w, h } of flatImages) {
                try {
                    await convertFlatDecodeToJPEG(pdfDoc, ref, obj, w, h, quality, maxDim);
                } catch (err) {
                    console.warn('Skipping FlateDecode image at ref', ref.toString(), err.message);
                }
                processed++;
                updateProgressUI(
                    30 + (processed / Math.max(totalImages, 1)) * 60,
                    'compressingImages',
                    { current: processed, total: Math.max(totalImages, 1) }
                );
            }

            if (totalImages === 0) {
                console.info('No compressible images found — applying structure compression only');
            }

            updateProgressUI(90, 'savingPDF');

            const compressedBytes = await pdfDoc.save({
                useObjectStreams: true, // compresses cross-reference + object streams
                addDefaultPage: false
            });

            state.compressedBlob = new Blob([compressedBytes], { type: 'application/pdf' });
            finishCompression(originalSize, state.compressedBlob.size);

        } catch (err) {
            handleCompressionError('errorPDF', err);
        }
    }

    /**
     * Re-encodes a single JPEG stream inside the PDF at lower quality/size.
     * Uses canvas for decoding + re-encoding. Skips if new bytes are larger.
     */
    async function recompressJPEGStream(pdfDoc, ref, obj, origW, origH, quality, maxDim) {
        const { PDFName, PDFNumber } = PDFLib;
        const origBytes = obj.contents;

        // Load JPEG bytes into an <img>
        const jpegBlob = new Blob([origBytes], { type: 'image/jpeg' });
        const url = URL.createObjectURL(jpegBlob);

        const img = await new Promise((resolve, reject) => {
            const i = new Image();
            i.onload = () => { URL.revokeObjectURL(url); resolve(i); };
            i.onerror = () => { URL.revokeObjectURL(url); reject(new Error('img load failed')); };
            i.src = url;
        });

        // Calculate target dimensions (downsample if over DPI cap)
        let newW = img.naturalWidth;
        let newH = img.naturalHeight;
        if (newW > maxDim || newH > maxDim) {
            const ratio = Math.min(maxDim / newW, maxDim / newH);
            newW = Math.max(1, Math.round(newW * ratio));
            newH = Math.max(1, Math.round(newH * ratio));
        }

        const canvas = document.createElement('canvas');
        canvas.width = newW;
        canvas.height = newH;
        canvas.getContext('2d').drawImage(img, 0, 0, newW, newH);

        const newBlob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', quality / 100));
        if (!newBlob || newBlob.size >= origBytes.length) return; // keep original if not smaller

        const newBytes = new Uint8Array(await newBlob.arrayBuffer());

        // Patch dict and replace stream in PDF context
        obj.dict.set(PDFName.of('Length'), PDFNumber.of(newBytes.length));
        obj.dict.set(PDFName.of('Width'), PDFNumber.of(newW));
        obj.dict.set(PDFName.of('Height'), PDFNumber.of(newH));

        // PDFLib.PDFRawStream is exported in the browser bundle
        const newStream = PDFLib.PDFRawStream.of(obj.dict, newBytes);
        pdfDoc.context.assign(ref, newStream);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PDF FLATDECODE → JPEG CONVERSION (PNG-type images)
    // ═══════════════════════════════════════════════════════════════════════

    /** Decompress zlib/deflate bytes using the native DecompressionStream API */
    async function decompressStream(bytes) {
        const run = async (format) => {
            const ds = new DecompressionStream(format);
            const writer = ds.writable.getWriter();
            const reader = ds.readable.getReader();
            writer.write(bytes);
            writer.close();
            const chunks = [];
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
            }
            reader.releaseLock();
            const len = chunks.reduce((a, c) => a + c.length, 0);
            const out = new Uint8Array(len);
            let off = 0;
            for (const c of chunks) { out.set(c, off); off += c.length; }
            return out;
        };
        try { return await run('deflate'); } catch (_) {}      // zlib (most PDFs)
        try { return await run('deflate-raw'); } catch (_) {}  // raw deflate (some PDFs)
        throw new Error('Cannot decompress stream');
    }

    /**
     * Undo PNG row filtering (predictor 10-15 in PDF DecodeParms).
     * Each row starts with a 1-byte filter type (0=None,1=Sub,2=Up,3=Avg,4=Paeth).
     */
    function applyPNGUnpredictor(data, width, numComponents) {
        const rowStride = width * numComponents;
        const numRows = Math.floor(data.length / (rowStride + 1));
        const out = new Uint8Array(rowStride * numRows);
        for (let row = 0; row < numRows; row++) {
            const base = row * (rowStride + 1);
            const ft = data[base];
            const outBase = row * rowStride;
            for (let i = 0; i < rowStride; i++) {
                const x = data[base + 1 + i];
                const a = i >= numComponents ? out[outBase + i - numComponents] : 0;
                const b = row > 0 ? out[(row - 1) * rowStride + i] : 0;
                const c = (row > 0 && i >= numComponents) ? out[(row - 1) * rowStride + i - numComponents] : 0;
                switch (ft) {
                    case 0: out[outBase + i] = x; break;
                    case 1: out[outBase + i] = (x + a) & 0xFF; break;
                    case 2: out[outBase + i] = (x + b) & 0xFF; break;
                    case 3: out[outBase + i] = (x + Math.floor((a + b) / 2)) & 0xFF; break;
                    case 4: {
                        const p = a + b - c;
                        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
                        const pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
                        out[outBase + i] = (x + pr) & 0xFF;
                        break;
                    }
                    default: out[outBase + i] = x;
                }
            }
        }
        return out;
    }

    /**
     * Converts a FlateDecode DeviceRGB image stream to JPEG inside the PDF.
     * Handles PNG predictor rows. Skips if JPEG result is not smaller.
     */
    async function convertFlatDecodeToJPEG(pdfDoc, ref, obj, w, h, quality, maxDim) {
        const { PDFName, PDFNumber } = PDFLib;

        // Check for PNG predictor in DecodeParms
        const decodeParms = obj.dict.lookup(PDFName.of('DecodeParms'));
        let predictor = 1;
        if (decodeParms && typeof decodeParms.lookupMaybe === 'function') {
            predictor = decodeParms.lookupMaybe(PDFName.of('Predictor'), PDFNumber)?.asNumber() ?? 1;
        }

        // Decompress the stream
        const raw = await decompressStream(obj.contents);

        // Apply PNG predictor if needed (predictor 10-15 = PNG row filters)
        const pixels = predictor >= 10 ? applyPNGUnpredictor(raw, w, 3) : raw;
        if (pixels.length < w * h * 3) throw new Error('Insufficient pixel data after decompression');

        // Build canvas from raw RGB bytes
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.createImageData(w, h);
        for (let i = 0; i < w * h; i++) {
            imgData.data[i * 4]     = pixels[i * 3];
            imgData.data[i * 4 + 1] = pixels[i * 3 + 1];
            imgData.data[i * 4 + 2] = pixels[i * 3 + 2];
            imgData.data[i * 4 + 3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);

        // Apply DPI downsampling if needed
        let finalCanvas = canvas;
        let newW = w, newH = h;
        if (newW > maxDim || newH > maxDim) {
            const ratio = Math.min(maxDim / newW, maxDim / newH);
            newW = Math.max(1, Math.round(newW * ratio));
            newH = Math.max(1, Math.round(newH * ratio));
            finalCanvas = document.createElement('canvas');
            finalCanvas.width = newW; finalCanvas.height = newH;
            finalCanvas.getContext('2d').drawImage(canvas, 0, 0, newW, newH);
        }

        const newBlob = await new Promise(res => finalCanvas.toBlob(res, 'image/jpeg', quality / 100));
        if (!newBlob || newBlob.size >= obj.contents.length) return; // keep original if not smaller

        const newBytes = new Uint8Array(await newBlob.arrayBuffer());

        // Patch dict: swap FlateDecode → DCTDecode, remove PNG predictor and transparency mask
        obj.dict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'));
        try { obj.dict.delete(PDFName.of('DecodeParms')); } catch (_) {}
        try { obj.dict.delete(PDFName.of('SMask')); } catch (_) {}
        obj.dict.set(PDFName.of('Length'), PDFNumber.of(newBytes.length));
        obj.dict.set(PDFName.of('Width'), PDFNumber.of(newW));
        obj.dict.set(PDFName.of('Height'), PDFNumber.of(newH));

        pdfDoc.context.assign(ref, PDFLib.PDFRawStream.of(obj.dict, newBytes));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RESULTS
    // ═══════════════════════════════════════════════════════════════════════
    function showResults(originalSize, finalSize, reductionPercent) {
        animateValue(elements.statOriginal, 0, originalSize, 1000, formatFileSize);
        animateValue(elements.statFinal, 0, finalSize, 1200, formatFileSize);
        animateValue(elements.statReduction, 0, reductionPercent, 1500, v => `-${v}%`);
        triggerConfetti();
    }

    function animateValue(el, start, end, duration, formatter) {
        let t0 = null;
        const step = ts => {
            if (!t0) t0 = ts;
            const p = Math.min((ts - t0) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = formatter(Math.floor(eased * (end - start) + start));
            if (p < 1) requestAnimationFrame(step);
            else el.textContent = formatter(end);
        };
        requestAnimationFrame(step);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DOWNLOAD
    // ═══════════════════════════════════════════════════════════════════════
    function downloadCompressed() {
        if (!state.compressedBlob || !state.file) return;
        const ext = state.fileType === 'ppt' ? '.pptx' : '.pdf';
        const base = state.file.name.replace(/\.[^/.]+$/, '');
        const url = URL.createObjectURL(state.compressedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = base + '_compressed' + ext;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CONFETTI
    // ═══════════════════════════════════════════════════════════════════════
    function triggerConfetti() {
        const canvas = elements.confettiCanvas;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const colors = ['#20C683', '#00d89e', '#95B5A9', '#ffffff'];
        const particles = Array.from({ length: 100 }, () => ({
            x: canvas.width / 2, y: canvas.height / 2 + 100,
            w: Math.random() * 10 + 5, h: Math.random() * 10 + 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 1) * 20 - 5,
            grav: 0.4, rot: Math.random() * 360, rotSpeed: (Math.random() - 0.5) * 10
        }));
        let animId;
        (function render() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let active = 0;
            particles.forEach(p => {
                p.vy += p.grav; p.x += p.vx; p.y += p.vy; p.rot += p.rotSpeed;
                if (p.y < canvas.height) active++;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot * Math.PI / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            });
            if (active > 0) animId = requestAnimationFrame(render);
        })();
        setTimeout(() => cancelAnimationFrame(animId), 3000);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INIT
    // ═══════════════════════════════════════════════════════════════════════
    function init() {
        initTheme();
        updateLanguageUI();
        setupRippleEffect();
        setupDropzone();

        elements.themeToggle.addEventListener('click', toggleTheme);
        elements.langToggle.addEventListener('click', toggleLanguage);

        elements.qualitySlider.addEventListener('input', e => {
            state.pptQuality = parseInt(e.target.value);
            elements.qualityValue.textContent = `${state.pptQuality}%`;
        });
        elements.pdfQualitySlider.addEventListener('input', e => {
            elements.pdfQualityValue.textContent = `${e.target.value}%`;
        });

        elements.compressBtn.addEventListener('click', startCompression);
        elements.downloadBtn.addEventListener('click', downloadCompressed);
        elements.changeFileBtn.addEventListener('click', resetFileSelection);
        elements.compressAnotherBtn.addEventListener('click', resetFileSelection);

        elements.fileInput.accept = '.pptx,.pdf';
        updateDynamicText();
    }

    init();
});
