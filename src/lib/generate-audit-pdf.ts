import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from 'date-fns';
import type { Audit } from "./types";

const FONT = "helvetica"; // Using a standard font

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
      return null;
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        reject(error);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error(`Failed to fetch and process image from ${url}:`, error);
    return null;
  }
}

async function buildPdf(data: Audit): Promise<jsPDF> {
  const doc = new jsPDF("p", "pt", "letter");
  const pageW = doc.internal.pageSize.getWidth();
  const leftMargin = 40;
  const rightMargin = 40;
  const contentWidth = pageW - leftMargin - rightMargin;
  
  const headerImage = await fetchImageAsDataUrl('/IMAGENEN_UNIFICADA.jpg');
  const headerImgHeight = 60;

  const addHeader = () => {
    if (headerImage) {
      doc.addImage(headerImage, 'JPEG', 0, 0, pageW, headerImgHeight);
    }
  };

  const addFooter = (pageNumber: number, pageCount: number) => {
    doc.setFontSize(8);
    doc.text(`Página ${pageNumber} de ${pageCount}`, pageW / 2, doc.internal.pageSize.getHeight() - 30, { align: 'center' });
  };
  
  let finalY = headerImgHeight + 20;

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
      return headerImgHeight + 20; // Reset Y position for new page
    }
    return yPosition;
  };

  // --- Audit Details ---
  const auditDetails = [
    ["ID de Auditoría:", data.id || 'N/A'],
    ["Fecha de Creación:", data.createdAt ? format(new Date(data.createdAt), 'yyyy-MM-dd HH:mm') : 'N/A'],
    ["Nombre del Auditor:", data.auditorName || 'N/A'],
  ];

  autoTable(doc, {
    startY: finalY,
    body: auditDetails,
    theme: "plain",
    styles: { font: FONT, fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 120 },
    }
  });
  finalY = (doc as any).lastAutoTable.finalY;
  
  finalY = checkPageBreak(finalY + 10);
  
  // --- Patient Info ---
  doc.setFont(FONT, "bold");
  doc.setFontSize(12);
  doc.text("Información del Paciente", leftMargin, finalY);
  finalY += 15;

  const patientBody = [
      ["Nombre:", data.patientName || 'N/A'],
      ["Documento:", `${data.documentType || 'N/A'} - ${data.documentNumber || 'N/A'}`],
      ["Etnia:", data.ethnicity || 'N/A'],
      ["Teléfono:", data.phoneNumber || 'N/A'],
      ["Dirección:", `${data.address || 'N/A'}, ${data.municipality || 'N/A'}, ${data.department || 'N/A'}`],
  ];
   if (data.sex) patientBody.push(["Sexo:", data.sex]);
   if (data.birthDate) patientBody.push(["Fecha de Nacimiento:", format(new Date(data.birthDate), 'yyyy-MM-dd')]);
   if (data.age !== undefined) patientBody.push(["Edad:", String(data.age)]);

  autoTable(doc, {
    startY: finalY,
    body: patientBody,
    theme: "striped",
    styles: { font: FONT, fontSize: 10 },
    columnStyles: { 0: { fontStyle: "bold" } },
  });
  finalY = (doc as any).lastAutoTable.finalY;
  
  finalY = checkPageBreak(finalY + 10);

  // --- Event Info ---
  doc.setFont(FONT, "bold");
  doc.setFontSize(12);
  doc.text("Información del Evento", leftMargin, finalY);
  finalY += 15;

  const eventBody = [
      ["Tipo de Visita:", data.visitType || 'N/A'],
      ["Fecha de Seguimiento:", data.followUpDate ? format(new Date(data.followUpDate), 'yyyy-MM-dd') : 'N/A'],
      ["Evento:", data.event || 'N/A'],
  ];
  if (data.eventDetails) eventBody.push(["Detalles del Evento:", data.eventDetails]);
  if (data.affiliationStatus) eventBody.push(["Estado Afiliación:", data.affiliationStatus]);
  if (data.area) eventBody.push(["Área:", data.area]);
  if (data.settlement) eventBody.push(["Asentamiento:", data.settlement]);
  if (data.nationality) eventBody.push(["Nacionalidad:", data.nationality]);
  if (data.primaryHealthProvider) eventBody.push(["IPS Primaria:", data.primaryHealthProvider]);
  if (data.regime) eventBody.push(["Régimen:", data.regime]);
  if (data.upgdProvider) eventBody.push(["UPGD/Prestador:", data.upgdProvider]);
  if (data.followUpInterventionType) eventBody.push(["Tipo Intervención:", data.followUpInterventionType]);

  autoTable(doc, {
    startY: finalY,
    body: eventBody,
    theme: "striped",
    styles: { font: FONT, fontSize: 10 },
    columnStyles: { 0: { fontStyle: "bold" } },
  });
  finalY = (doc as any).lastAutoTable.finalY;

  // --- Text Sections ---
  const addTextSection = (title: string, text: string | null | undefined) => {
    finalY = checkPageBreak(finalY + 20);
    doc.setFont(FONT, "bold");
    doc.setFontSize(12);
    doc.text(title, leftMargin, finalY);
    finalY += 15;
    
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
    alert("No se pudo generar el PDF. Revise la consola para más detalles.");
  }
}
