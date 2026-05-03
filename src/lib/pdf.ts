import jsPDF from "jspdf";

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