import * as React from 'react';
import { UnsubFn } from './event';
import { Store } from './store';
jest.useFakeTimers();

/* tslint:disable:max-classes-per-file */
// OP are the outer props.

export interface ContextLogger {
  onCreate: (propName: string) => void;
  onMountProvider: (propName: string) => void;
  onUnmountProvider: (propName: string) => void;
  onMountConsumer: (componentName: string) => void;
  onUnmountConsumer: (componentName: string) => void;
  onStateChangeProvider: (propName: string) => void;
  onRenderProvider: (propName: string) => void;
}

interface Props<S> {
  store: Store<S>;
}

interface State<S> {
  storeState: S;
}

export class Context<S> {
  public static addLogger(logger: ContextLogger) {
    Context.logger = logger;
  }

  private static logger: ContextLogger = {} as ContextLogger;

  public Provider: React.ComponentClass<Props<S>, State<S>>;
  public Consumer: React.Consumer<S>;
  private unsub: UnsubFn;
  private isWrapped: boolean = false;

  constructor(private name: string) {
    const { Provider, Consumer } = React.createContext<S>({} as S);
    this.Consumer = Consumer;
    const _name = `provider::${this.name}`;
    const { onCreate } = Context.logger;
    onCreate && onCreate(_name);

    let _unsub = this.unsub;
    const setWrap = this.setWrap;

    this.Provider = class MyProvider extends React.Component<Props<S>, State<S>> {
      constructor(props: Props<S>) {
        super(props);
        const { store } = props;
        this.state = { storeState: store.state };
      }

      public componentWillMount() {
        const { onMountProvider } = Context.logger;
        onMountProvider && onMountProvider(_name);
        setWrap(true);
      }

      public componentDidMount() {
        const { store } = this.props;
        store && (_unsub = store.eventChange.addSubscriber(this.providerChangeState, _name));
      }

      public componentWillUnmount() {
        _unsub();
        const { onUnmountProvider } = Context.logger;
        onUnmountProvider && onUnmountProvider(_name);
        setWrap(false);
      }

      public render() {
        const { onRenderProvider } = Context.logger;
        onRenderProvider && onRenderProvider(_name);
        return <Provider value={this.state.storeState}>{this.props.children}</Provider>;
      }

      private providerChangeState = (newState: S) => {
        if (this.state.storeState === newState) {
          return;
        }
        const { onStateChangeProvider } = Context.logger;
        onStateChangeProvider && onStateChangeProvider(_name);
        this.setState({ storeState: newState });
      };
    };
  }

  public connect<P>(WrappedComponent: React.ComponentType) {
    const consumer = this.Consumer;
    const propName = this.name;
    const getWrap = this.getWrap;
    const { onMountConsumer, onUnmountConsumer } = Context.logger;

    return class WithState extends React.Component<P> {
      public componentDidMount() {
        onMountConsumer && onMountConsumer(WrappedComponent.displayName || `consumer of ${propName}`);
      }

      public componentWillUnmount() {
        onUnmountConsumer && onUnmountConsumer(WrappedComponent.displayName || `consumer of ${propName}`);
      }

      public render() {
        const { ...restProps } = this.props as {};

        return React.createElement(consumer, null, (value: S) => {
          if (!getWrap()) {
            console.error(`state ${propName} is missing in Consumer.  Did you forget to include the Provider?`);
          }
          const mapped = {};
          mapped[propName] = value;
          return <WrappedComponent {...restProps} {...mapped} />;
        });
      }
    };
  }

  private setWrap = (isWrapped: boolean) => {
    this.isWrapped = isWrapped;
  };

  private getWrap = () => {
    return this.isWrapped;
  };
}
