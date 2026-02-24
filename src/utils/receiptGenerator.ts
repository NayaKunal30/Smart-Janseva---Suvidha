import jsPDF from 'jspdf';

export interface ReceiptData {
    billNumber: string;
    transactionId: string;
    amount: number;
    serviceName: string;
    serviceType: string;
    providerName: string;
    month: string;
    dueDate: string;
    paidAt: string;
    payerName: string;
    payerEmail: string;
    paymentMethod: string;
}

// Load logo as base64 from public folder
async function loadLogoBase64(): Promise<string | null> {
    try {
        const response = await fetch('/logo.png');
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

// Colors matching the app theme
const COLORS = {
    primary: [204, 85, 0] as [number, number, number],       // #cc5500 orange
    dark: [14, 13, 11] as [number, number, number],           // #0e0d0b
    gray: [122, 115, 104] as [number, number, number],        // #7a7368
    lightBg: [250, 250, 249] as [number, number, number],     // #fafaf9
    white: [255, 255, 255] as [number, number, number],
    green: [22, 163, 74] as [number, number, number],         // #16a34a
    border: [230, 230, 225] as [number, number, number],
};

export async function generatePaymentReceipt(data: ReceiptData): Promise<void> {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.width;
    const pageH = doc.internal.pageSize.height;
    const margin = 18;
    const contentW = pageW - margin * 2;

    // Load logo
    const logoBase64 = await loadLogoBase64();

    // ═══════════════════════════════════════════
    // TOP ACCENT BAR
    // ═══════════════════════════════════════════
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, pageW, 5, 'F');

    // ═══════════════════════════════════════════
    // HEADER WITH LOGO
    // ═══════════════════════════════════════════
    let y = 14;

    if (logoBase64) {
        try {
            doc.addImage(logoBase64, 'PNG', margin, y, 18, 18);
        } catch {
            // fallback if image fails
        }
    }

    const logoOffset = logoBase64 ? 22 : 0;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text('SMART JANSEVA', margin + logoOffset, y + 8);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray);
    doc.text('Smart Governance Platform  •  Government of India', margin + logoOffset, y + 14);

    // Receipt label on right
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text('PAYMENT RECEIPT', pageW - margin, y + 8, { align: 'right' });

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, pageW - margin, y + 13, { align: 'right' });

    // ═══════════════════════════════════════════
    // DIVIDER
    // ═══════════════════════════════════════════
    y = 38;
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageW - margin, y);

    // ═══════════════════════════════════════════
    // TITLE BAR
    // ═══════════════════════════════════════════
    y = 43;
    doc.setFillColor(...COLORS.lightBg);
    doc.roundedRect(margin, y, contentW, 12, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text('OFFICIAL PAYMENT RECEIPT', pageW / 2, y + 8, { align: 'center' });

    // ═══════════════════════════════════════════
    // TRANSACTION INFO
    // ═══════════════════════════════════════════
    y = 62;
    const colLeft = margin;
    const colRight = pageW / 2 + 5;
    const rowH = 14;

    const drawField = (label: string, value: string, x: number, yPos: number, maxW = 75) => {
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.gray);
        doc.text(label.toUpperCase(), x, yPos);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.dark);
        // Truncate if too long
        let displayVal = value;
        while (doc.getTextWidth(displayVal) > maxW && displayVal.length > 3) {
            displayVal = displayVal.slice(0, -4) + '...';
        }
        doc.text(displayVal, x, yPos + 5.5);
    };

    drawField('Transaction ID', data.transactionId, colLeft, y, 80);
    drawField('Payment Date', data.paidAt ? new Date(data.paidAt).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : new Date().toLocaleDateString('en-IN'), colRight, y);

    y += rowH;
    drawField('Payment Method', data.paymentMethod === 'upi' ? 'UPI' : data.paymentMethod === 'stripe' ? 'Card (Stripe)' : 'Online', colLeft, y);
    drawField('Payment Status', 'COMPLETED', colRight, y);

    // ═══════════════════════════════════════════
    // BILL DETAILS SECTION
    // ═══════════════════════════════════════════
    y += rowH + 3;
    doc.setDrawColor(...COLORS.border);
    doc.line(margin, y, pageW - margin, y);
    y += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text('Bill Information', margin, y);
    y += 8;

    drawField('Bill Number', data.billNumber, colLeft, y);
    drawField('Billing Period', data.month || 'Current Cycle', colRight, y);

    y += rowH;
    drawField('Service', data.serviceName, colLeft, y);
    drawField('Service Type', (data.serviceType || 'utility').toUpperCase(), colRight, y);

    y += rowH;
    drawField('Provider', data.providerName || 'Smart Janseva Municipal Corp', colLeft, y, 80);
    drawField('Due Date', data.dueDate ? new Date(data.dueDate).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'N/A', colRight, y);

    // ═══════════════════════════════════════════
    // PAYER DETAILS
    // ═══════════════════════════════════════════
    y += rowH + 3;
    doc.setDrawColor(...COLORS.border);
    doc.line(margin, y, pageW - margin, y);
    y += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text('Payer Details', margin, y);
    y += 8;

    drawField('Name', data.payerName || 'Citizen', colLeft, y);
    drawField('Email', data.payerEmail || 'N/A', colRight, y, 80);

    // ═══════════════════════════════════════════
    // AMOUNT BOX
    // ═══════════════════════════════════════════
    y += rowH + 8;
    doc.setFillColor(...COLORS.dark);
    doc.roundedRect(margin, y, contentW, 22, 3, 3, 'F');

    doc.setTextColor(...COLORS.white);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('TOTAL AMOUNT PAID', margin + 8, y + 9);

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    const amountStr = `Rs. ${data.amount.toLocaleString('en-IN')}`;
    doc.text(amountStr, pageW - margin - 8, y + 15, { align: 'right' });

    // ═══════════════════════════════════════════
    // PAID STAMP
    // ═══════════════════════════════════════════
    y += 30;
    doc.setFillColor(...COLORS.green);
    doc.roundedRect(pageW / 2 - 28, y, 56, 12, 2, 2, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('PAID SUCCESSFULLY', pageW / 2, y + 8, { align: 'center' });

    // ═══════════════════════════════════════════
    // FOOTER
    // ═══════════════════════════════════════════
    const footerY = pageH - 22;
    doc.setDrawColor(...COLORS.border);
    doc.line(margin, footerY, pageW - margin, footerY);

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(160, 160, 160);
    doc.text('This is a computer-generated receipt and does not require a signature.', pageW / 2, footerY + 5, { align: 'center' });
    doc.text('Smart Janseva  |  Smart Governance Platform  |  Government of India', pageW / 2, footerY + 9, { align: 'center' });
    doc.text('support@smartjanseva.gov.in  |  www.smartjanseva.gov.in', pageW / 2, footerY + 13, { align: 'center' });

    // Bottom accent
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, pageH - 4, pageW, 4, 'F');

    // Save
    const safeBillNum = (data.billNumber || 'receipt').replace(/[^a-zA-Z0-9-]/g, '_');
    doc.save(`SmartJanseva_Receipt_${safeBillNum}.pdf`);
}
