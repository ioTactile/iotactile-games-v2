import { describe, expect, it } from 'vitest';

import { cn } from './utils';

describe('cn', () => {
  it('fusionne plusieurs classes en une chaîne', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('ignore les valeurs falsy', () => {
    expect(cn('a', false, 'b', undefined, null, 'c')).toBe('a b c');
  });

  it('fusionne les classes Tailwind en conflit (dernier gagne)', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('accepte des tableaux et objets conditionnels', () => {
    expect(cn(['a', 'b'])).toBe('a b');
    expect(cn({ 'bg-red-500': true, 'bg-blue-500': false })).toBe('bg-red-500');
  });

  it('retourne une chaîne vide sans arguments', () => {
    expect(cn()).toBe('');
  });
});
