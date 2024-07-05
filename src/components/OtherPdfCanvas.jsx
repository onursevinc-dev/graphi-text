"use client"
import React, {useRef, useEffect, useState} from 'react';
import * as pdfjsLib from 'pdfjs-dist/webpack.mjs';
import 'pdfjs-dist/web/pdf_viewer.css';

const App = () => {
    const canvasRef = useRef(null);
    const [pdfDoc, setPdfDoc] = useState(null);
    const [selectedRectangle, setSelectedRectangle] = useState(null);
    const [rectangles, setRectangles] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentRect, setCurrentRect] = useState(null);
    const [resizing, setResizing] = useState(false);
    const [textContents, setTextContents] = useState([]);
    const pdfUrl = '/uploaded-pdfs/S100F2425W0702-İMALAT-AD-29.04.2024-20.05.2024.pdf';
    const pageNum = 24

    useEffect(() => {
        const url = pdfUrl; // PDF dosyanızın URL'si
        const loadingTask = pdfjsLib.getDocument(url);

        loadingTask.promise.then(pdf => {
            setPdfDoc(pdf);
            renderPage(pdf, pageNum);
        });
    }, []);

    const renderPage = (pdf, num) => {
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
            });
        });
    };

    const drawRectangles = (ctx) => {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        rectangles.forEach(rect => {
            ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        });

        if (currentRect) {
            ctx.strokeRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
        }
    };

    const handleMouseDown = (e) => {
        // Check if clicking on a rectangle to resize
        const mouseX = e.nativeEvent.offsetX;
        const mouseY = e.nativeEvent.offsetY;
        const clickedRect = rectangles.find(rect => {
            return mouseX >= rect.x && mouseX <= rect.x + rect.width &&
                mouseY >= rect.y && mouseY <= rect.y + rect.height;
        });
        if (clickedRect) {
            setSelectedRectangle(clickedRect);
            setCurrentRect(clickedRect)
            setResizing(true);
        }else{
            setSelectedRectangle(null)
            setResizing(false)
        }
        console.log("clickedRect", clickedRect)
        console.log("rectangles", rectangles)
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setCurrentRect({id: rectangles.length + 1, x, y, width: 0, height: 0});
        setIsDrawing(true);
        setResizing(false);

    };

    const handleMouseMove = (e) => {
        const mouseX = e.nativeEvent.offsetX;
        const mouseY = e.nativeEvent.offsetY;
        let edge = null
        const hoveredRect = rectangles.find(rect => isMouseOnRectEdge(mouseX, mouseY));
        console.log("hoveredRect", hoveredRect)
        if (hoveredRect) {
            edge = getResizingEdge(hoveredRect, mouseX, mouseY);
            console.log("edge", edge)
            canvasRef.current.style.cursor = getCursorForEdge(edge) || 'default';
        }

        if (!isDrawing) return;

        if (selectedRectangle) {
            const updatedRect = {...selectedRectangle};
            switch (edge) {
                case 'top-left':
                    updatedRect.x = mouseX;
                    updatedRect.y = mouseY;
                    updatedRect.width += (selectedRectangle.x - mouseX);
                    updatedRect.height += (selectedRectangle.y - mouseY);
                    break;
                case 'top-right':
                    updatedRect.y = mouseY;
                    updatedRect.width = mouseX - selectedRectangle.x;
                    updatedRect.height += (selectedRectangle.y - mouseY);
                    break;
                case 'bottom-left':
                    updatedRect.x = mouseX;
                    updatedRect.width += (selectedRectangle.x - mouseX);
                    updatedRect.height = mouseY - selectedRectangle.y;
                    break;
                case 'bottom-right':
                    updatedRect.width = mouseX - selectedRectangle.x;
                    updatedRect.height = mouseY - selectedRectangle.y;
                    break;
                case 'right':
                    updatedRect.width = mouseX - selectedRectangle.x;
                    break;
                case 'left':
                    updatedRect.x = mouseX;
                    updatedRect.width += (selectedRectangle.x - mouseX);
                    break;
                case 'top':
                    updatedRect.y = mouseY;
                    updatedRect.height += (selectedRectangle.y - mouseY);
                    break;
                case 'bottom':
                    updatedRect.height = mouseY - selectedRectangle.y;
                    break;
                default:
                    break;
            }
            const updatedRectangles = rectangles.map(rect =>
                rect.id === selectedRectangle.id ? updatedRect : rect
            );

            setRectangles(updatedRectangles);
            console.log("if")
        } else {
            console.log("else")
            const rect = canvasRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            setCurrentRect(prev => ({
                ...prev,
                width: x - prev.x,
                height: y - prev.y
            }));

        }
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        renderPage(pdfDoc, pageNum);
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
        if (currentRect.width != 0 || currentRect.height != 0) {
            setRectangles(prev => [...prev, currentRect]);
            extractTextFromRect(currentRect);
            setCurrentRect(null);
        }
    };

    const isMouseOnRectEdge = (mouseX, mouseY) => {
        const edgeSize = 8;
        if (!selectedRectangle) return
        return (
            mouseX >= selectedRectangle.x - edgeSize && mouseX <= selectedRectangle.x + selectedRectangle.width + edgeSize &&
            mouseY >= selectedRectangle.y - edgeSize && mouseY <= selectedRectangle.y + selectedRectangle.height + edgeSize
        );
    };

    const getResizingEdge = (rect, mouseX, mouseY) => {
        const edgeSize = 8; // Edge size for resizing
        if (
            mouseX >= rect.x && mouseX <= rect.x + edgeSize &&
            mouseY >= rect.y && mouseY <= rect.y + edgeSize
        ) {
            return 'top-left';
        } else if (
            mouseX >= rect.x + rect.width - edgeSize && mouseX <= rect.x + rect.width &&
            mouseY >= rect.y && mouseY <= rect.y + edgeSize
        ) {
            return 'top-right';
        } else if (
            mouseX >= rect.x && mouseX <= rect.x + edgeSize &&
            mouseY >= rect.y + rect.height - edgeSize && mouseY <= rect.y + rect.height
        ) {
            return 'bottom-left';
        } else if (
            mouseX >= rect.x + rect.width - edgeSize && mouseX <= rect.x + rect.width &&
            mouseY >= rect.y + rect.height - edgeSize && mouseY <= rect.y + rect.height
        ) {
            return 'bottom-right';
        } else if (mouseX >= rect.x + rect.width - edgeSize && mouseX <= rect.x + rect.width) {
            return 'right';
        } else if (mouseX >= rect.x && mouseX <= rect.x + edgeSize) {
            return 'left';
        } else if (mouseY >= rect.y && mouseY <= rect.y + edgeSize) {
            return 'top';
        } else if (mouseY >= rect.y + rect.height - edgeSize && mouseY <= rect.y + rect.height) {
            return 'bottom';
        }
        return null;
    };

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

    const extractTextFromRect = async (rect) => {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({scale: 1});
        const textContent = await page.getTextContent();

        const scaleX = viewport.width / canvasRef.current.width;
        const scaleY = viewport.height / canvasRef.current.height;

        let scaledRect = {
            x: rect.x * scaleX,
            y: rect.y * scaleY,
            width: rect.width * scaleX,
            height: rect.height * scaleY
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

        const text = textItems.map(item => item.str).join(' ');
        setTextContents(prev => [...prev, text]);
    };


    return (
        <div>
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                style={{border: '1px solid black'}}
            />
            <div>
                {textContents.map((text, index) => (
                    <div key={index}>
                        <h3>Rectangle {index + 1}:</h3>
                        <p>{text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default App;
