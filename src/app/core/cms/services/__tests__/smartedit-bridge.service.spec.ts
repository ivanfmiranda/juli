import { TestBed } from '@angular/core/testing';
import { SmartEditBridgeService } from '../smartedit-bridge.service';

describe('SmartEditBridgeService', () => {
  let service: SmartEditBridgeService;
  let postMessageSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SmartEditBridgeService]
    });

    service = TestBed.inject(SmartEditBridgeService);
    postMessageSpy = spyOn(window.parent, 'postMessage');
  });

  afterEach(() => {
    service.deactivate();
  });

  it('activates SmartEdit mode and notifies the parent editor that the storefront is ready', () => {
    service.activate();

    expect(service.isActive).toBe(true);
    expect(postMessageSpy).toHaveBeenCalledWith(
      { type: 'SMARTEDIT_READY', payload: { version: 1 } },
      '*'
    );
  });

  it('maps SmartEdit postMessage events into selection, highlight, update, and page streams', () => {
    let selection: any = null;
    let highlight: any = null;
    let page: any = null;
    let update: any = null;

    service.selection$.subscribe(value => selection = value);
    service.highlight$.subscribe(value => highlight = value);
    service.pageData$.subscribe(value => page = value);
    service.update$.subscribe(value => update = value);

    service.activate();

    window.dispatchEvent(new MessageEvent('message', {
      data: {
        type: 'SMARTEDIT_PAGE_DATA',
        payload: {
          page: { slug: 'home' }
        }
      }
    }));
    window.dispatchEvent(new MessageEvent('message', {
      data: {
        type: 'SMARTEDIT_SELECT',
        payload: {
          slotName: 'Section1',
          componentIndex: 2
        }
      }
    }));
    window.dispatchEvent(new MessageEvent('message', {
      data: {
        type: 'SMARTEDIT_HIGHLIGHT',
        payload: {
          slotName: 'Section1',
          componentIndex: 3
        }
      }
    }));
    window.dispatchEvent(new MessageEvent('message', {
      data: {
        type: 'SMARTEDIT_UPDATE',
        payload: {
          slotName: 'Section2',
          componentIndex: 1,
          component: { uid: 'cmp-1', title: 'Updated' }
        }
      }
    }));

    expect(page).toEqual({ slug: 'home' });
    expect(selection).toEqual({ slotName: 'Section1', componentIndex: 2 });
    expect(highlight).toEqual({ slotName: 'Section1', componentIndex: 3 });
    expect(update).toEqual({
      slotName: 'Section2',
      componentIndex: 1,
      component: { uid: 'cmp-1', title: 'Updated' }
    });
  });

  it('ignores unrelated messages and stops reacting after deactivation', () => {
    let selection: any = null;
    let highlight: any = null;

    service.selection$.subscribe(value => selection = value);
    service.highlight$.subscribe(value => highlight = value);

    service.activate();

    window.dispatchEvent(new MessageEvent('message', {
      data: {
        type: 'NOT_SMARTEDIT',
        payload: {
          slotName: 'Ignored',
          componentIndex: 1
        }
      }
    }));

    expect(selection).toBeNull();

    service.deactivate();

    window.dispatchEvent(new MessageEvent('message', {
      data: {
        type: 'SMARTEDIT_HIGHLIGHT',
        payload: {
          slotName: 'Section9',
          componentIndex: 9
        }
      }
    }));

    expect(highlight).toBeNull();
  });

  it('sends component click events back to the parent editor', () => {
    service.notifyComponentClick('Section3', 4, 'HeroBanner');

    expect(postMessageSpy).toHaveBeenCalledWith(
      {
        type: 'SMARTEDIT_COMPONENT_CLICK',
        payload: {
          slotName: 'Section3',
          componentIndex: 4,
          componentType: 'HeroBanner'
        }
      },
      '*'
    );
  });
});
