import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from './supabase';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

interface UserReportData {
  profile: any;
  complaints: any[];
  bills: any[];
  serviceApplications: any[];
  payments: any[];
}

interface AdminReportData {
  stats: any;
  users: any[];
  complaints: any[];
  serviceApplications: any[];
  recentActivities: any[];
}

// Generate AI-powered summary
function generateAISummary(data: any, type: 'user' | 'admin'): string {
  if (type === 'user') {
    const totalComplaints = data.complaints?.length || 0;
    const resolvedComplaints = data.complaints?.filter((c: any) => c.status === 'resolved').length || 0;
    const pendingComplaints = totalComplaints - resolvedComplaints;
    const totalBills = data.bills?.length || 0;
    const paidBills = data.bills?.filter((b: any) => b.status === 'paid').length || 0;
    const totalApplications = data.serviceApplications?.length || 0;
    const approvedApplications = data.serviceApplications?.filter((a: any) => a.status === 'approved').length || 0;

    return `User Activity Summary:

This report provides a comprehensive overview of your interactions with SMART JANSEVA platform. 

Complaint Management: You have registered ${totalComplaints} complaint(s) across various departments. Out of these, ${resolvedComplaints} have been successfully resolved, while ${pendingComplaints} are currently being processed by the concerned authorities. Your active participation helps improve public services.

Bill Payments: You have ${totalBills} bill(s) in the system, with ${paidBills} successfully paid. Regular bill payments ensure uninterrupted service delivery.

Service Applications: You have submitted ${totalApplications} service application(s), with ${approvedApplications} approved. These applications demonstrate your engagement with government services.

Overall Performance: Your consistent use of the platform contributes to the Digital India initiative. Continue using SMART JANSEVA for seamless access to government services.`;
  } else {
    const totalUsers = data.stats?.totalUsers || 0;
    const totalComplaints = data.stats?.totalComplaints || 0;
    const pendingComplaints = data.stats?.pendingComplaints || 0;
    const resolvedRate = totalComplaints > 0 ? ((totalComplaints - pendingComplaints) / totalComplaints * 100).toFixed(1) : 0;

    return `Administrative Performance Summary:

This report provides insights into the SMART JANSEVA platform's operational efficiency.

User Engagement: The platform currently serves ${totalUsers} registered user(s), demonstrating growing adoption of digital government services.

Complaint Resolution: A total of ${totalComplaints} complaint(s) have been registered, with ${pendingComplaints} currently pending resolution. The system maintains a ${resolvedRate}% resolution rate, indicating effective grievance management.

Service Delivery: The platform continues to facilitate seamless access to government services, with multiple service applications being processed efficiently.

System Health: All modules are operational, and the platform is successfully supporting the Digital India initiative by providing citizens with convenient access to public services.

Recommendations: Continue monitoring pending complaints, enhance response times, and maintain high service quality standards.`;
  }
}

// Format date for display
function formatDate(date: string | null): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Format currency
function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-IN')}`;
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

const COLORS = {
  primary: [204, 85, 0] as [number, number, number],       // #cc5500 orange
  dark: [14, 13, 11] as [number, number, number],           // #0e0d0b
  gray: [122, 115, 104] as [number, number, number],        // #7a7368
  lightBg: [250, 250, 249] as [number, number, number],     // #fafaf9
  white: [255, 255, 255] as [number, number, number],
  green: [22, 163, 74] as [number, number, number],         // #16a34a
  border: [230, 230, 225] as [number, number, number],
};

// Add header to PDF
function addPDFHeader(doc: jsPDF, title: string, logoBase64: string | null) {
  const pageW = doc.internal.pageSize.width;
  const margin = 14;

  // Top Accent Bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageW, 5, 'F');

  let y = 14;

  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', margin, y, 18, 18);
    } catch {
      // fallback if image fails
    }
  }

  const logoOffset = logoBase64 ? 22 : 0;

  // Add title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('SMART JANSEVA', margin + logoOffset, y + 8);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.gray);
  doc.text('Smart Governance Platform  •  Government of India', margin + logoOffset, y + 14);

  // Add report title on right
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text(title.toUpperCase(), pageW - margin, y + 8, { align: 'right' });

  // Add generation date
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.gray);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, pageW - margin, y + 13, { align: 'right' });

  // Divider
  y = 38;
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);

  return 45; // Return Y position for content start
}

// Add footer to PDF
function addPDFFooter(doc: jsPDF, pageNumber: number) {
  const pageHeight = doc.internal.pageSize.height;
  const pageW = doc.internal.pageSize.width;
  const margin = 14;
  const footerY = pageHeight - 22;

  doc.setDrawColor(...COLORS.border);
  doc.line(margin, footerY, pageW - margin, footerY);

  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160, 160, 160);
  doc.text(`Page ${pageNumber}`, pageW / 2, footerY + 5, { align: 'center' });
  doc.text('Smart Janseva  |  Smart Governance Platform  |  Government of India', pageW / 2, footerY + 9, { align: 'center' });
  doc.text('support@smartjanseva.gov.in  |  www.smartjanseva.gov.in', pageW / 2, footerY + 13, { align: 'center' });

  // Bottom accent
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, pageHeight - 4, pageW, 4, 'F');
}

// Generate User Report
export async function generateUserReport(userId: string): Promise<void> {
  try {
    // Fetch all user data
    const [profileResult, complaintsResult, billsResult, applicationsResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('complaints').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('bills').select('*, utility_services(*)').eq('user_id', userId).order('due_date', { ascending: false }),
      supabase.from('service_applications').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);

    const reportData: UserReportData = {
      profile: profileResult.data,
      complaints: complaintsResult.data || [],
      bills: billsResult.data || [],
      serviceApplications: applicationsResult.data || [],
      payments: [],
    };

    // Create PDF
    const doc = new jsPDF();
    const logoBase64 = await loadLogoBase64();
    let yPos = addPDFHeader(doc, 'Citizen Activity Report', logoBase64);

    // User Information
    yPos += 5;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Personal Information', 14, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${reportData.profile?.full_name || 'N/A'}`, 14, yPos);
    yPos += 6;
    doc.text(`Email: ${reportData.profile?.email || 'N/A'}`, 14, yPos);
    yPos += 6;
    doc.text(`Phone: ${reportData.profile?.phone || 'N/A'}`, 14, yPos);
    yPos += 6;
    doc.text(`Role: ${reportData.profile?.role || 'Citizen'}`, 14, yPos);
    yPos += 10;

    // AI Summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Activity Summary', 14, yPos);
    yPos += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const summary = generateAISummary(reportData, 'user');
    const summaryLines = doc.splitTextToSize(summary, 180);
    doc.text(summaryLines, 14, yPos);
    yPos += summaryLines.length * 4 + 10;

    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // Complaints Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Complaints Registered', 14, yPos);
    yPos += 5;

    if (reportData.complaints.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Complaint #', 'Category', 'Title', 'Status', 'Date', 'Priority']],
        body: reportData.complaints.map(c => [
          c.complaint_number || 'N/A',
          c.category || 'N/A',
          c.title?.substring(0, 30) || 'N/A',
          c.status || 'N/A',
          formatDate(c.created_at),
          c.priority || 'N/A',
        ]),
        theme: 'grid',
        headStyles: { fillColor: [0, 51, 102] },
        styles: { fontSize: 8 },
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text('No complaints registered', 14, yPos + 5);
      yPos += 15;
    }

    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // Bills Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Bills Overview', 14, yPos);
    yPos += 5;

    if (reportData.bills.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Bill #', 'Service', 'Amount', 'Due Date', 'Status']],
        body: reportData.bills.map(b => [
          b.bill_number || 'N/A',
          b.utility_services?.service_name || b.service_type || 'N/A',
          formatCurrency(b.amount || 0),
          formatDate(b.due_date),
          b.status || 'N/A',
        ]),
        theme: 'grid',
        headStyles: { fillColor: [0, 51, 102] },
        styles: { fontSize: 8 },
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text('No bills found', 14, yPos + 5);
      yPos += 15;
    }

    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // Service Applications Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Service Applications', 14, yPos);
    yPos += 5;

    if (reportData.serviceApplications.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Application #', 'Service Type', 'Service Name', 'Status', 'Date']],
        body: reportData.serviceApplications.map(a => [
          a.application_number || 'N/A',
          a.service_type || 'N/A',
          a.service_name?.substring(0, 30) || 'N/A',
          a.status || 'N/A',
          formatDate(a.created_at),
        ]),
        theme: 'grid',
        headStyles: { fillColor: [0, 51, 102] },
        styles: { fontSize: 8 },
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text('No service applications found', 14, yPos + 5);
      yPos += 15;
    }

    // Add footer to all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      addPDFFooter(doc, i);
    }

    // Save PDF
    const fileName = `SMART_JANSEVA_User_Report_${reportData.profile?.full_name?.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error generating user report:', error);
    throw error;
  }
}

// Generate Admin Report
export async function generateAdminReport(): Promise<void> {
  try {
    // Fetch all admin data
    const [usersResult, complaintsResult, applicationsResult, statsResult] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('complaints').select('*, profiles!complaints_user_id_fkey(full_name)').order('created_at', { ascending: false }),
      supabase.from('service_applications').select('*, profiles!service_applications_user_id_fkey(full_name)').order('created_at', { ascending: false }),
      Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('complaints').select('id', { count: 'exact', head: true }),
        supabase.from('bills').select('id', { count: 'exact', head: true }),
        supabase.from('service_applications').select('id', { count: 'exact', head: true }),
      ]),
    ]);

    const reportData: AdminReportData = {
      stats: {
        totalUsers: statsResult[0].count || 0,
        totalComplaints: statsResult[1].count || 0,
        totalBills: statsResult[2].count || 0,
        totalServices: statsResult[3].count || 0,
      },
      users: usersResult.data || [],
      complaints: complaintsResult.data || [],
      serviceApplications: applicationsResult.data || [],
      recentActivities: [],
    };

    // Create PDF
    const doc = new jsPDF();
    const logoBase64 = await loadLogoBase64();
    let yPos = addPDFHeader(doc, 'Administrative Report', logoBase64);

    // System Statistics
    yPos += 5;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('System Statistics', 14, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Users: ${reportData.stats.totalUsers}`, 14, yPos);
    yPos += 6;
    doc.text(`Total Complaints: ${reportData.stats.totalComplaints}`, 14, yPos);
    yPos += 6;
    doc.text(`Total Bills: ${reportData.stats.totalBills}`, 14, yPos);
    yPos += 6;
    doc.text(`Total Service Applications: ${reportData.stats.totalServices}`, 14, yPos);
    yPos += 10;

    // AI Summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Performance Summary', 14, yPos);
    yPos += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const summary = generateAISummary(reportData, 'admin');
    const summaryLines = doc.splitTextToSize(summary, 180);
    doc.text(summaryLines, 14, yPos);
    yPos += summaryLines.length * 4 + 10;

    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // Users Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Registered Users', 14, yPos);
    yPos += 5;

    if (reportData.users.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Name', 'Email', 'Phone', 'Role', 'Registered On']],
        body: reportData.users.slice(0, 50).map(u => [
          u.full_name || 'N/A',
          u.email || 'N/A',
          u.phone || 'N/A',
          u.role || 'N/A',
          formatDate(u.created_at),
        ]),
        theme: 'grid',
        headStyles: { fillColor: [0, 51, 102] },
        styles: { fontSize: 8 },
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // Complaints Summary by Status
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Complaints Overview', 14, yPos);
    yPos += 5;

    const complaintsByStatus: Record<string, number> = {};
    reportData.complaints.forEach(c => {
      complaintsByStatus[c.status] = (complaintsByStatus[c.status] || 0) + 1;
    });

    if (Object.keys(complaintsByStatus).length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Status', 'Count']],
        body: Object.entries(complaintsByStatus).map(([status, count]) => [status, count.toString()]),
        theme: 'grid',
        headStyles: { fillColor: [0, 51, 102] },
        styles: { fontSize: 9 },
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // Recent Complaints Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Recent Complaints (Last 20)', 14, yPos);
    yPos += 5;

    if (reportData.complaints.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Complaint #', 'User', 'Category', 'Status', 'Priority', 'Date']],
        body: reportData.complaints.slice(0, 20).map(c => [
          c.complaint_number || 'N/A',
          (c.profiles as any)?.full_name || 'N/A',
          c.category || 'N/A',
          c.status || 'N/A',
          c.priority || 'N/A',
          formatDate(c.created_at),
        ]),
        theme: 'grid',
        headStyles: { fillColor: [0, 51, 102] },
        styles: { fontSize: 7 },
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // Service Applications Summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Service Applications (Last 20)', 14, yPos);
    yPos += 5;

    if (reportData.serviceApplications.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Application #', 'User', 'Service Type', 'Status', 'Date']],
        body: reportData.serviceApplications.slice(0, 20).map(a => [
          a.application_number || 'N/A',
          (a.profiles as any)?.full_name || 'N/A',
          a.service_type || 'N/A',
          a.status || 'N/A',
          formatDate(a.created_at),
        ]),
        theme: 'grid',
        headStyles: { fillColor: [0, 51, 102] },
        styles: { fontSize: 7 },
      });
    }

    // Add footer to all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      addPDFFooter(doc, i);
    }

    // Save PDF
    const fileName = `SMART_JANSEVA_Admin_Report_${new Date().getTime()}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error generating admin report:', error);
    throw error;
  }
}
