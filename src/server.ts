import * as http from "http";
import { delay } from "./utils/timings";
import { PingData } from "./model/PingData";

const host = "localhost";
const port = 8080;

function getRandom(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

async function handleData(data: PingData) {
  const rnd = getRandom(0, 100);
  // console.log(rnd);
  if (rnd > 0 && rnd <= 60) {
    console.log(`[DATA] ${JSON.stringify(data)}`);
    return;
  }
  if (rnd > 60 && rnd <= 80) {
    throw new Error();
  }
  if (rnd > 80 && rnd <= 100) {
    while (true) {
      await delay(1);
    }
  }
}

function handleResponse(
  _req: http.IncomingMessage,
  res: http.ServerResponse,
  code: number,
  dataToSend?: string
) {
  // console.log(`[${new Date().toISOString()}] ${_req.method} ${_req.url} ${code}`);
  res.writeHead(code);
  res.end(dataToSend);
}

async function requestListener(
  request: http.IncomingMessage,
  response: http.ServerResponse
) {
  try {
    if (request.method === "POST" && request.url === "/data") {
      let body: any[] = [];
      request.on("data", (chunk) => {
        body.push(chunk);
      });
      request.on("end", async () => {
        try {
          const data = JSON.parse(Buffer.concat(body).toString());
          await handleData(data);
          handleResponse(request, response, 200, "OK");
        } catch (error) {
          // console.log(error);
          handleResponse(request, response, 500);
        }
      });
    } else {
      handleResponse(
        request,
        response,
        404,
        `Cannot ${request.method} ${request.url}`
      );
    }
  } catch (error) {
    // console.log(error);
    handleResponse(request, response, 500);
  }
}

const server = http.createServer(requestListener);
server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});
