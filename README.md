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
- `vehicle/:vehicleId/maxSpeed?startTime=<startTime>&endTime=<startTime>` - GET daily max speed of vehicle id in given datetime interval. Datetime format example: `2024-07-18T23:20:38.051797Z`.
- `vehicle/:vehicleId/avgSpeed?startTime=<startTime>&endTime=<startTime>` - GET daily average speed of vehicle id in given datetime interval. Datetime format example: `2024-07-18T23:20:38.051797Z`.

