// tslint:disable:max-classes-per-file
type NodeIteratorFn<T> = (node: T) => void;

export interface CPSubscriptionLogger {
  onSubscribe: (name: string, message: string) => void;
  onUnSubscribe: (name: string, message: string) => void;
}

export interface INode {
  prev: INode;
  next: INode;
}

export class Node implements INode {
  public static throwOnError: boolean = true;
  public prev: INode;
  public next: INode;
  private _removed: boolean = false;

  public remove() {
    if (this._removed) {
      console.error('node already removed');
      if (Node.throwOnError) {
        throw new Error('node already removed');
      }
    } else {
      this._removed = true;
    }
    const next = this.next;
    const prev = this.prev;

    next.prev = prev;
    prev.next = next;
  }
}

export class List<T extends Node> implements INode {
  public prev: INode;
  public next: INode;

  constructor() {
    this.prev = this;
    this.next = this;
  }

  public get length() {
    return this._length();
  }

  public forEach(doFn: NodeIteratorFn<T>, direction: 'forward' | 'backward' = 'forward'): void {
    let current: INode = direction === 'forward' ? this.next : this.prev;
    while (current !== this) {
      doFn(current as T);
      current = direction === 'forward' ? current.next : current.prev;
    }
  }

  public get start(): INode {
    return this;
  }

  public get end(): INode {
    return this.prev;
  }

  public addFragment(fragmentNodes: INodeFragment<T>, after: INode = this.prev) {
    const originalNext = after.next;
    after.next = fragmentNodes.firstNode;
    fragmentNodes.firstNode.prev = after;

    originalNext.prev = fragmentNodes.lastNode;
    fragmentNodes.lastNode.next = originalNext;

    return fragmentNodes;
  }

  public createFragment(nodes: T[]): INodeFragment<T> {
    if (nodes.length === 0) {
      throw new Error('no nodes to make a fragment');
    } else {
      const firstNode: T = nodes[0];
      const lastNode: T = nodes[nodes.length - 1];
      let prevNode: T = firstNode;

      nodes.forEach((currentNode) => {
        if (currentNode !== firstNode) {
          // Nodes 2,3....
          currentNode.prev = prevNode;
          prevNode.next = currentNode;
        }
        prevNode = currentNode;
      });

      return { firstNode, lastNode };
    }
  }

  private _length(): number {
    let count = 0;
    this.forEach(() => {
      count += 1;
    });
    return count;
  }
}

export interface INodeFragment<T> {
  firstNode: T;
  lastNode: T;
}
