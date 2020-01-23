import * as path from "path"
import {
  Worker,
  MessageChannel,
  MessagePort,
  isMainThread,
  parentPort
} from "worker_threads";
import os from "os"
import { Events, Commands } from "../core";

type WorkerInfo = {
  id: any;
  worker: Worker;
  subChannel: MessageChannel;
  busy: boolean;
}

const numWorker = os.cpus().length - 1;
let numWorkerReady = 0;
let workers: WorkerInfo[]

function createWorker(id) {
  const worker = new Worker(path.resolve(__dirname, "./worker.js"));
  const subChannel = new MessageChannel();
  try {
    subChannel.port2.on("message", handleWorkerMessage);
    return { id, worker, subChannel, busy: true };
  } catch (e) {
    console.error(e);
    throw e;
  }
}

function handleWorkerMessage(value) {
  const { event, id } = value;
  const workerInfo = workers[id];
  switch (event) {
    case Events.INITED:
      numWorkerReady++;
      if (value.context) {
        context = value.context;
      }
      if (numWorkerReady === numWorker) {
        _resolve();
      } else {
        initWorker(id + 1, context);
      }
      workerInfo.busy = false;
      break;
    case Events.FINISHED:
      numTasksDone++;
      workerInfo.busy = false;
      if (totalCount === 10) {
        console.log(chalk.green("All tasks done"));
        process.exit(0);
      }
      if (numTasksDone === totalTasks) {
        // console.log(chalk.green("All tasks done"));
        // process.exit(0);
        tasks = tasksBackup.concat();
        numTasksDone = 0;
      }
      if (tasks.length > 0) {
        doWork();
      }
      break;
  }
}


export function initializeWorkers(numWorker) {
  workers = []
  for (let i = 0;i < numWorker;i++) {
    const workerInfo = createWorker(i);
    workers.push(workerInfo);
  }
}

async function initWorker(id, context) {
  try {
    const workerInfo = workers[id];
    workerInfo.worker.postMessage(
      {
        id,
        command: Commands.INIT,
        data: {
          port: workerInfo.subChannel.port1,
          memory: workerInfo.wasmMemory,
          context
        }
      },
      [workerInfo.subChannel.port1]
    );
  } catch (e) {
    console.error(e);
    return reject();
  }
}
