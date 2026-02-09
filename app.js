// Bong Studio - Compresor PPT/PDF Web App
// JavaScript para compresión client-side

console.log('Script cargando...');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM listo!');
    
    let selectedFile = null;
    let compressedBlob = null;
    let currentFileType = 'ppt';
    
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
        
        console.log('Actualizando UI para:', type);
        
        if (type === 'ppt') {
            fileTypeLabel.textContent = 'PPT';
            fileInput.accept = '.pptx';
            dropZoneTitle.textContent = 'Arrastrá tu presentación acá';
            compressBtn.innerHTML = '<i data-feather="zap" style="width: 20px; height: 20px; display: inline-block; vertical-align: middle; margin-right: 8px;"></i>Comprimir Presentación';
            pdfInfoBadge.style.display = 'none';
        } else {
            fileTypeLabel.textContent = 'PDF';
            fileInput.accept = '.pdf';
            dropZoneTitle.textContent = 'Arrastrá tu PDF acá';
            compressBtn.innerHTML = '<i data-feather="zap" style="width: 20px; height: 20px; display: inline-block; vertical-align: middle; margin-right: 8px;"></i>Comprimir PDF';
            pdfInfoBadge.style.display = 'inline-block';
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
                qualityValue.textContent = value + '% (eBook - 150 DPI ⭐)';
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
                qualityValue.textContent = value + '% (Recomendado ⭐)';
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
        
        const quality = parseInt(qualitySlider.value);
        const originalSize = selectedFile.size;
        
        try {
            updateProgress(10, 'Preparando PDF...');
            const arrayBuffer = await selectedFile.arrayBuffer();
            
            updateProgress(20, 'Cargando motor de compresión...');
            
            const worker = new Worker('pdf-worker.js', { type: 'module' });
            
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
            };
            
            worker.postMessage({
                type: 'compress',
                data: arrayBuffer,
                quality: quality
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
