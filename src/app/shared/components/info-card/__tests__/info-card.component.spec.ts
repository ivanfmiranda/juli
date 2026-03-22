/**
 * InfoCard Component Tests
 * 
 * Testa o componente InfoCard para garantir renderização correta
 * e integração com o modelo canônico.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { InfoCardComponent } from '../info-card.component';
import { InfoCardComponentModel } from '../../../../core/models/cms.model';

// Mock do CmsComponentData
const createMockCmsComponentData = (data: InfoCardComponentModel) => ({
  data$: of(data)
});

describe('InfoCardComponent', () => {
  let component: InfoCardComponent;
  let fixture: ComponentFixture<InfoCardComponent>;

  const mockData: InfoCardComponentModel = {
    uid: 'test-123',
    typeCode: 'JuliInfoCardComponent',
    flexType: 'JuliInfoCardComponent',
    icon: '🚀',
    title: 'Performance',
    description: 'Arquitetura otimizada com lazy loading.',
    link: '/performance'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InfoCardComponent],
      providers: [
        {
          provide: 'CmsComponentData',
          useValue: createMockCmsComponentData(mockData)
        }
      ]
    });

    fixture = TestBed.createComponent(InfoCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have data$ observable', () => {
    expect(component.data$).toBeDefined();
  });

  describe('rendering with full data', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should render icon', () => {
      const icon = fixture.debugElement.query(By.css('.juli-info-card__icon'));
      expect(icon).toBeTruthy();
      expect(icon.nativeElement.textContent).toContain('🚀');
    });

    it('should render title', () => {
      const title = fixture.debugElement.query(By.css('.juli-info-card__title'));
      expect(title).toBeTruthy();
      expect(title.nativeElement.textContent).toContain('Performance');
    });

    it('should render description', () => {
      const desc = fixture.debugElement.query(By.css('.juli-info-card__description'));
      expect(desc).toBeTruthy();
      expect(desc.nativeElement.textContent).toContain('lazy loading');
    });

    it('should render link when provided', () => {
      const link = fixture.debugElement.query(By.css('.juli-info-card__link'));
      expect(link).toBeTruthy();
    });

    it('should have clickable class when link is provided', () => {
      const card = fixture.debugElement.query(By.css('.juli-info-card'));
      expect(card.classes['juli-info-card--clickable']).toBe(true);
    });
  });

  describe('rendering with partial data', () => {
    it('should not render icon when not provided', () => {
      const dataWithoutIcon: InfoCardComponentModel = {
        ...mockData,
        icon: undefined
      };
      
      TestBed.overrideProvider('CmsComponentData', {
        useValue: createMockCmsComponentData(dataWithoutIcon)
      });
      
      fixture = TestBed.createComponent(InfoCardComponent);
      fixture.detectChanges();

      const icon = fixture.debugElement.query(By.css('.juli-info-card__icon'));
      expect(icon).toBeFalsy();
    });

    it('should not render title when not provided', () => {
      const dataWithoutTitle: InfoCardComponentModel = {
        ...mockData,
        title: undefined
      };
      
      TestBed.overrideProvider('CmsComponentData', {
        useValue: createMockCmsComponentData(dataWithoutTitle)
      });
      
      fixture = TestBed.createComponent(InfoCardComponent);
      fixture.detectChanges();

      const title = fixture.debugElement.query(By.css('.juli-info-card__title'));
      expect(title).toBeFalsy();
    });

    it('should not render description when not provided', () => {
      const dataWithoutDesc: InfoCardComponentModel = {
        ...mockData,
        description: undefined
      };
      
      TestBed.overrideProvider('CmsComponentData', {
        useValue: createMockCmsComponentData(dataWithoutDesc)
      });
      
      fixture = TestBed.createComponent(InfoCardComponent);
      fixture.detectChanges();

      const desc = fixture.debugElement.query(By.css('.juli-info-card__description'));
      expect(desc).toBeFalsy();
    });

    it('should not render link when not provided', () => {
      const dataWithoutLink: InfoCardComponentModel = {
        ...mockData,
        link: undefined
      };
      
      TestBed.overrideProvider('CmsComponentData', {
        useValue: createMockCmsComponentData(dataWithoutLink)
      });
      
      fixture = TestBed.createComponent(InfoCardComponent);
      fixture.detectChanges();

      const link = fixture.debugElement.query(By.css('.juli-info-card__link'));
      expect(link).toBeFalsy();
    });

    it('should not have clickable class when no link', () => {
      const dataWithoutLink: InfoCardComponentModel = {
        ...mockData,
        link: undefined
      };
      
      TestBed.overrideProvider('CmsComponentData', {
        useValue: createMockCmsComponentData(dataWithoutLink)
      });
      
      fixture = TestBed.createComponent(InfoCardComponent);
      fixture.detectChanges();

      const card = fixture.debugElement.query(By.css('.juli-info-card'));
      expect(card.classes['juli-info-card--clickable']).toBeFalsy();
    });
  });

  describe('accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have article element for semantic structure', () => {
      const article = fixture.debugElement.query(By.css('article'));
      expect(article).toBeTruthy();
    });

    it('should have aria-label on link', () => {
      const link = fixture.debugElement.query(By.css('.juli-info-card__link'));
      expect(link.attributes['aria-label']).toContain('Saiba mais sobre');
      expect(link.attributes['aria-label']).toContain('Performance');
    });

    it('should have aria-hidden on icon', () => {
      const icon = fixture.debugElement.query(By.css('.juli-info-card__icon span'));
      expect(icon.attributes['aria-hidden']).toBe('true');
    });
  });

  describe('CSS classes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have correct BEM classes', () => {
      const card = fixture.debugElement.query(By.css('.juli-info-card'));
      const icon = fixture.debugElement.query(By.css('.juli-info-card__icon'));
      const content = fixture.debugElement.query(By.css('.juli-info-card__content'));
      const title = fixture.debugElement.query(By.css('.juli-info-card__title'));
      const desc = fixture.debugElement.query(By.css('.juli-info-card__description'));

      expect(card).toBeTruthy();
      expect(icon).toBeTruthy();
      expect(content).toBeTruthy();
      expect(title).toBeTruthy();
      expect(desc).toBeTruthy();
    });
  });
});
