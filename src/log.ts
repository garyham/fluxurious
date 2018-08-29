import { ContextLogger } from './context';
import { EventLogger } from './event';
import { StoreLogger } from './store';

export const standardEventLogger: EventLogger = {
  onCreate: (eventName: string) => {
    console.log(`creating ${eventName}`);
  },
  onDispatch: (eventName: string, payload: any) => {
    console.log('dispatching %s with %s', eventName, JSON.stringify(payload));
  },
  onSubscribe: (eventName: string, subscriberName: string) => {
    console.log(`adding subscription to ${eventName} by ${subscriberName}`);
  },
  onUnSubscribe: (eventName: string, subscriberName: string) => {
    console.log(`removing subscription from ${eventName} by ${subscriberName}`);
  }
};

export const standardStoreLogger: StoreLogger = {
  onCreate: (storeName: string) => {
    console.log(`creating ${storeName}`);
  }
};

export const standardContextLogger: ContextLogger = {
  onCreate: (propName: string) => {
    console.log(`creating ${propName}`);
  },
  onMountProvider: (propName: string) => {
    console.log(`mounting ${propName}`);
  },
  onUnmountProvider: (propName: string) => {
    console.log(`unmounting ${propName}`);
  },
  onMountConsumer: (componentName: string) => {
    console.log(`mounting ${componentName}`);
  },
  onUnmountConsumer: (componentName: string) => {
    console.log(`unmounting ${componentName}`);
  },
  onStateChangeProvider: (propName: string) => {
    console.log(`state change ${propName}`);
  },
  onRenderProvider: (propName: string) => {
    console.log(`render ${propName}`);
  }
};
