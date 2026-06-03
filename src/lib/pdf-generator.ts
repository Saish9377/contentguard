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
    doc.setFont('helvetica', 'oblique');
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
    doc.text('Plagiarism Scan & Originality Report', 42, 30);

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
    const getPlagiarismScoreDetails = (type: 'plagiarism' | 'exact' | 'partial' | 'unique', val: number) => {
      let col = [34, 197, 94]; // success green
      let label = 'Unique';
      if (type === 'plagiarism') {
        if (val === 0) {
          col = [34, 197, 94]; // green
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
      } else if (type === 'partial') {
        col = [245, 158, 11]; // amber/yellow
        label = 'Partial Match';
      } else if (type === 'unique') {
        col = [34, 197, 94]; // green
        label = 'Unique';
      }
      return { col, label };
    };

    const cards = [
      { type: 'plagiarism' as const, title: 'PLAGIARISM', val: similarityScore },
      { type: 'exact' as const, title: 'EXACT MATCH', val: exactScore },
      { type: 'partial' as const, title: 'PARTIAL MATCH', val: partialScore },
      { type: 'unique' as const, title: 'UNIQUE', val: originalityScore }
    ];

    cards.forEach((card, index) => {
      const cardX = 20 + index * 44; // 38mm width + 6mm gap
      const { col, label } = getPlagiarismScoreDetails(card.type, card.val);

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
      doc.text(`${card.val !== undefined ? card.val : '0'}%`, cardX + 19, 118, { align: 'center' });

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
    
    const previewRaw = text.length > 300 
      ? text.substring(0, 300) + '...' 
      : text;
    const previewLines = doc.splitTextToSize(previewRaw, 160);
    doc.text(previewLines, 25, 163);

    // =========================================================================
    // PAGE 2 — SCAN METRICS & GAUGES (DEDICATED DASHBOARD PAGE)
    // =========================================================================
    doc.addPage();

    // 1. Page Header Banner (Purple Gradient Header Bar)
    doc.setFillColor(124, 92, 252);
    doc.rect(15, 20, 180, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Plagiarism Analysis & Detailed Dashboard', 20, 25.5);

    // 2. Main Dashboard Layout (ONE unified card: w = 180, h = 85, from y = 34 to y = 119)
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, 34, 180, 85, 3, 3, 'FD');

    const ctx = doc.context2d;
    const strokeWidth = 5;

    const drawArc = (cx: number, cy: number, radius: number, startAngle: number, endAngle: number, color: string, w: number) => {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, endAngle, false);
      ctx.lineWidth = w;
      ctx.strokeStyle = color;
      ctx.stroke();
    };

    const drawGauge = (cx: number, cy: number, radius: number, val: number, color: string, w: number = 5) => {
      // background ring
      drawArc(cx, cy, radius, 0, 2 * Math.PI, '#e2e8f0', w);
      // filled arc
      if (val > 0) {
        const rad = (val / 100) * 2 * Math.PI;
        drawArc(cx, cy, radius, -0.5 * Math.PI, -0.5 * Math.PI + rad, color, w);
      }
    };

    // Column 1: Large Donut Chart (Plagiarism% vs Unique%)
    // Center: cx = 45, cy = 76, radius = 22
    const largeCX = 45;
    const largeCY = 76;
    const largeR = 22;
    const largeW = 7;

    // Background ring
    drawArc(largeCX, largeCY, largeR, 0, 2 * Math.PI, '#e2e8f0', largeW);

    const radUnique = (originalityScore / 100) * 2 * Math.PI;
    const radPlag = (similarityScore / 100) * 2 * Math.PI;

    // Unique segment (Green)
    if (originalityScore > 0) {
      drawArc(largeCX, largeCY, largeR, -0.5 * Math.PI, -0.5 * Math.PI + radUnique, '#10b981', largeW);
    }
    // Plagiarism segment (Red)
    if (similarityScore > 0) {
      drawArc(largeCX, largeCY, largeR, -0.5 * Math.PI + radUnique, -0.5 * Math.PI + radUnique + radPlag, '#ef4444', largeW);
    }

    // Center text in large donut
    const textCol = similarityScore > 10 ? [239, 68, 68] : similarityScore === 0 ? [16, 185, 129] : [245, 158, 11];
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(textCol[0], textCol[1], textCol[2]);
    doc.text(`${similarityScore}%`, largeCX, largeCY + 1.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Plagiarism', largeCX, largeCY + 7.5, { align: 'center' });


    // Column 2: Stacked small donuts (Exact Match top, Partial Match bottom)
    const smallCX = 105;
    const topCY = 56;
    const bottomCY = 90;
    const smallR = 9;
    const smallW = 3.5;

    // Top: Exact Match % (red/orange ring)
    drawGauge(smallCX, topCY, smallR, exactScore, '#f97316', smallW);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(249, 115, 22); // orange (#f97316)
    doc.text(`${exactScore}%`, smallCX, topCY + 1.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Exact Match', smallCX, topCY + 12, { align: 'center' });

    // Bottom: Partial Match % (blue ring)
    drawGauge(smallCX, bottomCY, smallR, partialScore, '#3b82f6', smallW);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(59, 130, 246); // blue (#3b82f6)
    doc.text(`${partialScore}%`, smallCX, bottomCY + 1.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Partial Match', smallCX, bottomCY + 12, { align: 'center' });


    // Column 3: Document stats table (clean, alternating row bg, words, chars, sentences, paragraphs, read time, speak time)
    const tableX = 142;
    const tableY = 38;
    const tableW = 46;
    const rHeight = 10.5;

    const rTime = Math.max(1, Math.ceil(wordCount / 200));
    const sTime = Math.max(1, Math.ceil(wordCount / 130));

    const statsList = [
      { label: 'Words', val: wordCount.toLocaleString() },
      { label: 'Characters', val: characterCount.toLocaleString() },
      { label: 'Sentences', val: (sentenceCount || Math.ceil(wordCount / 15)).toLocaleString() },
      { label: 'Paragraphs', val: (paragraphCount || Math.ceil(wordCount / 50)).toLocaleString() },
      { label: 'Read Time', val: `${rTime} min(s)` },
      { label: 'Speak Time', val: `${sTime} min(s)` }
    ];

    statsList.forEach((stat, idx) => {
      const rowY = tableY + idx * rHeight;
      // Alternating row background
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(tableX - 2, rowY - 1.5, tableW + 4, rHeight, 'F');
      }
      
      // Muted label
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(stat.label, tableX, rowY + 5);

      // Bold value
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text(stat.val, tableX + tableW, rowY + 5, { align: 'right' });
    });

    // =========================================================================
    // PAGE 3 — CONTENT CHECKED FOR PLAGIARISM
    // =========================================================================
    doc.addPage();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('Content Checked For Plagiarism', 15, 20);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(15, 23, 195, 23);

    let currentY = 30;

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
          currentY = 25;
        }
        doc.text(line, 15, currentY);
        currentY += 5.2;
      }
    }

    // =========================================================================
    // PAGE 4 — MATCHED SOURCES & CITATIONS
    // =========================================================================
    doc.addPage();
    currentY = 25;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('Matched Sources & Academic Citations', 15, currentY);
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
      let matchIdx = 1;
      for (const match of matches) {
        const snippet = `"${match.text}"`;
        const snippetLines = doc.splitTextToSize(snippet, 160);
        
        // Calculate card height based on snippet line count
        const cardH = 12 + snippetLines.length * 4.2 + 6;

        if (currentY + cardH > 265) {
          doc.addPage();
          currentY = 25;
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
        doc.setFontSize(8.5);
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

    // =========================================================================
    // PAGE 5 — VERIFIED ORIGINALITY CERTIFICATE & RECOMMENDATIONS
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
    doc.text('VERIFIED ORIGINALITY CERTIFICATE', 105, 38, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(124, 92, 252);
    doc.text('ContentGuard Plagiarism Scan Platform', 105, 45, { align: 'center' });

    // Divider
    doc.setDrawColor(124, 92, 252);
    doc.setLineWidth(0.3);
    doc.line(45, 51, 165, 51);

    // Certificate Body
    doc.setFont('helvetica', 'oblique');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 100, 110);
    doc.text("This document certifies that the analyzed content has been", 105, 61, { align: 'center' });
    doc.text("processed through ContentGuard's Jaccard similarity and", 105, 66, { align: 'center' });
    doc.text("semantic sentence comparison originality database.", 105, 71, { align: 'center' });

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
    doc.text('Originality', 105, 112, { align: 'center' });
    doc.text('Method', 155, 112, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 46);
    doc.text(generatedAt.toLocaleDateString(), 55, 118, { align: 'center' });
    doc.text(`${originalityScore}%`, 105, 118, { align: 'center' });
    doc.text('Multi-Layer Plagiarism Scan', 155, 118, { align: 'center' });

    // 2. Recommendations Section (y = 152)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 46);
    doc.text('Improvement Recommendations', 20, 152);

    const bullets: string[] = [];
    if (originalityScore < 90) {
      bullets.push('Review and rewrite the matches from similar web sources');
    }
    if (plagiarismMatches && plagiarismMatches > 0) {
      bullets.push(`Paraphrase or add inline citations for ${plagiarismMatches} matched sources`);
    }
    bullets.push('Review highlighted document text to identify self-similarities');
    bullets.push('Run periodic originality scans to ensure content integrity');

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
