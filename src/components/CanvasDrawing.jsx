"use client"
import React, {useEffect, useRef, useState} from 'react';
import * as pdfJS from "pdfjs-dist/webpack.mjs";

const CanvasDrawing = () => {
    const canvasRef = useRef(null);
    const [pdfDoc, setPdfDoc] = useState(null);
    const [rectangles, setRectangles] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [selectedRectangle, setSelectedRectangle] = useState(null);
    const [updatedRect, setUpdatedRect] = useState(null);
    const [resizing, setResizing] = useState(false);
    const [resizingEdge, setResizingEdge] = useState(null);
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);
    const [textContents, setTextContents] = useState({});
    const [isRendering, setIsRendering] = useState(false);


    // Örnek kullanım
    const pdfUrl = '/uploaded-pdfs/S100F2425W0702-İMALAT-AD-29.04.2024-20.05.2024.pdf';
    const pageNum = 24

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
            setUpdatedRect({...selectedRectangle});
            if (!updatedRect) return
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
            setUpdatedRect(updatedRect)
        } else if (isDrawing) {
            setUpdatedRect(null)
            const rectWidth = mouseX - startX;
            const rectHeight = mouseY - startY;
            context.setLineDash([5, 3]); // Dashed line
            context.strokeStyle = 'red'; // Set stroke color to red
            context.strokeRect(startX, startY, rectWidth, rectHeight);
            context.setLineDash([]); // Reset to solid line
        }
        redrawRectangles(context);
    };

    const endDrawing = (e) => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (isDrawing) {
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
            extractTextFromRect(newRectangle)
            setIsDrawing(false);
        }

        setResizing(false);
        setSelectedRectangle(null);
        setResizingEdge(null);
        context.clearRect(0, 0, canvas.width, canvas.height);
        redrawRectangles(context);
        if (updatedRect) extractTextFromRect(updatedRect)

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
        renderPage(pdfDoc, pageNum);
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

    const drawRectangles = (ctx) => {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        rectangles.forEach(rect => {
            ctx.strokeRect(rect.startX, rect.startY, rect.rectWidth, rect.rectHeight);
        });

        if (selectedRectangle) {
            ctx.strokeRect(selectedRectangle.startX, selectedRectangle.startY, selectedRectangle.rectWidth, selectedRectangle.rectHeight);
        }
    };

    const renderPage = (pdf, num) => {
        if (!pdf) return;
        if (isRendering) return; // Eğer render işlemi devam ediyorsa çıkış yap

        setIsRendering(true); // Render işlemi başladığında durumu güncelleyin
        pdf.getPage(num).then(page => {
            const viewport = page.getViewport({scale: 1.5});
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };
            page.render(renderContext).promise.then(() => {
                drawRectangles(ctx);
                setIsRendering(false); // Render işlemi tamamlandığında durumu güncelleyin
            });
        });
    };


    const extractTextFromRect = async (rect) => {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({scale: 1});
        const textContent = await page.getTextContent();

        const scaleX = viewport.width / canvasRef.current.width;
        const scaleY = viewport.height / canvasRef.current.height;

        let scaledRect = {
            x: rect.startX * scaleX,
            y: rect.startY * scaleY,
            width: rect.rectWidth * scaleX,
            height: rect.rectHeight * scaleY
        };

        const textItems = textContent.items.filter(item => {
            let ty = item.transform[4]; // x pozisyonu
            let tx = item.transform[5]
            // Metin öğesinin koordinatları, dikdörtgenin içinde mi kontrol et
            return tx >= scaledRect.x &&
                tx <= scaledRect.x + scaledRect.width &&
                ty >= scaledRect.y &&
                ty <= scaledRect.y + scaledRect.height;
        });
        let row = 1
        let col = 1
        let lastItem = null
        let objectSortedTextItems = {}
        let maxHeaderSize = null

        for (let ti of textItems) {
            if (!lastItem) {
                let obj = {...ti, row, col}
                objectSortedTextItems[row + "_" + col] = {...ti,row,col};
                lastItem = {...ti,row,col}
                continue
            }
            ti.str = ti.str.trim()
            if (!!!ti.str && ti.width <= 150) continue

            /*En son elemanın ve şuanki elemanın x-y koordinatları belirlenir*/
            let lastItemY = lastItem.transform[4]
            let lastItemX = lastItem.transform[5]
            let itemY = ti.transform[4]
            let itemX = ti.transform[5]

            /* Row ve Col Değerleri set edilir*/
            if (itemX - lastItemX >= 35) col++
            if (itemY - lastItemY >= 20) {
                if (maxHeaderSize == null) {
                    maxHeaderSize = col
                }
                row++
                col = 1
            }

            if (itemX === lastItemX && itemY - lastItemY <= 7) {
                objectSortedTextItems[row + "_" + col] = {
                    ...lastItem,
                    str: lastItem.str + " " + ti.str,
                    row,
                    col
                }
                console.log("if ti",ti)
                console.log("if lastItem",lastItem)
            } else {
                objectSortedTextItems[row + "_" + col] = {...ti,row,col};
                console.log("else ti",ti)
                console.log("else lastItem",lastItem)
            }
            lastItem = {...ti,row,col}
        }
        console.log("objectSortedTextItems", objectSortedTextItems)


        const textData = textItems.map(item => item.str)

        setTextContents(prev => ({
            ...prev,
            [rect.id]: textData
        }));
    };


    useEffect(() => {
        const loadingTask = pdfJS.getDocument(pdfUrl);

        loadingTask.promise.then(pdf => {
            setPdfDoc(pdf);
            renderPage(pdf, pageNum);
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
            <div>
                {JSON.stringify(textContents)}
                {/*{textContents.map((text, index) => (*/}
                {/*    <div key={index}>*/}
                {/*        <h3>Rectangle {index + 1}:</h3>*/}
                {/*        <p>{JSON.stringify(text)}</p>*/}
                {/*    </div>*/}
                {/*))}*/}
            </div>
        </div>
    );
};

export default CanvasDrawing;
