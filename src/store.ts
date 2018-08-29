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
    if (Store.names.indexOf(name) !== -1) {
      throw new Error(`store with name ${name} already exists`);
    }
    const { onCreate } = Store.logger;
    onCreate && onCreate(this._name);
    this.eventChange = new Event<S>(this._name);
    Store.names.push(name);
    this._state = initialState;
  }

  get name() {
    return this._name;
  }

  get state() {
    return this._state;
    // tslint:disable-next-line:only-arrow-functions
  }

  public makeSubscriber<P>(reducerFn: ReducerFn<P, S>): SubscriberFn<P> {
    // tslint:disable-next-line:variable-name
    const __fn__ = (payload: P) => {
      const currentState = this._state;
      this._state = reducerFn(payload, this.state);
      if (this._state !== currentState) {
        this.eventChange.publish(this._state);
      }
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
