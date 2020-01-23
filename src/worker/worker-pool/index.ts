import * as path from "path"
import {
  Worker,
  MessageChannel,
} from "worker_threads"
import os from "os"
import { Events, Commands } from "../../core"

type WorkerInfo = {
  id: any
  worker: Worker
  memory: SharedArrayBuffer
  subChannel: MessageChannel
  busy: boolean
}

type WorkerMessage = {
  id: number
  event: string
}

type TaskInfo = {
  id: number
  data: any
}

const numCPU = os.cpus().length - 1
let _numWorker = 0
let numWorkerReady = 0
let workers: WorkerInfo[]
let _resolve: Function
let _reject: Function
let _tasks: TaskInfo[]
let numTasks: number
let numTasksFinished: number
let onProgressCallback: (finished: number) => void
let onCompletedCallback: (finished: number) => void

function createWorker(id: number, memory: SharedArrayBuffer): WorkerInfo {
  const worker = new Worker(path.resolve(__dirname, "./worker.js"))
  const subChannel = new MessageChannel()
  try {
    subChannel.port1.on("message", handleWorkerMessage)
    return { id, worker, subChannel, memory, busy: true }
  } catch (e) {
    console.error(e)
    throw e
  }
}

async function initWorker(id: number) {
  try {
    const workerInfo = workers[id]
    const { memory, subChannel: { port2: port } } = workerInfo

    workerInfo.worker.postMessage(
      {
        id,
        command: Commands.INIT,
        data: {
          port,
          memory
        }
      },
      [port]
    )
  } catch (e) {
    _reject(e)
  }
}

export async function initializeWorkers(
  memory: SharedArrayBuffer, numWorker: number = numCPU): Promise<void> {
  _numWorker = numWorker
  _resolve = null
  _reject = null
  workers = []
  for (let i = 0;i < _numWorker;i++) {
    const workerInfo = createWorker(i, memory)
    workers.push(workerInfo)
  }
  return new Promise((resolve, reject) => {
    _resolve = resolve
    _reject = reject
    initWorker(0)
  })
}


function handleWorkerMessage(message: WorkerMessage) {
  const { event, id } = message
  const workerInfo = workers[id]
  switch (event) {
    case Events.INITED:
      numWorkerReady++
      if (numWorkerReady === _numWorker) {
        _resolve()
      } else {
        initWorker(id + 1)
      }
      workerInfo.busy = false
      break
    case Events.FINISHED:
      numTasksFinished++
      workerInfo.busy = false
      if (numTasksFinished === numTasks) {
        onCompletedCallback(numTasksFinished)
        _resolve()
        return
      }
      onProgressCallback(numTasksFinished)
      runNextTask(workerInfo)
      break
  }
}

export async function runTasks(tasks: TaskInfo[],
  onprogress: (finished: number) => void, oncompleted: (finished: number) => void) {
  _resolve = null
  _reject = null
  _tasks = tasks
  numTasks = _tasks.length
  numTasksFinished = 0
  onProgressCallback = onprogress
  onCompletedCallback = oncompleted
  workers.forEach(workerInfo => runNextTask(workerInfo))
  return new Promise((resolve, reject) => {
    _resolve = resolve
    _reject = reject
  })
}

function runNextTask(workerInfo: WorkerInfo) {
  if (_tasks.length > 0) {
    const task = _tasks.shift()
    workerInfo.worker.postMessage(
      {
        command: Commands.RUN,
        data: {
          task
        }
      }
    )
    workerInfo.busy = true
  }
}
