import { ReducerFn, SubscriberFn } from './event';
import { Event } from './event';

export interface StoreLogger {
  onCreate?: (storeName: string) => void;
}

export class Store<S> {
  public static addLogger(logger: StoreLogger = {}) {
    Store.logger = logger;
  }

  private static logger: StoreLogger = {} as StoreLogger;

  private static names: string[] = [];
  public eventChange: Event<S>;
  private _name: string;
  private _state: S;

  constructor(name: string, initialState: S) {
    this._name = `store::${name}`;
    if (Store.names.indexOf(this._name) !== -1) {
      throw new Error(`store with name ${name} already exists`);
    }
    const { onCreate } = Store.logger;
    onCreate && onCreate(this._name);
    this.eventChange = new Event<S>(this._name);
    Store.names.push(this._name);
    this._state = initialState;
  }

  get name() {
    return this._name;
  }

  get state() {
    return this._state;
    // tslint:disable-next-line:only-arrow-functions
  }

  set state(value: S) {
    const currentState = this._state;
    this._state = value;
    if (this._state !== currentState) {
      this.eventChange.publish(this._state);
    }
  }

  public weaklyDestroy = () => {
    // We simply remove the name check, it does not remove the object.
    // To have JS actually destroy the Store you must remove any references to it
    // then garbage collection will remove it.
    const ndx = Store.names.indexOf(this.name);
    if (Store.names.indexOf(this.name) === -1) {
      throw new Error(`store does not exist`);
    }
    Store.names.splice(ndx, 1);
  };

  public addReducer(reducer: (s: Store<S>) => void) {
    reducer(this);
    return this;
  }

  public makeSubscriber<P>(reducerFn: ReducerFn<P, S>): SubscriberFn<P> {
    // tslint:disable-next-line:variable-name
    const __fn__ = (payload: P) => {
      this.state = reducerFn(payload, this.state);
    };

    // We add this meta-data to allow us to pass a better name for the store to the event.
    Object.defineProperty(__fn__, 'store', {
      enumerable: false, // optional; if you care about your enumerated keys
      configurable: false,
      writable: false,
      value: `${this._name}::reducer(${reducerFn.name || 'anonymous'})`
    });

    return __fn__;
  }
}
