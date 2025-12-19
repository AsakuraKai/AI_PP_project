/**
 * Tests for QualityScorer
 */

import { QualityScorer, QualityFactors } from '../../src/db/QualityScorer';

describe('QualityScorer', () => {
  let scorer: QualityScorer;
  
  beforeEach(() => {
    scorer = new QualityScorer();
  });
  
  describe('calculateQuality()', () => {
    it('should calculate quality from base confidence', () => {
      const factors: QualityFactors = {
        baseConfidence: 0.8,
        userValidated: false,
        ageMs: 0
      };
      
      const quality = scorer.calculateQuality(factors);
      
      expect(quality).toBe(0.8);
    });
    
    it('should add validation bonus', () => {
      const factors: QualityFactors = {
        baseConfidence: 0.7,
        userValidated: true,
        ageMs: 0
      };
      
      const quality = scorer.calculateQuality(factors);
      
      // 0.7 + 0.2 validation bonus = 0.9 (with floating point tolerance)
      expect(quality).toBeCloseTo(0.9, 10);
    });
    
    it('should apply age penalty for old documents', () => {
      const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000;
      
      const factors: QualityFactors = {
        baseConfidence: 0.8,
        userValidated: false,
        ageMs: sixMonths
      };
      
      const quality = scorer.calculateQuality(factors);
      
      // 0.8 * (1 - 0.5) = 0.4 (50% age penalty at 6 months)
      expect(quality).toBeCloseTo(0.4, 2);
    });
    
    it('should apply partial age penalty for newer documents', () => {
      const threeMonths = 3 * 30 * 24 * 60 * 60 * 1000;
      
      const factors: QualityFactors = {
        baseConfidence: 0.8,
        userValidated: false,
        ageMs: threeMonths
      };
      
      const quality = scorer.calculateQuality(factors);
      
      // 0.8 * (1 - 0.25) = 0.6 (25% age penalty at 3 months)
      expect(quality).toBeGreaterThan(0.4);
      expect(quality).toBeLessThan(0.8);
    });
    
    it('should add usage bonus for frequently used RCAs', () => {
      const factors: QualityFactors = {
        baseConfidence: 0.7,
        userValidated: false,
        ageMs: 0,
        usageCount: 9 // log10(10) = 1, so 0.1 bonus
      };
      
      const quality = scorer.calculateQuality(factors);
      
      // 0.7 + log10(10) * 0.1 = 0.7 + 0.1 = 0.8
      expect(quality).toBeCloseTo(0.8, 2);
    });
    
    it('should combine all factors correctly', () => {
      const oneMonth = 30 * 24 * 60 * 60 * 1000;
      
      const factors: QualityFactors = {
        baseConfidence: 0.6,
        userValidated: true,
        ageMs: oneMonth, // ~8.3% penalty
        usageCount: 4 // log10(5) * 0.1 ≈ 0.07
      };
      
      const quality = scorer.calculateQuality(factors);
      
      // (0.6 + 0.2) * (1 - 0.083) + 0.07 ≈ 0.80
      expect(quality).toBeGreaterThan(0.7);
      expect(quality).toBeLessThan(0.9);
    });
    
    it('should clamp quality to minimum', () => {
      const factors: QualityFactors = {
        baseConfidence: 0.1,
        userValidated: false,
        ageMs: 12 * 30 * 24 * 60 * 60 * 1000 // 1 year old
      };
      
      const quality = scorer.calculateQuality(factors);
      
      expect(quality).toBeGreaterThanOrEqual(0.1);
    });
    
    it('should clamp quality to maximum', () => {
      const factors: QualityFactors = {
        baseConfidence: 0.9,
        userValidated: true,
        ageMs: 0,
        usageCount: 100
      };
      
      const quality = scorer.calculateQuality(factors);
      
      expect(quality).toBeLessThanOrEqual(1.0);
    });
    
    it('should handle zero age', () => {
      const factors: QualityFactors = {
        baseConfidence: 0.8,
        userValidated: false,
        ageMs: 0
      };
      
      const quality = scorer.calculateQuality(factors);
      
      expect(quality).toBe(0.8);
    });
    
    it('should handle zero usage count', () => {
      const factors: QualityFactors = {
        baseConfidence: 0.8,
        userValidated: false,
        ageMs: 0,
        usageCount: 0
      };
      
      const quality = scorer.calculateQuality(factors);
      
      expect(quality).toBe(0.8);
    });
  });
  
  describe('calculateQualityWithBreakdown()', () => {
    it('should return detailed breakdown', () => {
      const factors: QualityFactors = {
        baseConfidence: 0.7,
        userValidated: true,
        ageMs: 3 * 30 * 24 * 60 * 60 * 1000,
        usageCount: 4
      };
      
      const breakdown = scorer.calculateQualityWithBreakdown(factors);
      
      expect(breakdown).toHaveProperty('score');
      expect(breakdown).toHaveProperty('baseConfidence');
      expect(breakdown).toHaveProperty('validationBonus');
      expect(breakdown).toHaveProperty('agePenalty');
      expect(breakdown).toHaveProperty('usageBonus');
      
      expect(breakdown.baseConfidence).toBe(0.7);
      expect(breakdown.validationBonus).toBe(0.2);
      expect(breakdown.agePenalty).toBeGreaterThan(0);
      expect(breakdown.usageBonus).toBeGreaterThan(0);
    });
    
    it('should show zero bonuses when not applicable', () => {
      const factors: QualityFactors = {
        baseConfidence: 0.8,
        userValidated: false,
        ageMs: 0
      };
      
      const breakdown = scorer.calculateQualityWithBreakdown(factors);
      
      expect(breakdown.validationBonus).toBe(0);
      expect(breakdown.agePenalty).toBe(0);
      expect(breakdown.usageBonus).toBe(0);
    });
  });
  
  describe('isBelowMinimum()', () => {
    it('should return true for quality below minimum', () => {
      expect(scorer.isBelowMinimum(0.05)).toBe(true);
      expect(scorer.isBelowMinimum(0.09)).toBe(true);
    });
    
    it('should return false for quality at or above minimum', () => {
      expect(scorer.isBelowMinimum(0.1)).toBe(false);
      expect(scorer.isBelowMinimum(0.5)).toBe(false);
      expect(scorer.isBelowMinimum(1.0)).toBe(false);
    });
  });
  
  describe('applyPositiveFeedback()', () => {
    it('should increase quality by 20%', () => {
      const updated = scorer.applyPositiveFeedback(0.5);
      expect(updated).toBe(0.6);
    });
    
    it('should cap at maximum quality', () => {
      const updated = scorer.applyPositiveFeedback(0.95);
      expect(updated).toBe(1.0);
    });
  });
  
  describe('applyNegativeFeedback()', () => {
    it('should decrease quality by 50%', () => {
      const updated = scorer.applyNegativeFeedback(0.8);
      expect(updated).toBe(0.4);
    });
    
    it('should floor at minimum quality', () => {
      const updated = scorer.applyNegativeFeedback(0.15);
      expect(updated).toBe(0.1);
    });
  });
  
  describe('custom configuration', () => {
    it('should accept custom age threshold', () => {
      const customScorer = new QualityScorer({
        ageThreshold: 30 * 24 * 60 * 60 * 1000 // 1 month
      });
      
      const factors: QualityFactors = {
        baseConfidence: 0.8,
        userValidated: false,
        ageMs: 30 * 24 * 60 * 60 * 1000
      };
      
      const quality = customScorer.calculateQuality(factors);
      
      // Should apply maximum penalty at 1 month
      expect(quality).toBeCloseTo(0.4, 2);
    });
    
    it('should accept custom validation bonus', () => {
      const customScorer = new QualityScorer({
        validationBonus: 0.3
      });
      
      const factors: QualityFactors = {
        baseConfidence: 0.6,
        userValidated: true,
        ageMs: 0
      };
      
      const quality = customScorer.calculateQuality(factors);
      
      expect(quality).toBeCloseTo(0.9, 10);
    });
    
    it('should accept custom min/max quality', () => {
      const customScorer = new QualityScorer({
        minQuality: 0.2,
        maxQuality: 0.9
      });
      
      const lowFactors: QualityFactors = {
        baseConfidence: 0.1,
        userValidated: false,
        ageMs: 12 * 30 * 24 * 60 * 60 * 1000
      };
      
      const highFactors: QualityFactors = {
        baseConfidence: 0.95,
        userValidated: true,
        ageMs: 0
      };
      
      expect(customScorer.calculateQuality(lowFactors)).toBe(0.2);
      expect(customScorer.calculateQuality(highFactors)).toBe(0.9);
    });
  });
  
  describe('getConfig()', () => {
    it('should return current configuration', () => {
      const config = scorer.getConfig();
      
      expect(config).toHaveProperty('ageThreshold');
      expect(config).toHaveProperty('maxAgePenalty');
      expect(config).toHaveProperty('validationBonus');
      expect(config).toHaveProperty('minQuality');
      expect(config).toHaveProperty('maxQuality');
    });
    
    it('should return copy of config', () => {
      const config = scorer.getConfig();
      config.validationBonus = 999;
      
      // Should not affect internal config
      const factors: QualityFactors = {
        baseConfidence: 0.5,
        userValidated: true,
        ageMs: 0
      };
      
      expect(scorer.calculateQuality(factors)).toBe(0.7); // Not 0.5 + 999
    });
  });
});
