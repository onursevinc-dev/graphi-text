"use client"
import React, {useRef, useState, useEffect} from 'react';
import * as pdfJS from "pdfjs-dist/webpack.mjs";

const CanvasDrawing = () => {
    const canvasRef = useRef(null);
    const [rectangles, setRectangles] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [selectedRectangle, setSelectedRectangle] = useState(null);
    const [resizing, setResizing] = useState(false);
    const [resizingEdge, setResizingEdge] = useState(null);
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const mouseX = e.nativeEvent.offsetX;
        const mouseY = e.nativeEvent.offsetY;

        // Check if clicking on a rectangle to resize
        const clickedRect = rectangles.find(rect => {
            return mouseX >= rect.startX && mouseX <= rect.startX + rect.rectWidth &&
                mouseY >= rect.startY && mouseY <= rect.startY + rect.rectHeight;
        });

        if (clickedRect) {
            const edge = getResizingEdge(clickedRect, mouseX, mouseY);
            if (edge) {
                canvas.style.cursor = getCursorForEdge(edge);
                setResizingEdge(edge);
                setSelectedRectangle(clickedRect);
                setResizing(true);
            }
        } else {
            // Start drawing a new rectangle
            console.log(mouseX, mouseY)
            setStartX(mouseX);
            setStartY(mouseY);
            setIsDrawing(true);
            canvas.style.cursor = 'default';
        }
    };

    const drawRectangle = (e) => {
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            const mouseX = e.nativeEvent.offsetX;
            const mouseY = e.nativeEvent.offsetY;

            const hoveredRect = rectangles.find(rect => isMouseOnRectEdge(rect, mouseX, mouseY));
            if (hoveredRect) {
                const edge = getResizingEdge(hoveredRect, mouseX, mouseY);
                canvas.style.cursor = getCursorForEdge(edge) || 'default';
            } else {
                canvas.style.cursor = 'default';
            }


            if (resizing && selectedRectangle) {
                const updatedRect = {...selectedRectangle};
                switch (resizingEdge) {
                    case 'top-left':
                        updatedRect.startX = mouseX;
                        updatedRect.startY = mouseY;
                        updatedRect.rectWidth += (selectedRectangle.startX - mouseX);
                        updatedRect.rectHeight += (selectedRectangle.startY - mouseY);
                        break;
                    case 'top-right':
                        updatedRect.startY = mouseY;
                        updatedRect.rectWidth = mouseX - selectedRectangle.startX;
                        updatedRect.rectHeight += (selectedRectangle.startY - mouseY);
                        break;
                    case 'bottom-left':
                        updatedRect.startX = mouseX;
                        updatedRect.rectWidth += (selectedRectangle.startX - mouseX);
                        updatedRect.rectHeight = mouseY - selectedRectangle.startY;
                        break;
                    case 'bottom-right':
                        updatedRect.rectWidth = mouseX - selectedRectangle.startX;
                        updatedRect.rectHeight = mouseY - selectedRectangle.startY;
                        break;
                    case 'right':
                        updatedRect.rectWidth = mouseX - selectedRectangle.startX;
                        break;
                    case 'left':
                        updatedRect.startX = mouseX;
                        updatedRect.rectWidth += (selectedRectangle.startX - mouseX);
                        break;
                    case 'top':
                        updatedRect.startY = mouseY;
                        updatedRect.rectHeight += (selectedRectangle.startY - mouseY);
                        break;
                    case 'bottom':
                        updatedRect.rectHeight = mouseY - selectedRectangle.startY;
                        break;
                    default:
                        break;
                }

                const updatedRectangles = rectangles.map(rect =>
                    rect.id === selectedRectangle.id ? updatedRect : rect
                );

                setRectangles(updatedRectangles);
                redrawRectangles(context);
            } else if (isDrawing) {
                const rectWidth = mouseX - startX;
                const rectHeight = mouseY - startY;

                context.clearRect(0, 0, canvas.width, canvas.height);
                redrawRectangles(context);
                context.setLineDash([5, 3]); // Dashed line
                context.strokeStyle = 'red'; // Set stroke color to red
                context.strokeRect(startX, startY, rectWidth, rectHeight);
                context.setLineDash([]); // Reset to solid line
            }
        }
    ;

    const endDrawing = (e) => {
        if (isDrawing) {
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            console.log(selectedRectangle)
            let rectWidth = e.nativeEvent.offsetX - startX;
            let rectHeight = e.nativeEvent.offsetY - startY;

            if (selectedRectangle) {
                const mouseX = startX + selectedRectangle.rectWidth;
                const mouseY = startY + selectedRectangle.rectHeight;
                rectWidth = mouseX - startX
                rectHeight = mouseY - startY
            }


            const newRectangle = {
                id: rectangles.length + 1,
                startX,
                startY,
                rectWidth,
                rectHeight
            };


            setRectangles([...rectangles, newRectangle]);
            setIsDrawing(false);
        }

        setResizing(false);
        setSelectedRectangle(null);
        setResizingEdge(null);
    };

    const getResizingEdge = (rect, mouseX, mouseY) => {
        const edgeSize = 8; // Edge size for resizing
        if (
            mouseX >= rect.startX && mouseX <= rect.startX + edgeSize &&
            mouseY >= rect.startY && mouseY <= rect.startY + edgeSize
        ) {
            return 'top-left';
        } else if (
            mouseX >= rect.startX + rect.rectWidth - edgeSize && mouseX <= rect.startX + rect.rectWidth &&
            mouseY >= rect.startY && mouseY <= rect.startY + edgeSize
        ) {
            return 'top-right';
        } else if (
            mouseX >= rect.startX && mouseX <= rect.startX + edgeSize &&
            mouseY >= rect.startY + rect.rectHeight - edgeSize && mouseY <= rect.startY + rect.rectHeight
        ) {
            return 'bottom-left';
        } else if (
            mouseX >= rect.startX + rect.rectWidth - edgeSize && mouseX <= rect.startX + rect.rectWidth &&
            mouseY >= rect.startY + rect.rectHeight - edgeSize && mouseY <= rect.startY + rect.rectHeight
        ) {
            return 'bottom-right';
        } else if (mouseX >= rect.startX + rect.rectWidth - edgeSize && mouseX <= rect.startX + rect.rectWidth) {
            return 'right';
        } else if (mouseX >= rect.startX && mouseX <= rect.startX + edgeSize) {
            return 'left';
        } else if (mouseY >= rect.startY && mouseY <= rect.startY + edgeSize) {
            return 'top';
        } else if (mouseY >= rect.startY + rect.rectHeight - edgeSize && mouseY <= rect.startY + rect.rectHeight) {
            return 'bottom';
        }
        return null;
    };

    const redrawRectangles = (context) => {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        rectangles.forEach(rect => {
            context.setLineDash([5, 3]); // Dashed line
            context.strokeStyle = 'red'; // Set stroke color to red
            context.strokeRect(rect.startX, rect.startY, rect.rectWidth, rect.rectHeight);
            context.setLineDash([]); // Reset to solid line
        });
    };

    const clearRectangles = () => {
        setRectangles([]);
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
    };

    const resizingRectangle = (e) => {
        if (e.keyCode === 38 || e.keyCode === 40) {
            console.log(e)
            console.log("169 selectedRectangle", selectedRectangle)
            selectedRectangle.rectWidth += 10
            selectedRectangle.rectHeight += 10
            setSelectedRectangle(selectedRectangle)
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            redrawRectangles(context);
        }
    }

    const getCursorForEdge = (edge) => {
        switch (edge) {
            case 'top-left':
            case 'bottom-right':
                return 'nwse-resize';
            case 'top-right':
            case 'bottom-left':
                return 'nesw-resize';
            case 'top':
            case 'bottom':
                return 'ns-resize';
            case 'left':
            case 'right':
                return 'ew-resize';

            default:
                return 'default';
        }
    };

    const isMouseOnRectEdge = (rect, mouseX, mouseY) => {
        const edgeSize = 8;
        return (
            mouseX >= rect.startX - edgeSize && mouseX <= rect.startX + rect.rectWidth + edgeSize &&
            mouseY >= rect.startY - edgeSize && mouseY <= rect.startY + rect.rectHeight + edgeSize
        );
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.setAttribute('tabIndex', '0');
        canvas.focus();
        const context = canvas.getContext('2d');
        redrawRectangles(context);

        /*PDF*/
        const renderPDF = async (pdfUrl, canvas) => {
            const loadingTask = pdfJS.getDocument(pdfUrl);
            const pdf = await loadingTask.promise;

            const page = await pdf.getPage(24);
            const viewport = page.getViewport({scale: 1});

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const context = canvas.getContext('2d');
            console.log(context)

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
    }, []);

    return (
        <div style={{position: 'relative'}}>
            <button
                onClick={clearRectangles}
                style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 1
                }}
            >
                Seçimleri Temizle
            </button>
            <canvas
                ref={canvasRef}
                width={800}
                height={600}
                style={{border: '2px solid black'}}
                onMouseDown={startDrawing}
                onMouseMove={drawRectangle}
                onMouseUp={endDrawing}
                onMouseLeave={endDrawing}
                onKeyDown={resizingRectangle}
            />
        </div>
    );
};

export default CanvasDrawing;
