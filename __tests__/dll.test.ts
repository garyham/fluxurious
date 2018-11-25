import { INodeFragment, List, Node } from '../src/dll';

class TestNode extends Node {
  constructor(public age: number) {
    super();
  }
}

describe('subscription tests', () => {
  let list: List<TestNode>;
  let testNodes: TestNode[];
  let fragment: INodeFragment<TestNode>;
  let remNode: TestNode;

  it('should create subscriptions', () => {
    list = new List<TestNode>();
    expect(list.length).toBe(0);
    expect(list.start).toBe(list);
    expect(list.end).toBe(list);
  });
  it('should ignore empty array', () => {
    expect(list.createFragment).toThrow();
    expect(list.length).toBe(0);
    expect(list.start).toBe(list);
    expect(list.end).toBe(list);
  });
  it('should create a fragment', () => {
    testNodes = [new TestNode(44)];
    fragment = list.createFragment(testNodes);
    expect(fragment.firstNode).toBe(testNodes[0]);
    expect(fragment.lastNode).toBe(testNodes[0]);
  });
  it('should add a fragment (at end by default)', () => {
    list.addFragment(fragment);
    expect(list.length).toBe(1);
  });
  it('should create an array fragment', () => {
    testNodes = [new TestNode(45), new TestNode(46), new TestNode(47)];
    fragment = list.createFragment(testNodes);
    expect(fragment.firstNode).toBe(testNodes[0]);
    expect(fragment.lastNode).toBe(testNodes[2]);
  });
  it('should add an array fragment', () => {
    list.addFragment(fragment);
    expect(list.length).toBe(4);
  });
  it('should add an array fragment at the beginning', () => {
    testNodes = [new TestNode(41), new TestNode(42), new TestNode(43)];
    fragment = list.createFragment(testNodes);
    list.addFragment(fragment, list.start);
    const ages: number[] = [];
    list.forEach(({ age }) => {
      ages.push(age);
    });
    expect(list.length).toBe(7);
    expect(ages).toEqual([41, 42, 43, 44, 45, 46, 47]);
  });
  it('should remove a middle node', () => {
    remNode = testNodes[1];
    remNode.remove();
    expect(list.length).toBe(6);
  });
  it('should REJECT removal of same node', () => {
    expect(remNode.remove).toThrow();
    Node.throwOnError = false;
    remNode.remove(); // Just prints console.error()
    expect(list.length).toBe(6);
  });
  it('should remove first node', () => {
    testNodes[0].remove();
    expect(list.length).toBe(5);
  });
  it('should traverse in reverse', () => {
    let count = 0;
    list.forEach(() => {
      count += 1;
    }, 'backward');
    expect(count).toBe(5);
  });
});
