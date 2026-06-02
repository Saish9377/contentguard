import { NextRequest, NextResponse } from 'next/server';
import { generateAPA, generateMLA, generateHarvard, generateChicago } from '@/lib/citation/generators';
import { CitationSource } from '@/types/citation';

export async function POST(request: NextRequest) {
  try {
    const body: CitationSource = await request.json();

    if (!body.title || !body.authors || body.authors.length === 0) {
      return NextResponse.json({ error: 'Title and at least one author are required.' }, { status: 400 });
    }

    const citations = {
      apa: generateAPA(body),
      mla: generateMLA(body),
      harvard: generateHarvard(body),
      chicago: generateChicago(body),
    };

    return NextResponse.json(citations);
  } catch (error) {
    console.error('Citation error:', error);
    return NextResponse.json({ error: 'Failed to generate citations.' }, { status: 500 });
  }
}
