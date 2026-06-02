import { jsPDF } from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';

// Apply the autoTable plugin to jsPDF prototype
applyPlugin(jsPDF);

export interface PlagiarismReportData {
  text: string;
  originalityScore: number;
  similarityScore: number;
  matches: {
    text: string;
    matchPercentage: number;
    source: string;
    url?: string;
    startIndex: number;
    endIndex: number;
  }[];
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
  paragraphCount: number;
  reportId: string;
  generatedAt: Date;
}

interface PremiumReportData {
  aiScore: number;           // 0-100
  originalityScore: number;  // 0-100
  grammarScore: number;      // 0-100
  qualityScore: number;      // 0-100
  readabilityScore: number;  // Flesch score 0-100
  readingLevel: string;      // e.g. "College"
  wordCount: number;
  characterCount: number;
  tone: string;              // "Formal" | "Casual" | "Aggressive" | "Neutral"
  toneConfidence: number;    // 0-100
  avgSentenceLength: number;
  contentPreview: string;    // first 300 chars of text
  grammarErrors: number;
  reportId: string;
  generatedAt: Date;
  simpleSentencesPct?: number;   // optional
  mediumSentencesPct?: number;   // optional
  complexSentencesPct?: number;  // optional
  uniqueWords?: number;          // optional
  plagiarismMatches?: number;    // optional
}

/**
 * Helper to draw a standard header-accented footer on each PDF page.
 * 
 * @param doc jsPDF document instance
 * @param pageNumber current page index
 */
function drawFooter(doc: jsPDF, pageNumber: number) {
  doc.saveGraphicsState();
  
  // Thin separator line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(20, 277, 190, 277);
  
  // Footer text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(139, 143, 168); // muted gray
  
  doc.text('ContentGuard | AI Authenticity Platform', 20, 283);
  doc.text(`Page ${pageNumber} of 3`, 105, 283, { align: 'center' });
  doc.text('contentguard.app', 190, 283, { align: 'right' });
  
  doc.restoreGraphicsState();
}

/**
 * Helper to map score boundaries to colors and status titles.
 */
function getScoreDetails(type: 'ai' | 'originality' | 'grammar' | 'quality', val: number) {
  let col = [34, 197, 94]; // success green
  let label = '';
  if (type === 'ai') {
    if (val <= 30) {
      col = [34, 197, 94]; // green
      label = 'Human Written';
    } else if (val <= 60) {
      col = [245, 158, 11]; // orange
      label = 'Mixed Content';
    } else {
      col = [239, 68, 68]; // red
      label = 'AI Generated';
    }
  } else if (type === 'originality') {
    if (val >= 80) {
      col = [34, 197, 94];
      label = 'Original';
    } else if (val >= 50) {
      col = [245, 158, 11];
      label = 'Partial Match';
    } else {
      col = [239, 68, 68];
      label = 'Plagiarized';
    }
  } else { // grammar and quality
    if (val >= 90) {
      col = [34, 197, 94];
      label = 'Excellent';
    } else if (val >= 70) {
      col = [245, 158, 11];
      label = 'Good';
    } else {
      col = [239, 68, 68];
      label = 'Needs Work';
    }
    if (type === 'quality' && val < 70) {
      label = 'Needs Improvement';
    }
  }
  return { col, label };
}

/**
 * Generates a premium, visually stunning 3-page PDF report for ContentGuard.
 * Uses manual vector draw instructions on jsPDF's canvas context for high fidelity.
 * 
 * @param data PremiumReportData values containing analysis scores and metrics.
 */
export async function generatePremiumReport(data: PremiumReportData): Promise<void> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const {
      aiScore,
      originalityScore,
      grammarScore,
      qualityScore,
      readabilityScore,
      readingLevel,
      wordCount,
      characterCount,
      tone,
      toneConfidence,
      avgSentenceLength,
      contentPreview,
      grammarErrors,
      reportId,
      generatedAt,
      simpleSentencesPct,
      mediumSentencesPct,
      complexSentencesPct,
      uniqueWords,
      plagiarismMatches
    } = data;

    const dateStr = generatedAt.toISOString().split('T')[0];

    // =========================================================================
    // PAGE 1 — COVER PAGE
    // =========================================================================

    // 1. Header Banner (Full width primary dark background)
    doc.setFillColor(13, 15, 20);
    doc.rect(0, 0, 210, 45, 'F');

    // Header Separator Accent Line (Purple Accent)
    doc.setFillColor(124, 92, 252);
    doc.rect(0, 45, 210, 2, 'F');

    // Logo & Header Titles
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text('CG', 20, 26);

    doc.setFontSize(18);
    doc.text('ContentGuard', 42, 23);

    doc.setTextColor(124, 92, 252); // accent purple
    doc.setFontSize(11);
    doc.text('AI Authenticity & Quality Report', 42, 30);

    // 2. Report Meta Info (Below header, light gray card)
    doc.setFillColor(248, 249, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(20, 58, 170, 24, 3, 3, 'FD');

    // Meta Info Left Column
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 143, 168);
    doc.text('Generated:', 25, 66);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 46);
    doc.text(generatedAt.toLocaleString(), 46, 66);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 143, 168);
    doc.text('Report ID:', 25, 74);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 46);
    doc.text(reportId, 46, 74);

    // Meta Info Right Column
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 143, 168);
    doc.text('Word Count:', 110, 66);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 46);
    doc.text(wordCount.toLocaleString(), 134, 66);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 143, 168);
    doc.text('Tone:', 110, 74);

    // Draw Tone Badge
    const toneStr = tone || 'Neutral';
    let badgeBg = [139, 143, 168];
    if (toneStr === 'Formal') badgeBg = [59, 130, 246]; // blue
    else if (toneStr === 'Casual') badgeBg = [34, 197, 94]; // green
    else if (toneStr === 'Aggressive') badgeBg = [239, 68, 68]; // red
    else if (toneStr === 'Persuasive') badgeBg = [124, 92, 252]; // purple

    doc.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
    doc.roundedRect(122, 70, 25, 5.5, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(`${toneStr} (${toneConfidence}%)`, 134.5, 74, { align: 'center' });

    // 3. 4 Score Cards Section (y = 92)
    const cardY = 92;
    const cards = [
      { type: 'ai' as const, title: 'AI PROBABILITY', val: aiScore },
      { type: 'originality' as const, title: 'ORIGINALITY', val: originalityScore },
      { type: 'grammar' as const, title: 'GRAMMAR', val: grammarScore },
      { type: 'quality' as const, title: 'QUALITY', val: qualityScore }
    ];

    cards.forEach((card, index) => {
      const cardX = 20 + index * 44; // 38mm width + 6mm gap
      const { col, label } = getScoreDetails(card.type, card.val);

      // Card boundary box
      doc.setDrawColor(col[0], col[1], col[2]);
      doc.setLineWidth(0.4);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(cardX, cardY, 38, 45, 2.5, 2.5, 'FD');

      // Card Content
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(139, 143, 168);
      doc.text(card.title, cardX + 19, 102, { align: 'center' });

      doc.setFontSize(24);
      doc.setTextColor(col[0], col[1], col[2]);
      doc.text(`${card.val !== undefined ? card.val : 'N/A'}%`, cardX + 19, 118, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 30, 46);
      doc.text(label, cardX + 19, 128, { align: 'center' });
    });

    // 4. Content Preview Box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(139, 143, 168);
    doc.text('CONTENT PREVIEW', 20, 150);

    doc.setFillColor(248, 249, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(20, 154, 170, 56, 3, 3, 'FD');

    doc.setFont('helvetica', 'oblique');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 100, 110);
    
    const previewRaw = contentPreview.length > 300 
      ? contentPreview.substring(0, 300) + '...' 
      : contentPreview;
    const previewLines = doc.splitTextToSize(previewRaw, 160);
    doc.text(previewLines, 25, 163);

    // Footer Cover Page
    drawFooter(doc, 1);

    // =========================================================================
    // PAGE 2 — VISUAL ANALYTICS PAGE
    // =========================================================================
    doc.addPage();

    // 1. Page Header Banner
    doc.setFillColor(124, 92, 252);
    doc.rect(20, 20, 170, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Visual Analytics & Detailed Breakdown', 24, 25);

    // Get jsPDF canvas 2d context for manual chart rendering
    const ctx = doc.context2d;

    // 2. Chart 1 — Donut Arc (Left side)
    const donutCX = 60;
    const donutCY = 75;
    
    // Background arc (gray)
    ctx.beginPath();
    ctx.arc(donutCX, donutCY, 24, 0, 2 * Math.PI, false);
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#e5e7eb';
    ctx.stroke();

    // Foreground arc (colored based on score)
    const aiColorDetails = getScoreDetails('ai', aiScore);
    const aiColorHex = aiScore <= 30 ? '#22c55e' : aiScore <= 60 ? '#f59e0b' : '#ef4444';
    const scoreRad = (aiScore / 100) * 2 * Math.PI;
    
    ctx.beginPath();
    ctx.arc(donutCX, donutCY, 24, -0.5 * Math.PI, -0.5 * Math.PI + scoreRad, false);
    ctx.lineWidth = 12;
    ctx.strokeStyle = aiColorHex;
    ctx.stroke();

    // Circle center texts
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(aiColorDetails.col[0], aiColorDetails.col[1], aiColorDetails.col[2]);
    doc.text(`${aiScore}%`, donutCX, donutCY - 1, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setTextColor(139, 143, 168);
    doc.text('AI Score', donutCX, donutCY + 5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 30, 46);
    doc.text('AI Content Probability', donutCX, 114, { align: 'center' });

    // Donut Legend
    doc.setFillColor(239, 68, 68); // red
    doc.circle(36, 120, 1.5, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 110);
    doc.text('AI Generated', 40, 121.5);

    doc.setFillColor(34, 197, 94); // green
    doc.circle(64, 120, 1.5, 'F');
    doc.text('Human Written', 68, 121.5);

    // 3. Chart 3 — Readability Pie Chart (Right side)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 30, 46);
    doc.text('Writing Complexity', 120, 38);

    const simplePct = simpleSentencesPct || 50;
    const mediumPct = mediumSentencesPct || 30;
    const complexPct = complexSentencesPct !== undefined ? complexSentencesPct : (100 - simplePct - mediumPct);

    const w1 = (simplePct / 100) * 2 * Math.PI;
    const w2 = (mediumPct / 100) * 2 * Math.PI;
    const w3 = (complexPct / 100) * 2 * Math.PI;

    const pieCX = 140;
    const pieCY = 75;
    const pieR = 20;

    // Wedge 1: Simple (Green)
    ctx.beginPath();
    ctx.moveTo(pieCX, pieCY);
    ctx.arc(pieCX, pieCY, pieR, -0.5 * Math.PI, -0.5 * Math.PI + w1, false);
    ctx.closePath();
    ctx.fillStyle = '#22c55e';
    ctx.fill();

    // Wedge 2: Medium (Yellow)
    ctx.beginPath();
    ctx.moveTo(pieCX, pieCY);
    ctx.arc(pieCX, pieCY, pieR, -0.5 * Math.PI + w1, -0.5 * Math.PI + w1 + w2, false);
    ctx.closePath();
    ctx.fillStyle = '#f59e0b';
    ctx.fill();

    // Wedge 3: Complex (Red/Pink)
    ctx.beginPath();
    ctx.moveTo(pieCX, pieCY);
    ctx.arc(pieCX, pieCY, pieR, -0.5 * Math.PI + w1 + w2, -0.5 * Math.PI + w1 + w2 + w3, false);
    ctx.closePath();
    ctx.fillStyle = '#ec4899';
    ctx.fill();

    // Pie Legend
    doc.setFillColor(34, 197, 94);
    doc.circle(168, 65, 1.5, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 110);
    doc.text(`Simple: ${simplePct}%`, 172, 66.5);

    doc.setFillColor(245, 158, 11);
    doc.circle(168, 75, 1.5, 'F');
    doc.text(`Medium: ${mediumPct}%`, 172, 76.5);

    doc.setFillColor(236, 72, 153);
    doc.circle(168, 85, 1.5, 'F');
    doc.text(`Complex: ${complexPct}%`, 172, 86.5);

    // 4. Chart 2 — Scores Bar Chart (Center)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 30, 46);
    doc.text('Quality Metrics Overview', 20, 131);

    const bars = [
      { label: 'Originality Score', val: originalityScore },
      { label: 'Grammar Score', val: grammarScore },
      { label: 'Overall Quality', val: qualityScore },
      { label: 'Readability Score', val: readabilityScore },
    ];

    let barY = 137;
    bars.forEach(bar => {
      // Label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 30, 46);
      doc.text(bar.label, 20, barY + 4.2);

      // Background gray bar
      doc.setFillColor(229, 231, 235);
      doc.roundedRect(65, barY, 110, 6, 1.5, 1.5, 'F');

      // Fill colored bar
      const fillVal = bar.val !== undefined ? bar.val : 0;
      let fillCol = [34, 197, 94];
      if (fillVal < 60) {
        fillCol = [239, 68, 68];
      } else if (fillVal < 80) {
        fillCol = [245, 158, 11];
      }

      doc.setFillColor(fillCol[0], fillCol[1], fillCol[2]);
      if (fillVal > 0) {
        doc.roundedRect(65, barY, (fillVal / 100) * 110, 6, 1.5, 1.5, 'F');
      }

      // Percentage label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(fillCol[0], fillCol[1], fillCol[2]);
      doc.text(`${fillVal}%`, 180, barY + 4.5);

      barY += 9.5;
    });

    // 5. Table Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 30, 46);
    doc.text('Detailed Writing Statistics', 20, 182);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (doc as any).autoTable({
      startY: 186,
      margin: { left: 20, right: 20 },
      head: [['Metric', 'Value']],
      body: [
        ['Flesch Reading Ease Score', `${readabilityScore !== undefined ? readabilityScore : 'N/A'}/100`],
        ['Reading Level', readingLevel || 'N/A'],
        ['Average Sentence Length', `${avgSentenceLength !== undefined ? avgSentenceLength.toFixed(1) : 'N/A'} words`],
        ['Word Count', wordCount.toLocaleString()],
        ['Character Count', characterCount.toLocaleString()],
        ['Estimated Reading Time', `${Math.max(1, Math.ceil(wordCount / 200))} min`],
        ['Unique Words', uniqueWords ? uniqueWords.toLocaleString() : 'N/A'],
      ],
      headStyles: { fillColor: [124, 92, 252], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 249, 252] },
      styles: { font: 'helvetica', fontSize: 8.2 },
      theme: 'striped',
    });

    // Footer Page 2
    drawFooter(doc, 2);

    // =========================================================================
    // PAGE 3 — CERTIFICATE & SUMMARY PAGE
    // =========================================================================
    doc.addPage();

    // 1. Certificate Decorative Border
    // Outer rect
    doc.setDrawColor(124, 92, 252);
    doc.setLineWidth(0.8);
    doc.rect(20, 20, 170, 120, 'S');

    // Inner rect (3mm gap)
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.4);
    doc.rect(23, 23, 164, 114, 'S');

    // Centered headers
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(13, 15, 20);
    doc.text('VERIFIED AUTHENTICITY CERTIFICATE', 105, 38, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(124, 92, 252);
    doc.text('ContentGuard AI Analysis Platform', 105, 45, { align: 'center' });

    // Divider
    doc.setDrawColor(124, 92, 252);
    doc.setLineWidth(0.3);
    doc.line(45, 51, 165, 51);

    // Certificate Body
    doc.setFont('helvetica', 'oblique');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 100, 110);
    doc.text("This document certifies that the analyzed content has been", 105, 61, { align: 'center' });
    doc.text("processed through ContentGuard's multi-layer authenticity", 105, 66, { align: 'center' });
    doc.text("verification system.", 105, 71, { align: 'center' });

    // Big Result Badge
    let badgeText = '';
    let badgeCol = [34, 197, 94];
    if (aiScore <= 30) {
      badgeText = 'VERIFIED: HUMAN AUTHORED CONTENT';
      badgeCol = [34, 197, 94];
    } else if (aiScore <= 60) {
      badgeText = 'WARNING: MIXED CONTENT DETECTED';
      badgeCol = [245, 158, 11];
    } else {
      badgeText = 'ATTENTION: AI GENERATED CONTENT';
      badgeCol = [239, 68, 68];
    }

    doc.setFillColor(badgeCol[0], badgeCol[1], badgeCol[2]);
    doc.roundedRect(45, 82, 120, 12, 2.5, 2.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(255, 255, 255);
    doc.text(badgeText, 105, 89.5, { align: 'center' });

    // Certificate Meta stats
    doc.setFontSize(8);
    doc.setTextColor(139, 143, 168);
    doc.setFont('helvetica', 'normal');
    doc.text('Processed', 55, 112, { align: 'center' });
    doc.text('Confidence', 105, 112, { align: 'center' });
    doc.text('Method', 155, 112, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 46);
    doc.text(generatedAt.toLocaleDateString(), 55, 118, { align: 'center' });
    doc.text(`${100 - Math.round(aiScore)}%`, 105, 118, { align: 'center' });
    doc.text('Multi-Layer AI Analysis', 155, 118, { align: 'center' });

    // 2. Recommendations Section (y = 152)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 46);
    doc.text('Improvement Recommendations', 20, 152);

    const bullets: string[] = [];
    if (grammarScore < 90) {
      bullets.push(`Review and correct ${grammarErrors} grammatical issues found`);
    }
    if (aiScore > 30) {
      bullets.push('Consider rewriting AI-flagged sentences for authenticity');
    }
    if (originalityScore < 80) {
      const matchCount = plagiarismMatches !== undefined ? plagiarismMatches : 0;
      bullets.push(`Paraphrase or cite ${matchCount} similar passages found`);
    }
    
    // Parse grade level (e.g., "Grade 12" -> 12, "College" -> 13, "Graduate" -> 16)
    let gradeLevel = 0;
    const gradeMatch = (readingLevel || '').match(/\d+/);
    if (gradeMatch) {
      gradeLevel = parseInt(gradeMatch[0], 10);
    } else if ((readingLevel || '').toLowerCase().includes('college')) {
      gradeLevel = 13;
    } else if ((readingLevel || '').toLowerCase().includes('graduate') || (readingLevel || '').toLowerCase().includes('professional')) {
      gradeLevel = 16;
    }
    
    if (gradeLevel > 12) {
      bullets.push('Simplify sentence structure for broader audience');
    }
    bullets.push('Run periodic checks to maintain content quality');

    let bulletY = 161;
    bullets.forEach(bullet => {
      // Draw purple bullet dot
      doc.setFillColor(124, 92, 252);
      doc.circle(23, bulletY - 1, 1, 'F');

      // Draw text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 60);
      doc.text(bullet, 28, bulletY);
      
      bulletY += 7.5;
    });

    // Footer Page 3
    drawFooter(doc, 3);

    // Save document
    doc.save(`ContentGuard-Report-${dateStr}.pdf`);
  } catch (error) {
    console.error('Failed to generate premium report PDF:', error);
    throw error;
  }
}

/**
 * Generates a premium plagiarism checker report PDF matching the user's expected output.
 * Contains circular gauges for Plagiarism, Exact Match, Partial Match, and Unique.
 * Features a detailed statistics table, full text with plagiarized parts highlighted in red,
 * and a list of matching sources at the end.
 */
export async function generatePlagiarismReport(data: PlagiarismReportData): Promise<void> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const {
      text,
      originalityScore,
      similarityScore,
      matches,
      wordCount,
      characterCount,
      sentenceCount,
      paragraphCount,
      reportId,
      generatedAt
    } = data;

    const dateStr = generatedAt.toISOString().split('T')[0];

    // Helper to draw plagiarism footer retrospectively
    const drawPlagiarismFooter = (pdfDoc: jsPDF, pageNum: number, totalPagesCount: number) => {
      pdfDoc.saveGraphicsState();
      pdfDoc.setDrawColor(226, 232, 240);
      pdfDoc.setLineWidth(0.3);
      pdfDoc.line(15, 280, 195, 280);

      pdfDoc.setFont('helvetica', 'normal');
      pdfDoc.setFontSize(8);
      pdfDoc.setTextColor(148, 163, 184); // slate-400

      pdfDoc.text('ContentGuard | Plagiarism Scan Report', 15, 285);
      pdfDoc.text(`Page ${pageNum} of ${totalPagesCount}`, 105, 285, { align: 'center' });
      pdfDoc.text('contentguard.app', 195, 285, { align: 'right' });
      pdfDoc.restoreGraphicsState();
    };

    // Calculate Exact vs Partial match split
    const totalWords = wordCount || 1;
    const exactWords = matches
      .filter(m => m.matchPercentage >= 70)
      .reduce((sum, m) => sum + m.text.split(/\s+/).filter(Boolean).length, 0);

    const exactScore = Math.min(similarityScore, Math.round((exactWords / totalWords) * 100));
    const partialScore = Math.max(0, similarityScore - exactScore);

    // =========================================================================
    // PAGE 1 — SCAN METRICS & GAUGES
    // =========================================================================

    // 1. Header Area
    doc.setFillColor(248, 250, 252);
    doc.rect(15, 15, 180, 20, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(15, 35, 195, 35);

    // Logo text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(124, 92, 252); // purple
    doc.text('ContentGuard', 20, 25);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('PLAGIARISM SCAN REPORT', 20, 30);

    // Date & Report Metadata
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Date: ${generatedAt.toLocaleDateString()}`, 190, 24, { align: 'right' });
    doc.text(`Report ID: ${reportId}`, 190, 29, { align: 'right' });

    // 2. Main Dashboard Layout (4 side-by-side cards)
    const ctx = doc.context2d;
    const r = 11;
    const circ = 2 * Math.PI * r;
    const strokeWidth = 5;

    const drawArc = (cx: number, cy: number, radius: number, startAngle: number, endAngle: number, color: string, w: number) => {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, endAngle, false);
      ctx.lineWidth = w;
      ctx.strokeStyle = color;
      ctx.stroke();
    };

    const drawGauge = (cx: number, cy: number, radius: number, val: number, color: string) => {
      // background ring
      drawArc(cx, cy, radius, 0, 2 * Math.PI, '#e2e8f0', strokeWidth);
      // filled arc
      if (val > 0) {
        const rad = (val / 100) * 2 * Math.PI;
        drawArc(cx, cy, radius, -0.5 * Math.PI, -0.5 * Math.PI + rad, color, strokeWidth);
      }
    };

    // Card 1: Plagiarism Score (Red)
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, 40, 40, 48, 2.5, 2.5, 'S');

    drawGauge(35, 60, r, similarityScore, '#ef4444');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(239, 68, 68);
    doc.text(`${similarityScore}%`, 35, 59, { align: 'center' });
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Plagiarism', 35, 64, { align: 'center' });

    // Card 2: Exact & Partial (Stacked small gauges)
    doc.roundedRect(60, 40, 40, 48, 2.5, 2.5, 'S');
    // Exact Match Gauge
    drawGauge(80, 50, 6, exactScore, '#ef4444');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(239, 68, 68);
    doc.text(`${exactScore}%`, 80, 51, { align: 'center' });
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text('Exact Match', 80, 60, { align: 'center' });

    // Partial Match Gauge
    drawGauge(80, 70, 6, partialScore, '#3b82f6');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(59, 130, 246);
    doc.text(`${partialScore}%`, 80, 71, { align: 'center' });
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text('Partial Match', 80, 80, { align: 'center' });

    // Card 3: Unique (Green)
    doc.roundedRect(105, 40, 40, 48, 2.5, 2.5, 'S');
    drawGauge(125, 60, r, originalityScore, '#10b981');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(16, 185, 129);
    doc.text(`${originalityScore}%`, 125, 59, { align: 'center' });
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Unique', 125, 64, { align: 'center' });

    // Card 4: Detailed Statistics Table (slate-400 values)
    doc.roundedRect(150, 40, 45, 48, 2.5, 2.5, 'S');
    const statsList = [
      { label: 'Words', val: wordCount },
      { label: 'Characters', val: characterCount },
      { label: 'Sentences', val: sentenceCount },
      { label: 'Paragraphs', val: paragraphCount },
      { label: 'Read Time', val: `${Math.max(1, Math.ceil(wordCount / 200))} min` },
      { label: 'Speak Time', val: `${Math.max(1, Math.ceil(wordCount / 130))} min` }
    ];

    let statsY = 46;
    statsList.forEach(s => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(s.label, 154, statsY);
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text(String(s.val), 191, statsY, { align: 'right' });
      statsY += 7.2;
    });

    // 3. Section: Content Checked For Plagiarism (y = 96)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('Content Checked For Plagiarism', 15, 98);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(15, 101, 195, 101);

    let currentY = 108;
    let pageCount = 1;

    // Split text into sentences using regex
    const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];

    doc.setFontSize(9.5);
    doc.setFont('times', 'normal');
    doc.setTextColor(71, 85, 105);

    for (const sentence of sentences) {
      const cleanSentence = sentence.trim();
      if (cleanSentence.length === 0) continue;

      // Check if sentence is plagiarized
      const isPlagiarized = matches.some(m => {
        const cleanMatchText = m.text.trim();
        return cleanSentence.includes(cleanMatchText) || cleanMatchText.includes(cleanSentence);
      });

      if (isPlagiarized) {
        doc.setTextColor(239, 68, 68); // red
        doc.setFont('times', 'bold');
      } else {
        doc.setTextColor(71, 85, 105); // gray
        doc.setFont('times', 'normal');
      }

      // Wrap sentence text into lines
      const lines = doc.splitTextToSize(sentence, 180);
      for (const line of lines) {
        if (currentY > 265) {
          doc.addPage();
          pageCount++;
          currentY = 25;
        }
        doc.text(line, 15, currentY);
        currentY += 5.2;
      }
    }

    // 4. Section: Matched Sources (y = dynamic)
    currentY += 8;
    if (currentY > 240) {
      doc.addPage();
      pageCount++;
      currentY = 25;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('Matched Sources & Citations', 15, currentY);
    currentY += 3;

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(15, currentY, 195, currentY);
    currentY += 7;

    if (matches.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(16, 185, 129); // green
      doc.text('No plagiarism found. Content is 100% original.', 15, currentY);
    } else {
      for (const match of matches) {
        if (currentY > 245) {
          doc.addPage();
          pageCount++;
          currentY = 25;
        }

        // Draw a small red accent rect
        doc.setFillColor(239, 68, 68);
        doc.rect(15, currentY - 3, 2, 10, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(239, 68, 68); // red
        doc.text(`${match.matchPercentage}% Match — ${match.source}`, 20, currentY);
        currentY += 4.2;

        if (match.url) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(59, 130, 246); // blue link
          doc.text(match.url, 20, currentY);
          currentY += 4.2;
        }

        doc.setFont('times', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        const snippetLines = doc.splitTextToSize(`"${match.text}"`, 170);
        doc.text(snippetLines, 20, currentY);
        currentY += snippetLines.length * 4.2 + 6;
      }
    }

    // Retrospectively draw footer on all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawPlagiarismFooter(doc, i, totalPages);
    }

    doc.save(`Plagiarism-Scan-Report-${dateStr}.pdf`);
  } catch (error) {
    console.error('Failed to generate plagiarism report PDF:', error);
    throw error;
  }
}

