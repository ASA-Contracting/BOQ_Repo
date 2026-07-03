import { describe, expect, it } from 'vitest';
import {
  formatTreeFilterMode,
  getTreeFilterLabel,
  getTreeFilterSelectedModes,
  matchesModeFilter,
  matchesTagFilter,
  toggleTreeFilterBulkSelection,
  toggleTreeFilterOption,
  TREE_FILTER_OPTION_MODES,
} from './category-tree-filter';

describe('category-tree-filter', () => {
  it('returns all modes for all filter', () => {
    expect(getTreeFilterSelectedModes('all')).toEqual(new Set(TREE_FILTER_OPTION_MODES));
  });

  it('toggles individual filter options', () => {
    const next = toggleTreeFilterOption('all', 'tagged');
    expect(getTreeFilterSelectedModes(next).has('tagged')).toBe(false);
    expect(formatTreeFilterMode(getTreeFilterSelectedModes(next))).toBe('custom:untagged,material-records,price-records');
  });

  it('bulk toggles between all and none', () => {
    expect(toggleTreeFilterBulkSelection('all')).toBe('none');
    expect(toggleTreeFilterBulkSelection('none')).toBe('all');
  });

  it('matches mode and tag filters', () => {
    const modes = new Set(['material-records'] as const);
    expect(matchesModeFilter(modes, ['hvac'], 2)).toBe(true);
    expect(matchesModeFilter(modes, [], 0)).toBe(false);
    expect(matchesTagFilter(new Set(['hvac']), ['HVAC'])).toBe(true);
    expect(matchesTagFilter(new Set(['plumbing']), ['HVAC'])).toBe(false);
  });

  it('formats filter labels', () => {
    expect(getTreeFilterLabel('all')).toBe('All categories');
    expect(getTreeFilterLabel('tagged')).toBe('Tagged');
  });
});
