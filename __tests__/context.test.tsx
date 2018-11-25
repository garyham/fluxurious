import { mount, shallow } from 'enzyme';
import * as React from 'react';
import { Context, Event, Store } from '../src';
import { standardContextLogger } from '../src/log';
jest.useFakeTimers();

interface IMeState {
  age: number;
  name: string;
}

interface IEventAgePayload {
  age: number;
}

const inner: React.SFC<{ meState: IMeState }> = (props) => {
  return (
    <div className="consumer">
      <pre>{JSON.stringify(props.meState)}</pre>
    </div>
  );
};

describe('Context tests', () => {
  let testWrap: Context<IMeState>;
  const expectedState: IMeState = {
    age: 10,
    name: 'Bert'
  };

  const ageEvent: Event<IEventAgePayload> = new Event('age');

  const testStore: Store<IMeState> = new Store('me', expectedState);

  const storeSubscriber = testStore.makeSubscriber(({ age }, state) => {
    return { ...state, age };
  });

  ageEvent.subscribe(storeSubscriber);

  test('should add a logger', () => {
    Context.addLogger(standardContextLogger);
  });

  test('should create a context', () => {
    testWrap = new Context<IMeState>('meState');
    expect(testWrap).toBeInstanceOf(Context);
  });

  it('Consumer renders with console error when not wrapped by Provider', () => {
    // @ts-ignore
    const Wrapped = testWrap.connect(inner);
  });

  it('Provider renders children when passed in', () => {
    const wrapper = shallow(
      <testWrap.Provider store={testStore}>
        <div className="provider" />
      </testWrap.Provider>
    );
    expect(wrapper.contains(<div className="provider" />)).toBe(true);
  });

  it('Consumer renders with correct state', () => {
    const Wrapped = testWrap.connect(inner);

    const wrapper = mount(
      <testWrap.Provider store={testStore}>
        <Wrapped />
      </testWrap.Provider>
    );
    expect(wrapper.containsMatchingElement(<pre>{JSON.stringify(expectedState)}</pre>)).toBe(true);
  });

  it('Consumer changes on event', () => {
    const Wrapped = testWrap.connect(inner);
    const wrapper = mount(
      <testWrap.Provider store={testStore}>
        <Wrapped />
      </testWrap.Provider>
    );
    expect(wrapper.containsMatchingElement(<pre>{JSON.stringify(expectedState)}</pre>)).toBe(true);
    ageEvent.publish({ age: 23 });
    jest.runAllImmediates();
    expectedState.age = 23;
    wrapper.update();
    expect(wrapper.containsMatchingElement(<pre>{JSON.stringify(expectedState)}</pre>)).toBe(true);
    wrapper.unmount();
  });
  test('should reset the logger', () => {
    Context.addLogger();
  });
});
