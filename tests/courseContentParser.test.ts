import { formatCourseDetailedContentToHtml } from '../utils/courseContentParser';

describe('formatCourseDetailedContentToHtml', () => {
  it('converts **bold** to <strong>', () => {
    const html = formatCourseDetailedContentToHtml('**bold**');
    expect(html).toContain('<strong>bold</strong>');
  });

  it('converts *italic* to <em>', () => {
    const html = formatCourseDetailedContentToHtml('*italic*');
    expect(html).toContain('<em>italic</em>');
  });

  it('returns empty string for empty input', () => {
    const html = formatCourseDetailedContentToHtml('');
    expect(html).toBe('');
  });
});
