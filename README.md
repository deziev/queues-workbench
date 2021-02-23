# TS job scheduler

## Prerequisites
* NodeJS 10|12

## Installation
Install dependencies and compile typescript:
```
npm install
npm run compile
```

## Usage
To run server:
```
npm run server
```

To run queues in client:
```
npm run client
```

Client script run example:
```js
[STORE] error: ID: 1 | 1 | Error: connect ECONNREFUSED 127.0.0.1:8080
[STORE] error: ID: 1 | 2 | Error: connect ECONNREFUSED 127.0.0.1:8080
[STORE] error: ID: 2 | 1 | Error: connect ECONNREFUSED 127.0.0.1:8080
[STORE] error: ID: 1 | 3 | Error: connect ECONNREFUSED 127.0.0.1:8080
[STORE] error: ID: 2 | 2 | Error: connect ECONNREFUSED 127.0.0.1:8080
[STORE] success: ID: 3 | 1 | OK
[STORE] success: ID: 1 | 4 | OK
[STORE] error: ID: 5 | 1 | Error: Invalid status code: 500
[STORE] success: ID: 5 | 2 | OK
[STORE] success: ID: 6 | 1 | OK
[STORE] success: ID: 7 | 1 | OK
[STORE] success: ID: 8 | 1 | OK
[STORE] error: ID: 2 | 3 | Error: HTTP: Request timeout
[STORE] success: ID: 9 | 1 | OK
[STORE] error: ID: 4 | 1 | Error: HTTP: Request timeout
[STORE] success: ID: 10 | 1 | OK
[STORE] error: ID: 2 | 4 | Error: Invalid status code: 500
[STORE] error: ID: 11 | 1 | Error: Invalid status code: 500
[STORE] success: ID: 11 | 2 | OK
[STORE] success: ID: 12 | 1 | OK
[STORE] success: ID: 13 | 1 | OK
[STORE] success: ID: 15 | 1 | OK
[STORE] success: ID: 2 | 5 | OK
[STORE] error: ID: 4 | 2 | Error: HTTP: Request timeout
[STORE] error: ID: 16 | 1 | Error: Invalid status code: 500
[STORE] success: ID: 16 | 2 | OK
[STORE] success: ID: 4 | 3 | OK
[STORE] success: ID: 17 | 1 | OK
```