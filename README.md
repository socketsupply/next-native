# SYNOPSIS

Next-Natve is a project that makes it possible to build native, cross-platform apps using the
Next.js framework.

> [!WARNING]
> This is pre-release software! It's only ready for early adopters and potential contributors.

# Usage

## CLI

Use as a command line tool to initialize an existing project as a native app.

```bash
npm i @socketsupply/next-native -g
```

## Module

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
