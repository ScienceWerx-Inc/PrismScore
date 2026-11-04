import { describe, it, expect } from 'vitest';
import {
  calculateCompanyScore,
  calculateReadinessBand,
  computeExecutiveGap,
} from '../scoring';

describe('Scoring Engine Tests', () => {
  it('should score 500 and AI-led when all dimensions have maximum points (15/15)', () => {
    const result = calculateCompanyScore({
      STRATEGY: 15,
      USE_VALUE: 15,
      DATA_TECH: 15,
      GOVERNANCE: 15,
      PEOPLE: 15,
    });

    expect(result.totalScore).toBe(500);
    expect(result.band).toBe('AI-led');
    expect(result.dimensionPercentages.STRATEGY).toBe(100);
    expect(result.dimensionPercentages.USE_VALUE).toBe(100);
    expect(result.dimensionPercentages.DATA_TECH).toBe(100);
    expect(result.dimensionPercentages.GOVERNANCE).toBe(100);
    expect(result.dimensionPercentages.PEOPLE).toBe(100);
  });

  it('should score 0 and Unaware when all dimensions have 0 points', () => {
    const result = calculateCompanyScore({
      STRATEGY: 0,
      USE_VALUE: 0,
      DATA_TECH: 0,
      GOVERNANCE: 0,
      PEOPLE: 0,
    });

    expect(result.totalScore).toBe(0);
    expect(result.band).toBe('Unaware');
  });

  it('matches hand calculation for mixed realistic inputs', () => {
    // Strategy: 12/15 = 80% * 0.25 = 20.0
    // Use: 9/15 = 60% * 0.20 = 12.0
    // Data: 6/15 = 40% * 0.20 = 8.0
    // Governance: 9/15 = 60% * 0.20 = 12.0
    // People: 6/15 = 40% * 0.15 = 6.0
    // Total sum = 58.0%
    // Score = 5 * 58.0 = 290
    const result = calculateCompanyScore({
      STRATEGY: 12,
      USE_VALUE: 9,
      DATA_TECH: 6,
      GOVERNANCE: 9,
      PEOPLE: 6,
    });

    expect(result.dimensionPercentages.STRATEGY).toBe(80);
    expect(result.dimensionPercentages.USE_VALUE).toBe(60);
    expect(result.dimensionPercentages.DATA_TECH).toBe(40);
    expect(result.dimensionPercentages.GOVERNANCE).toBe(60);
    expect(result.dimensionPercentages.PEOPLE).toBe(40);
    expect(result.totalScore).toBe(290);
    expect(result.band).toBe('Exploring');
  });

  it('computes exact unrounded fractional composite score (matches peer review test case: 336.67)', () => {
    // Strategy: 11/15 = 73.333% * 0.25 * 500 = 91.6667
    // Use: 9/15 = 60.0% * 0.20 * 500 = 60.0
    // Data: 10/15 = 66.667% * 0.20 * 500 = 66.6667
    // Governance: 11/15 = 73.333% * 0.20 * 500 = 73.3333
    // People: 9/15 = 60.0% * 0.15 * 500 = 45.0
    // Exact composite = 336.6667 -> 336.67
    const result = calculateCompanyScore({
      STRATEGY: 11,
      USE_VALUE: 9,
      DATA_TECH: 10,
      GOVERNANCE: 11,
      PEOPLE: 9,
    });

    expect(result.totalScore).toBe(336.67);
    expect(result.band).toBe('Established');
    // Ensure priority recommendations target lowest dimensions (Use & Value, People & Skills)
    expect(result.priorityActions.length).toBeGreaterThan(0);
    expect(result.priorityActions[0].dimension).toBe('Use and Value');
    expect(result.priorityActions[1].dimension).toBe('People and Skills');
  });

  it('correctly maps readiness bands along boundaries', () => {
    expect(calculateReadinessBand(0)).toBe('Unaware');
    expect(calculateReadinessBand(200)).toBe('Unaware');
    expect(calculateReadinessBand(201)).toBe('Exploring');
    expect(calculateReadinessBand(300)).toBe('Exploring');
    expect(calculateReadinessBand(301)).toBe('Established');
    expect(calculateReadinessBand(400)).toBe('Established');
    expect(calculateReadinessBand(401)).toBe('AI-led');
    expect(calculateReadinessBand(500)).toBe('AI-led');
  });

  it('calculates executive competency gaps and priority', () => {
    const highGap = computeExecutiveGap('Strategic Opportunity', 'PRACTICING', 'LEADING');
    expect(highGap.gap).toBe(2);
    expect(highGap.priority).toBe('HIGH');

    const medGap = computeExecutiveGap('Risk & Legal Exposure', 'PRACTICING', 'PROFICIENT');
    expect(medGap.gap).toBe(1);
    expect(medGap.priority).toBe('MEDIUM');

    const noGap = computeExecutiveGap('AI Fundamentals', 'LEADING', 'AWARE');
    expect(noGap.gap).toBe(0);
    expect(noGap.priority).toBe('LOW');
  });
});

