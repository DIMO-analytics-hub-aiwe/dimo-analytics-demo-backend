- Install dependencies

`npm install`

- Setup Environment

Create `.env` file and fill it similar to `.env.sample`.

- Start Server

`node --experimental-specifier-resolution=node --loader ts-node/esm index.mjs`

- Stop Server

Press `Contro+C` in terminal.

If you wasn't able to stop previous server and port is taken when try to start again:

`lsof -i :3000`
`kill -9 <pid>`