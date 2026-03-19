# Image to PDF Converter

Convert one or multiple images into a PDF document with configurable page size and fit mode, using pdf-lib entirely in the browser.

**Live Demo:** https://file-converter-free.com/en/image-tools/convert-images-to-pdf-free

## How It Works

Images are embedded into a PDF created with `PDFDocument.create()` from the pdf-lib library. JPEG files are embedded using `pdfDoc.embedJpg()` and PNG files using `pdfDoc.embedPng()`. Page dimensions are computed from presets — A4, A3, Letter, Legal — using point units, or set to custom millimeter values converted to points via `72 / 25.4`. Three fit modes are supported: fit (scale down to fit the page while preserving aspect ratio), fill (scale up to fill the page), and original (embed at native resolution). Multiple images produce one page each and can be drag-reordered before conversion. The final PDF bytes are downloaded via a Blob URL.

## Features

- Multi-image to multi-page PDF
- Page size presets: A4, A3, Letter, Legal, and custom millimeters
- Fit modes: fit (scale down), fill (scale up), original size
- Drag-to-reorder file list before conversion
- Supports JPEG and PNG input

## Browser APIs Used

- pdf-lib (`PDFDocument.create`, `embedJpg`, `embedPng`)
- FileReader API (`readAsArrayBuffer`)
- Blob / URL.createObjectURL
- Drag-and-drop for file reordering

## Code Structure

| File | Description |
|------|-------------|
| `image-to-pdf.js` | `ImageToPdf` class — pdf-lib PDF creation, page size calculation (mm to points), three fit modes, drag-reorder list |

## Usage

| Element ID | Purpose |
|------------|---------|
| `dropZone` | Drag-and-drop target for image files |
| `fileInput` | File picker input |
| `pageSizeSelect` | Page size preset selector |
| `fitModeSelect` | Image fit mode (fit/fill/original) |
| `fileList` | Drag-to-reorder list of added images |
| `convertBtn` | Generate and download PDF |

## License

MIT
