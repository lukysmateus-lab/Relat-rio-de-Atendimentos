import jsPDF from "jspdf";
import { AttendanceData, RefinedContent, SignatureData } from "../types";

export const generatePDF = (
  data: AttendanceData,
  content: RefinedContent,
  signatures: SignatureData
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  
  // Font helper
  const setFont = (size: number, weight: "normal" | "bold" | "italic" | "bolditalic" = "normal", style: "helvetica" | "times" = "helvetica") => {
    doc.setFont(style, weight);
    doc.setFontSize(size);
  };

  let yPos = 20;

  // --- HEADER ---
  // Assuming Logo placeholder. Since we don't have a real image URL, we draw a circle or text.
  // "ESB"
  doc.setLineWidth(0.5);
  doc.rect(margin, margin, contentWidth, 260); // Main border around the page (optional, based on image border)
  
  // Inner container for header
  doc.rect(margin, margin, contentWidth, 40); 
  
  // Logo Text Area (Top Center)
  setFont(20, "bold", "times");
  doc.text("ESB", pageWidth / 2, margin + 12, { align: "center" });
  
  setFont(8, "normal", "times");
  doc.text("ESCOLA SALESIANA", pageWidth / 2, margin + 17, { align: "center" });
  doc.text("BRASÍLIA", pageWidth / 2, margin + 21, { align: "center" });

  // Quote
  setFont(10, "italic", "times");
  doc.text('“Ancorados na Esperança, Peregrinos com os Jovens”', pageWidth / 2, margin + 28, { align: "center" });

  // Title
  setFont(12, "bold", "helvetica");
  doc.text("REGISTRO DE ATENDIMENTO", pageWidth / 2, margin + 36, { align: "center" });
  doc.setLineWidth(0.2);
  doc.line(margin + 60, margin + 37, pageWidth - 60, margin + 37); // Underline title

  yPos = margin + 45;

  // --- IDENTIFICAÇÃO ---
  setFont(10, "bold");
  doc.text("Identificação", margin + 2, yPos);
  
  // Fields lines
  const lineGap = 7;
  yPos += 5;
  
  setFont(10, "normal");
  
  // Row 1: Estudante | Ano/Turma
  doc.text("Estudante:", margin + 2, yPos);
  doc.text(data.studentName, margin + 25, yPos); 
  doc.line(margin + 23, yPos + 1, margin + 140, yPos + 1); // Line for Name
  
  doc.text("Ano / Turma:", margin + 142, yPos);
  doc.text(data.className, margin + 165, yPos);
  doc.line(margin + 164, yPos + 1, pageWidth - margin - 2, yPos + 1); // Line for Class
  
  yPos += lineGap;
  
  // Row 2: Responsável
  doc.text("Responsável:", margin + 2, yPos);
  doc.text(data.responsibleName, margin + 27, yPos);
  doc.line(margin + 25, yPos + 1, pageWidth - margin - 2, yPos + 1);
  
  yPos += lineGap;

  // Row 3: Fones | Data | Horário
  doc.text("Fones:", margin + 2, yPos);
  doc.text(data.phone, margin + 16, yPos);
  doc.line(margin + 15, yPos + 1, margin + 90, yPos + 1);

  doc.text("Data:", margin + 92, yPos);
  doc.text(new Date(data.date).toLocaleDateString('pt-BR'), margin + 103, yPos);
  doc.line(margin + 102, yPos + 1, margin + 135, yPos + 1);

  doc.text("Horário:", margin + 137, yPos);
  doc.text(data.time, margin + 152, yPos);
  doc.line(margin + 151, yPos + 1, pageWidth - margin - 2, yPos + 1);

  yPos += 8;
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos); // Section Separator

  // --- CONTEXTO ---
  yPos += 5;
  setFont(10, "bold");
  doc.text("Encontro Solicitado Pela:", margin + 2, yPos);
  doc.text("Motivo do Atendimento:", pageWidth / 2 + 5, yPos);
  
  yPos += 6;
  setFont(9, "normal");
  
  // Checkbox Helper
  const drawCheckbox = (x: number, y: number, label: string, isChecked: boolean) => {
    doc.text(`( ${isChecked ? 'X' : ' '} )  ${label}`, x, y);
  };

  const reqBy = data.requestedBy;
  drawCheckbox(margin + 2, yPos, "Pais / Responsáveis", reqBy.includes("Pais"));
  drawCheckbox(pageWidth / 2 + 5, yPos, "Acompanhamento Pedagógico", data.reason.includes("Acompanhamento"));
  
  yPos += 5;
  drawCheckbox(margin + 2, yPos, "Educador(a)", reqBy.includes("Educador"));
  drawCheckbox(pageWidth / 2 + 5, yPos, "Ocorrência Disciplinar", data.reason.includes("Disciplinar"));
  
  yPos += 5;
  drawCheckbox(margin + 2, yPos, "Orientador(a) Educacional", reqBy.includes("Orientador"));
  drawCheckbox(pageWidth / 2 + 5, yPos, "Coordenação Pedagógica", data.reason.includes("Coordenação"));
  
  yPos += 5;
  drawCheckbox(margin + 2, yPos, "Direção Pedagógica", reqBy.includes("Direção"));
  drawCheckbox(margin + 2, yPos + 5, "Outros:", reqBy.includes("Outros"));
  
  // Manual line for "Outros"
  doc.line(margin + 18, yPos + 6, margin + 70, yPos + 6);

  yPos += 10;
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos); // Section Separator

  // --- RELATÓRIO ---
  yPos += 6;
  setFont(10, "bold");
  doc.text("Relatório da Entrevista:", margin + 2, yPos);
  doc.setLineWidth(0.2);
  doc.line(margin + 2, yPos + 1, margin + 45, yPos + 1); // Underline heading

  yPos += 8;
  
  // Simulated lined paper background for the report area
  const reportAreaStart = yPos;
  const reportAreaHeight = 120; // Fixed height for report area based on form
  const lineSpacing = 7;
  const endOfReport = reportAreaStart + reportAreaHeight;

  // Draw lines
  doc.setDrawColor(200);
  for (let l = reportAreaStart; l < endOfReport; l += lineSpacing) {
    doc.line(margin + 2, l, pageWidth - margin - 2, l);
  }
  doc.setDrawColor(0); // Reset to black

  // Print Content
  setFont(10, "normal");
  const fullText = `${content.formalReport}\n\nEncaminhamentos:\n${content.agreements.map(a => `• ${a}`).join('\n')}`;
  
  const splitText = doc.splitTextToSize(fullText, contentWidth - 5);
  doc.text(splitText, margin + 2, reportAreaStart - 2); // Start slightly above the first line visually

  yPos = endOfReport + 5;
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos); // Section Separator

  // --- ASSINATURAS ---
  yPos += 5;
  
  // Headers
  setFont(9, "bold");
  doc.text("Assinatura(s) do(s) presente(s)", margin + 2, yPos);
  doc.text("Ciente e de Acordo", pageWidth - margin - 40, yPos);
  
  yPos += 3;
  doc.setLineWidth(0.2);
  doc.line(margin, yPos, pageWidth - margin, yPos);

  yPos += 6;

  // Signature Rows Helper
  const drawSignatureRow = (roleLabel: string, signatureImage: string | null) => {
    // Check page break (unlikely here given fixed layout, but good practice)
    if (yPos > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }

    setFont(9, "bold");
    doc.text(roleLabel, margin + 2, yPos + 4);
    
    // The line for signature
    const lineStartX = margin + 45;
    const lineEndX = pageWidth - margin - 2;
    doc.line(lineStartX, yPos + 4, lineEndX, yPos + 4);

    // If signature exists, place it floating over the line
    if (signatureImage) {
        // Center image on the line
        // Image dims: ~40x20
        const imgWidth = 40;
        const imgHeight = 20;
        const imgX = lineStartX + (lineEndX - lineStartX) / 2 - (imgWidth / 2);
        const imgY = yPos - 12; // Move up to sit on line
        doc.addImage(signatureImage, "PNG", imgX, imgY, imgWidth, imgHeight);
    }
    
    yPos += 12; // Spacing for next row
  };

  // 1. Mãe/Pai (Responsável)
  drawSignatureRow("1. Responsável:", signatures.responsible);
  
  // 2. Coordenação
  drawSignatureRow("2. Coordenação:", signatures.coord);
  
  // 3. SOE
  drawSignatureRow("3. SOE:", signatures.soe);
  
  // 4. AEE
  drawSignatureRow("4. AEE:", signatures.aee);
  
  // 5. Integral
  drawSignatureRow("5. Integral:", signatures.integral);

  // --- FOOTER INFO ---
  yPos = 265;
  setFont(8, "italic");
  doc.text(`Documento gerado digitalmente em ${new Date().toLocaleString('pt-BR')} via SOE Inteligente`, margin, yPos);

  doc.save(`atendimento_${data.studentName.replace(/\s+/g, '_')}.pdf`);
};