import jsPDF from "jspdf";
import { TailoredResumeResponse } from "./api";

export function exportApplicationPDF({
  candidateName,
  companyName,
  roleTitle,
  coverLetter,
  tailoredSummary,
}: {
  candidateName: string;
  companyName: string;
  roleTitle: string;
  coverLetter: string;
  tailoredSummary: string;
}) {
  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(candidateName || "Candidate", 20, 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`${roleTitle} · ${companyName}`, 20, 33);
  doc.text(
    new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    20,
    40,
  );
  doc.setLineWidth(0.3);
  doc.line(20, 44, W - 20, 44);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Professional Summary", 20, 54);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const sumLines = doc.splitTextToSize(tailoredSummary || "", W - 40);
  doc.text(sumLines, 20, 62);
  const clY = 62 + sumLines.length * 6 + 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Cover Letter", 20, clY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const clLines = doc.splitTextToSize(coverLetter || "", W - 40);
  doc.text(clLines, 20, clY + 8);
  doc.save(
    `${(candidateName || "Application").replace(/ /g, "_")}_${(companyName || "Company").replace(/ /g, "_")}_Application.pdf`,
  );
}

export function exportTailoredResumePDF(
  data: TailoredResumeResponse,
  candidateName: string,
  companyName?: string,
) {
  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = W - 2 * margin;
  let yPos = 20;

  // Colors
  const primaryColor = [31, 41, 55]; // Gray-800
  const secondaryColor = [75, 85, 99]; // Gray-600
  const accentColor = [37, 99, 235]; // Blue-600
  const lightGray = [229, 231, 235]; // Gray-200

  const checkPageBreak = (minHeight: number) => {
    if (yPos + minHeight > pageHeight - 15) {
      doc.addPage();
      yPos = 20;
      return true;
    }
    return false;
  };

  // --- Header ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  const nameWidth = doc.getTextWidth(candidateName.toUpperCase());
  doc.text(candidateName.toUpperCase(), W / 2, yPos, { align: "center" });
  yPos += 10;

  // Contact info row
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  const contact = data.contactHeader;
  const contactParts = [
    contact.email,
    contact.phone,
    contact.location,
    contact.linkedin ? "LinkedIn" : null,
  ].filter(Boolean);
  const contactText = contactParts.join("  |  ");
  doc.text(contactText, W / 2, yPos, { align: "center" });
  yPos += 8;

  // Horizontal line under header
  doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setLineWidth(0.8);
  doc.line(margin, yPos, W - margin, yPos);
  yPos += 10;

  const drawSectionHeader = (title: string) => {
    checkPageBreak(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text(title, margin, yPos);
    
    doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.setLineWidth(0.2);
    doc.line(margin, yPos + 1.5, W - margin, yPos + 1.5);
    
    yPos += 8;
  };

  // --- Professional Summary ---
  drawSectionHeader("PROFESSIONAL SUMMARY");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  const summaryLines = doc.splitTextToSize(data.professionalSummary || "", contentWidth);
  doc.text(summaryLines, margin, yPos);
  yPos += summaryLines.length * 5 + 6;

  // --- Core Competencies ---
  drawSectionHeader("CORE COMPETENCIES");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  const skillCols = 3;
  const colWidth = contentWidth / skillCols;
  const skills = data.coreCompetencies;
  
  for (let i = 0; i < skills.length; i++) {
    const col = i % skillCols;
    const row = Math.floor(i / skillCols);
    const x = margin + (col * colWidth);
    const y = yPos + (row * 5);
    
    if (i % skillCols === 0 && i !== 0) {
      // check if we need to move yPos after a full row
    }
    
    doc.text(`• ${skills[i]}`, x, y);
    if (col === skillCols - 1 || i === skills.length - 1) {
      if (i === skills.length - 1) {
        yPos += (row + 1) * 5 + 6;
      }
    }
  }

  // --- Work Experience ---
  drawSectionHeader("WORK EXPERIENCE");
  
  data.workExperience.forEach((exp, idx) => {
    checkPageBreak(25);
    
    // Title and Company
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(exp.title, margin, yPos);
    
    // Duration (Right Aligned)
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9.5);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(exp.duration, W - margin, yPos, { align: "right" });
    yPos += 5;
    
    // Company
    doc.setFont("helvetica", "bold");
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(exp.company, margin, yPos);
    yPos += 5;

    // Bullets
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    exp.bullets.forEach((bullet) => {
      checkPageBreak(8);
      const bulletLines = doc.splitTextToSize(`•  ${bullet}`, contentWidth - 4);
      doc.text(bulletLines, margin + 2, yPos);
      yPos += bulletLines.length * 4.5;
    });
    
    yPos += 4;
  });

  // --- Education ---
  if (data.education.length > 0) {
    drawSectionHeader("EDUCATION");
    data.education.forEach((edu) => {
      checkPageBreak(12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(edu.degree, margin, yPos);
      
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9.5);
      doc.text(edu.year, W - margin, yPos, { align: "right" });
      yPos += 5;
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(edu.institution, margin, yPos);
      yPos += 8;
    });
  }

  // --- Certifications ---
  if (data.certifications.length > 0) {
    drawSectionHeader("CERTIFICATIONS");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    const certs = data.certifications.join("  |  ");
    const certLines = doc.splitTextToSize(certs, contentWidth);
    doc.text(certLines, margin, yPos);
  }

  // --- Footer ---
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generated by AI Career Compass  |  Page ${i} of ${pageCount}`,
      W / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  const filename = `${candidateName.replace(/ /g, "_")}_Resume.pdf`;
  doc.save(filename);
}