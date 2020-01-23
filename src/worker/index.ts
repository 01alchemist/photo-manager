
function readFile(file: string) {

}

function checkDuplicate(hash: string) {

}

function getContentHash(content: ArrayBuffer): string {
  return null
}

const path = require("path");
const chalk = require("chalk");
const fs = require("fs");
import { parentPort } from "worker_threads";
import { Commands, Events } from "../core";

let workerId = null;
let port = null;
let memory: SharedArrayBuffer

parentPort.on("message", async event => {
  try {

    switch (event.command) {
      case Commands.INIT:
        // console.log(`[worker-${event.id}]: ${event.command}`);
        workerId = event.id;
        port = event.data.port;
        memory = event.data.memory;
        port.postMessage({ id: workerId, event: Events.INITED });
        break;
      case Commands.RUN:
        // console.log(`[worker-${workerId}]: ${event.command}`);
        // fs.readFileSync()
        console.log(event.data.task);
        port.postMessage({ id: workerId, event: Events.FINISHED });
        break;
    }
  } catch (e) {
    console.error(e);
  }
});
