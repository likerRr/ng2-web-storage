import {WebStorageService} from './web-storage.service';
import {WEB_STORAGE_SERVICE_CONFIG, webStorageConfigDefault} from './web-storage.config';
import {TestBed, inject, async} from '@angular/core/testing';
import {ReplaySubject} from 'rxjs';
import {WS_ERROR} from './web-storage.messages';

describe('WebStorage Service', () => {
  let testKey = 'key',
    testKey2 = 'key2',
    testKey3 = 'key3',
    testVal = 'val',
    testVal2 = 'val2',
    testVal3 = 'val3',
    overrideVal = 'oVal';

  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      WebStorageService,
      {provide: WEB_STORAGE_SERVICE_CONFIG, useValue: webStorageConfigDefault}
    ]
  }));

  // storage.addProvider('name', instance);
  // storage.useProvider('name', useValue);

  it(`should be empty`,
    inject([WebStorageService], (storage: WebStorageService) => {
      expect(storage.length).toEqual(0);
    })
  );

  it(`should be 'null' when trying to get the key that doesn't exists`, (
    inject([WebStorageService], (storage: WebStorageService) => {
      expect(storage.get(testKey)).toBeNull();
    })
  ));

  it(`should set value`, (
    inject([WebStorageService], (storage: WebStorageService) => {
      spyOn(storage, 'set').and.callThrough();

      // set single value
      storage.set(testKey, testVal);

      expect(storage.set).toHaveBeenCalled();
      expect(storage.get(testKey)).toBe(testVal);
    })
  ));

  it(`should override the value`, (
    inject([WebStorageService], (storage: WebStorageService) => {
      storage.set(testKey, overrideVal);

      expect(storage.get(testKey)).toBe(overrideVal);

      storage.set(testKey, testVal);
    })
  ));

  it(`should get keys and value(s)`, (
    inject([WebStorageService], (storage: WebStorageService) => {
      storage.set(testKey, testVal);
      storage.set(testKey2, testVal2);

      // get single value
      expect(storage.get(testKey)).toBe(testVal);

      // get all items
      expect(storage.getAll()).toEqual({
        [testKey]: testVal,
        [testKey2]: testVal2
      });

      // get all keys
      expect(storage.keys()).toEqual([testKey, testKey2]);
    })
  ));

  it(`should get items length`,
    inject([WebStorageService], (storage: WebStorageService) => {
      storage.set(testKey3, testVal3);

      expect(storage.length).toBe(3);
    })
  );

  it(`should remove two item`,
    inject([WebStorageService], (storage: WebStorageService) => {
      expect(storage.remove(testKey)).toBe(testVal);
      expect(storage.remove(testKey2)).toBe(testVal2);
      expect(storage.length).toBe(1);
    })
  );

  it(`should remove all items`,
    inject([WebStorageService], (storage: WebStorageService) => {
      spyOn(storage, 'removeAll').and.callThrough();

      storage.removeAll();

      expect(storage.removeAll).toHaveBeenCalled();
      expect(storage.length).toEqual(0);
    })
  );

});

describe('WebStorage Service event', () => {
  let testKey = 'key',
    testVal = 'val';

  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      WebStorageService,
      {provide: WEB_STORAGE_SERVICE_CONFIG, useValue: webStorageConfigDefault}
    ]
  }));

  it(`'onError' fires`,
    async(inject([WebStorageService], (storage: WebStorageService) => {
      expect(storage.onError).toEqual(jasmine.any(ReplaySubject));

      enum ACTION {
        USE_UNKNOWN_PROVIDER,
        USE_API_WHEN_PROVIDER_NOT_SET
      }

      let current: ACTION,
        spies = {
          onErrorFn(val) {
            switch(current) {
              case ACTION.USE_UNKNOWN_PROVIDER: {
                expect(val).toBe(WS_ERROR.UNKNOWN_PROVIDER); break;
              }
              case ACTION.USE_API_WHEN_PROVIDER_NOT_SET:
              default: {
                expect(val).toBe(WS_ERROR.PROVIDER_NOT_SET); break;
              }
            }
          }
        };

      spyOn(spies, 'onErrorFn').and.callThrough();

      storage.onError.subscribe(spies.onErrorFn);

      // #1
      current = ACTION.USE_UNKNOWN_PROVIDER;
      storage.useProvider('unknown_provider');

      // #2
      current = ACTION.USE_API_WHEN_PROVIDER_NOT_SET;
      storage.set(testKey, testVal);
      storage.length;
      storage.get(testKey);
      storage.has(testKey);
      storage.remove(testKey);
      storage.removeAll();
      storage.forEach(() => {});
      storage.keys();
      storage.getAll();

      expect(spies.onErrorFn).toHaveBeenCalledTimes(10);
    }))
  );
});