// Bong Studio - Compresor PPT/PDF Web App
// JavaScript para compresión client-side

console.log('Script cargando...');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM listo!');
    
    let selectedFile = null;
    let compressedBlob = null;
    let currentFileType = 'ppt';
    
    // Variables para working loader
    let lastProgress = -1;
    let stuckTimer = null;
    let messageTimer = null;
    let messageIndex = 0;
    const workingMessages = [
        'Trabajando...',
        'Comprimiendo imágenes...',
        'Optimizando calidad...',
        'Casi listo...'
    ];
    
    // Elements
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');
    const compressBtn = document.getElementById('compressBtn');
    const progressContainer = document.getElementById('progressContainer');
    const progressLabel = document.getElementById('progressLabel');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const workingLoader = document.getElementById('workingLoader');
    const workingLoaderLabel = document.getElementById('workingLoaderLabel');
    const results = document.getElementById('results');
    const originalSizeEl = document.getElementById('originalSize');
    const finalSizeEl = document.getElementById('finalSize');
    const reductionEl = document.getElementById('reduction');
    const downloadBtn = document.getElementById('downloadBtn');
    const fileTypeLabel = document.getElementById('fileTypeLabel');
    const dropZoneTitle = document.getElementById('dropZoneTitle');
    const dropZoneSubtitle = document.getElementById('dropZoneSubtitle');
    const pdfInfoBadge = document.querySelector('.pdf-info');
    const selectorBtns = document.querySelectorAll('.selector-btn');
    const qualityControl = document.getElementById('qualityControl');
    
    // PDF Advanced Controls
    const pdfAdvancedControls = document.getElementById('pdfAdvancedControls');
    const modeButtons = document.querySelectorAll('.pdf-mode-btn');
    const dpiButtons = document.querySelectorAll('.dpi-btn');
    const preserveText = document.getElementById('preserveText');
    const preserveLinks = document.getElementById('preserveLinks');
    const preserveLayout = document.getElementById('preserveLayout');
    const preservationNote = document.getElementById('preservationNote');
    const checkboxLabels = document.querySelectorAll('.checkbox-label');
    
    let pdfCompressionMode = 'images-only'; // 'images-only' or 'full'
    let pdfDPI = 150; // 72, 150, or 300
    
    console.log('Botones encontrados:', selectorBtns.length);
    
    // File Type Selector
    selectorBtns.forEach(btn => {
        console.log('Agregando listener a:', btn.dataset.type);
        btn.addEventListener('click', () => {
            console.log('Click en:', btn.dataset.type);
            switchFileType(btn.dataset.type);
        });
    });
    
    console.log('Listeners agregados correctamente');
    
    // PDF Mode selector (images-only vs full)
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            pdfCompressionMode = mode;
            
            modeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Enable/disable checkboxes based on mode
            if (mode === 'full') {
                // Optimización completa: deshabilitar checkboxes
                preserveText.disabled = true;
                preserveLinks.disabled = true;
                preserveLayout.disabled = true;
                checkboxLabels.forEach(label => label.classList.add('disabled'));
                preservationNote.style.display = 'flex';
                feather.replace();
            } else {
                // Solo imágenes: habilitar checkboxes
                preserveText.disabled = false;
                preserveLinks.disabled = false;
                preserveLayout.disabled = false;
                checkboxLabels.forEach(label => label.classList.remove('disabled'));
                preservationNote.style.display = 'none';
            }
            
            console.log('PDF Mode cambiado a:', mode);
        });
    });
    
    // DPI selector
    dpiButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const dpi = parseInt(btn.dataset.dpi);
            pdfDPI = dpi;
            
            dpiButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            console.log('DPI cambiado a:', dpi);
        });
    });
    
    
    function switchFileType(type) {
        console.log('switchFileType llamado con:', type);
        currentFileType = type;
        
        selectorBtns.forEach(btn => {
            if (btn.dataset.type === type) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Mover el pill - Estilo 3: Ultra Smooth
        const pill = document.querySelector('.selector-pill');
        if (pill) {
            if (type === 'pdf') {
                pill.style.transform = 'translateX(100%)';
            } else {
                pill.style.transform = 'translateX(0)';
            }
        }
        
        console.log('Actualizando UI para:', type);
        
        if (type === 'ppt') {
            fileTypeLabel.textContent = 'PPT';
            fileInput.accept = '.pptx';
            dropZoneTitle.textContent = 'Arrastrá tu presentación acá';
            compressBtn.innerHTML = '<i data-feather="zap" style="width: 20px; height: 20px; display: inline-block; vertical-align: middle; margin-right: 8px;"></i>Comprimir Presentación';
            pdfInfoBadge.style.display = 'none';
            pdfAdvancedControls.style.display = 'none';
            qualityControl.style.display = 'block'; // Mostrar slider para PPT
        } else {
            fileTypeLabel.textContent = 'PDF';
            fileInput.accept = '.pdf';
            dropZoneTitle.textContent = 'Arrastrá tu PDF acá';
            compressBtn.innerHTML = '<i data-feather="zap" style="width: 20px; height: 20px; display: inline-block; vertical-align: middle; margin-right: 8px;"></i>Comprimir PDF';
            pdfInfoBadge.style.display = 'inline-block';
            pdfAdvancedControls.style.display = 'block';
            qualityControl.style.display = 'none'; // Ocultar slider para PDF
        }
        
        console.log('Disparando evento input en slider');
        qualitySlider.dispatchEvent(new Event('input'));
        
        console.log('Reemplazando iconos Feather');
        feather.replace();
        
        selectedFile = null;
        fileInfo.classList.remove('active');
        results.classList.remove('active');
        compressBtn.disabled = true;
        
        console.log('switchFileType completado');
    }
    
    // Drag and drop
    dropZone.addEventListener('click', () => fileInput.click());
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragging');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragging');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragging');
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });
    
    // Quality slider
    qualitySlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        qualityValue.className = 'quality-value';
        
        if (currentFileType === 'pdf') {
            if (value <= 70) {
                qualityValue.classList.add('low');
                qualityValue.textContent = value + '% (Pantalla - 72 DPI)';
            } else if (value <= 84) {
                qualityValue.classList.add('recommended');
                qualityValue.innerHTML = value + '% (eBook - 150 DPI <i data-feather="star" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-left: 2px; fill: #20C683; stroke: #20C683;"></i>)';
                feather.replace();
            } else if (value <= 92) {
                qualityValue.classList.add('high');
                qualityValue.textContent = value + '% (Imprimir - 300 DPI)';
            } else {
                qualityValue.classList.add('high');
                qualityValue.textContent = value + '% (Profesional - 300 DPI)';
            }
        } else {
            if (value >= 90) {
                qualityValue.classList.add('high');
                qualityValue.textContent = value + '% (Máxima calidad)';
            } else if (value >= 85) {
                qualityValue.classList.add('recommended');
                qualityValue.innerHTML = value + '% (Recomendado <i data-feather="star" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-left: 2px; fill: #20C683; stroke: #20C683;"></i>)';
                feather.replace();
            } else if (value >= 75) {
                qualityValue.classList.add('medium');
                qualityValue.textContent = value + '% (Buena compresión)';
            } else {
                qualityValue.classList.add('low');
                qualityValue.textContent = value + '% (Máxima compresión)';
            }
        }
    });
    
    compressBtn.addEventListener('click', compressPresentation);
    downloadBtn.addEventListener('click', downloadCompressed);
    
    // Handle file
    function handleFile(file) {
        const expectedExtension = currentFileType === 'ppt' ? '.pptx' : '.pdf';
        
        if (!file.name.toLowerCase().endsWith(expectedExtension)) {
            alert(`Por favor seleccioná un archivo ${expectedExtension}`);
            return;
        }
        
        selectedFile = file;
        fileName.textContent = file.name;
        fileSize.textContent = formatBytes(file.size);
        fileInfo.classList.add('active');
        compressBtn.disabled = false;
        results.classList.remove('active');
    }
    
    function formatBytes(bytes) {
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
    
    function updateProgress(percent, label = 'Procesando...') {
        progressFill.style.width = percent + '%';
        progressText.textContent = Math.round(percent) + '%';
        progressLabel.textContent = label;
        
        // Detección de estancamiento
        const roundedPercent = Math.round(percent);
        
        console.log(`📊 Progress: ${roundedPercent}% (last: ${lastProgress}%)`);
        
        if (roundedPercent === lastProgress) {
            // El progreso no cambió
            if (!stuckTimer) {
                console.log('⏳ Progress stuck, starting 2s timer...');
                // Iniciar timer de 2 segundos (antes era 5s)
                stuckTimer = setTimeout(() => {
                    console.log('🔄 Timer triggered! Showing working loader...');
                    showWorkingLoader();
                }, 2000);
            }
        } else {
            // El progreso cambió, resetear todo
            console.log('✅ Progress changed, resetting loader');
            lastProgress = roundedPercent;
            clearTimeout(stuckTimer);
            stuckTimer = null;
            hideWorkingLoader();
        }
    }
    
    function showWorkingLoader() {
        console.log('🟢 showWorkingLoader() - Adding active class');
        workingLoader.classList.add('active');
        messageIndex = 0;
        workingLoaderLabel.textContent = workingMessages[messageIndex];
        
        // Rotar mensajes cada 3 segundos
        messageTimer = setInterval(() => {
            messageIndex = (messageIndex + 1) % workingMessages.length;
            workingLoaderLabel.textContent = workingMessages[messageIndex];
            console.log(`🔄 Message changed to: ${workingMessages[messageIndex]}`);
        }, 3000);
    }
    
    function hideWorkingLoader() {
        console.log('🔴 hideWorkingLoader() - Removing active class');
        workingLoader.classList.remove('active');
        clearInterval(messageTimer);
        messageTimer = null;
        messageIndex = 0;
    }
    
    function resetWorkingLoader() {
        lastProgress = -1;
        clearTimeout(stuckTimer);
        stuckTimer = null;
        hideWorkingLoader();
    }
    
    function hasTransparency(imageData) {
        const data = imageData.data;
        for (let i = 3; i < data.length; i += 4) {
            if (data[i] < 255) return true;
        }
        return false;
    }
    
    async function compressImage(blob, filename, quality) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const isPng = filename.toLowerCase().endsWith('.png');
                let shouldKeepPng = false;
                
                if (isPng) {
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    shouldKeepPng = hasTransparency(imageData);
                }
                
                if (shouldKeepPng) {
                    canvas.toBlob((blob) => {
                        resolve({ blob, kept: true });
                    }, 'image/png');
                } else {
                    canvas.toBlob((blob) => {
                        resolve({ blob, kept: false });
                    }, 'image/jpeg', quality / 100);
                }
            };
            
            img.onerror = reject;
            img.src = URL.createObjectURL(blob);
        });
    }
    
    async function compressPresentation() {
        if (!selectedFile) return;
        
        if (currentFileType === 'ppt') {
            await compressPPT();
        } else {
            await compressPDF();
        }
    }
    
    async function compressPPT() {
        compressBtn.disabled = true;
        progressContainer.classList.add('active');
        results.classList.remove('active');
        resetWorkingLoader(); // Reset loader state
        
        const quality = parseInt(qualitySlider.value);
        const originalSize = selectedFile.size;
        
        try {
            updateProgress(10, 'Extrayendo presentación...');
            
            const zip = await JSZip.loadAsync(selectedFile);
            updateProgress(20, 'Buscando imágenes...');
            
            const mediaFiles = [];
            zip.folder('ppt/media').forEach((relativePath, file) => {
                const lower = relativePath.toLowerCase();
                if (lower.endsWith('.png') || lower.endsWith('.jpg') || 
                    lower.endsWith('.jpeg') || lower.endsWith('.bmp')) {
                    mediaFiles.push({ path: 'ppt/media/' + relativePath, file });
                }
            });
            
            if (mediaFiles.length === 0) {
                updateProgress(100, 'No se encontraron imágenes');
                setTimeout(() => {
                    progressContainer.classList.remove('active');
                    alert('La presentación no contiene imágenes para comprimir');
                    compressBtn.disabled = false;
                }, 1000);
                return;
            }
            
            updateProgress(30, `Comprimiendo ${mediaFiles.length} imágenes...`);
            
            let processed = 0;
            for (const { path, file } of mediaFiles) {
                const blob = await file.async('blob');
                const filename = path.split('/').pop();
                
                try {
                    const { blob: compressedBlob } = await compressImage(blob, filename, quality);
                    zip.file(path, compressedBlob);
                } catch (err) {
                    console.error('Error compressing', filename, err);
                }
                
                processed++;
                const progress = 30 + (processed / mediaFiles.length) * 60;
                updateProgress(progress, `Comprimiendo imágenes... ${processed}/${mediaFiles.length}`);
            }
            
            updateProgress(90, 'Reconstruyendo presentación...');
            
            compressedBlob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 9 }
            });
            
            updateProgress(100, '¡Completado!');
            
            const finalSize = compressedBlob.size;
            const reduction = ((originalSize - finalSize) / originalSize) * 100;
            
            originalSizeEl.textContent = formatBytes(originalSize);
            finalSizeEl.textContent = formatBytes(finalSize);
            reductionEl.textContent = reduction.toFixed(1) + '%';
            
            setTimeout(() => {
                progressContainer.classList.remove('active');
                results.classList.add('active');
            }, 500);
            
        } catch (err) {
            console.error('Error:', err);
            alert('Error al comprimir la presentación: ' + err.message);
            progressContainer.classList.remove('active');
        } finally {
            compressBtn.disabled = false;
        }
    }
    
    async function compressPDF() {
        compressBtn.disabled = true;
        progressContainer.classList.add('active');
        results.classList.remove('active');
        resetWorkingLoader(); // Reset loader state
        
        const quality = parseInt(qualitySlider.value);
        const originalSize = selectedFile.size;
        
        try {
            updateProgress(10, 'Preparando PDF...');
            const arrayBuffer = await selectedFile.arrayBuffer();
            
            updateProgress(20, 'Cargando motor de compresión...');
            
            // Create inline worker to avoid CORS issues with file://
            const workerCode = `
                let gs = null;

                async function initGhostscript() {
                    if (gs) return gs;
                    
                    try {
                        const module = await import('https://cdn.jsdelivr.net/npm/@jspawn/ghostscript-wasm@0.0.2/gs.mjs');
                        
                        gs = await module.default({
                            locateFile: (file) => \`https://cdn.jsdelivr.net/npm/@jspawn/ghostscript-wasm@0.0.2/\${file}\`,
                            printErr: (text) => {
                                console.log('Ghostscript:', text);
                            }
                        });
                        
                        return gs;
                    } catch (error) {
                        throw new Error('Error loading Ghostscript: ' + error.message);
                    }
                }

                async function compressPDF(pdfData, options) {
                    try {
                        const ghostscript = await initGhostscript();
                        
                        self.postMessage({ type: 'progress', progress: 30, message: 'Ghostscript cargado' });
                        
                        ghostscript.FS.writeFile('input.pdf', new Uint8Array(pdfData));
                        
                        self.postMessage({ type: 'progress', progress: 40, message: 'Comprimiendo PDF...' });
                        
                        // Build Ghostscript arguments based on options
                        const args = [
                            '-sDEVICE=pdfwrite',
                            '-dCompatibilityLevel=1.4',
                            '-dNOPAUSE',
                            '-dQUIET',
                            '-dBATCH',
                            '-sOutputFile=output.pdf'
                        ];
                        
                        // Image compression settings
                        args.push(\`-dColorImageResolution=\${options.dpi}\`);
                        args.push(\`-dGrayImageResolution=\${options.dpi}\`);
                        args.push('-dColorImageDownsampleType=/Bicubic');
                        args.push('-dGrayImageDownsampleType=/Bicubic');
                        args.push('-dMonoImageDownsampleType=/Bicubic');
                        
                        // Preservation options
                        if (options.preserveLinks) {
                            args.push('-dPreserveAnnots=true');
                        }
                        
                        if (options.preserveText) {
                            args.push('-dEmbedAllFonts=true');
                            args.push('-dSubsetFonts=false');
                        }
                        
                        if (options.preserveLayout) {
                            args.push('-dPreserveHalftoneInfo=true');
                            args.push('-dAutoRotatePages=/None');
                            args.push('-dPreserveOverprintSettings=true');
                        }
                        
                        // Compression mode
                        if (options.mode === 'images-only') {
                            // Only compress images, don't touch structure
                            args.push('-dCompressPages=false');
                            args.push('-dCompressFonts=false');
                            args.push('-dDetectDuplicateImages=false');
                        } else {
                            // Full optimization
                            args.push('-dCompressPages=true');
                            args.push('-dCompressFonts=true');
                            args.push('-dDetectDuplicateImages=true');
                        }
                        
                        args.push('input.pdf');
                        
                        console.log('Ghostscript args:', args);
                        
                        await ghostscript.callMain(args);
                        
                        self.postMessage({ type: 'progress', progress: 80, message: 'Finalizando...' });
                        
                        const compressedData = ghostscript.FS.readFile('output.pdf');
                        
                        ghostscript.FS.unlink('input.pdf');
                        ghostscript.FS.unlink('output.pdf');
                        
                        self.postMessage({ type: 'progress', progress: 100, message: '¡Completado!' });
                        
                        return compressedData.buffer;
                        
                    } catch (error) {
                        throw new Error('Error compressing PDF: ' + error.message);
                    }
                }

                self.addEventListener('message', async (e) => {
                    const { type, data, options } = e.data;
                    
                    if (type === 'compress') {
                        try {
                            const compressed = await compressPDF(data, options);
                            self.postMessage({ type: 'complete', data: compressed });
                        } catch (error) {
                            self.postMessage({ type: 'error', message: error.message });
                        }
                    }
                });
            `;
            
            // Create worker from blob
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            const workerUrl = URL.createObjectURL(blob);
            const worker = new Worker(workerUrl, { type: 'module' });
            
            worker.onmessage = (e) => {
                const { type, progress, message, data } = e.data;
                
                if (type === 'progress') {
                    updateProgress(progress, message);
                } else if (type === 'complete') {
                    compressedBlob = new Blob([data], { type: 'application/pdf' });
                    
                    const finalSize = compressedBlob.size;
                    const reduction = ((originalSize - finalSize) / originalSize) * 100;
                    
                    originalSizeEl.textContent = formatBytes(originalSize);
                    finalSizeEl.textContent = formatBytes(finalSize);
                    reductionEl.textContent = reduction.toFixed(1) + '%';
                    
                    setTimeout(() => {
                        progressContainer.classList.remove('active');
                        results.classList.add('active');
                        worker.terminate();
                        URL.revokeObjectURL(workerUrl);
                    }, 500);
                } else if (type === 'error') {
                    throw new Error(message);
                }
            };
            
            worker.onerror = (error) => {
                console.error('Worker error:', error);
                alert('Error en el procesamiento: ' + error.message);
                progressContainer.classList.remove('active');
                compressBtn.disabled = false;
                worker.terminate();
                URL.revokeObjectURL(workerUrl);
            };
            
            worker.postMessage({
                type: 'compress',
                data: arrayBuffer,
                options: {
                    dpi: pdfDPI,
                    mode: pdfCompressionMode,
                    // En modo 'full', ignorar checkboxes y comprimir todo
                    preserveText: pdfCompressionMode === 'images-only' ? preserveText.checked : false,
                    preserveLinks: pdfCompressionMode === 'images-only' ? preserveLinks.checked : false,
                    preserveLayout: pdfCompressionMode === 'images-only' ? preserveLayout.checked : false
                }
            });
            
        } catch (err) {
            console.error('Error:', err);
            alert('Error al comprimir el PDF: ' + err.message);
            progressContainer.classList.remove('active');
            compressBtn.disabled = false;
        }
    }
    
    function downloadCompressed() {
        if (!compressedBlob) return;
        
        const extension = currentFileType === 'ppt' ? '.pptx' : '.pdf';
        const originalName = selectedFile.name.replace(extension, '');
        const newName = originalName + '_COMPRESSED' + extension;
        
        const url = URL.createObjectURL(compressedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = newName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Initialize
    qualitySlider.dispatchEvent(new Event('input'));
    feather.replace();
    
});
