import { WebSocketTransport, Multiplexer, encodeObject, decodeObject } from 'omnistreams';
const http = require('https');
const process = require('process');
const WebSocket = require('ws');

(async() => {

  if (process.argv.length < 3) {
    console.log(`Usage: ${process.argv[1]} FIBRIDGE_SERVER_ADDR`);
    process.exit(1);
  }

  const addr = process.argv[2];

  const ws = new WebSocket(`wss://${addr}/omnistreams`);
  ws.onerror = () => {
    process.exit(1);
  };

  const transport = new WebSocketTransport(ws);
  const mux = new Multiplexer(transport);

  const promise = new Promise(async (resolve, reject) => {
    let id = null;

    mux.onControlMessage((rawMessage) => {
      const message = decodeObject(rawMessage)

      const rpc = message;
      switch (rpc.method) {
        case 'setId':
          id = rpc.params;

          http.get(`https://${addr}/${id}/dummy_filename.txt`, (res) => {

              let allData = '';

              res.on('data', (data) => {
                allData += data;
              });

              res.on('end', () => {
                if (allData === "GATTACA") {
                  resolve();
                }
                else {
                  reject();
                }
              });

            });
          break;
        case 'getFile':

          if (!id) return;

          const enc = new TextEncoder();
          const buf = enc.encode("GATTACA");

          const rpcResponse = {
            jsonrpc: '2.0',
            result: {
              //size: fullFile.size,
              size: buf.length,
              //range: rpc.params.range,
            },
            id: rpc.id,
          };

          const sendStream = mux.createConduit(encodeObject(rpcResponse));
          sendStream.write(buf);
          sendStream.end();

          break;
      }
    });
  });

  try {
    await promise;
    ws.close();
    process.exit(0);
  }
  catch (e) {
    process.exit(1);
  }
})();
