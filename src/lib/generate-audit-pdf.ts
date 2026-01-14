import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from 'date-fns';
import type { Audit, User } from "./types";

const FONT = "helvetica";

async function buildPdf(data: Audit, backgroundImage: string | null, auditor: User | null, doc: jsPDF): Promise<jsPDF> {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const leftMargin = 70;
  const topMargin = 115;

  const addBackground = () => {
    if (backgroundImage) {
      try {
        doc.addImage(backgroundImage, 'JPEG', 0, 0, pageW, pageH, undefined, 'FAST');
      } catch (e) {
        console.error("Error adding background image to PDF:", e);
      }
    }
  };

  const addFooter = (pageNumber: number, pageCount: number) => {
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Página ${pageNumber} de ${pageCount}`, pageW / 2, pageH - 40, { align: 'center' });
  };
  
  addBackground();

  let finalY = topMargin;

  doc.setFont(FONT, "bold");
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("ESTRATEGIA GRESM-Gestión Del Riesgo En Salud Mental", pageW / 2, finalY, { align: "center" });
  finalY += 30;

  autoTable(doc, {
    startY: finalY,
    body: [
        [{ content: 'ID de Auditoría:', styles: { fontStyle: 'bold' } }, data.id || 'N/A'],
        [{ content: 'Fecha de Creación:', styles: { fontStyle: 'bold' } }, data.createdAt ? format(new Date(data.createdAt), 'yyyy-MM-dd HH:mm') : 'N/A'],
        [{ content: 'Nombre del Auditor:', styles: { fontStyle: 'bold' } }, data.auditorName || 'N/A'],
    ],
    theme: "plain",
    styles: { font: FONT, fontSize: 10 },
    didDrawPage: (hookData) => { 
      if (hookData.pageNumber > 1) {
        addBackground(); 
      }
    },
  });
  
  const addSectionTitle = (title: string) => {
      finalY = (doc as any).lastAutoTable.finalY + 30;
      if (finalY > pageH - 100) {
        doc.addPage();
        addBackground();
        finalY = topMargin;
      }
      doc.setFont(FONT, "bold");
      doc.setFontSize(12);
      doc.text(title, leftMargin, finalY);
      finalY += 15;
  };

  addSectionTitle("Información del Paciente");
  autoTable(doc, {
    startY: finalY,
    body: [
        [{ content: 'Nombre:', styles: { fontStyle: "bold" } }, data.patientName || 'N/A'],
        [{ content: 'Documento:', styles: { fontStyle: "bold" } }, `${data.documentType || 'N/A'} - ${data.documentNumber || 'N/A'}`],
        [{ content: 'Etnia:', styles: { fontStyle: "bold" } }, data.ethnicity || 'N/A'],
        [{ content: 'Teléfono:', styles: { fontStyle: "bold" } }, data.phoneNumber || 'N/A'],
        [{ content: 'Dirección:', styles: { fontStyle: "bold" } }, `${data.address || 'N/A'}, ${data.municipality || 'N/A'}, ${data.department || 'N/A'}`],
    ],
    theme: "striped",
    styles: { font: FONT, fontSize: 10, cellPadding: 5 },
    didDrawPage: (hookData) => { if(hookData.pageNumber > 1) addBackground(); },
  });

  addSectionTitle("Información del Evento");
  autoTable(doc, {
    startY: finalY,
    body: [
        [{ content: 'Tipo de Visita:', styles: { fontStyle: "bold" } }, data.visitType || 'N/A'],
        [{ content: 'Fecha de Seguimiento:', styles: { fontStyle: "bold" } }, data.followUpDate ? format(new Date(data.followUpDate), 'yyyy-MM-dd') : 'N/A'],
        [{ content: 'Evento:', styles: { fontStyle: "bold" } }, data.event || 'N/A'],
        ...(data.eventDetails ? [[{ content: 'Detalles del Evento:', styles: { fontStyle: "bold" } }, data.eventDetails]] : []),
    ],
    theme: "striped",
    styles: { font: FONT, fontSize: 10, cellPadding: 5 },
    didDrawPage: (hookData) => { if(hookData.pageNumber > 1) addBackground(); },
  });
  finalY = (doc as any).lastAutoTable.finalY;

  const showSpecialEventFields = data.event === 'Intento de Suicidio' || data.event === 'Consumo de Sustancia Psicoactivas';

  if (showSpecialEventFields) {
    addSectionTitle("Información Adicional de Evento");
    autoTable(doc, {
      startY: finalY,
      body: [
        ...(data.birthDate ? [[{ content: 'Fecha de Nacimiento:', styles: { fontStyle: "bold" } }, format(new Date(data.birthDate), 'yyyy-MM-dd')]] : []),
        ...(data.age !== undefined ? [[{ content: 'Edad:', styles: { fontStyle: "bold" } }, String(data.age)]] : []),
        ...(data.sex ? [[{ content: 'Sexo:', styles: { fontStyle: "bold" } }, data.sex]] : []),
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
      didDrawPage: (hookData) => { if(hookData.pageNumber > 1) addBackground(); },
    });
    finalY = (doc as any).lastAutoTable.finalY;
  }

  const addTextSection = (title: string, text: string | null | undefined) => {
    finalY = finalY + 30;
    if (finalY > pageH - 100) {
      doc.addPage();
      addBackground();
      finalY = topMargin;
    }
    doc.setFont(FONT, "bold");
    doc.setFontSize(12);
    doc.text(title, leftMargin, finalY);
    finalY += 15;
    
    doc.setFont(FONT, "normal");
    doc.setFontSize(10);
    const safeText = text || 'N/A';
    const splitText = doc.splitTextToSize(safeText, pageW - leftMargin * 2);

    splitText.forEach((line: string) => {
      if (finalY > pageH - 100) {
        doc.addPage();
        addBackground();
        finalY = topMargin;
      }
      doc.text(line, leftMargin, finalY, { align: 'justify' });
      finalY += 12;
    });
  }

  addTextSection("Notas de Seguimiento", data.followUpNotes);
  addTextSection("Conducta a Seguir", data.nextSteps);

  if (auditor?.signature) {
    finalY += 40; // Space before signature
    if (finalY > pageH - 150) { // Check if there is enough space for the signature block
        doc.addPage();
        addBackground();
        finalY = topMargin;
    }
    try {
      doc.addImage(auditor.signature, 'PNG', leftMargin, finalY, 120, 60, undefined, 'FAST');
    } catch (e) {
      console.error("Error adding signature image:", e);
      doc.text('[Error al cargar la firma]', leftMargin, finalY + 30);
    }

    finalY += 70; // Position below signature image
    doc.setFont(FONT, "bold");
    doc.setFontSize(10);
    doc.text(auditor.fullName || '', leftMargin, finalY);
    finalY += 12;
    doc.setFont(FONT, "normal");
    doc.text(auditor.cargo || '', leftMargin, finalY);
  }


  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(i, pageCount);
  }

  return doc;
}

export async function generateAuditPdf(audit: Audit, backgroundImage: string | null, auditor: User | null, docInstance?: jsPDF): Promise<jsPDF> {
  const doc = docInstance || new jsPDF({
    orientation: "p",
    unit: "pt",
    format: "a4"
  });

  try {
    const finalDoc = await buildPdf(audit, backgroundImage, auditor, doc);
    
    if (!docInstance) {
        const fileName = `Informe_Auditoria_${audit.id}_${(audit.patientName || 'SinNombre').replace(/ /g, '_')}.pdf`;
        finalDoc.save(fileName);
    }
    
    return finalDoc;
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    if (!docInstance) {
        alert("No se pudo generar el PDF. Revise la consola para más detalles.");
    }
    throw error;
  }
}
