// Bong Studio - Compresor PPT/PDF Web App
// JavaScript para compresión client-side

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {

let selectedFile = null;
let compressedBlob = null;
let currentFileType = 'ppt'; // 'ppt' or 'pdf'

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

// File Type Selector
const selectorBtns = document.querySelectorAll('.selector-btn');

selectorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        switchFileType(type);
    });
});

function switchFileType(type) {
    currentFileType = type;
    
    // Update active state
    selectorBtns.forEach(btn => {
        if (btn.dataset.type === type) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update UI
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
    
    // Update quality label
    const currentQuality = parseInt(qualitySlider.value);
    qualitySlider.dispatchEvent(new Event('input'));
    
    // Update icons
    feather.replace();
    
    // Reset state
    selectedFile = null;
    fileInfo.classList.remove('active');
    results.classList.remove('active');
    compressBtn.disabled = true;
}

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

// Drag and drop handlers
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
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
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
    
    // Update color based on quality
    qualityValue.className = 'quality-value';
    
    if (currentFileType === 'pdf') {
        // PDF: Show Ghostscript preset
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
        // PPT: Original labels
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

// Compress button
compressBtn.addEventListener('click', compressPresentation);

// Download button
downloadBtn.addEventListener('click', downloadCompressed);

// Handle file selection
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

// Format bytes
function formatBytes(bytes) {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// Update progress
function updateProgress(percent, label = 'Procesando...') {
    progressFill.style.width = percent + '%';
    progressText.textContent = Math.round(percent) + '%';
    progressLabel.textContent = label;
}

// Check if PNG has transparency
function hasTransparency(imageData) {
    const data = imageData.data;
    for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 255) {
            return true;
        }
    }
    return false;
}

// Compress image
async function compressImage(blob, filename, quality) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw image
            ctx.drawImage(img, 0, 0);
            
            // Check for transparency in PNGs
            const isPng = filename.toLowerCase().endsWith('.png');
            let shouldKeepPng = false;
            
            if (isPng) {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                shouldKeepPng = hasTransparency(imageData);
            }
            
            // Compress
            if (shouldKeepPng) {
                // Keep as PNG with optimization
                canvas.toBlob((blob) => {
                    resolve({ blob, kept: true });
                }, 'image/png');
            } else {
                // Convert to JPEG
                canvas.toBlob((blob) => {
                    resolve({ blob, kept: false });
                }, 'image/jpeg', quality / 100);
            }
        };
        
        img.onerror = reject;
        img.src = URL.createObjectURL(blob);
    });
}

// Compress presentation
async function compressPresentation() {
    if (!selectedFile) return;
    
    if (currentFileType === 'ppt') {
        await compressPPT();
    } else {
        await compressPDF();
    }
}

// Compress PPT
async function compressPPT() {
    compressBtn.disabled = true;
    progressContainer.classList.add('active');
    results.classList.remove('active');
    
    const quality = parseInt(qualitySlider.value);
    const originalSize = selectedFile.size;
    
    try {
        updateProgress(10, 'Extrayendo presentación...');
        
        // Load ZIP
        const zip = await JSZip.loadAsync(selectedFile);
        
        updateProgress(20, 'Buscando imágenes...');
        
        // Find media folder
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
        
        // Compress each image
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
        
        // Generate new PPTX
        compressedBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 9 }
        });
        
        updateProgress(100, '¡Completado!');
        
        // Show results
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

// Download compressed file
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

// Compress PDF using Ghostscript WASM
async function compressPDF() {
    compressBtn.disabled = true;
    progressContainer.classList.add('active');
    results.classList.remove('active');
    
    const quality = parseInt(qualitySlider.value);
    const originalSize = selectedFile.size;
    
    try {
        updateProgress(10, 'Preparando PDF...');
        
        // Read file as ArrayBuffer
        const arrayBuffer = await selectedFile.arrayBuffer();
        
        updateProgress(20, 'Cargando motor de compresión...');
        
        // Create Web Worker for PDF compression
        const worker = new Worker('pdf-worker.js', { type: 'module' });
        
        // Handle worker messages
        worker.onmessage = (e) => {
            const { type, progress, message, data } = e.data;
            
            if (type === 'progress') {
                updateProgress(progress, message);
            } else if (type === 'complete') {
                // Create blob from compressed data
                compressedBlob = new Blob([data], { type: 'application/pdf' });
                
                // Show results
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
        
        // Send compression task to worker
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

// Initialize on load
qualitySlider.dispatchEvent(new Event('input'));
feather.replace();

}); // End DOMContentLoaded
