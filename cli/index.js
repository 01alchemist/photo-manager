#!/usr/bin/env node
const minimist = require("minimist")
const { main } = require("../dist/index")

const options = minimist(process.argv.slice(2))
main(options)
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1)
  })
