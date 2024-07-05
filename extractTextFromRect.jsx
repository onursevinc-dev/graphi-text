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
    let objectHeaders = {}
    let sortedHeaders = {}
    let body = {}
    let lastItem = null
    let rowCount = 1
    let columnCount = 1
    let maxHeaderSize = null
    for (let ti of textItems) {
        ti.str = ti.str.trim()
        if (!lastItem) {
            objectHeaders[rowCount + "_" + columnCount] = ti;
        } else {
            if (!ti.str && ti.width <= 150) continue
            if (!ti.str) {
                ti.str = lastItem.str+"~~~"
            }
            let lastItemY = lastItem.transform[4]
            let lastItemX = lastItem.transform[5]

            let itemY = ti.transform[4]
            let itemX = ti.transform[5]
            if (itemX - lastItemX >= 35) columnCount++
            if (itemY - lastItemY >= 20) {
                if (maxHeaderSize == null) {
                    maxHeaderSize = columnCount
                }
                rowCount++
                columnCount = 1
            }

            /*Buradaki kontrolde alt eleman mı yani metnin devamı kontrolü yapılıyor entere basılmış gibi mi*/
            if (itemX === lastItemX && itemY - lastItemY <= 7) {
                objectHeaders[rowCount + "_" + columnCount] = {
                    ...lastItem,
                    str: lastItem.str.trim() + " " + ti.str,
                    rowCount,
                    columnCount
                }
                lastItem = ti
                continue
            }
            objectHeaders[rowCount + "_" + columnCount] = {...ti, rowCount, columnCount};
        }
        lastItem = ti
    }
    console.log("objectHeaders", objectHeaders)

    /*


            for (let key in objectHeaders) {
                let oh = objectHeaders[key]
                sortedHeaders[oh.rowCount + "_" + oh.columnCount] = oh
            }

            let data = []
            for (let row = 1; row <= rowCount; row++) {
                let rowData = []
                for (let col = 1; col<= maxHeaderSize; col++) {
                    let sh = sortedHeaders[row + "_" + col]
                    rowData.push(sh)
                }
                data.push(rowData)
            }

     */


    const textData = textItems.map(item => item.str)
    const cleanedData = textData.filter(value => value !== "");

    setTextContents(prev => ({
        ...prev,
        [rect.id]: cleanedData
    }));
};