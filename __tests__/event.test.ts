import 'jest-extended';
import { Event, standardEventLogger, Store, SubscriberFn, UnsubFn } from '../src';

jest.useFakeTimers();

interface ITestEventPayload {
  name: string;
  age: number;
}

describe('event tests', () => {
  let testEvent: Event<ITestEventPayload>;
  let testEvent2: Event<ITestEventPayload>;
  testEvent2 = new Event('test');

  const firstFn = jest.fn();
  const secondFn = jest.fn();
  const thirdFn = jest.fn();
  let unsub: UnsubFn;
  let unsub2: UnsubFn;
  let unsub3: UnsubFn;

  beforeEach(() => {
    firstFn.mockReset();
    secondFn.mockReset();
    thirdFn.mockReset();
  });

  it('should add logger', () => {
    Event.addLogger(standardEventLogger);
  });

  it('should create an event', () => {
    testEvent = new Event('test');
    expect(testEvent.length()).toBe(0);
    expect(testEvent.name).toBe('event::test');
    expect(testEvent).toBeInstanceOf(Event);
  });
  it('should add a single subscriber', () => {
    unsub = testEvent.subscribe(firstFn);
    expect(testEvent.length()).toBe(1);
  });
  it('should publish an event', () => {
    testEvent.publish({ name: 'Ellen', age: 21 });
    jest.runAllImmediates();
    expect(firstFn).toHaveBeenLastCalledWith({ name: 'Ellen', age: 21 });
  });
  it('should add array subscriber', () => {
    unsub2 = testEvent.subscribe([secondFn, thirdFn]);
    expect(testEvent.length()).toBe(3);
  });
  it('should publish an event to multiple sources', () => {
    testEvent.publish({ name: 'Matt', age: 20 });
    jest.runAllImmediates();
    expect(firstFn).toHaveBeenLastCalledWith({ name: 'Matt', age: 20 });
    expect(secondFn).toHaveBeenLastCalledWith({ name: 'Matt', age: 20 });
    expect(thirdFn).toHaveBeenLastCalledWith({ name: 'Matt', age: 20 });
    expect(firstFn).toHaveBeenCalledBefore(secondFn);
    expect(secondFn).toHaveBeenCalledBefore(thirdFn);
    expect(testEvent.length()).toBe(3);
  });
  it('should unsubscribe', () => {
    unsub();
    expect(testEvent.length()).toBe(2);
    testEvent.publish({ name: 'Ben', age: 17 });
    jest.runAllImmediates();
    expect(firstFn).not.toHaveBeenCalled();
    expect(secondFn).toHaveBeenLastCalledWith({ name: 'Ben', age: 17 });
    expect(thirdFn).toHaveBeenLastCalledWith({ name: 'Ben', age: 17 });
  });
  it('should throw when unsub called twice', () => {
    expect(() => {
      unsub();
    }).toThrowError();
  });
  it('should throw when empty array', () => {
    expect(() => {
      testEvent.subscribe([]);
    }).toThrowError();
    expect(() => {
      testEvent.subscribe('hi' as any);
    }).toThrowError();
    expect(() => {
      testEvent.subscribe(['hi'] as any);
    }).toThrowError();
  });
  it('should subscribe first again', () => {
    unsub = testEvent.subscribeFirst(firstFn, 'first');
    expect(testEvent.length()).toBe(3);
  });
  it('should publish in correct order', () => {
    testEvent.publish({ name: 'Michaela', age: 38 });
    jest.runAllImmediates();
    expect(firstFn).toHaveBeenLastCalledWith({ name: 'Michaela', age: 38 });
    expect(secondFn).toHaveBeenLastCalledWith({ name: 'Michaela', age: 38 });
    expect(thirdFn).toHaveBeenLastCalledWith({ name: 'Michaela', age: 38 });
    expect(firstFn).toHaveBeenCalledBefore(secondFn);
    expect(secondFn).toHaveBeenCalledBefore(thirdFn);
    expect(testEvent.length()).toBe(3);
  });
  it('should unsubscribe the array', () => {
    unsub2();
    expect(testEvent.length()).toBe(1);
  });
  it('should publish correctly after array', () => {
    testEvent.publish({ name: 'Ben', age: 17 });
    jest.runAllImmediates();
    expect(firstFn).toHaveBeenLastCalledWith({ name: 'Ben', age: 17 });
    expect(secondFn).not.toHaveBeenCalled();
    expect(thirdFn).not.toHaveBeenCalled();
  });
  it('should subscribe the array first', () => {
    unsub2 = testEvent.subscribeFirst([secondFn, thirdFn]);
    expect(testEvent.length()).toBe(3);
  });
  it('should publish again in correct order', () => {
    testEvent.publish({ name: 'Gary', age: 38 });
    jest.runAllImmediates();
    expect(firstFn).toHaveBeenLastCalledWith({ name: 'Gary', age: 38 });
    expect(secondFn).toHaveBeenLastCalledWith({ name: 'Gary', age: 38 });
    expect(thirdFn).toHaveBeenLastCalledWith({ name: 'Gary', age: 38 });
    expect(secondFn).toHaveBeenCalledBefore(thirdFn);
    expect(thirdFn).toHaveBeenCalledBefore(firstFn);
    expect(testEvent.length()).toBe(3);
  });
  it('should wrap dispatcher', () => {
    let wrappedCalled: boolean = false;

    testEvent.wrapDispatcher((original) => {
      wrappedCalled = true;
      return original;
    });

    testEvent.publish({ name: 'Gary', age: 38 });
    jest.runAllImmediates();
    expect(wrappedCalled).toBe(true);
    expect(firstFn).toHaveBeenLastCalledWith({ name: 'Gary', age: 38 });
    expect(secondFn).toHaveBeenLastCalledWith({ name: 'Gary', age: 38 });
    expect(thirdFn).toHaveBeenLastCalledWith({ name: 'Gary', age: 38 });
    expect(secondFn).toHaveBeenCalledBefore(thirdFn);
    expect(thirdFn).toHaveBeenCalledBefore(firstFn);
    expect(testEvent.length()).toBe(3);
  });
  it('should catch bad subscriber', () => {
    unsub3 = testEvent.subscribe(() => {
      throw new Error('bad subscriber');
    });
    expect(() => {
      testEvent.publish({ name: 'Gary', age: 38 });
      jest.runAllImmediates();
    }).toThrow();
    unsub3();
  });
  it('should catch a bad wrapper', () => {
    testEvent.resetDispatcher();
    testEvent.wrapDispatcher(() => {
      return () => {
        throw new Error('bad dispatcher');
      };
    });

    expect(() => {
      testEvent.publish({ name: 'Gary', age: 38 });
      jest.runAllImmediates();
    }).toThrow();
  });
  it('should reset the logger', () => {
    Event.addLogger();
  });
});
