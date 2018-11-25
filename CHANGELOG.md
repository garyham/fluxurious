# Change Log

## 1.0.16

- Added `Store.addReducer(fn) : Store` where fn : `(store)=>void`. In this way we can segment reducers and then chain them to modify the store.
- Event names are now optional but highly recommended as it makes debugging easier.
- Cleaned up types to prevent payload type being "P | undefined" in subscriberFn
- moved react to peer/devDependencies
- npm update including to Typescript 3.x.x compiler.
- Clean up of internals and tests after npm update

## 1.0.15

Added back the call to `setImmediate()` to the dispatcher of a Store. Makes for a much more deterministic behaviour. This can introduce a sequencing issue if one subscriberFn modifies the store (the result of which will be delayed until the next 'tick') and another does something that depends on the store being changed immediately (In my application it was a history.push() which happens immediately). To get around this simply wrap the body of the subscriberFn in a setImmediate() call.

```typescript
setImmediate(() => {
  history.push('new/route');
});
```
