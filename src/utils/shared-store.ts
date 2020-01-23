import { _1mb } from "./consts"

/* 
  0 [ 0 , 1 , 2 , 3 , 4 , 5 , 6 , 7 ]
  1 [              size             ]
*/

export class SharedStore {
  constructor(public buffer: SharedArrayBuffer = new SharedArrayBuffer(_1mb)) {

  }

  get size(): number {
    return 0
  }

  get bytesAvailable(): number {
    return 0
  }

  get bytesUsed(): number {
    return 0
  }

  set<T>(key: string, data: T): void {

  }

  get<T>(key: string): T {
    return null
  }

  reset(): void {

  }
}
