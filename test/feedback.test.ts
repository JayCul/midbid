// The feedback form must carry the answers into the issue template and must not
// invent anything about the person filling it in.
import { describe, expect, it } from 'vitest';
import { feedbackUrl } from '../src/components/Feedback';

describe('feedback link', () => {
  const url = () =>
    new URL(
      feedbackUrl({
        task: 'Placing a bid',
        whatHappened: 'The bid failed with "bid is below the minimum"',
        expected: 'It should tell me the minimum moved',
        clarity: '4 - mostly clear',
      }),
    );

  it('targets the pilot feedback template on the product repo', () => {
    const u = url();
    expect(u.origin + u.pathname).toBe('https://github.com/JayCul/midbid/issues/new');
    expect(u.searchParams.get('template')).toBe('feedback.yml');
    expect(u.searchParams.get('labels')).toBe('feedback,pilot');
  });

  it('prefills every answer under the template field ids', () => {
    const p = url().searchParams;
    expect(p.get('task')).toBe('Placing a bid');
    expect(p.get('what-happened')).toMatch(/below the minimum/);
    expect(p.get('expected')).toMatch(/minimum moved/);
    expect(p.get('clarity')).toBe('4 - mostly clear');
  });

  it('carries nothing but the answers given', () => {
    const keys = [...url().searchParams.keys()].sort();
    expect(keys).toEqual(['clarity', 'expected', 'labels', 'task', 'template', 'what-happened']);
  });
});
