import { INode, List, Node } from './dll';

export type SubscriberFn<P> = (payload?: P) => void;
export type ReducerFn<P, S> = (payload: P, state: S) => S;
export type DispatcherWrapperFn<P> = (wrapper: SubscriberFn<P>) => SubscriberFn<P>;
export type UnsubFn = () => void;

export interface EventLogger {
  onCreate?: (eventName: string) => void;
  onDispatch?: (eventName: string, payload: any) => void;
  onSubscribe?: (eventName: string, subscriberName: string) => void;
  onUnSubscribe?: (eventName: string, subscriberName: string) => void;
}

export class Event<P = undefined> {
  public static addLogger(logger: EventLogger = {}) {
    Event.logger = logger;
  }

  private static logger: EventLogger = {} as EventLogger;

  public name: string;
  private _subs: List<SubscriptionNode<P>>;
  private dispatcher: SubscriberFn<P>;

  constructor(name: string) {
    this.name = `event::${name}`;
    const { onCreate } = Event.logger;
    onCreate && onCreate(this.name);
    this._subs = new List<SubscriptionNode<P>>();
    this._dispatch = this._dispatch.bind(this);
    this.dispatcher = this._dispatch;
  }

  public get length() {
    return this._subs.length;
  }

  public wrapDispatcher(wrapper: DispatcherWrapperFn<P>) {
    this.dispatcher = wrapper(this.dispatcher);
  }

  public resetDispatcher() {
    this.dispatcher = this._dispatch;
  }

  public publish(payload?: P) {
    setImmediate(() => {
      try {
        this.dispatcher(payload);
      } catch (error) {
        console.error('publish saw a bad dispatch error %s', this.name);
        throw error;
      }
    });
  }

  public subscribeFirst(subFns: SubscriberFn<P> | Array<SubscriberFn<P>>, forcedName?: string): UnsubFn {
    return this.subscribeAny(this._subs.start, subFns, forcedName);
  }

  public subscribe(subFns: SubscriberFn<P> | Array<SubscriberFn<P>>, forcedName?: string): UnsubFn {
    return this.subscribeAny(this._subs.end, subFns, forcedName);
  }

  private subscribeAny(after: INode, subFns: SubscriberFn<P> | Array<SubscriberFn<P>>, forcedName?: string): UnsubFn {
    const { onSubscribe, onUnSubscribe } = Event.logger;
    let subs: Array<SubscriptionNode<P>>;

    if (typeof subFns === 'function') {
      subs = this.makeSubscriberNodesFromFunction(subFns, forcedName);
    } else if (Array.isArray(subFns)) {
      subs = this.makeSubscriberNodesFromArray(subFns);
    } else {
      throw new Error('bad subscription type');
    }

    const fragment = this._subs.createFragment(subs);

    this._subs.addFragment(fragment, after);

    onSubscribe &&
      onSubscribe(
        this.name,
        subs
          .map(({ name }) => {
            return name;
          })
          .toString()
      );

    return () => {
      subs.forEach((sub) => {
        onUnSubscribe && onUnSubscribe(this.name, sub.name);
        sub.remove();
      });
    };
  }

  private makeSubscriberNodesFromArray(subFns: Array<SubscriberFn<P>>): Array<SubscriptionNode<P>> {
    const subs: Array<SubscriptionNode<P>> = [];

    subFns.forEach((subFn, i) => {
      if (typeof subFn === 'function') {
        const subscription = new SubscriptionNode();

        // Try to grab a sensible name...
        // tslint:disable-next-line:no-string-literal
        const _name = subFn.name && subFn.name !== '__fn__' ? subFn.name : subFn['store'] || i;
        subscription.name = _name;
        subscription.fn = subFn;
        subs.push(subscription);
      } else {
        throw new Error('bad subscription type in array');
      }
    });

    return subs;
  }

  private makeSubscriberNodesFromFunction(subFn: SubscriberFn<P>, forcedName?: string): Array<SubscriptionNode<P>> {
    const subscription = new SubscriptionNode();
    // tslint:disable-next-line:no-string-literal
    const _name = forcedName || (subFn.name && subFn.name !== '__fn__' ? subFn.name : subFn['store'] || 'anonymous');
    // tslint:enable
    subscription.fn = subFn;
    subscription.name = _name;

    return [subscription];
  }

  private _dispatch(payload: P) {
    const { onDispatch } = Event.logger;

    onDispatch && onDispatch(this.name, payload);
    this._subs.forEach((sub) => {
      const { fn, name } = sub;
      try {
        fn(payload);
      } catch (error) {
        console.error(`bad dispatcher ${name}`);
        throw error;
      }
    });
  }
}

// tslint:disable-next-line:max-classes-per-file
export class SubscriptionNode<P> extends Node {
  public name: string;
  public fn: SubscriberFn<P>;

  constructor() {
    super();
  }
}
