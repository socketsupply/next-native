# SYNOPSIS

Next-Natve is a project that makes it possible to build native, cross-platform apps using the
Next.js framework.

> [!WARNING]
> This is pre-release software! It's only ready for early adopters and potential contributors.

# USAGE

## FROM CLI

Use as a command line tool to initialize an existing project as a native app.

```bash
$npm i @socketsupply/next-native -g
```

```
$next-native -h
next-natve v0.5.4 (97fa3f7c)

usage:
  next-natve [SUBCOMMAND] [options] [<project-dir>]
  next-natve [SUBCOMMAND] -h

subcommands:
  build                                build project
  list-devices                         get the list of connected devices
  init                                 create a new project (in the current directory)
  install-app                          install app to the device
  print-build-dir                      print build path to stdout
  run                                  run application
  env                                  print relavent environment variables
  setup                                install build dependencies

general options:
  -h, --help                           print help message
  --prefix                             print install path
  -v, --version                        print program version
```

## AS CODE

Use as a module inside to create a nextjs server inside a service worker. See [this example][0]
to get a quick demo up and running.

```js
import createServer from 'npm:@socketsupply/next-native'

const server = await createServer()
console.log('Created Server')

server.start().then(() => {
  console.log('Started Server')
})
```

[0]:test
