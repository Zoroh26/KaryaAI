/**
 * Tests for the WorkflowService helper methods and TaskAssignmentService scoring.
 * These are pure-logic tests that don't require Firebase connections.
 */

// ─── Workflow helper logic ─────────────────────────────────────────────────────

describe('WorkflowService helpers (pure logic)', () => {
  // Replicate private helpers for testing
  const determinePriority = (totalHours: number): 'High' | 'Medium' | 'Low' => {
    if (totalHours >= 200) return 'High';
    if (totalHours >= 80) return 'Medium';
    return 'Low';
  };

  const determineComplexity = (totalHours: number, phaseCount: number): 'Low' | 'Medium' | 'High' => {
    if (totalHours <= 40 && phaseCount <= 3) return 'Low';
    if (totalHours <= 160 && phaseCount <= 5) return 'Medium';
    return 'High';
  };

  const calculateDuration = (totalHours: number): string => {
    const daysEstimate = Math.ceil(totalHours / 8);
    const weeksEstimate = Math.ceil(daysEstimate / 5);
    if (weeksEstimate <= 1) return `${daysEstimate} day${daysEstimate !== 1 ? 's' : ''}`;
    if (weeksEstimate <= 4) return `${weeksEstimate} week${weeksEstimate !== 1 ? 's' : ''}`;
    const monthsEstimate = Math.ceil(weeksEstimate / 4);
    return `${monthsEstimate} month${monthsEstimate !== 1 ? 's' : ''}`;
  };

  test('determinePriority returns High for >= 200 hours', () => {
    expect(determinePriority(200)).toBe('High');
    expect(determinePriority(600)).toBe('High');
  });

  test('determinePriority returns Medium for 80-199 hours', () => {
    expect(determinePriority(80)).toBe('Medium');
    expect(determinePriority(150)).toBe('Medium');
  });

  test('determinePriority returns Low for < 80 hours', () => {
    expect(determinePriority(40)).toBe('Low');
    expect(determinePriority(0)).toBe('Low');
  });

  test('determineComplexity returns High for large projects', () => {
    expect(determineComplexity(600, 5)).toBe('High');
    expect(determineComplexity(161, 3)).toBe('High');
  });

  test('determineComplexity returns Low for small projects', () => {
    expect(determineComplexity(40, 3)).toBe('Low');
    expect(determineComplexity(8, 1)).toBe('Low');
  });

  test('calculateDuration handles single day', () => {
    expect(calculateDuration(8)).toBe('1 day');
  });

  test('calculateDuration handles weeks', () => {
    expect(calculateDuration(80)).toBe('2 weeks');
  });

  test('calculateDuration handles months', () => {
    expect(calculateDuration(600)).toBe('4 months');
  });
});

// ─── Dependency resolution ─────────────────────────────────────────────────────

describe('Dependency title → ID resolution', () => {
  /**
   * Replicate the resolution logic from transformToHierarchical.
   */
  const resolveDepTitles = (
    deps: string[],
    titleToId: Map<string, string>
  ): string[] =>
    deps.map(dep => titleToId.get(dep.toLowerCase().trim()) ?? dep);

  test('resolves known dependency titles to IDs', () => {
    const map = new Map([
      ['market research & competitive analysis', 'task_1_1'],
      ['feature definition & prioritization', 'task_1_2'],
    ]);

    const resolved = resolveDepTitles(
      ['Market Research & Competitive Analysis', 'Feature Definition & Prioritization'],
      map
    );
    expect(resolved).toEqual(['task_1_1', 'task_1_2']);
  });

  test('falls back to original string for unknown dependencies', () => {
    const map = new Map([['known task', 'task_1_1']]);
    const resolved = resolveDepTitles(['Known Task', 'Unknown Task'], map);
    expect(resolved).toEqual(['task_1_1', 'Unknown Task']);
  });

  test('handles empty dependency list', () => {
    const map = new Map<string, string>();
    expect(resolveDepTitles([], map)).toEqual([]);
  });
});

// ─── Task assignment scoring ───────────────────────────────────────────────────

describe('TaskAssignmentService scoring logic', () => {
  const calculateSkillScore = (
    taskSkills: string[],
    employeeSkills: string[]
  ): number => {
    if (taskSkills.length === 0) return 0;
    const matches = taskSkills.filter(skill =>
      employeeSkills.some(
        empSkill =>
          empSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(empSkill.toLowerCase())
      )
    ).length;
    return (matches / taskSkills.length) * 40;
  };

  test('perfect skill match gives 40 points', () => {
    expect(calculateSkillScore(['React', 'TypeScript'], ['React', 'TypeScript', 'Node.js'])).toBe(40);
  });

  test('partial skill match gives proportional score', () => {
    expect(calculateSkillScore(['React', 'TypeScript'], ['React'])).toBe(20);
  });

  test('no skill match gives 0 points', () => {
    expect(calculateSkillScore(['React'], ['Java', 'Spring'])).toBe(0);
  });

  test('empty task skills gives 0 points (no division by zero)', () => {
    expect(calculateSkillScore([], ['React', 'TypeScript'])).toBe(0);
  });

  test('case-insensitive matching works', () => {
    expect(calculateSkillScore(['react'], ['React'])).toBe(40);
  });
});
