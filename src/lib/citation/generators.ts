import { CitationSource, CitationOutput } from '@/types/citation';

function formatAuthorsAPA(authors: string[]): string {
  if (authors.length === 0) return '';
  if (authors.length === 1) return formatLastFirst(authors[0]);
  if (authors.length === 2) return `${formatLastFirst(authors[0])}, & ${formatLastFirst(authors[1])}`;
  if (authors.length <= 7) {
    const formatted = authors.slice(0, -1).map(formatLastFirst).join(', ');
    return `${formatted}, & ${formatLastFirst(authors[authors.length - 1])}`;
  }
  const first6 = authors.slice(0, 6).map(formatLastFirst).join(', ');
  return `${first6}, . . . ${formatLastFirst(authors[authors.length - 1])}`;
}

function formatLastFirst(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  const initials = parts.slice(0, -1).map(p => p[0].toUpperCase() + '.').join(' ');
  return `${last}, ${initials}`;
}

function formatFirstLast(name: string): string {
  return name.trim();
}

export function generateAPA(source: CitationSource): CitationOutput {
  let formatted = '';
  let inText = '';

  const authorStr = formatAuthorsAPA(source.authors);
  const lastName = source.authors[0]?.split(/\s+/).pop() || 'Unknown';

  switch (source.type) {
    case 'book':
      formatted = `${authorStr} (${source.year}). *${source.title}*${source.edition ? ` (${source.edition} ed.)` : ''}. ${source.publisher || ''}.${source.doi ? ` https://doi.org/${source.doi}` : ''}`;
      break;
    case 'journal':
      formatted = `${authorStr} (${source.year}). ${source.title}. *${source.journal || ''}*${source.volume ? `, *${source.volume}*` : ''}${source.issue ? `(${source.issue})` : ''}${source.pages ? `, ${source.pages}` : ''}.${source.doi ? ` https://doi.org/${source.doi}` : ''}`;
      break;
    case 'website':
      formatted = `${authorStr} (${source.year}). *${source.title}*. ${source.publisher || ''}. ${source.url || ''}`;
      break;
    case 'conference':
      formatted = `${authorStr} (${source.year}). ${source.title}. In *${source.conference || ''}*${source.pages ? ` (pp. ${source.pages})` : ''}. ${source.publisher || ''}.`;
      break;
  }

  inText = source.authors.length <= 2
    ? `(${source.authors.map(a => a.split(/\s+/).pop()).join(' & ')}, ${source.year})`
    : `(${lastName} et al., ${source.year})`;

  return { style: 'apa', formatted: formatted.replace(/\.\./g, '.').trim(), inText };
}

export function generateMLA(source: CitationSource): CitationOutput {
  let formatted = '';
  const firstName = source.authors[0] ? formatLastFirst(source.authors[0]) : 'Unknown';

  switch (source.type) {
    case 'book':
      formatted = `${firstName}. *${source.title}*. ${source.publisher || ''}, ${source.year}.`;
      break;
    case 'journal':
      formatted = `${firstName}. "${source.title}." *${source.journal || ''}*, vol. ${source.volume || 'n/a'}, no. ${source.issue || 'n/a'}, ${source.year}, pp. ${source.pages || 'n/a'}.`;
      break;
    case 'website':
      formatted = `${firstName}. "${source.title}." *${source.publisher || ''}*, ${source.year}, ${source.url || ''}.${source.accessDate ? ` Accessed ${source.accessDate}.` : ''}`;
      break;
    case 'conference':
      formatted = `${firstName}. "${source.title}." *${source.conference || ''}*, ${source.year}, pp. ${source.pages || 'n/a'}.`;
      break;
  }

  const lastName = source.authors[0]?.split(/\s+/).pop() || 'Unknown';
  const inText = source.authors.length <= 2
    ? `(${source.authors.map(a => a.split(/\s+/).pop()).join(' and ')} ${source.pages || ''})`
    : `(${lastName} et al. ${source.pages || ''})`;

  return { style: 'mla', formatted: formatted.trim(), inText: inText.trim() };
}

export function generateHarvard(source: CitationSource): CitationOutput {
  const authorStr = source.authors.map(formatLastFirst).join(', ');
  let formatted = '';

  switch (source.type) {
    case 'book':
      formatted = `${authorStr} (${source.year}) *${source.title}*. ${source.city ? `${source.city}: ` : ''}${source.publisher || ''}.`;
      break;
    case 'journal':
      formatted = `${authorStr} (${source.year}) '${source.title}', *${source.journal || ''}*, ${source.volume || ''}(${source.issue || ''}), pp. ${source.pages || ''}.`;
      break;
    case 'website':
      formatted = `${authorStr} (${source.year}) *${source.title}*. Available at: ${source.url || ''}${source.accessDate ? ` (Accessed: ${source.accessDate})` : ''}.`;
      break;
    case 'conference':
      formatted = `${authorStr} (${source.year}) '${source.title}', *${source.conference || ''}*${source.pages ? `, pp. ${source.pages}` : ''}.`;
      break;
  }

  const lastName = source.authors[0]?.split(/\s+/).pop() || 'Unknown';
  const inText = `(${lastName}${source.authors.length > 2 ? ' et al.' : ''}, ${source.year})`;

  return { style: 'harvard', formatted: formatted.trim(), inText };
}

export function generateChicago(source: CitationSource): CitationOutput {
  const firstAuthor = source.authors[0] ? formatLastFirst(source.authors[0]) : 'Unknown';
  const otherAuthors = source.authors.slice(1).map(formatFirstLast).join(', ');
  const authorStr = otherAuthors ? `${firstAuthor}, and ${otherAuthors}` : firstAuthor;
  let formatted = '';

  switch (source.type) {
    case 'book':
      formatted = `${authorStr}. *${source.title}*. ${source.city ? `${source.city}: ` : ''}${source.publisher || ''}, ${source.year}.`;
      break;
    case 'journal':
      formatted = `${authorStr}. "${source.title}." *${source.journal || ''}* ${source.volume || ''}${source.issue ? `, no. ${source.issue}` : ''} (${source.year}): ${source.pages || ''}.`;
      break;
    case 'website':
      formatted = `${authorStr}. "${source.title}." ${source.publisher || ''}. ${source.accessDate ? `Accessed ${source.accessDate}. ` : ''}${source.url || ''}.`;
      break;
    case 'conference':
      formatted = `${authorStr}. "${source.title}." Paper presented at ${source.conference || ''}, ${source.year}.`;
      break;
  }

  const lastName = source.authors[0]?.split(/\s+/).pop() || 'Unknown';
  const inText = `(${lastName} ${source.year}, ${source.pages || ''})`;

  return { style: 'chicago', formatted: formatted.trim(), inText: inText.trim() };
}
