require('source-map-support').install();
import { promises as fs, Dirent } from "fs"
import * as path from "path"
import { _1gb } from "./utils/consts"
import { initializeWorkers, runTasks } from "./worker/worker-pool"

export type Options = {
  source: string
  destination: string
  batch: number
}

const defaultOptions: Options = {
  source: ".",
  destination: "./organized-photos",
  batch: 10
}

export async function main(options = {}) {
  const _options = {
    ...defaultOptions,
    ...options
  }
  const memory = new SharedArrayBuffer(_1gb)
  const workerPromsie = initializeWorkers(memory, 10)
  const scanPromise = scanDirectory(path.resolve(_options.source))
  const [, dirs] = await Promise.all([workerPromsie, scanPromise])
  await processDirs(dirs)
}

async function processDirs(dirs: Dirent[]) {
  const tasks = dirs.map((dir, id) => ({ id, data: dir }))
  await runTasks(tasks, onProgress, onComplete)
}

function onProgress(numFinished: number) {
  // process.stdout.write(`numFinished:${numFinished}`)
  // console.log(`numFinished:${numFinished}`)
}
function onComplete(numFinished: number) {
  console.log(`Finished:${numFinished}`)
}

async function scanDirectory(dir: string): Promise<Dirent[]> {
  const dirs = await fs.readdir(dir, { withFileTypes: true })
  return dirs
}
