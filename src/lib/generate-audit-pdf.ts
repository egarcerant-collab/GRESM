import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from 'date-fns';
import type { Audit } from "./types";

const FONT = "helvetica"; // Using a standard font

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    // In a browser environment, the URL for public files is relative to the root.
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.statusText}`);
      // Return null to indicate failure, so the PDF can still be generated without the image.
      return null;
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = (err) => {
        console.error("FileReader error:", err);
        reject(err);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error(`Error fetching or processing image from ${url}:`, error);
    return null; // Ensure generation continues even if image fails
  }
}


async function buildPdf(data: Audit): Promise<jsPDF> {
  const doc = new jsPDF("p", "pt", "letter");
  const pageW = doc.internal.pageSize.getWidth();
  const leftMargin = 40;
  const rightMargin = 40;
  const contentWidth = pageW - leftMargin - rightMargin;
  
  // Use the correctly encoded path for the image
  const headerImage = await fetchImageAsDataUrl('/imagen/IMAGENEN%20UNIFICADA.jpg');
  const headerImgHeight = 60; // Adjust as needed

  const addHeader = () => {
    if (headerImage) {
      doc.addImage(headerImage, 'JPEG', 0, 0, pageW, headerImgHeight);
    }
  };

  const addFooter = (pageNumber: number, pageCount: number) => {
    doc.setFontSize(8);
    doc.text(`Página ${pageNumber} de ${pageCount}`, pageW / 2, doc.internal.pageSize.getHeight() - 30, { align: 'center' });
  };

  let finalY = headerImage ? headerImgHeight + 20 : leftMargin;
  
  addHeader();

  // Main Title
  doc.setFont(FONT, "bold");
  doc.setFontSize(16);
  doc.text("Informe de Auditoría", pageW / 2, finalY, { align: "center" });
  finalY += 30;

  // Function to check for page overflow and add a new page if needed
  const checkPageBreak = (yPosition: number) => {
    if (yPosition > doc.internal.pageSize.getHeight() - 60) { // 60 for bottom margin
      doc.addPage();
      addHeader();
      return headerImage ? headerImgHeight + 20 : leftMargin; // Reset Y position
    }
    return yPosition;
  };

  // --- Audit Details Table ---
  autoTable(doc, {
    startY: finalY,
    body: [
        [{ content: 'ID de Auditoría:', styles: { fontStyle: 'bold' } }, data.id || 'N/A'],
        [{ content: 'Fecha de Creación:', styles: { fontStyle: 'bold' } }, data.createdAt ? format(new Date(data.createdAt), 'yyyy-MM-dd HH:mm') : 'N/A'],
        [{ content: 'Nombre del Auditor:', styles: { fontStyle: 'bold' } }, data.auditorName || 'N/A'],
    ],
    theme: "plain",
    styles: { font: FONT, fontSize: 10 },
  });
  finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // --- Section Title Function ---
  const addSectionTitle = (title: string) => {
      finalY = checkPageBreak(finalY);
      doc.setFont(FONT, "bold");
      doc.setFontSize(12);
      doc.text(title, leftMargin, finalY);
      finalY += 15;
  };

  // --- Patient Info Section ---
  addSectionTitle("Información del Paciente");
  autoTable(doc, {
    startY: finalY,
    body: [
        [{ content: 'Nombre:', styles: { fontStyle: "bold" } }, data.patientName || 'N/A'],
        [{ content: 'Documento:', styles: { fontStyle: "bold" } }, `${data.documentType || 'N/A'} - ${data.documentNumber || 'N/A'}`],
        [{ content: 'Etnia:', styles: { fontStyle: "bold" } }, data.ethnicity || 'N/A'],
        [{ content: 'Teléfono:', styles: { fontStyle: "bold" } }, data.phoneNumber || 'N/A'],
        [{ content: 'Dirección:', styles: { fontStyle: "bold" } }, `${data.address || 'N/A'}, ${data.municipality || 'N/A'}, ${data.department || 'N/A'}`],
        ...(data.sex ? [[{ content: 'Sexo:', styles: { fontStyle: "bold" } }, data.sex]] : []),
        ...(data.birthDate ? [[{ content: 'Fecha de Nacimiento:', styles: { fontStyle: "bold" } }, format(new Date(data.birthDate), 'yyyy-MM-dd')]] : []),
        ...(data.age !== undefined ? [[{ content: 'Edad:', styles: { fontStyle: "bold" } }, String(data.age)]] : []),
    ],
    theme: "striped",
    styles: { font: FONT, fontSize: 10, cellPadding: 5 },
    didDrawPage: (hookData) => addHeader(), // Add header to new pages created by this table
  });
  finalY = (doc as any).lastAutoTable.finalY + 10;

  // --- Event Info Section ---
  addSectionTitle("Información del Evento");
  autoTable(doc, {
    startY: finalY,
    body: [
        [{ content: 'Tipo de Visita:', styles: { fontStyle: "bold" } }, data.visitType || 'N/A'],
        [{ content: 'Fecha de Seguimiento:', styles: { fontStyle: "bold" } }, data.followUpDate ? format(new Date(data.followUpDate), 'yyyy-MM-dd') : 'N/A'],
        [{ content: 'Evento:', styles: { fontStyle: "bold" } }, data.event || 'N/A'],
        ...(data.eventDetails ? [[{ content: 'Detalles del Evento:', styles: { fontStyle: "bold" } }, data.eventDetails]] : []),
        ...(data.affiliationStatus ? [[{ content: 'Estado Afiliación:', styles: { fontStyle: "bold" } }, data.affiliationStatus]] : []),
        ...(data.area ? [[{ content: 'Área:', styles: { fontStyle: "bold" } }, data.area]] : []),
        ...(data.settlement ? [[{ content: 'Asentamiento:', styles: { fontStyle: "bold" } }, data.settlement]] : []),
        ...(data.nationality ? [[{ content: 'Nacionalidad:', styles: { fontStyle: "bold" } }, data.nationality]] : []),
        ...(data.primaryHealthProvider ? [[{ content: 'IPS Primaria:', styles: { fontStyle: "bold" } }, data.primaryHealthProvider]] : []),
        ...(data.regime ? [[{ content: 'Régimen:', styles: { fontStyle: "bold" } }, data.regime]] : []),
        ...(data.upgdProvider ? [[{ content: 'UPGD/Prestador:', styles: { fontStyle: "bold" } }, data.upgdProvider]] : []),
        ...(data.followUpInterventionType ? [[{ content: 'Tipo Intervención:', styles: { fontStyle: "bold" } }, data.followUpInterventionType]] : []),
    ],
    theme: "striped",
    styles: { font: FONT, fontSize: 10, cellPadding: 5 },
    didDrawPage: (hookData) => addHeader(),
  });
  finalY = (doc as any).lastAutoTable.finalY;

  // --- Text Sections ---
  const addTextSection = (title: string, text: string | null | undefined) => {
    finalY = checkPageBreak(finalY + 20);
    addSectionTitle(title);
    
    doc.setFont(FONT, "normal");
    doc.setFontSize(10);
    const safeText = text || 'N/A';
    const splitText = doc.splitTextToSize(safeText, contentWidth);

    splitText.forEach((line: string) => {
        finalY = checkPageBreak(finalY);
        doc.text(line, leftMargin, finalY, { align: 'justify' });
        finalY += 12; // Line height
    });
  }

  addTextSection("Notas de Seguimiento", data.followUpNotes);
  addTextSection("Conducta a Seguir", data.nextSteps);

  // --- Finalize with page numbers ---
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(i, pageCount);
  }

  return doc;
}

export async function generateAuditPdf(audit: Audit): Promise<void> {
  try {
    const doc = await buildPdf(audit);
    const fileName = `Informe_Auditoria_${audit.id}_${(audit.patientName || 'SinNombre').replace(/ /g, '_')}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    // Use alert for user feedback in case of an unexpected error during build/save
    alert("No se pudo generar el PDF. Revise la consola para más detalles.");
  }
}
