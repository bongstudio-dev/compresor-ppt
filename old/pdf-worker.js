// Bong Studio - PDF Compression Web Worker
// Using Ghostscript WASM

let gs = null;

// Load Ghostscript WASM
async function initGhostscript() {
    if (gs) return gs;
    
    try {
        // Import Ghostscript WASM module
        const module = await import('https://cdn.jsdelivr.net/npm/@jspawn/ghostscript-wasm@0.0.2/gs.mjs');
        
        gs = await module.default({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@jspawn/ghostscript-wasm@0.0.2/${file}`,
            printErr: (text) => {
                console.log('Ghostscript:', text);
            }
        });
        
        return gs;
    } catch (error) {
        throw new Error('Error loading Ghostscript: ' + error.message);
    }
}

// Map quality slider to Ghostscript presets
function getGhostscriptPreset(quality) {
    if (quality <= 70) return '/screen';    // 72 DPI - Máxima compresión
    if (quality <= 84) return '/ebook';     // 150 DPI - Recomendado
    if (quality <= 92) return '/printer';   // 300 DPI - Alta calidad
    return '/prepress';                      // 300 DPI - Calidad profesional
}

// Compress PDF using Ghostscript
async function compressPDF(pdfData, quality) {
    try {
        // Initialize Ghostscript if needed
        const ghostscript = await initGhostscript();
        
        // Post progress
        self.postMessage({ type: 'progress', progress: 30, message: 'Ghostscript cargado' });
        
        // Get preset based on quality
        const preset = getGhostscriptPreset(quality);
        
        // Write input file to virtual filesystem
        ghostscript.FS.writeFile('input.pdf', new Uint8Array(pdfData));
        
        self.postMessage({ type: 'progress', progress: 40, message: 'Comprimiendo PDF...' });
        
        // Run Ghostscript compression
        const args = [
            '-sDEVICE=pdfwrite',
            '-dCompatibilityLevel=1.4',
            `-dPDFSETTINGS=${preset}`,
            '-dNOPAUSE',
            '-dQUIET',
            '-dBATCH',
            '-dPreserveAnnots=true',           // Preserve annotations
            '-dPreserveHalftoneInfo=true',     // Better quality
            '-dAutoRotatePages=/None',          // Don't rotate pages
            '-dColorImageDownsampleType=/Bicubic',
            '-dGrayImageDownsampleType=/Bicubic',
            '-dMonoImageDownsampleType=/Bicubic',
            '-sOutputFile=output.pdf',
            'input.pdf'
        ];
        
        // Execute Ghostscript
        await ghostscript.callMain(args);
        
        self.postMessage({ type: 'progress', progress: 80, message: 'Finalizando...' });
        
        // Read compressed file
        const compressedData = ghostscript.FS.readFile('output.pdf');
        
        // Clean up
        ghostscript.FS.unlink('input.pdf');
        ghostscript.FS.unlink('output.pdf');
        
        self.postMessage({ type: 'progress', progress: 100, message: '¡Completado!' });
        
        // Return compressed data
        return compressedData.buffer;
        
    } catch (error) {
        throw new Error('Error compressing PDF: ' + error.message);
    }
}

// Handle messages from main thread
self.addEventListener('message', async (e) => {
    const { type, data, quality } = e.data;
    
    if (type === 'compress') {
        try {
            const compressed = await compressPDF(data, quality);
            self.postMessage({ type: 'complete', data: compressed });
        } catch (error) {
            self.postMessage({ type: 'error', message: error.message });
        }
    }
});
