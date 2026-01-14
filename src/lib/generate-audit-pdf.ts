import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from 'date-fns';
import type { Audit } from "./types";

const FONT = "helvetica"; // Using a standard font

function buildPdf(data: Audit, bgImage: string | null): jsPDF {
  const doc = new jsPDF("p", "pt", "letter");
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  
  const topMargin = 80;
  const bottomMargin = 60;
  const leftMargin = 40;
  const rightMargin = 40;
  const contentWidth = pageW - leftMargin - rightMargin;

  const addBackground = () => {
    if (bgImage) {
        doc.addImage(bgImage, 'JPEG', 0, pageH - 200, pageW, 200, undefined, 'FAST');
    }
  }

  const addPageWithBg = () => {
      doc.addPage();
      addBackground();
  }
  
  addBackground();

  let finalY = topMargin;

  // Header
  doc.setFont(FONT, "bold");
  doc.setFontSize(16);
  doc.text("Informe de Auditoría", pageW / 2, finalY, { align: "center" });
  finalY += 30;

  // Audit Details Table
  doc.setFont(FONT, "normal");
  doc.setFontSize(10);
  const auditDetails = [
    ["ID de Auditoría:", data.id],
    ["Fecha de Creación:", format(new Date(data.createdAt), 'yyyy-MM-dd HH:mm')],
    ["Nombre del Auditor:", data.auditorName],
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

  finalY = (doc as any).lastAutoTable.finalY + 20;

  // Patient Info
  doc.setFont(FONT, "bold");
  doc.setFontSize(12);
  doc.text("Información del Paciente", leftMargin, finalY);
  finalY += 15;

  const patientBody = [
      [{ content: "Nombre:", styles: { fontStyle: "bold" } }, data.patientName],
      [{ content: "Documento:", styles: { fontStyle: "bold" } }, `${data.documentType} - ${data.documentNumber}`],
      [{ content: "Etnia:", styles: { fontStyle: "bold" } }, data.ethnicity],
      [{ content: "Teléfono:", styles: { fontStyle: "bold" } }, data.phoneNumber],
      [{ content: "Dirección:", styles: { fontStyle: "bold" } }, `${data.address}, ${data.municipality}, ${data.department}`],
  ];

  if (data.sex) {
      patientBody.push([{ content: "Sexo:", styles: { fontStyle: "bold" } }, data.sex]);
  }
  if (data.birthDate) {
    patientBody.push([{ content: "Fecha de Nacimiento:", styles: { fontStyle: "bold" } }, format(new Date(data.birthDate), 'yyyy-MM-dd')]);
  }
  if (data.age) {
    patientBody.push([{ content: "Edad:", styles: { fontStyle: "bold" } }, String(data.age)]);
  }

  autoTable(doc, {
    startY: finalY,
    head: [],
    body: patientBody,
    theme: "striped",
    styles: { font: FONT, fontSize: 10 },
  });
  finalY = (doc as any).lastAutoTable.finalY;

  // Event Info
  finalY += 20;
  doc.setFont(FONT, "bold");
  doc.setFontSize(12);
  doc.text("Información del Evento", leftMargin, finalY);
  finalY += 15;

  const eventBody = [
        [{ content: "Tipo de Visita:", styles: { fontStyle: "bold" } }, data.visitType],
        [{ content: "Fecha de Seguimiento:", styles: { fontStyle: "bold" } }, format(new Date(data.followUpDate), 'yyyy-MM-dd')],
        [{ content: "Evento:", styles: { fontStyle: "bold" } }, data.event],
  ];

  if (data.eventDetails) {
    eventBody.push([{ content: "Detalles del Evento:", styles: { fontStyle: "bold" } }, data.eventDetails]);
  }
  if (data.affiliationStatus) {
    eventBody.push([{ content: "Estado Afiliación:", styles: { fontStyle: "bold" } }, data.affiliationStatus]);
  }
  if (data.area) {
    eventBody.push([{ content: "Área:", styles: { fontStyle: "bold" } }, data.area]);
  }
  if (data.settlement) {
    eventBody.push([{ content: "Asentamiento:", styles: { fontStyle: "bold" } }, data.settlement]);
  }
  if (data.nationality) {
    eventBody.push([{ content: "Nacionalidad:", styles: { fontStyle: "bold" } }, data.nationality]);
  }
  if (data.primaryHealthProvider) {
    eventBody.push([{ content: "IPS Primaria:", styles: { fontStyle: "bold" } }, data.primaryHealthProvider]);
  }
  if (data.regime) {
    eventBody.push([{ content: "Régimen:", styles: { fontStyle: "bold" } }, data.regime]);
  }
  if (data.upgdProvider) {
    eventBody.push([{ content: "UPGD/Prestador:", styles: { fontStyle: "bold" } }, data.upgdProvider]);
  }
  if (data.followUpInterventionType) {
    eventBody.push([{ content: "Tipo Intervención:", styles: { fontStyle: "bold" } }, data.followUpInterventionType]);
  }

  autoTable(doc, {
    startY: finalY,
    head: [],
    body: eventBody,
    theme: "striped",
    styles: { font: FONT, fontSize: 10 },
  });
  finalY = (doc as any).lastAutoTable.finalY;

  // Function to add text content with page breaks
  const addTextSection = (title: string, text: string) => {
    finalY += 20;
    if (finalY > pageH - bottomMargin - 40) { // Check if space for title + some text
        addPageWithBg();
        finalY = topMargin;
    }
    doc.setFont(FONT, "bold");
    doc.setFontSize(12);
    doc.text(title, leftMargin, finalY);
    finalY += 15;
    
    doc.setFont(FONT, "normal");
    doc.setFontSize(10);
    const splitText = doc.splitTextToSize(text, contentWidth);

    splitText.forEach((line: string) => {
        if (finalY > pageH - bottomMargin) {
            addPageWithBg();
            finalY = topMargin;
        }
        doc.text(line, leftMargin, finalY);
        finalY += 12; // Line height
    });
  }

  // Follow-up Notes and Next Steps
  addTextSection("Notas de Seguimiento", data.followUpNotes);
  addTextSection("Conducta a Seguir", data.nextSteps);

  // Footer with page number
  const pageCount = (doc as any).internal.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Página ${i} de ${pageCount}`, pageW / 2, pageH - 30, { align: 'center' });
  }

  return doc;
}

export async function generateAuditPdf(
  audit: Audit,
  bgImage: string | null = null,
): Promise<void> {
  const doc = buildPdf(audit, bgImage);
  const fileName = `Informe_Auditoria_${audit.id}_${audit.patientName.replace(/ /g, '_')}.pdf`;
  doc.save(fileName);
}
