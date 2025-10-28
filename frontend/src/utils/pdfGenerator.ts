import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CandidateData {
  name: string;
  email: string;
  position: string;
  interviewDate: string;
  invitedDate?: string;
  status: 'completed' | 'in-progress' | 'scheduled';
  score: number;
  interviewType: 'voice' | 'video' | 'both';
  experienceLevel: 'fresher' | 'mid' | 'senior';
  confidenceScore?: number;
  technicalDepth?: number;
  communication?: number;
}

export const generateCandidatePDF = (candidate: CandidateData) => {
  const doc = new jsPDF();
  
  // Add company header
  doc.setFillColor(79, 70, 229); // Indigo color
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('HIRE MIND', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('AI-Powered Interview Analysis Report', 105, 30, { align: 'center' });
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Candidate Information Section
  let yPos = 55;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Candidate Information', 20, yPos);
  
  yPos += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  const candidateInfo = [
    ['Name:', candidate.name],
    ['Email:', candidate.email],
    ['Position:', candidate.position],
    ['Interview Type:', candidate.interviewType.toUpperCase()],
    ['Experience Level:', candidate.experienceLevel.charAt(0).toUpperCase() + candidate.experienceLevel.slice(1)],
    ['Status:', candidate.status.toUpperCase()],
    ['Invited On:', candidate.invitedDate || 'N/A'],
    ['Interview Date:', candidate.interviewDate]
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [],
    body: candidateInfo,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 130 }
    }
  });
  
  // Performance Metrics Section (only for completed interviews)
  if (candidate.status === 'completed') {
    yPos = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Performance Metrics', 20, yPos);
    
    yPos += 5;
    
    // Overall Score - Large display
    doc.setFillColor(240, 253, 244); // Light green background
    doc.roundedRect(20, yPos, 170, 30, 3, 3, 'F');
    
    doc.setFontSize(14);
    doc.setTextColor(22, 163, 74); // Green color
    doc.text('Overall Score', 25, yPos + 12);
    
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    const scoreColor = candidate.score >= 80 ? [22, 163, 74] : 
                       candidate.score >= 60 ? [245, 158, 11] : [239, 68, 68];
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(`${candidate.score}%`, 165, yPos + 20, { align: 'right' });
    
    // Reset color
    doc.setTextColor(0, 0, 0);
    
    // Detailed Metrics
    yPos += 40;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('AI Analysis Breakdown', 20, yPos);
    
    yPos += 5;
    
    const metrics = [
      ['Confidence', `${candidate.confidenceScore || 0}%`],
      ['Technical Knowledge', `${candidate.technicalDepth || 0}%`],
      ['Communication Skills', `${candidate.communication || 0}%`]
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Score']],
      body: metrics,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 50, halign: 'center', fontStyle: 'bold' }
      }
    });
    
    // Performance Bars
    yPos = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Performance Visualization', 20, yPos);
    
    yPos += 10;
    
    const drawPerformanceBar = (label: string, score: number, y: number) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(label, 20, y);
      
      // Background bar
      doc.setFillColor(229, 231, 235);
      doc.roundedRect(80, y - 5, 100, 8, 2, 2, 'F');
      
      // Score bar
      const barColor = score >= 80 ? [34, 197, 94] : 
                       score >= 60 ? [251, 191, 36] : [239, 68, 68];
      doc.setFillColor(barColor[0], barColor[1], barColor[2]);
      doc.roundedRect(80, y - 5, score, 8, 2, 2, 'F');
      
      // Score text
      doc.setFont('helvetica', 'bold');
      doc.text(`${score}%`, 185, y, { align: 'right' });
    };
    
    drawPerformanceBar('Confidence', candidate.confidenceScore || 0, yPos);
    drawPerformanceBar('Technical Knowledge', candidate.technicalDepth || 0, yPos + 15);
    drawPerformanceBar('Communication', candidate.communication || 0, yPos + 30);
  } else {
    // For scheduled/in-progress interviews
    yPos = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFillColor(254, 249, 195); // Light yellow
    doc.roundedRect(20, yPos, 170, 30, 3, 3, 'F');
    
    doc.setFontSize(12);
    doc.setTextColor(161, 98, 7);
    doc.text('Interview Status: ' + candidate.status.toUpperCase(), 105, yPos + 12, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text('Performance metrics will be available after interview completion.', 105, yPos + 22, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated by Hire Mind AI | ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`,
      105,
      285,
      { align: 'center' }
    );
  }
  
  // Save the PDF
  const fileName = `${candidate.name.replace(/\s+/g, '_')}_Interview_Report.pdf`;
  doc.save(fileName);
};
