/**
 * Fallback Policy Service Tests
 * 
 * Testa o sistema centralizado de fallback.
 * Garante decisões consistentes de fallback em todos os cenários.
 */

import { TestBed } from '@angular/core/testing';
import { 
  FallbackPolicyService, 
  FallbackType, 
  FallbackContext 
} from '../fallback-policy.service';

describe('FallbackPolicyService', () => {
  let service: FallbackPolicyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FallbackPolicyService]
    });
    service = TestBed.inject(FallbackPolicyService);
  });

  describe('getLoadingDecision()', () => {
    it('should return LoadingState decision', () => {
      const decision = service.getLoadingDecision();
      
      expect(decision.type).toBe(FallbackType.LOADING);
      expect(decision.component).toBe('LoadingState');
      expect(decision.severity).toBe('info');
      expect(decision.shouldLog).toBe(false);
    });
  });

  describe('getDecisionForType()', () => {
    it('should return decision for UNKNOWN_COMPONENT', () => {
      const decision = service.getDecisionForType(FallbackType.UNKNOWN_COMPONENT);
      
      expect(decision.type).toBe(FallbackType.UNKNOWN_COMPONENT);
      expect(decision.component).toBe('UnknownComponent');
      expect(decision.severity).toBe('warning');
      expect(decision.shouldLog).toBe(true);
    });

    it('should return decision for INVALID_PAYLOAD', () => {
      const decision = service.getDecisionForType(FallbackType.INVALID_PAYLOAD);
      
      expect(decision.type).toBe(FallbackType.INVALID_PAYLOAD);
      expect(decision.component).toBe('ErrorComponent');
      expect(decision.severity).toBe('error');
    });

    it('should return decision for EMPTY_CONTENT', () => {
      const decision = service.getDecisionForType(FallbackType.EMPTY_CONTENT);
      
      expect(decision.type).toBe(FallbackType.EMPTY_CONTENT);
      expect(decision.component).toBe('EmptyState');
      expect(decision.severity).toBe('info');
      expect(decision.shouldLog).toBe(false);
    });

    it('should return decision for API_ERROR', () => {
      const decision = service.getDecisionForType(FallbackType.API_ERROR);
      
      expect(decision.type).toBe(FallbackType.API_ERROR);
      expect(decision.component).toBe('ErrorComponent');
      expect(decision.severity).toBe('error');
    });

    it('should return decision for PAGE_NOT_FOUND', () => {
      const decision = service.getDecisionForType(FallbackType.PAGE_NOT_FOUND);
      
      expect(decision.type).toBe(FallbackType.PAGE_NOT_FOUND);
      expect(decision.component).toBe('NotFoundPage');
      expect(decision.severity).toBe('warning');
    });
  });

  describe('decide() - API_ERROR detection', () => {
    it('should detect API_ERROR when error is present', () => {
      const context: FallbackContext = {
        typeCode: 'SomeComponent',
        error: new Error('Network failure')
      };

      const decision = service.decide(context);
      
      expect(decision.type).toBe(FallbackType.API_ERROR);
      expect(decision.component).toBe('ErrorComponent');
      expect(decision.message).toContain('Network failure');
    });

    it('should include typeCode in error message when available', () => {
      const context: FallbackContext = {
        typeCode: 'HeroBanner',
        error: new Error('Timeout')
      };

      const decision = service.decide(context);
      
      expect(decision.message).toContain('HeroBanner');
      expect(decision.message).toContain('Timeout');
    });
  });

  describe('decide() - PAGE_NOT_FOUND detection', () => {
    it('should detect PAGE_NOT_FOUND for not-found label', () => {
      const context: FallbackContext = {
        pageLabel: 'not-found'
      };

      const decision = service.decide(context);
      
      expect(decision.type).toBe(FallbackType.PAGE_NOT_FOUND);
    });

    it('should detect PAGE_NOT_FOUND for 404 label', () => {
      const context: FallbackContext = {
        pageLabel: '404'
      };

      const decision = service.decide(context);
      
      expect(decision.type).toBe(FallbackType.PAGE_NOT_FOUND);
    });
  });

  describe('decide() - EMPTY_CONTENT detection', () => {
    it('should detect EMPTY_CONTENT for empty array', () => {
      const context: FallbackContext = {
        originalPayload: []
      };

      const decision = service.decide(context);
      
      expect(decision.type).toBe(FallbackType.EMPTY_CONTENT);
    });

    it('should detect EMPTY_CONTENT for null payload', () => {
      const context: FallbackContext = {
        originalPayload: null
      };

      const decision = service.decide(context);
      
      expect(decision.type).toBe(FallbackType.EMPTY_CONTENT);
    });

    it('should detect EMPTY_CONTENT for undefined payload', () => {
      const context: FallbackContext = {
        originalPayload: undefined
      };

      const decision = service.decide(context);
      
      expect(decision.type).toBe(FallbackType.EMPTY_CONTENT);
    });

    it('should detect EMPTY_CONTENT for empty object', () => {
      const context: FallbackContext = {
        originalPayload: {}
      };

      const decision = service.decide(context);
      
      expect(decision.type).toBe(FallbackType.EMPTY_CONTENT);
    });
  });

  describe('decide() - UNKNOWN_COMPONENT detection', () => {
    it('should detect UNKNOWN_COMPONENT for UnknownType', () => {
      const context: FallbackContext = {
        typeCode: 'UnknownType'
      };

      const decision = service.decide(context);
      
      expect(decision.type).toBe(FallbackType.UNKNOWN_COMPONENT);
    });
  });

  describe('decide() - INVALID_PAYLOAD fallback', () => {
    it('should default to INVALID_PAYLOAD for invalid data', () => {
      const context: FallbackContext = {
        typeCode: 'SomeType',
        originalPayload: { some: 'data' }
      };

      const decision = service.decide(context);
      
      expect(decision.type).toBe(FallbackType.INVALID_PAYLOAD);
      expect(decision.component).toBe('ErrorComponent');
    });
  });

  describe('decide() - message enrichment', () => {
    it('should include slotName in message when available', () => {
      const context: FallbackContext = {
        typeCode: 'TestComponent',
        slotName: 'Section1',
        error: new Error('Test')
      };

      const decision = service.decide(context);
      
      expect(decision.message).toContain('Section1');
    });

    it('should include pageLabel in message when available', () => {
      const context: FallbackContext = {
        pageLabel: 'homepage',
        error: new Error('Test')
      };

      const decision = service.decide(context);
      
      expect(decision.message).toContain('homepage');
    });

    it('should combine all context in message', () => {
      const context: FallbackContext = {
        typeCode: 'HeroBanner',
        slotName: 'Section1',
        pageLabel: 'homepage',
        error: new Error('Network error')
      };

      const decision = service.decide(context);
      
      expect(decision.message).toContain('HeroBanner');
      expect(decision.message).toContain('Section1');
      expect(decision.message).toContain('homepage');
      expect(decision.message).toContain('Network error');
    });
  });

  describe('priority order', () => {
    it('should prioritize error over empty content', () => {
      const context: FallbackContext = {
        originalPayload: [],  // Would be EMPTY_CONTENT
        error: new Error('Server error')  // But error takes priority
      };

      const decision = service.decide(context);
      
      expect(decision.type).toBe(FallbackType.API_ERROR);
    });

    it('should prioritize not-found over unknown type', () => {
      const context: FallbackContext = {
        typeCode: 'UnknownType',
        pageLabel: 'not-found'
      };

      const decision = service.decide(context);
      
      expect(decision.type).toBe(FallbackType.PAGE_NOT_FOUND);
    });
  });
});
