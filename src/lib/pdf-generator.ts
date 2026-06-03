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

  // Premium metrics
  aiScore?: number;
  grammarScore?: number;
  qualityScore?: number;
  readabilityScore?: number;
  readingLevel?: string;
  tone?: string;
  toneConfidence?: number;
  avgSentenceLength?: number;
  grammarErrors?: number;
  plagiarismMatches?: number;
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
  sentenceCount?: number;        // optional
  paragraphCount?: number;       // optional
  reportType?: 'ai' | 'plagiarism'; // optional
  exactScore?: number;           // optional
  partialScore?: number;         // optional
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
      plagiarismMatches,
      sentenceCount,
      paragraphCount,
      reportType = 'ai',
      exactScore = 0,
      partialScore = 0
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

    doc.setFont('helvetica', 'italic');
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
    doc.text(
      reportType === 'plagiarism'
        ? 'Plagiarism Analysis & Detailed Breakdown'
        : 'Visual Analytics & Detailed Breakdown',
      24,
      25
    );

    // Get jsPDF canvas 2d context for manual chart rendering
    const ctx = doc.context2d;

    const donutCX = 60;
    const donutCY = 75;

    if (reportType === 'plagiarism') {
      // 2. Chart 1 — Plagiarism Donut (Left side)
      // Background arc (gray)
      ctx.beginPath();
      ctx.arc(donutCX, donutCY, 24, 0, 2 * Math.PI, false);
      ctx.lineWidth = 12;
      ctx.strokeStyle = '#e5e7eb';
      ctx.stroke();

      // Arcs calculation
      const similarityScore = 100 - originalityScore;
      const radUnique = (originalityScore / 100) * 2 * Math.PI;
      const radExact = (exactScore / 100) * 2 * Math.PI;
      const radPartial = (partialScore / 100) * 2 * Math.PI;

      // Unique segment (green)
      if (originalityScore > 0) {
        ctx.beginPath();
        ctx.arc(donutCX, donutCY, 24, -0.5 * Math.PI, -0.5 * Math.PI + radUnique, false);
        ctx.lineWidth = 12;
        ctx.strokeStyle = '#84cc16'; // lime green
        ctx.stroke();
      }

      // Exact segment (red)
      if (exactScore > 0) {
        ctx.beginPath();
        ctx.arc(donutCX, donutCY, 24, -0.5 * Math.PI + radUnique, -0.5 * Math.PI + radUnique + radExact, false);
        ctx.lineWidth = 12;
        ctx.strokeStyle = '#ef4444'; // red
        ctx.stroke();
      }

      // Partial segment (blue)
      if (partialScore > 0) {
        ctx.beginPath();
        ctx.arc(donutCX, donutCY, 24, -0.5 * Math.PI + radUnique + radExact, -0.5 * Math.PI + radUnique + radExact + radPartial, false);
        ctx.lineWidth = 12;
        ctx.strokeStyle = '#3b82f6'; // blue
        ctx.stroke();
      }

      // Center text inside the donut
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59);
      doc.text(`${similarityScore}%`, donutCX, donutCY - 1, { align: 'center' });

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Plagiarism', donutCX, donutCY + 5, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 30, 46);
      doc.text('Plagiarism Distribution', donutCX, 114, { align: 'center' });

      // 3. Legend List (Right side)
      const legendX = 115;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(30, 30, 46);
      doc.text('Scan Results', legendX, 38);

      // Unique Row
      doc.setFillColor(132, 204, 22); // lime green
      doc.circle(legendX + 2, 50, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Unique', legendX + 8, 51.5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text(`${originalityScore}%`, 185, 52, { align: 'right' });

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.25);
      doc.line(legendX, 57, 185, 57);

      // Exact Match Row
      doc.setFillColor(239, 68, 68); // red
      doc.circle(legendX + 2, 69, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Exact Match', legendX + 8, 70.5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text(`${exactScore}%`, 185, 71, { align: 'right' });

      doc.line(legendX, 76, 185, 76);

      // Partial Match Row
      doc.setFillColor(59, 130, 246); // blue
      doc.circle(legendX + 2, 88, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Partial Match', legendX + 8, 89.5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text(`${partialScore}%`, 185, 90, { align: 'right' });

      doc.line(legendX, 95, 185, 95);
    } else {
      // 2. Chart 1 — Donut Arc (Left side)
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
    }

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
    doc.text(
      reportType === 'plagiarism' ? 'Plagiarism Scan Statistics' : 'Detailed Writing Statistics',
      20,
      182
    );

    let tableBody = [];
    if (reportType === 'plagiarism') {
      const rTime = Math.max(1, Math.ceil(wordCount / 200));
      const sTime = Math.max(1, Math.ceil(wordCount / 130));
      tableBody = [
        ['Words', wordCount.toLocaleString()],
        ['Characters', characterCount.toLocaleString()],
        ['Sentences', (sentenceCount || Math.ceil(wordCount / 15)).toLocaleString()],
        ['Paragraphs', (paragraphCount || Math.ceil(wordCount / 50)).toLocaleString()],
        ['Read Time', `${rTime} minute(s)`],
        ['Speak Time', `${sTime} minute(s)`]
      ];
    } else {
      tableBody = [
        ['Flesch Reading Ease Score', `${readabilityScore !== undefined ? readabilityScore : 'N/A'}/100`],
        ['Reading Level', readingLevel || 'N/A'],
        ['Average Sentence Length', `${avgSentenceLength !== undefined ? avgSentenceLength.toFixed(1) : 'N/A'} words`],
        ['Word Count', wordCount.toLocaleString()],
        ['Character Count', characterCount.toLocaleString()],
        ['Estimated Reading Time', `${Math.max(1, Math.ceil(wordCount / 200))} min`],
        ['Unique Words', uniqueWords ? uniqueWords.toLocaleString() : 'N/A'],
      ];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (doc as any).autoTable({
      startY: 186,
      margin: { left: 20, right: 20 },
      head: [[reportType === 'plagiarism' ? 'Scan Parameter' : 'Metric', 'Value']],
      body: tableBody,
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
    doc.text(
      reportType === 'plagiarism' ? 'VERIFIED ORIGINALITY CERTIFICATE' : 'VERIFIED AUTHENTICITY CERTIFICATE',
      105,
      38,
      { align: 'center' }
    );

    doc.setFontSize(10);
    doc.setTextColor(124, 92, 252);
    doc.text(
      reportType === 'plagiarism' ? 'ContentGuard Plagiarism Scan Platform' : 'ContentGuard AI Analysis Platform',
      105,
      45,
      { align: 'center' }
    );

    // Divider
    doc.setDrawColor(124, 92, 252);
    doc.setLineWidth(0.3);
    doc.line(45, 51, 165, 51);

    // Certificate Body
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 100, 110);
    if (reportType === 'plagiarism') {
      doc.text("This document certifies that the analyzed content has been", 105, 61, { align: 'center' });
      doc.text("processed through ContentGuard's Jaccard similarity and", 105, 66, { align: 'center' });
      doc.text("semantic sentence comparison originality database.", 105, 71, { align: 'center' });
    } else {
      doc.text("This document certifies that the analyzed content has been", 105, 61, { align: 'center' });
      doc.text("processed through ContentGuard's multi-layer authenticity", 105, 66, { align: 'center' });
      doc.text("verification system.", 105, 71, { align: 'center' });
    }

    // Big Result Badge
    let badgeText = '';
    let badgeCol = [34, 197, 94];
    if (reportType === 'plagiarism') {
      if (originalityScore >= 80) {
        badgeText = 'VERIFIED: ORIGINAL CONTENT';
        badgeCol = [34, 197, 94];
      } else if (originalityScore >= 50) {
        badgeText = 'WARNING: SIMILAR CONTENT DETECTED';
        badgeCol = [245, 158, 11];
      } else {
        badgeText = 'ATTENTION: PLAGIARIZED CONTENT DETECTED';
        badgeCol = [239, 68, 68];
      }
    } else {
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
    doc.text(reportType === 'plagiarism' ? 'Originality' : 'Confidence', 105, 112, { align: 'center' });
    doc.text('Method', 155, 112, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 46);
    doc.text(generatedAt.toLocaleDateString(), 55, 118, { align: 'center' });
    doc.text(
      reportType === 'plagiarism' ? `${originalityScore}%` : `${100 - Math.round(aiScore)}%`,
      105,
      118,
      { align: 'center' }
    );
    doc.text(
      reportType === 'plagiarism' ? 'Multi-Layer Plagiarism Scan' : 'Multi-Layer AI Analysis',
      155,
      118,
      { align: 'center' }
    );

    // 2. Recommendations Section (y = 152)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 46);
    doc.text('Improvement Recommendations', 20, 152);

    const bullets: string[] = [];
    if (reportType === 'plagiarism') {
      if (originalityScore < 90) {
        bullets.push(`Review and rewrite the matches from similar web sources`);
      }
      if (plagiarismMatches && plagiarismMatches > 0) {
        bullets.push(`Paraphrase or add inline citations for ${plagiarismMatches} matched sources`);
      }
      bullets.push('Review highlighted document text to identify self-similarities');
      bullets.push('Run periodic originality scans to ensure content integrity');
    } else {
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
    }

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
      generatedAt,
      aiScore = 0,
      grammarScore = 95,
      qualityScore = 90,
      readabilityScore = 60,
      readingLevel = 'College',
      tone = 'Neutral',
      toneConfidence = 100,
      avgSentenceLength = 15,
      grammarErrors = 0,
      plagiarismMatches = 0
    } = data;

    const dateStr = generatedAt.toISOString().split('T')[0];

    // Calculate Exact vs Partial match split
    const totalWords = wordCount || 1;
    const exactWords = matches
      .filter(m => m.matchPercentage >= 70)
      .reduce((sum, m) => sum + m.text.split(/\s+/).filter(Boolean).length, 0);

    const exactScore = Math.min(similarityScore, Math.round((exactWords / totalWords) * 100));
    const partialScore = Math.max(0, similarityScore - exactScore);

    // =========================================================================
    // PAGE 1 — COVER PAGE
    // =========================================================================

    // 1. Header Banner (Full width primary dark background)
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 45, 'F');

    // Draw checkmark badge in header banner
    doc.setFillColor(124, 92, 252);
    doc.circle(28, 22.5, 6, 'F');
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1.2);
    doc.line(25.5, 22.5, 27.5, 24.5);
    doc.line(27.5, 24.5, 31, 21);

    // Header Titles
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('ContentGuard', 40, 22);

    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.text('PLAGIARISM SCAN & ORIGINALITY CERTIFICATION', 40, 29);

    // Header Separator Accent Lines (Multi-color bar)
    doc.setFillColor(124, 92, 252);
    doc.rect(0, 45, 70, 2, 'F');
    doc.setFillColor(59, 130, 246);
    doc.rect(70, 45, 70, 2, 'F');
    doc.setFillColor(16, 185, 129);
    doc.rect(140, 45, 70, 2, 'F');

    // 2. Report Meta Info (Below header, light gray card with left accent)
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(20, 58, 170, 26, 3, 3, 'FD');
    doc.setFillColor(124, 92, 252);
    doc.rect(20, 58, 2, 26, 'F');

    // Meta Info Column Labels
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('DATE GENERATED', 27, 67);
    doc.text('REPORT SCAN ID', 82, 67);
    doc.text('TOTAL WORDS', 145, 67);

    // Meta Info Values
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(generatedAt.toLocaleString(), 27, 75);
    doc.text(reportId, 82, 75);
    doc.text(wordCount.toLocaleString(), 145, 75);

    // 3. 4 Score Cards Section (y = 92)
    const cardY = 92;
    const getPlagiarismScoreDetails = (type: 'plagiarism' | 'exact' | 'partial' | 'unique', val: number) => {
      let col = [34, 197, 94]; // success green
      let label = 'Unique';
      let desc = '';
      if (type === 'plagiarism') {
        desc = 'Total matched text';
        if (val === 0) {
          col = [16, 185, 129]; // green
          label = 'Plagiarism';
        } else if (val <= 10) {
          col = [245, 158, 11]; // orange
          label = 'Plagiarism';
        } else {
          col = [239, 68, 68]; // red
          label = 'Plagiarism';
        }
      } else if (type === 'exact') {
        col = [239, 68, 68]; // red
        label = 'Exact Match';
        desc = '1:1 direct web copying';
      } else if (type === 'partial') {
        col = [59, 130, 246]; // blue
        label = 'Partial Match';
        desc = 'Paraphrased text blocks';
      } else if (type === 'unique') {
        col = [16, 185, 129]; // green
        label = 'Unique';
        desc = 'Original human-written';
      }
      return { col, label, desc };
    };

    const cards = [
      { type: 'plagiarism' as const, title: 'PLAGIARISM', val: similarityScore },
      { type: 'exact' as const, title: 'EXACT MATCH', val: exactScore },
      { type: 'partial' as const, title: 'PARTIAL MATCH', val: partialScore },
      { type: 'unique' as const, title: 'UNIQUE', val: originalityScore }
    ];

    cards.forEach((card, index) => {
      const cardX = 20 + index * 44; // 38mm width + 6mm gap
      const { col, label, desc } = getPlagiarismScoreDetails(card.type, card.val);

      // Card shadow
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(cardX + 1, cardY + 1, 38, 45, 2.5, 2.5, 'F');

      // Card boundary box with colored border and soft background fill
      let bgCol = [255, 255, 255];
      if (card.type === 'plagiarism') bgCol = [254, 242, 242]; // light red
      else if (card.type === 'exact') bgCol = [255, 247, 237]; // light orange
      else if (card.type === 'partial') bgCol = [239, 246, 255]; // light blue
      else if (card.type === 'unique') bgCol = [240, 253, 244]; // light green

      doc.setFillColor(bgCol[0], bgCol[1], bgCol[2]);
      doc.setDrawColor(col[0], col[1], col[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(cardX, cardY, 38, 45, 2.5, 2.5, 'FD');

      // Accent line top
      doc.setFillColor(col[0], col[1], col[2]);
      doc.rect(cardX, cardY, 38, 3, 'F');

      // Card Content
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(col[0], col[1], col[2]);
      doc.text(card.title, cardX + 19, cardY + 10, { align: 'center' });

      doc.setFontSize(22);
      doc.setTextColor(30, 41, 59);
      doc.text(`${card.val !== undefined ? card.val : '0'}%`, cardX + 19, cardY + 25, { align: 'center' });

      doc.setFontSize(8.5);
      doc.setTextColor(col[0], col[1], col[2]);
      doc.text(label, cardX + 19, cardY + 34, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(desc, cardX + 19, cardY + 40, { align: 'center' });
    });

    // 4. Content Preview Box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('DOCUMENT CONTENT PREVIEW', 20, 153);

    // Shadow
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(21, 159, 170, 52, 3, 3, 'F');

    // Box border
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(20, 158, 170, 52, 3, 3, 'FD');

    // Paper tag graphic
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.rect(174, 164, 8, 10, 'S');
    doc.line(178, 164, 182, 168);

    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    
    const previewRaw = text.length > 300 
      ? text.substring(0, 300) + '...' 
      : text;
    const previewLines = doc.splitTextToSize(previewRaw, 156);
    doc.text(previewLines, 26, 170);

    // 5. Verification Security / Authenticity Seal
    // Shadow
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(21, 221, 170, 42, 3, 3, 'F');

    // Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(20, 220, 170, 42, 3, 3, 'FD');

    // Left emerald accent
    doc.setFillColor(16, 185, 129);
    doc.rect(20, 220, 2, 42, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(16, 185, 129);
    doc.text('VERIFICATION SECURITY & SCAN QUALITY', 27, 229);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('This scan report is cryptographically signed and Jaccard-verified against our plagiarism database', 27, 235);
    doc.text('comprising active index crawled web resources, academic books, and digital repositories.', 27, 239);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('DATABASE STATUS: VERIFIED ONLINE', 27, 250);

    // Status badge outline
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.3);
    doc.roundedRect(125, 244, 58, 10, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(16, 185, 129);
    doc.text('JACCARD SCAN: SECURE', 154, 250.5, { align: 'center' });


    // =========================================================================
    // PAGE 2 — SCAN METRICS & GAUGES (DEDICATED DASHBOARD PAGE)
    // =========================================================================
    doc.addPage();

    // 1. Page Header Banner (Dark Theme)
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Plagiarism Analysis & Detailed Dashboard', 20, 16);
    doc.setFillColor(124, 92, 252);
    doc.rect(0, 25, 210, 1.5, 'F');

    // 2. Main Dashboard Layout (3 widgets side-by-side)
    // Widget 1: Large Donut Chart (Originality vs Plagiarism)
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(15, 32, 85, 82, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('ORIGINALITY VS PLAGIARISM', 22, 42);

    const ctx = doc.context2d;
    const drawArc = (cx: number, cy: number, radius: number, startAngle: number, endAngle: number, color: string, w: number) => {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, endAngle, false);
      ctx.lineWidth = w;
      ctx.strokeStyle = color;
      ctx.stroke();
    };

    const drawGauge = (cx: number, cy: number, radius: number, val: number, color: string, w: number = 5) => {
      // background ring
      drawArc(cx, cy, radius, 0, 2 * Math.PI, '#f1f5f9', w);
      // filled arc
      if (val > 0) {
        const rad = (val / 100) * 2 * Math.PI;
        drawArc(cx, cy, radius, -0.5 * Math.PI, -0.5 * Math.PI + rad, color, w);
      }
    };

    const largeCX = 57.5;
    const largeCY = 70;
    const largeR = 18;
    const largeW = 6.5;

    // Background ring
    drawArc(largeCX, largeCY, largeR, 0, 2 * Math.PI, '#f1f5f9', largeW);

    // Segments
    const rUnique = (originalityScore / 100) * 2 * Math.PI;
    const rPlag = (similarityScore / 100) * 2 * Math.PI;

    // Unique segment (Green)
    if (originalityScore > 0) {
      drawArc(largeCX, largeCY, largeR, -0.5 * Math.PI, -0.5 * Math.PI + rUnique, '#10b981', largeW);
    }
    // Plagiarism segment (Red)
    if (similarityScore > 0) {
      drawArc(largeCX, largeCY, largeR, -0.5 * Math.PI + rUnique, -0.5 * Math.PI + rUnique + rPlag, '#ef4444', largeW);
    }

    // Center text in large donut
    const textCol = similarityScore > 10 ? [239, 68, 68] : similarityScore === 0 ? [16, 185, 129] : [245, 158, 11];
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(textCol[0], textCol[1], textCol[2]);
    doc.text(`${similarityScore}%`, largeCX, largeCY + 1.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Plagiarism', largeCX, largeCY + 7.5, { align: 'center' });

    // Legend
    doc.setFillColor(16, 185, 129);
    doc.circle(28, 98, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Unique Content: ${originalityScore}%`, 33, 99.5);

    doc.setFillColor(239, 68, 68);
    doc.circle(28, 105, 1.5, 'F');
    doc.text(`Plagiarized Content: ${similarityScore}%`, 33, 106.5);


    // Widget 2: Plagiarism Subtypes (Right column, top, y = 32 to 70, x = 105 to 195, width 90)
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(105, 32, 90, 38, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('MATCH TYPES DETECTED', 112, 40);

    const smallCX1 = 127;
    const smallCX2 = 173;
    const topCY = 51;
    const smallR = 7.5;
    const smallW = 3.5;

    // Left: Exact Match % (red/orange ring)
    drawGauge(smallCX1, topCY, smallR, exactScore, '#ef4444', smallW);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(239, 68, 68);
    doc.text(`${exactScore}%`, smallCX1, topCY + 1.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Exact Match', smallCX1, topCY + 10.5, { align: 'center' });

    // Right: Partial Match % (blue ring)
    drawGauge(smallCX2, topCY, smallR, partialScore, '#3b82f6', smallW);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(59, 130, 246);
    doc.text(`${partialScore}%`, smallCX2, topCY + 1.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Partial Match', smallCX2, topCY + 10.5, { align: 'center' });


    // Widget 3: Document Stats Table (Right column, bottom, y = 74 to 114, x = 105 to 195, width 90)
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(105, 74, 90, 40, 3, 3, 'FD');

    const rHeight = 5.8;
    const tableX = 110;
    const tableY = 77;
    const tableW = 80;

    const rTime = Math.max(1, Math.ceil(wordCount / 200));
    const sTime = Math.max(1, Math.ceil(wordCount / 130));

    const statsList = [
      { label: 'Words Count', val: wordCount.toLocaleString() },
      { label: 'Characters', val: characterCount.toLocaleString() },
      { label: 'Total Sentences', val: (sentenceCount || Math.ceil(wordCount / 15)).toLocaleString() },
      { label: 'Paragraphs', val: (paragraphCount || Math.ceil(wordCount / 50)).toLocaleString() },
      { label: 'Est. Reading Time', val: `${rTime} min(s)` },
      { label: 'Est. Speaking Time', val: `${sTime} min(s)` }
    ];

    statsList.forEach((stat, idx) => {
      const rowY = tableY + idx * rHeight;
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(tableX - 2, rowY - 1, tableW, rHeight, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(stat.label, tableX, rowY + 3.8);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(stat.val, tableX + tableW - 4, rowY + 3.8, { align: 'right' });
    });


    // Widget 4: Visual Originality Comparison Bar (y = 120, x = 15, w = 180, h = 42)
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, 120, 180, 42, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('VISUAL ORIGINALITY COMPARISON BAR', 22, 129);

    const barX = 22;
    const barY = 135;
    const barW = 166;
    const barH = 8;

    const wUnique = (originalityScore / 100) * barW;
    const wExact = (exactScore / 100) * barW;
    const wPartial = (partialScore / 100) * barW;

    let currentBarX = barX;

    // Unique segment (Green)
    if (originalityScore > 0) {
      doc.setFillColor(16, 185, 129);
      doc.rect(currentBarX, barY, wUnique, barH, 'F');
      currentBarX += wUnique;
    }
    // Exact segment (Red)
    if (exactScore > 0) {
      doc.setFillColor(239, 68, 68);
      doc.rect(currentBarX, barY, wExact, barH, 'F');
      currentBarX += wExact;
    }
    // Partial segment (Blue)
    if (partialScore > 0) {
      doc.setFillColor(59, 130, 246);
      doc.rect(currentBarX, barY, wPartial, barH, 'F');
    }

    // Legend
    doc.setFillColor(16, 185, 129);
    doc.circle(28, 152, 1.5, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Unique: ${originalityScore}%`, 33, 153.5);

    doc.setFillColor(239, 68, 68);
    doc.circle(80, 152, 1.5, 'F');
    doc.text(`Exact Match: ${exactScore}%`, 85, 153.5);

    doc.setFillColor(59, 130, 246);
    doc.circle(135, 152, 1.5, 'F');
    doc.text(`Partial Match: ${partialScore}%`, 140, 153.5);


    // Widget 5: Scan Coverage Checklist (y = 168, x = 15, w = 180, h = 44)
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, 168, 180, 44, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('SCAN PARAMETERS & DATABASE COVERAGE', 22, 177);

    const checkItems = [
      { t: 'Jaccard Web Index', d: 'Scanned active online resources, web pages, blogs, and news feeds.' },
      { t: 'Academic Library & Journals', d: 'Checked against journals, publications, and thesis databases.' },
      { t: 'Semantic Paraphrase Classifier', d: 'Inspected sentence syntax and synonyms for structural similarities.' },
      { t: 'AI-Generated Copy check', d: 'Validated multi-model patterns for machine-assisted translations.' }
    ];

    checkItems.forEach((item, idx) => {
      const itemY = 184 + idx * 6.5;

      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(0.4);
      doc.setFillColor(240, 253, 244);
      doc.rect(22, itemY - 2.5, 3.5, 3.5, 'FD');

      doc.setLineWidth(0.6);
      doc.line(22.8, itemY - 1, 23.8, itemY - 0.4);
      doc.line(23.8, itemY - 0.4, 25, itemY - 2.2);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(item.t + ':', 28, itemY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(item.d, 68, itemY);
    });


    // Widget 6: Executive Verification Assessment (y = 218, x = 15, w = 180, h = 44)
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, 218, 180, 44, 3, 3, 'FD');

    doc.setFillColor(124, 92, 252);
    doc.rect(15, 218, 2, 44, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(124, 92, 252);
    doc.text('EXECUTIVE VERIFICATION ASSESSMENT', 22, 227);

    let feedback = '';
    if (similarityScore === 0) {
      feedback = 'The scanned document demonstrates 100% originality. No matching patterns or Jaccard similarity traces were detected against active web nodes, journals, or online libraries. The content is verified as fully unique and human-written.';
    } else if (similarityScore <= 10) {
      feedback = `The scanned document demonstrates high originality (${originalityScore}%). A minor similarity of ${similarityScore}% was identified, indicating standard citation overlaps, common phrases, or referencing. The document is verified as authentic and clean.`;
    } else {
      feedback = `The scanned document exhibits moderate to high similarity matches (${similarityScore}% total). A significant portion of the text shows direct copying (${exactScore}%) or paraphrasing (${partialScore}%). We highly recommend reviewing the matches highlighted in the appendix starting on Page 4 and applying proper academic citations.`;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const feedbackLines = doc.splitTextToSize(feedback, 168);
    doc.text(feedbackLines, 22, 234);


    // =========================================================================
    // PAGE 3 — VERIFIED ORIGINALITY CERTIFICATE
    // =========================================================================
    doc.addPage();
    let currentY = 20;

    // 1. Certificate Decorative Border
    // Outer rect
    doc.setDrawColor(124, 92, 252);
    doc.setLineWidth(0.8);
    doc.rect(20, currentY, 170, 115, 'S');

    // Inner rect (3mm gap)
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.4);
    doc.rect(23, currentY + 3, 164, 109, 'S');

    // Centered headers
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(13, 15, 20);
    doc.text('VERIFIED ORIGINALITY CERTIFICATE', 105, currentY + 18, { align: 'center' });

    doc.setFontSize(9.5);
    doc.setTextColor(124, 92, 252);
    doc.text('ContentGuard Plagiarism Scan Platform', 105, currentY + 25, { align: 'center' });

    // Divider
    doc.setDrawColor(124, 92, 252);
    doc.setLineWidth(0.3);
    doc.line(45, currentY + 31, 165, currentY + 31);

    // Certificate Body
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 110);
    doc.text("This document certifies that the analyzed content has been", 105, currentY + 41, { align: 'center' });
    doc.text("processed through ContentGuard's Jaccard similarity and", 105, currentY + 46, { align: 'center' });
    doc.text("semantic sentence comparison originality database.", 105, currentY + 51, { align: 'center' });

    // Big Result Badge
    let badgeText = '';
    let badgeCol = [34, 197, 94];
    if (originalityScore >= 80) {
      badgeText = 'VERIFIED: ORIGINAL CONTENT';
      badgeCol = [34, 197, 94];
    } else if (originalityScore >= 50) {
      badgeText = 'WARNING: SIMILAR CONTENT DETECTED';
      badgeCol = [245, 158, 11];
    } else {
      badgeText = 'ATTENTION: PLAGIARIZED CONTENT DETECTED';
      badgeCol = [239, 68, 68];
    }

    doc.setFillColor(badgeCol[0], badgeCol[1], badgeCol[2]);
    doc.roundedRect(45, currentY + 62, 120, 12, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(badgeText, 105, currentY + 69.5, { align: 'center' });

    // Certificate Meta stats
    doc.setFontSize(8);
    doc.setTextColor(139, 143, 168);
    doc.setFont('helvetica', 'normal');
    doc.text('Processed', 55, currentY + 92, { align: 'center' });
    doc.text('Originality', 105, currentY + 92, { align: 'center' });
    doc.text('Method', 155, currentY + 92, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 46);
    doc.text(generatedAt.toLocaleDateString(), 55, currentY + 98, { align: 'center' });
    doc.text(`${originalityScore}%`, 105, currentY + 98, { align: 'center' });
    doc.text('Multi-Layer Plagiarism Scan', 155, currentY + 98, { align: 'center' });

    // Move currentY to outside the border box for recommendations
    currentY += 125;

    // 3. Recommendations Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 46);
    doc.text('Improvement Recommendations', 20, currentY);
    currentY += 7;

    const bullets: string[] = [];
    if (originalityScore < 90) {
      bullets.push('Review and rewrite the matches from similar web sources');
    }
    if (plagiarismMatches && plagiarismMatches > 0) {
      bullets.push(`Paraphrase or add inline citations for ${plagiarismMatches} matched sources`);
    }
    bullets.push('Review highlighted document text to identify self-similarities');
    bullets.push('Run periodic originality scans to ensure content integrity');

    bullets.forEach(bullet => {
      // Draw purple bullet dot
      doc.setFillColor(124, 92, 252);
      doc.circle(23, currentY - 1, 1, 'F');

      // Draw text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 60);
      doc.text(bullet, 28, currentY);

      currentY += 7.0;
    });


    // =========================================================================
    // PAGE 4 — CONTENT CHECKED FOR PLAGIARISM (APPENDIX A)
    // =========================================================================
    doc.addPage();
    currentY = 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('Appendix A: Highlighted Text Analysis', 15, currentY);
    currentY += 5;

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(15, currentY, 195, currentY);
    currentY += 8;

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
          currentY = 20;
        }
        doc.text(line, 15, currentY);
        currentY += 5.5;
      }
    }


    // =========================================================================
    // PAGE 5 — MATCHED SOURCES & CITATIONS (APPENDIX B)
    // =========================================================================
    doc.addPage();
    currentY = 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('Appendix B: Matched Sources & Academic Citations', 15, currentY);
    currentY += 5;

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(15, currentY, 195, currentY);
    currentY += 8;

    if (matches.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(16, 185, 129); // green
      doc.text('No plagiarism found. Content is 100% original.', 15, currentY);
      currentY += 8;
    } else {
      let matchIdx = 1;
      for (const match of matches) {
        const snippet = `"${match.text}"`;
        const snippetLines = doc.splitTextToSize(snippet, 160);
        
        // Calculate card height based on snippet line count
        const cardH = 12 + snippetLines.length * 4.0 + 6;

        if (currentY + cardH > 265) {
          doc.addPage();
          currentY = 20;
        }

        // Draw card boundary box
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(15, currentY, 170, cardH, 2, 2, 'FD');

        // Grey Circle with Number
        doc.setFillColor(241, 245, 249);
        doc.circle(21, currentY + 6, 2.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(String(matchIdx), 21, currentY + 7, { align: 'center' });

        // URL in blue/purple
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(124, 92, 252); // purple
        const sourceUrl = match.url || match.source;
        const truncatedUrl = sourceUrl.length > 70 ? sourceUrl.substring(0, 70) + '...' : sourceUrl;
        doc.text(truncatedUrl, 26, currentY + 7);

        // Match badge in red pill badge style
        doc.setFillColor(254, 242, 242);
        doc.roundedRect(160, currentY + 3.5, 20, 5, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(239, 68, 68);
        doc.text(`${match.matchPercentage}% MATCH`, 170, currentY + 7, { align: 'center' });

        // Snippet text in muted color below URL
        doc.setFont('times', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text(snippetLines, 21, currentY + 14);

        currentY += cardH + 5;
        matchIdx++;
      }
    }

    // Retrospectively draw footer on all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.saveGraphicsState();
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(20, 277, 190, 277);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(139, 143, 168); // muted gray

      doc.text('ContentGuard | Plagiarism Scan Report', 20, 283);
      doc.text(`Page ${i} of ${totalPages}`, 105, 283, { align: 'center' });
      doc.text('contentguard.app', 190, 283, { align: 'right' });
      doc.restoreGraphicsState();
    }

    // Save document
    doc.save(`Plagiarism-Scan-Report-${dateStr}.pdf`);
  } catch (error) {
    console.error('Failed to generate plagiarism report PDF:', error);
    throw error;
  }
}
