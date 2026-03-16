const PAGE_SIZES = {
    'A4':     [595.28, 841.89],
    'A3':     [841.89, 1190.55],
    'Letter': [612, 792],
    'Legal':  [612, 1008]
};

// Points per mm (1 inch = 72 points, 1 inch = 25.4 mm)
const MM_TO_PT = 72 / 25.4;

class ImageToPdf {
    constructor() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.img2pdfEditor = document.getElementById('img2pdfEditor');
        this.img2pdfFileList = document.getElementById('img2pdfFileList');
        this.img2pdfStatus = document.getElementById('img2pdfStatus');
        this.convertToPdfBtn = document.getElementById('convertToPdfBtn');
        this.img2pdfDownloadBtn = document.getElementById('img2pdfDownloadBtn');
        this.pageSizeSelect = document.getElementById('pageSize');
        this.customSizeRow = document.getElementById('customSizeRow');
        this.orientationSelect = document.getElementById('orientation');
        this.fitModeSelect = document.getElementById('fitMode');

        // Each entry: { file, arrayBuffer, objectUrl }
        this.files = [];
        this.dragSrcIndex = null;
        this.resultBlob = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.uploadArea.addEventListener('click', (e) => {
            if (e.target.closest('#img2pdfEditor')) return;
            this.fileInput.click();
        });

        this.fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
            this.fileInput.value = '';
        });

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.uploadArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            this.uploadArea.addEventListener(eventName, () => {
                this.uploadArea.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.uploadArea.addEventListener(eventName, () => {
                this.uploadArea.classList.remove('drag-over');
            });
        });

        this.uploadArea.addEventListener('drop', (e) => {
            this.handleFiles(e.dataTransfer.files);
        });

        this.pageSizeSelect.addEventListener('change', () => {
            this.customSizeRow.style.display = this.pageSizeSelect.value === 'Custom' ? 'flex' : 'none';
        });

        this.convertToPdfBtn.addEventListener('click', () => {
            this.convertToPdf();
        });

        this.img2pdfDownloadBtn.addEventListener('click', () => {
            if (this.resultBlob) {
                this.downloadBlob(this.resultBlob, 'images.pdf');
            }
        });
    }

    async handleFiles(fileList) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const validFiles = Array.from(fileList).filter(f => validTypes.includes(f.type));

        if (validFiles.length === 0) {
            alert('Please select valid image files (JPEG, PNG, or WebP).');
            return;
        }

        this.img2pdfEditor.style.display = 'block';
        this.img2pdfDownloadBtn.style.display = 'none';
        this.img2pdfStatus.textContent = '';

        for (const file of validFiles) {
            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            const objectUrl = URL.createObjectURL(file);
            this.files.push({ file, arrayBuffer, objectUrl });
        }

        this.renderFileList();
    }

    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    renderFileList() {
        this.img2pdfFileList.innerHTML = '';

        this.files.forEach((fileData, index) => {
            const li = document.createElement('li');
            li.className = 'merge-file-item img2pdf-file-item';
            li.draggable = true;
            li.dataset.index = index;

            li.innerHTML = `
                <span class="drag-handle" title="Drag to reorder">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="3" y1="9" x2="21" y2="9"/>
                        <line x1="3" y1="15" x2="21" y2="15"/>
                    </svg>
                </span>
                <img class="img2pdf-thumb" src="${fileData.objectUrl}" alt="">
                <div class="merge-file-details">
                    <span class="merge-file-name">${this.escapeHtml(fileData.file.name)}</span>
                    <span class="merge-file-meta">${this.formatFileSize(fileData.file.size)}</span>
                </div>
                <button class="merge-remove-btn" data-index="${index}" title="Remove">&times;</button>
            `;

            li.addEventListener('dragstart', (e) => {
                this.dragSrcIndex = index;
                li.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });

            li.addEventListener('dragend', () => {
                li.classList.remove('dragging');
                document.querySelectorAll('.img2pdf-file-item').forEach(el => el.classList.remove('drag-over-item'));
            });

            li.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                document.querySelectorAll('.img2pdf-file-item').forEach(el => el.classList.remove('drag-over-item'));
                li.classList.add('drag-over-item');
            });

            li.addEventListener('drop', (e) => {
                e.preventDefault();
                if (this.dragSrcIndex === null || this.dragSrcIndex === index) return;
                const moved = this.files.splice(this.dragSrcIndex, 1)[0];
                this.files.splice(index, 0, moved);
                this.dragSrcIndex = null;
                this.renderFileList();
            });

            const removeBtn = li.querySelector('.merge-remove-btn');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(removeBtn.dataset.index, 10);
                URL.revokeObjectURL(this.files[idx].objectUrl);
                this.files.splice(idx, 1);
                if (this.files.length === 0) {
                    this.img2pdfEditor.style.display = 'none';
                } else {
                    this.renderFileList();
                }
            });

            this.img2pdfFileList.appendChild(li);
        });
    }

    getPageDimensions() {
        const sizeName = this.pageSizeSelect.value;
        const orientation = this.orientationSelect.value;

        let width, height;

        if (sizeName === 'Custom') {
            const wMm = parseFloat(document.getElementById('customWidth').value);
            const hMm = parseFloat(document.getElementById('customHeight').value);
            if (isNaN(wMm) || isNaN(hMm) || wMm <= 0 || hMm <= 0) {
                alert('Please enter valid custom dimensions in mm.');
                return null;
            }
            width = wMm * MM_TO_PT;
            height = hMm * MM_TO_PT;
        } else {
            const dims = PAGE_SIZES[sizeName];
            width = dims[0];
            height = dims[1];
        }

        if (orientation === 'landscape') {
            return [Math.max(width, height), Math.min(width, height)];
        }
        return [Math.min(width, height), Math.max(width, height)];
    }

    getImageDimensions(arrayBuffer, mimeType) {
        return new Promise((resolve) => {
            const blob = new Blob([arrayBuffer], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
                resolve({ w: img.naturalWidth, h: img.naturalHeight });
                URL.revokeObjectURL(url);
            };
            img.onerror = () => {
                resolve({ w: 0, h: 0 });
                URL.revokeObjectURL(url);
            };
            img.src = url;
        });
    }

    calcDrawRect(imgW, imgH, pageW, pageH, fitMode) {
        const margin = fitMode === 'original' ? 0 : 36; // 0.5 inch margin for fit/fill
        const availW = pageW - margin * 2;
        const availH = pageH - margin * 2;

        if (fitMode === 'original') {
            return { x: 0, y: pageH - imgH, w: imgW, h: imgH };
        }

        if (fitMode === 'fit') {
            const scale = Math.min(availW / imgW, availH / imgH, 1);
            const drawW = imgW * scale;
            const drawH = imgH * scale;
            const x = margin + (availW - drawW) / 2;
            const y = margin + (availH - drawH) / 2;
            return { x, y: pageH - y - drawH, w: drawW, h: drawH };
        }

        if (fitMode === 'fill') {
            const scale = Math.max(availW / imgW, availH / imgH);
            const drawW = imgW * scale;
            const drawH = imgH * scale;
            const x = (pageW - drawW) / 2;
            const y = (pageH - drawH) / 2;
            return { x, y: pageH - y - drawH, w: drawW, h: drawH };
        }

        return { x: margin, y: margin, w: availW, h: availH };
    }

    async convertToPdf() {
        if (this.files.length === 0) {
            alert('Please add at least one image.');
            return;
        }

        const pageDims = this.getPageDimensions();
        if (!pageDims) return;

        const [pageW, pageH] = pageDims;
        const fitMode = this.fitModeSelect.value;

        this.convertToPdfBtn.disabled = true;
        this.img2pdfDownloadBtn.style.display = 'none';
        this.img2pdfStatus.textContent = 'Starting conversion...';

        try {
            const pdfDoc = await PDFLib.PDFDocument.create();

            for (let i = 0; i < this.files.length; i++) {
                const fileData = this.files[i];
                this.img2pdfStatus.textContent = 'Converting image ' + (i + 1) + ' of ' + this.files.length + '...';

                const mimeType = fileData.file.type;
                const bytes = new Uint8Array(fileData.arrayBuffer);

                let embeddedImage;
                if (mimeType === 'image/png') {
                    embeddedImage = await pdfDoc.embedPng(bytes);
                } else {
                    // JPEG and WebP are embedded as JPG (pdf-lib handles conversion)
                    embeddedImage = await pdfDoc.embedJpg(bytes);
                }

                const imgW = embeddedImage.width;
                const imgH = embeddedImage.height;

                const page = pdfDoc.addPage([pageW, pageH]);
                const rect = this.calcDrawRect(imgW, imgH, pageW, pageH, fitMode);

                page.drawImage(embeddedImage, {
                    x: rect.x,
                    y: rect.y,
                    width: rect.w,
                    height: rect.h
                });
            }

            this.img2pdfStatus.textContent = 'Saving PDF...';
            const pdfBytes = await pdfDoc.save();
            this.resultBlob = new Blob([pdfBytes], { type: 'application/pdf' });

            this.img2pdfStatus.textContent = 'Done! ' + this.formatFileSize(this.resultBlob.size);
            this.img2pdfDownloadBtn.style.display = 'inline-block';
        } catch (err) {
            console.error('Convert error:', err);
            this.img2pdfStatus.textContent = 'Error: ' + err.message;
        } finally {
            this.convertToPdfBtn.disabled = false;
        }
    }

    downloadBlob(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ImageToPdf();
});
