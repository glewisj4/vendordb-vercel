import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { type Vendor, type Representative } from '@shared/schema';

interface ExportOptions {
  title?: string;
  includeContacts?: boolean;
  includeCategories?: boolean;
  orientation?: 'portrait' | 'landscape';
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export function exportVendorsToPDF(
  vendors: Vendor[], 
  representatives: Representative[] = [],
  options: ExportOptions = {}
) {
  const {
    title = 'LowesPro Vendor Directory',
    includeContacts = true,
    includeCategories = true,
    orientation = 'landscape',
    sortField = 'companyName',
    sortOrder = 'asc'
  } = options;

  // Apply sorting to match webpage
  const sortedVendors = [...vendors].sort((a, b) => {
    let aValue = '', bValue = '';
    
    switch (sortField) {
      case 'vendorNumber':
        aValue = a.vendorNumber || '';
        bValue = b.vendorNumber || '';
        break;
      case 'companyName':
        aValue = a.companyName;
        bValue = b.companyName;
        break;
      case 'phone':
        aValue = a.phone || '';
        bValue = b.phone || '';
        break;
      case 'email':
        aValue = a.email || '';
        bValue = b.email || '';
        break;
      default:
        aValue = a.companyName;
        bValue = b.companyName;
    }
    
    const comparison = aValue.localeCompare(bValue);
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Create PDF with letter size (8.5" x 11")
  const doc = new jsPDF({
    orientation: orientation,
    unit: 'in',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 0.4;

  // Add header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, 0.75, { align: 'center' });

  // Add date and vendor count
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const today = new Date().toLocaleDateString();
  doc.text(`Generated: ${today}`, margin, 1.1);
  doc.text(`Total Vendors: ${sortedVendors.length}`, pageWidth - margin, 1.1, { align: 'right' });

  // Prepare table data
  const tableData = sortedVendors.map(vendor => {
    const vendorReps = representatives.filter(rep => rep.vendorId === vendor.id);
    const primaryContact = vendorReps.length > 0 ? vendorReps[0] : null;
    
    const row = [
      vendor.vendorNumber || 'N/A',
      vendor.companyName,
      vendor.phone || 'N/A',
      vendor.email || 'N/A'
    ];

    // Add sales rep info
    if (includeContacts && primaryContact) {
      row.push(primaryContact.name);
      row.push(primaryContact.cellPhone || 'N/A');
      row.push(primaryContact.email || 'N/A');
    } else if (includeContacts) {
      row.push('No Rep Assigned');
      row.push('N/A');
      row.push('N/A');
    }

    // Add categories
    if (includeCategories) {
      const categories = Array.isArray(vendor.categories) && vendor.categories.length > 0 
        ? vendor.categories.slice(0, 2).join(', ') + (vendor.categories.length > 2 ? '...' : '')
        : 'None';
      row.push(categories);
    }

    // Add services column last
    const services = Array.isArray(vendor.services) && vendor.services.length > 0 
      ? vendor.services.slice(0, 2).join(', ') + (vendor.services.length > 2 ? '...' : '')
      : 'None';
    row.push(services);

    return row;
  });

  // Define columns based on options
  const columns = [
    { header: 'Vendor #', dataKey: 'vendorNumber' },
    { header: 'Company Name', dataKey: 'companyName' },
    { header: 'Phone', dataKey: 'phone' },
    { header: 'Email', dataKey: 'email' }
  ];

  if (includeContacts) {
    columns.push(
      { header: 'Sales Rep', dataKey: 'salesRep' },
      { header: 'Rep Phone', dataKey: 'repPhone' },
      { header: 'Rep Email', dataKey: 'repEmail' }
    );
  }

  if (includeCategories) {
    columns.push({ header: 'Categories', dataKey: 'categories' });
  }

  columns.push({ header: 'Services', dataKey: 'services' });

  // Generate table with auto-sizing
  autoTable(doc, {
    head: [columns.map(col => col.header)],
    body: tableData,
    startY: 1.4,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 7,
      cellPadding: 0.03,
      lineColor: [200, 200, 200],
      lineWidth: 0.01,
      halign: 'left',
      valign: 'middle',
      overflow: 'linebreak',
      cellWidth: 'wrap',
    },
    headStyles: {
      fillColor: [41, 128, 185], // Blue header
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245], // Light gray for alternate rows
    },
    columnStyles: {
      0: { cellWidth: 0.6 }, // Vendor #
      1: { cellWidth: 1.8 }, // Company Name
      2: { cellWidth: 0.9 }, // Phone
      3: { cellWidth: 1.3 }, // Email
      ...(includeContacts ? {
        4: { cellWidth: 1.2 }, // Sales Rep
        5: { cellWidth: 0.9 }, // Rep Phone
        6: { cellWidth: 1.2 }, // Rep Email
      } : {}),
      ...(includeCategories ? {
        [includeContacts ? 7 : 4]: { cellWidth: 1.3 } // Categories
      } : {}),
      [includeContacts && includeCategories ? 8 : includeContacts ? 7 : includeCategories ? 5 : 4]: { 
        cellWidth: 1.2 
      } // Services (last column)
    },
    didDrawPage: (data) => {
      // Add page numbers
      const pageNum = (doc as any).internal.getCurrentPageInfo().pageNumber;
      const totalPages = (doc as any).internal.pages.length - 1;
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Page ${pageNum} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 0.3,
        { align: 'center' }
      );
      
      // Add footer
      doc.text(
        'LowesPro Vendor Management System',
        margin,
        pageHeight - 0.3
      );
    },
  });

  return doc;
}

export function exportRepresentativesToPDF(representatives: Representative[], vendors: Vendor[] = [], sortField: string = 'name', sortOrder: 'asc' | 'desc' = 'asc') {
  // Apply sorting to match webpage
  const sortedRepresentatives = [...representatives].sort((a, b) => {
    let aValue = '', bValue = '';
    
    switch (sortField) {
      case 'name':
        aValue = a.name;
        bValue = b.name;
        break;
      case 'vendorName':
        aValue = a.vendorName || '';
        bValue = b.vendorName || '';
        break;
      case 'position':
        aValue = a.position || '';
        bValue = b.position || '';
        break;
      default:
        aValue = a.name;
        bValue = b.name;
    }
    
    const comparison = aValue.localeCompare(bValue);
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 0.5;

  // Add header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('LowesPro Sales Representatives Directory', pageWidth / 2, 0.75, { align: 'center' });

  // Add date and count
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const today = new Date().toLocaleDateString();
  doc.text(`Generated: ${today}`, margin, 1.1);
  doc.text(`Total Representatives: ${sortedRepresentatives.length}`, pageWidth - margin, 1.1, { align: 'right' });

  // Prepare table data
  const tableData = sortedRepresentatives.map(rep => [
    rep.name,
    rep.vendorName || 'N/A',
    rep.position || 'Sales Representative',
    rep.cellPhone || 'N/A',
    rep.email || 'N/A'
  ]);

  // Generate table
  autoTable(doc, {
    head: [['Representative', 'Vendor Company', 'Position', 'Phone', 'Email']],
    body: tableData,
    startY: 1.4,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 0.04,
      lineColor: [200, 200, 200],
      lineWidth: 0.01,
      halign: 'left',
      valign: 'middle',
      overflow: 'linebreak',
      cellWidth: 'wrap',
    },
    headStyles: {
      fillColor: [46, 125, 50], // Green header
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 1.6 }, // Representative
      1: { cellWidth: 1.8 }, // Vendor Company
      2: { cellWidth: 1.3 }, // Position
      3: { cellWidth: 1.1 }, // Phone
      4: { cellWidth: 1.8 }, // Email
    },
    didDrawPage: (data) => {
      const pageNum = (doc as any).internal.getCurrentPageInfo().pageNumber;
      const totalPages = (doc as any).internal.pages.length - 1;
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Page ${pageNum} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 0.3,
        { align: 'center' }
      );
      
      doc.text(
        'LowesPro Vendor Management System',
        margin,
        pageHeight - 0.3
      );
    },
  });

  return doc;
}