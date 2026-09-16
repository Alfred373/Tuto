import { ExtractionOutputSchema, SolutionOutputSchema, EnrichmentOutputSchema } from '../../features/solve/schemas';

function runSolvePipelineSchemaTests(): void {
  process.stdout.write('\n=== SOLVE PIPELINE SCHEMA UNIT TESTS ===\n');

  // Test 1: Valid Stage 1 Extraction Output
  const validExtraction = {
    transcribedText: 'Find the roots of 2x^2 + 5x - 3 = 0',
    transcribedLatex: '2x^2 + 5x - 3 = 0',
    subject: 'MATHEMATICS',
    detectedQuestionCount: 1,
    extractionConfidence: 0.98,
    topicTitle: 'Quadratic Equations',
  };

  const parsedExtraction = ExtractionOutputSchema.safeParse(validExtraction);
  if (!parsedExtraction.success) {
    throw new Error(`Failed to parse valid extraction output: ${parsedExtraction.error.message}`);
  }
  process.stdout.write('Test 1: ExtractionOutputSchema parses valid multimodal extraction... PASSED\n');

  // Test 1b: Extraction Output with null transcribedLatex and lowercase subject (e.g. "what is biology")
  const biologyExtraction = {
    transcribedText: 'What is biology?',
    transcribedLatex: null,
    subject: 'biology',
    detectedQuestionCount: 1,
    extractionConfidence: 0.99,
  };
  const parsedBiology = ExtractionOutputSchema.safeParse(biologyExtraction);
  if (!parsedBiology.success) {
    throw new Error(`Failed to parse biology extraction with null latex: ${parsedBiology.error.message}`);
  }
  if (parsedBiology.data.subject !== 'BIOLOGY') {
    throw new Error('Expected subject to be converted to uppercase BIOLOGY');
  }
  process.stdout.write('Test 1b: ExtractionOutputSchema cleanly handles null transcribedLatex & lowercase subject... PASSED\n');

  // Test 2: Invalid Stage 1 (missing required fields)
  const invalidExtraction = {
    transcribedText: '',
    subject: 'INVALID_SUBJECT',
  };
  const parsedInvalidExtraction = ExtractionOutputSchema.safeParse(invalidExtraction);
  if (parsedInvalidExtraction.success) {
    throw new Error('ExtractionOutputSchema should have rejected invalid extraction');
  }
  process.stdout.write('Test 2: ExtractionOutputSchema rejects invalid/incomplete response... PASSED\n');

  // Test 3: Valid Stage 3 Solution Output
  const validSolution = {
    steps: [
      {
        ordinal: 1,
        statement: 'Identify the coefficients a = 2, b = 5, c = -3.',
        workingLatex: 'a=2, b=5, c=-3',
        markNote: 'M1 for coefficient identification',
      },
      {
        ordinal: 2,
        statement: 'Apply the quadratic formula.',
        workingLatex: 'x = \\frac{-5 \\pm \\sqrt{25 - 4(2)(-3)}}{4} = \\frac{-5 \\pm 7}{4}',
        markNote: 'M1 for substitution, A1 for roots',
      },
    ],
    finalAnswer: 'x = 1/2 or x = -3',
    finalAnswerLatex: 'x = \\frac{1}{2} \\text{ or } x = -3',
    confidence: 'HIGH',
  };

  const parsedSolution = SolutionOutputSchema.safeParse(validSolution);
  if (!parsedSolution.success) {
    throw new Error(`Failed to parse valid solution output: ${parsedSolution.error.message}`);
  }
  process.stdout.write('Test 3: SolutionOutputSchema parses structured step-by-step solution... PASSED\n');

  // Test 4: Valid Stage 5 Enrichment Output
  const validEnrichment = {
    explanation: 'Quadratic equations can be solved using factoring, completing the square, or the quadratic formula.',
    followUpPrompt: 'Solve 3x^2 - 4x + 1 = 0',
    followUpAnswer: 'x = 1 or x = 1/3',
    quizItems: [
      {
        ordinal: 1,
        prompt: 'What is the discriminant formula for ax^2 + bx + c = 0?',
        options: ['A. b^2 - 4ac', 'B. -b ± √(b^2 - 4ac)', 'C. 2a / b', 'D. b^2 + 4ac'],
        correctOption: 'A',
        rationale: 'The discriminant is D = b^2 - 4ac.',
      },
    ],
  };

  const parsedEnrichment = EnrichmentOutputSchema.safeParse(validEnrichment);
  if (!parsedEnrichment.success) {
    throw new Error(`Failed to parse valid enrichment output: ${parsedEnrichment.error.message}`);
  }
  process.stdout.write('Test 4: EnrichmentOutputSchema parses quiz and explanations... PASSED\n');

  process.stdout.write('\n✅ ALL SOLVE PIPELINE SCHEMA TESTS PASSED!\n\n');
}

runSolvePipelineSchemaTests();
