"use client"
import React, {useEffect, useRef} from 'react';
import * as pdfJS from "pdfjs-dist/webpack.mjs";

const PdfViewer = ({pdfUrl}) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const renderPDF = async (pdfUrl, canvas) => {
            const loadingTask = pdfJS.getDocument(pdfUrl);
            const pdf = await loadingTask.promise;

            const page = await pdf.getPage(24);
            const viewport = page.getViewport({scale: 1});

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const context = canvas.getContext('2d');

            // Önceki render işlemlerini iptal etmek veya beklemek için kullanılabilir
            // Beklemek için: await PDFJS.renderAllPromises();
            // İptal etmek için: PDFJS.cleanup();

            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };

            await page.render(renderContext).promise;
        };

// Örnek kullanım
        const pdfUrl = '/uploaded-pdfs/S100F2425W0702-İMALAT-AD-29.04.2024-20.05.2024.pdf';

        renderPDF(pdfUrl, canvasRef.current)
            .then(() => {
                console.log('PDF rendered successfully');
            })
            .catch((error) => {
                console.error('Error rendering PDF:', error);
            });
    }, [pdfUrl]);

    return <canvas ref={canvasRef}></canvas>;
};

export default PdfViewer;
