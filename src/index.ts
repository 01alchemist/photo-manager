import { promises as fs } from "fs"
import * as path from "path"

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

const workers = []

export async function main(options = {}) {
  const _options = {
    ...defaultOptions,
    ...options
  }

  const dirs = await scanDirectory(path.resolve(_options.source))
}




const jobsToDo = []
let numJobsDone = 0

function processBatchJobs(batch: number) {
  let limit = workers.filter(worker => worker.isFree()).length
  while (limit-- > 0) {
    const job = jobsToDo.shift()
    processJob(job)
  }
}

function processJob(job) {

}

async function scanDirectory(dir: string): Promise<string[]> {
  const dirs = await fs.readdir(dir, { withFileTypes: true })
  console.log(dirs);
  return []
}
