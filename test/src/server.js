import createServer from 'npm:@socketsupply/next-native'

const server = await createServer()
console.log('Created Server')

server.start().then(() => {
  console.log('Started Server')
})

