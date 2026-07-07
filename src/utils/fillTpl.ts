import type { Child } from '../types';

/**
 * Fill {name}/{subj}/{obj}/{poss} placeholders from a child's pronouns, and
 * capitalize the first character (so a title starting with "{subj}…" reads right).
 */
export function fillTpl(str: string, child: Child): string {
  const p = child.pronoun;
  const out = str
    .replaceAll('{subj}', p.subj)
    .replaceAll('{obj}', p.obj)
    .replaceAll('{poss}', p.poss)
    .replaceAll('{name}', child.name);
  return out.charAt(0).toUpperCase() + out.slice(1);
}
