import { describe, it, expect } from 'vitest';
import { formatCourseDetailedContentToHtml, ProcessedContentItem } from './courseContentParser';
import { QuizSectionProps } from '../components/ui/QuizSection'; // Assuming this path is correct relative to utils/

describe('formatCourseDetailedContentToHtml', () => {
  it('should return an empty array for undefined or empty input', () => {
    expect(formatCourseDetailedContentToHtml(undefined)).toEqual([]);
    expect(formatCourseDetailedContentToHtml('')).toEqual([]);
  });

  it('should process a simple HTML segment correctly', () => {
    const input = '## Hello\nThis is a paragraph.';
    // Note: The exact HTML output depends on the parser's specific class names and structure.
    // This expectedHTML is an approximation. Test will check for key elements.
    const result = formatCourseDetailedContentToHtml(input);
    expect(result.length).toBe(1);
    expect(result[0].type).toBe('html');
    const htmlContent = result[0].content as string;
    // More robust checks for key elements
    expect(htmlContent).toContain('<h3'); // Check for H3 tag
    expect(htmlContent).toContain('Hello</h3>');
    expect(htmlContent).toContain('<p'); // Check for P tag
    expect(htmlContent).toContain('This is a paragraph.</p>');
  });

  it('should process a simple quiz JSON block correctly', () => {
    const quizJson: QuizSectionProps = { // Explicitly type for clarity and correctness
      title: 'Test Quiz',
      questions: [
        {
          id: 'q1',
          questionText: 'What is 2+2?',
          options: [{ id: 'q1o1', text: '4' }, { id: 'q1o2', text: '3' }],
          correctAnswerId: 'q1o1',
          explanation: 'Because math.'
        },
      ],
    };
    const input = `>>> QUIZ_JSON:
${JSON.stringify(quizJson, null, 2)}
<<< QUIZ_JSON_END`;

    const result = formatCourseDetailedContentToHtml(input);
    expect(result.length).toBe(1);
    expect(result[0].type).toBe('quiz');
    const quizContent = result[0].content as QuizSectionProps;
    expect(quizContent.title).toBe('Test Quiz');
    expect(quizContent.questions.length).toBe(1);
    expect(quizContent.questions[0].questionText).toBe('What is 2+2?');
    // Check if the object is deeply equal (or a subset if only checking specific props)
    expect(quizContent).toEqual(quizJson);
  });

  it('should process mixed HTML and quiz content in order', () => {
    const quizJson: QuizSectionProps = {
      title: 'Mid Quiz',
      questions: [{ id: 'mq1', questionText: 'Is this a quiz?', options: [{id: 'mq1o1', text: 'Yes'}], correctAnswerId: 'mq1o1', explanation: '' }],
    };
    const input = `
# First Section
Some introductory text.

>>> QUIZ_JSON:
${JSON.stringify(quizJson)}
<<< QUIZ_JSON_END

## Second Section
Some concluding text.
`;

    const result = formatCourseDetailedContentToHtml(input);
    expect(result.length).toBe(3);

    expect(result[0].type).toBe('html');
    expect((result[0].content as string)).toContain('First Section');
    expect((result[0].content as string)).toContain('Some introductory text.');


    expect(result[1].type).toBe('quiz');
    expect((result[1].content as QuizSectionProps).title).toBe('Mid Quiz');
    expect(result[1].content as QuizSectionProps).toEqual(quizJson);


    expect(result[2].type).toBe('html');
    expect((result[2].content as string)).toContain('Second Section');
    expect((result[2].content as string)).toContain('Some concluding text.');
  });

  it('should handle multiple quiz blocks correctly', () => {
    const quizJson1: QuizSectionProps = { title: 'Quiz 1', questions: [] };
    const quizJson2: QuizSectionProps = { title: 'Quiz 2', questions: [] };
    const input = `
Text 1
>>> QUIZ_JSON:
${JSON.stringify(quizJson1)}
<<< QUIZ_JSON_END
Text 2
>>> QUIZ_JSON:
${JSON.stringify(quizJson2)}
<<< QUIZ_JSON_END
Text 3
`;
    const result = formatCourseDetailedContentToHtml(input);
    expect(result.length).toBe(5); // HTML, Quiz, HTML, Quiz, HTML
    expect(result[0].type).toBe('html');
    expect((result[0].content as string)).toContain('Text 1');
    expect(result[1].type).toBe('quiz');
    expect((result[1].content as QuizSectionProps).title).toBe('Quiz 1');
    expect(result[2].type).toBe('html');
    expect((result[2].content as string)).toContain('Text 2');
    expect(result[3].type).toBe('quiz');
    expect((result[3].content as QuizSectionProps).title).toBe('Quiz 2');
    expect(result[4].type).toBe('html');
    expect((result[4].content as string)).toContain('Text 3');
  });

  it('should treat malformed JSON as an HTML block', () => {
    const malformedJsonInput = `
>>> QUIZ_JSON:
{ title: "Malformed Quiz", questions: [ { id: "q1" } ] // Missing quotes around keys
<<< QUIZ_JSON_END
`;
    const result = formatCourseDetailedContentToHtml(malformedJsonInput);
    expect(result.length).toBe(1);
    expect(result[0].type).toBe('html');
    // The content should be the original malformed block, including markers, as per current parser fallback
    expect((result[0].content as string)).toContain('>>> QUIZ_JSON:');
    expect((result[0].content as string)).toContain('{ title: "Malformed Quiz", questions: [ { id: "q1" } ] // Missing quotes around keys');
    expect((result[0].content as string)).toContain('<<< QUIZ_JSON_END');
  });

  it('should correctly parse complex markdown features like tables and alerts within HTML segments', () => {
    const input = `
## HTML Content with Table

טבלה 1: My Table
Header1Header2
Row1Cell1Row1Cell2
Row2Cell1Row2Cell2

>>> INFO: This is an info alert.
And it continues on the next line.

Regular paragraph.
    `; // Note: Backticks used for multiline string for clarity in test definition
    const result = formatCourseDetailedContentToHtml(input);
    expect(result.length).toBe(1);
    expect(result[0].type).toBe('html');
    const html = result[0].content as string;

    // Check for table elements (simplified)
    expect(html).toMatch(/<table/);
    expect(html).toMatch(/<caption[^>]*>My Table<\/caption>/);
    expect(html).toMatch(/<thead/);
    expect(html).toMatch(/Header1/);
    expect(html).toMatch(/Row1Cell1/);

    // Check for alert box
    expect(html).toMatch(/custom-alert-box-info/);
    expect(html).toMatch(/This is an info alert./);
    expect(html).toMatch(/And it continues on the next line./);

    expect(html).toMatch(/<p[^>]*>Regular paragraph.<\/p>/);
  });

  it('should handle empty lines between HTML and quiz blocks', () => {
    const quizJson: QuizSectionProps = { title: 'Quiz', questions: [] };
    const input = `
Some HTML content.

>>> QUIZ_JSON:
${JSON.stringify(quizJson)}
<<< QUIZ_JSON_END

More HTML content.
`;
    const result = formatCourseDetailedContentToHtml(input);
    expect(result.length).toBe(3);
    expect(result[0].type).toBe('html');
    expect((result[0].content as string)).toContain('Some HTML content.');
    expect(result[1].type).toBe('quiz');
    expect((result[1].content as QuizSectionProps).title).toBe('Quiz');
    expect(result[2].type).toBe('html');
    expect((result[2].content as string)).toContain('More HTML content.');
  });

  it('should handle content starting or ending with a quiz block', () => {
    const quizJson1: QuizSectionProps = { title: 'Start Quiz', questions: [] };
    const quizJson2: QuizSectionProps = { title: 'End Quiz', questions: [] };
    const inputStart = `>>> QUIZ_JSON:
${JSON.stringify(quizJson1)}
<<< QUIZ_JSON_END
Some HTML after.`;
    const resultStart = formatCourseDetailedContentToHtml(inputStart);
    expect(resultStart.length).toBe(2);
    expect(resultStart[0].type).toBe('quiz');
    expect((resultStart[0].content as QuizSectionProps).title).toBe('Start Quiz');
    expect(resultStart[1].type).toBe('html');
    expect((resultStart[1].content as string)).toContain('Some HTML after.');

    const inputEnd = `Some HTML before.
>>> QUIZ_JSON:
${JSON.stringify(quizJson2)}
<<< QUIZ_JSON_END`;
    const resultEnd = formatCourseDetailedContentToHtml(inputEnd);
    expect(resultEnd.length).toBe(2);
    expect(resultEnd[0].type).toBe('html');
    expect((resultEnd[0].content as string)).toContain('Some HTML before.');
    expect(resultEnd[1].type).toBe('quiz');
    expect((resultEnd[1].content as QuizSectionProps).title).toBe('End Quiz');
  });

  it('should handle input with only a quiz block', () => {
    const quizJson: QuizSectionProps = { title: 'Only Quiz', questions: [] };
    const input = `>>> QUIZ_JSON:
${JSON.stringify(quizJson)}
<<< QUIZ_JSON_END`;
    const result = formatCourseDetailedContentToHtml(input);
    expect(result.length).toBe(1);
    expect(result[0].type).toBe('quiz');
    expect(result[0].content).toEqual(quizJson);
  });

  it('should handle quiz block with no surrounding newlines', () => {
    const quizJson: QuizSectionProps = { title: 'No Newlines Quiz', questions: [] };
    const input = `HTML before>>> QUIZ_JSON:${JSON.stringify(quizJson)}<<< QUIZ_JSON_ENDHTML after`;
    const result = formatCourseDetailedContentToHtml(input);
    expect(result.length).toBe(3);
    expect(result[0].type).toBe('html');
    expect((result[0].content as string)).toContain('HTML before');
    expect(result[1].type).toBe('quiz');
    expect(result[1].content).toEqual(quizJson);
    expect(result[2].type).toBe('html');
    expect((result[2].content as string)).toContain('HTML after');
  });

  it('should correctly process HTML segments that are only whitespace if not trimmed away by parser logic', () => {
    // This test depends on whether processMarkdownSegmentToHtml trims its input or if the main loop does.
    // The current implementation of formatCourseDetailedContentToHtml trims htmlSegmentBeforeText and remainingText
    // before calling processMarkdownSegmentToHtml. If processMarkdownSegmentToHtml itself trims, then
    // an input of "   " would result in empty string. If it doesn't, it might produce <p> </p> or similar.
    // The current loop structure: `if (htmlSegmentBeforeText.trim().length > 0)` means empty/whitespace segments are skipped.
    // So, this test confirms that purely whitespace segments do not create empty HTML items.
    const quizJson: QuizSectionProps = { title: 'Quiz', questions: [] };
    const input = `
>>> QUIZ_JSON:
${JSON.stringify(quizJson)}
<<< QUIZ_JSON_END
  `;
    const result = formatCourseDetailedContentToHtml(input);
    // Expecting only the quiz block if whitespace segments are ignored.
    expect(result.length).toBe(1);
    expect(result[0].type).toBe('quiz');
  });

  it('should handle malformed quiz block with no end marker', () => {
    const input = `
Some HTML
>>> QUIZ_JSON:
{ "title": "Unterminated Quiz"
`;
    const result = formatCourseDetailedContentToHtml(input);
    // The parser should treat the ">>> QUIZ_JSON:..." part as HTML since it's unclosed.
    expect(result.length).toBe(1); // HTML before, then the rest as HTML
    expect(result[0].type).toBe('html');
    expect((result[0].content as string)).toContain('Some HTML');
    expect((result[0].content as string)).toContain('>>> QUIZ_JSON:');
    expect((result[0].content as string)).toContain('Unterminated Quiz');
  });

});
