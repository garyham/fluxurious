import 'jest-extended';
import { Event, standardStoreLogger, Store } from '../src';

jest.useFakeTimers();

interface IMeState {
  age: number;
  name: string;
}

interface IEventAgePayload {
  age: number;
}

interface IEventNamePayload {
  name: string;
}

describe('Store tests', () => {
  const expectedState: IMeState = {
    age: 10,
    name: 'Bert'
  };

  let testStore: Store<IMeState>;
  const ageEvent: Event<IEventAgePayload> = new Event('age');
  const nameEvent: Event<IEventNamePayload> = new Event('name');
  const dummyFn1 = jest.fn();
  const dummyFn2 = jest.fn();

  test('should add a logger', () => {
    Store.addLogger(standardStoreLogger);
  });

  test('should create a store', () => {
    testStore = new Store('testStore', expectedState);
    expect(testStore).toBeInstanceOf(Store);
    expect(testStore.name).toBe('store::testStore');
    expect(testStore.state).toEqual(expectedState);
  });

  test('should throw when creating store of same name', () => {
    expect(() => {
      testStore = new Store('testStore', expectedState);
    }).toThrow();
  });

  test('should subscribe to an event', () => {
    ageEvent.subscribe(
      testStore.makeSubscriber(({ age }, state) => {
        if (age === 100) {
          return state;
        }
        return { ...state, age };
      })
    );
    expect(testStore.state).toEqual(expectedState);
  });
  test('should update when event published', () => {
    ageEvent.publish({ age: 99 });
    jest.runAllImmediates();
    expectedState.age = 99;
    expect(testStore.state).toEqual(expectedState);
  });
  test('should issue event when updated', () => {
    let sawAge: number = 0;

    testStore.eventChange.subscribe(({ age }) => {
      sawAge = age;
    });
    ageEvent.publish({ age: 52 });
    expectedState.age = 52;
    jest.runAllImmediates();
    expect(testStore.state).toEqual(expectedState);
    expect(sawAge).toEqual(52);
  });
  test('should NOT issue event when age = 100', () => {
    let sawAge: number = 0;

    testStore.eventChange.subscribe(({ age }) => {
      sawAge = age;
    });
    ageEvent.publish({ age: 100 });
    jest.runAllImmediates();
    expect(testStore.state).toEqual(expectedState);
    expect(sawAge).toEqual(0);
  });
  test('should add subscriber as part of array', () => {
    nameEvent.subscribe([
      testStore.makeSubscriber(({ name }, state) => {
        dummyFn1(name);
        return { ...state, name };
      }),
      ({ name }) => {
        dummyFn2(name);
      }
    ]);
  });
  test('should publish in order', () => {
    nameEvent.publish({ name: 'Ernie' });
    jest.runAllImmediates();
    expectedState.name = 'Ernie';
    expect(testStore.state).toEqual(expectedState);
    expect(dummyFn1).toHaveBeenCalledBefore(dummyFn2);
  });
  test('should reset the logger', () => {
    Store.addLogger();
  });
  test('should not throw after destroying store', () => {
    expect(() => {
      testStore.weaklyDestroy();
      testStore = new Store('testStore', expectedState);
    }).not.toThrowError();
  });
});
