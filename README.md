### Install dependencies

`npm install`

### Setup Environment

Create `.env` file and fill it similar to `.env.sample`.

### Start Server

`node --experimental-specifier-resolution=node --loader ts-node/esm index.mjs`

### Stop Server

Press `Contro+C` in terminal.

If you wasn't able to stop previous server and port is taken when try to start again:

`lsof -i :3000`

`kill -9 <pid>`

### Endpoints

- `/authToken` - GET auth token.
- `/user` - GET user info.
- `vehicles` - GET user vehicles (currently vehicles of privileged id).
- `vehicle/:vehicleId` - GET vehicle status by id.
- `vehicle/:vehicleId/trips` - GET vehicle trips by id.
- `vehicle/:vehicleId/info?startTime=<startTime>&endTime=<endTime>` - GET info (fuel, speed) of vehicle id in given datetime interval grouped by datetime interval. Example: `http://localhost:3000/vehicle/100387/info?startTime=2024-07-18T23:20:38.051797Z&endTime=2024-07-19T02:59:11.380939Z&interval=1s`. If `interval` is not specified then 24h is used.