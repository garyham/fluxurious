# Fluxurious

## What is it?

A strongly typed event/store system with easy integration into React (16+).

Events are independent of the Store, allow 0..N subscribers to listen for a published payload, don't rely on strings and are strongly typed.

Stores can subscribe to Events (as can other functions). Contexts are automatically created to allow Store state to be passed easily to React components.

It does similar things to Redux in that it has stores and events (aka actions) and it supports injection of state from props but it is **not** Redux.

## Why?

I liked the Redux is the correct approach but the reliance on strings for events and the use of switch statements made for poor typechecking.  
Added to that async handling (with Thunk) seems to be an afterthough with really complex typings.
Lastly the level of boilerplate needed just frustrated me.

I was strongly influenced, both positively and negatively, by Redux (reducers, connect() and the separation of concerns), immutable data and reactive programming (RxJs) and I am a huge typescript fan.

## Install

npm i -S fluxurious

## Prerequisites

React 16 (needs new Context mechanism);
Typescript ^2.9.0 is the version I tested with but the types should work with most.

## Influences

I hadn't even thought of Context as a replacement for Redux until I read [this article by Didier FRANC](https://medium.freecodecamp.org/replacing-redux-with-the-new-react-context-api-8f5d01a00e8c) and [this article by Dave Ceddia](https://daveceddia.com/context-api-vs-redux/). Thanks guys.

# Events

## Creating

Creating is simple.

```typescript
interface IPayloadTransaction {
  from: string;
  to: string;
  amount: number;
}

const makePayment = new Event<IPayloadTransaction>('makePayment');
```

## Publishing data

```typescript
makePayment.publish({ from: 'Alice', to: 'Bob', amount: 100 });
```

## Subscribing.

```typescript
const amountSubscriber = ({ from, to, amount }) => {
  console.log(`I saw from:${from}, to:${to} and amount:${amount}`);
};

const unsub = eventMakePayment.subscribe(amountSubscriber);
```

> I made amountSubscriber a separate function to ensure it was a named function. This makes for more readable logs.

## Unsubscribing.

Just call the function returned from the subscription call.

```typescript
unsub();
```

## Execution order.

### Execution order.

#### Single Event

The order of execution is the order in which subscribers are registered. If you have an order dependency you can subscribe (and unsubscribe) arrays of subscribers.

```typescript
const amountSubscriber = ({ from, to, amount }) => {
  console.log(`I saw from:${from}, to:${to} and amount:${amount}`);
};

const afterAmountSubscriber({ from, to, amount }) => {
  console.log('I will always execute after amountSubscriber');
}

const unsub = eventMakePayment.subscribe([
  amountSubscriber,afterAmountSubscriber
]);
```

calling `unsub()` will unsubscribe them all.

#### Cascaded Events

Consider event A with subscribers 1,2 and 3 and event B with subscribers 4 and 5.

If subscriber 1 calls event B this could create a sequencing issue.

> **Is the order** 1,2,3 then 4,5 **or** 1,2 then 4,5 and finally 3.

To guarantee ordering, the store dispatcher is wrapped in a call to `setImmediate()`. This will guarantee the order is 1,2,3 then 4,5.

### First Subscriber

The function `.subscribeFirst()` allows a subscriber to be forced to the head of the dispatch list. Usually new subscriptions are added to the end.

## Advanced Control

The `dispatcher` can be wrapped to allow for filtering, throttling or debounce prior to dispatching.

```typescript
eventMakePayment.wrapDispatcher((originalDispatcher) => lodash.debounce(originalDispatcher, 2000));
```

Mapping the payload from one type to another cannot be done by wrapping the dispatcher as they are strongly typed but this can be accomplished by cascading 2 events.

# Stores

Stores manage state and work in tandem with Events

## Creating

```typescript
interface IMyAccountState {
  name: string;
  amount: number;
}

const myAccount = new Store<IMyAccountState>('my bank account', { name: 'Bob', amount: 0 });
```

## Subscribing to Events

Each store has a `.makeSubscriber()` function. This takes a reducer with the signature `(payload:P, state:S)=>S`.

S and P are correctly inferred from the event and the store state.

```typescript
const transactionSubscriber = myAccount.makeSubscriber(({ from, to, amount }, state) => {
  let newAmount;
  const originalAmount = state.amount;

  if (from === state.me) {
    newAmount = originalAmount - amount;
  } else if (to === state.me) {
    newAmount = originalAmount + amount;
  } else {
    console.error('bad transaction');
    return state;
  }

  return { ...state, amount: newAmount };
});

unsub = eventMakePayment.subscribe(transactionSubscriber);
```

> The **state** returned **must be immutable** to cause a change event to be emitted. In this example we use the spread operator to guarantee the change.
>
> For the bad transaction, we simply return an unchanged state

## Changes in the Store contents.

Each store also has an event which may be subscribed to.

```typescript
myAccount.eventChange.subscribe(({ name, amount }) => {
  console.log(`hi ${name}, your balance is now ${amount}`);
});
```

## Reading the Store contents.

The contents of the store can be read by accessing the `.state` property.

# Context

One of the features I loved with redux was the `connect()` method. This cleanly separated the state domain from the react domain and allowed for clean stateless components.

Redux achieves this by passing the store react `context`

React 16 comes with the new Context mechanism which this library integrates with stores and events to achieve the same separation of concerns.

## Creating

```typescript
const myStateWrapper = new Context<IMyAccountState>('myState');
```

The name `myState` is **important** as it is used as the prop name by the Consumer.

## The Consumer

```typescript
interface IProps {
  myState: IMyAccountState;
}

export const ShowAccount: React.SFC<IProps> = ({ myState }) => {
  return (
    <div>
      <pre>{JSON.stringify(myState)}</pre>
    </div>
  );
};

const WrappedShowAccount = myStateWrapper.connect(ShowAccount);
```

## The Provider

The provider takes a single prop, the `store` which must be an instanceOf(Store). The provider listens to events on the store and any changes in state will cause it to re-render.

If a Provider is unmounted it automatically unsubscribes from the store and re-subscribes when it remounts.

```coffee
interface IProps {
  myState: IMyAccountState;
}

export const App: React.SFC<IProps> = (props) => {
  return (
    <div>
      <myStateWrapper.Provider store={myAccount}>
        <div>
          <WrappedShowAccount />
        </div>
      </myStateWrapper.Provider>
    </div>
  );
};
```

## Nesting

### Consumers

You can create as many wrappers as necessary and cascade them on a component.

```typescript
const WrappedShowAccount = authStateWrapper.connect(myStateWrapper.connect(ShowAccount));
```

### Providers

Providers can be placed at an appropriate depth.

```coffee
export const App: React.SFC<IProps> = (props) => {
  return (
    <div>
      <myStateWrapper.Provider store={myAccount}>
        <div>
          <WrappedShowAccount />
          <myOtherWrapper.Provider>
            <div>
              <div>
                <OtherWrappedConsumer />
              </div>
            </div>
          </myOtherWrapper.Provider>
        </div>
      </myStateWrapper.Provider>
    </div>
  );
};
```

## Logging

The Store, Event and Context classes all have a static function called `addLogger`.

Event names are prefixed with `event::`, Store names with `store::`. The Loggers support `onCreate, onRender, onMount, onUnmount, onDispatch, onSubscribe, onUnsubscribe` methods which be selectively installed as needed. Example loggers are provided which simply log to console.

## Initialisation

I recommend creating all the events and stores in the application before registering any subscribers.

```typescript
export const authEvents = {
  login: new Event<ILoginPayload>('login'),
  logout: new Event<ILogoutPayload>('logout')
};

export const authStore = new Store<IAuthState>('auth');
```

Initialising subscriptions is best done in a function which is called after all events and stores have been created. This avoids issues with potential circular dependencies.

```typescript
import {authEvents} from './Events'

const initAuth(authStore:IAuthStore){
  authEvents.login.subscribe(authStore.makeSubscriber(({friendlyName, sessionId}, state)=>{
    return({...state, friendlyName, sessionId})
  }))
}
```

The store now has a convenience method called addReducer which allows you to chain reducers.
It will pass the store to the parameter function.
This allows you to segment the reducer for a store into different files.

```
authStore.addReducer(initReducer).addReducer(anotherReducer)
```
