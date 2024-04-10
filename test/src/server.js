import createServer from 'npm:@socketsupply/next-native'

const server = await createServer()
server.start().catch((err) => {
  console.error('Failed to start server', err)
})
