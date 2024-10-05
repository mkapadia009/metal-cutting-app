const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const orderSummary = document.getElementById('order-summary');
const remainingAreaText = document.getElementById('remaining-area');

let mainSheet = {};
let clientOrders = [];

// Function to add order
function addOrder() {
    const mainLength = parseFloat(document.getElementById('main-length').value);
    const mainWidth = parseFloat(document.getElementById('main-width').value);
    const mainThickness = parseFloat(document.getElementById('main-thickness').value); // Capture thickness

    if (!mainSheet.length || !mainSheet.width) {
        mainSheet = { length: mainLength, width: mainWidth, thickness: mainThickness };
    }

    const clientName = document.getElementById('client-name').value;
    const orderLength = parseFloat(document.getElementById('order-length').value);
    const orderWidth = parseFloat(document.getElementById('order-width').value);

    clientOrders.push({ clientName, length: orderLength, width: orderWidth });
    updateOrderSummary();
    drawCanvas();
}

// Function to update order summary
function updateOrderSummary() {
    orderSummary.innerHTML = '';
    clientOrders.forEach(order => {
        const li = document.createElement('li');
        li.textContent = `${order.clientName}: ${order.length}mm x ${order.width}mm`;
        orderSummary.appendChild(li);
    });
}

// Function to draw on canvas
function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    canvas.width = 600; // Set a fixed width for canvas
    canvas.height = 400; // Set a fixed height for canvas
    const scaleFactor = Math.min(canvas.width / mainSheet.length, canvas.height / mainSheet.width);

    // Draw the main sheet
    ctx.strokeStyle = '#333';
    ctx.strokeRect(0, 0, mainSheet.length * scaleFactor, mainSheet.width * scaleFactor);

    // Place client orders on the main sheet
    const packedOrders = packRectangles(clientOrders, mainSheet);
    let totalAreaUsed = 0;

    packedOrders.forEach(order => {
        const x = order.x * scaleFactor;
        const y = order.y * scaleFactor;
        const length = order.length * scaleFactor;
        const width = order.width * scaleFactor;

        totalAreaUsed += order.length * order.width;

        // Draw the rectangle
        ctx.fillStyle = '#007bff';
        ctx.fillRect(x, y, length, width);
        ctx.strokeRect(x, y, length, width);

        // Calculate font size based on rectangle size
        ctx.fillStyle = '#fff';
        const fontSize = Math.min(length / 10, width / 5); // Adjust font size
        ctx.font = `${fontSize}px Arial`;
        ctx.fillText(order.clientName, x + 5, y + fontSize + 5); // Write client name inside the rectangle

        // Draw dimensions inside the rectangle
        const dimText = `${order.length}mm x ${order.width}mm`;
        ctx.fillText(dimText, x + 5, y + fontSize * 2); // Write dimensions inside
    });

    // Calculate remaining area
    const mainSheetArea = mainSheet.length * mainSheet.width;
    const remainingArea = mainSheetArea - totalAreaUsed;

    remainingAreaText.textContent = `Remaining Area: ${remainingArea} mm²`;
}

// Function to optimally pack rectangles onto the main sheet
function packRectangles(rectangles, sheet) {
    const packed = [];
    let currentX = 0, currentY = 0, rowHeight = 0;

    rectangles.forEach(rect => {
        if (currentX + rect.length <= sheet.length) {
            packed.push({ ...rect, x: currentX, y: currentY });
            currentX += rect.length;
            rowHeight = Math.max(rowHeight, rect.width);
        } else if (currentY + rowHeight + rect.width <= sheet.width) {
            currentX = 0;
            currentY += rowHeight;
            rowHeight = rect.width;
            packed.push({ ...rect, x: currentX, y: currentY });
            currentX += rect.length;
        } else {
            alert(`Order for ${rect.clientName} doesn't fit.`);
        }
    });

    return packed;
}

// Function to export orders to Excel
function exportToExcel() {
    const worksheet = XLSX.utils.json_to_sheet(clientOrders.map(order => ({
        Client: order.clientName,
        Length: order.length,
        Width: order.width,
        MainSheetLength: mainSheet.length,
        MainSheetWidth: mainSheet.width,
        MainSheetThickness: mainSheet.thickness // Include thickness
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');

    // Save to Excel file
    XLSX.writeFile(workbook, 'metal_sheet_orders.xlsx');
}
