import express from 'express';
import dotenv from 'dotenv';
import { DIMO } from '@dimo-network/dimo-node-sdk';

// setup env
dotenv.config();

// start app
const app = express();
const port = 3000;
app.use(express.json());

// Initialize DIMO client
const dimo = new DIMO('Production');

// Auth token

let authHeaders = null;
let authExpiry = null;

function isAuthValid() {
  if (!authHeaders || !authExpiry) return false;
  return Date.now() < authExpiry;
}

async function getAuthToken() {
  try {
    if (isAuthValid()) {
      console.log("Token valid");
      return authHeaders;
    }
    console.log("Get new token");
    const result = await dimo.auth.getToken({
      client_id: process.env.client_id,
      domain: process.env.redirect_uri,
      private_key: process.env.private_key,
    });
    console.log(result);
    authHeaders = result;
    authExpiry = Date.now() + 24*60*60*1000; // temp expire interval - 24h
    return result;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return error;
  }
}

// Middleware

async function ensureAuthToken(req, res, next) {
  const result = await getAuthToken();
  if (result instanceof Error) {
    res.status(500).json({ error: 'Unable to authenticate', details: result.message });
  } else {
    req.user = result;
    return next()
  }
}

async function ensureVehiclePrivilege(req, res, next) {
  const auth = await getAuthToken();
  if (auth instanceof Error) {
    res.status(500).json({ error: 'Unable to authenticate', details: auth.message });
    return;
  }
  const vehicleId = parseInt(req.params.vehicleId);
  console.log(vehicleId);
  try {
    const result = await dimo.tokenexchange.exchange({
      ...auth,
      privileges: [1,4,6],
      tokenId: vehicleId
    });
    console.log("Token exchange result:", result);
    req.user = result;
    return next();
  } catch (error) {
    console.error('Error during token exchange:', error);
    res.status(500).json({ error: 'Error during token exchange', details: error.message });
  }
}

// APIs

// get token
app.get('/authToken', ensureAuthToken, async (req, res) => {
  res.status(200).json(req.user);
});

// get user
app.get('/user', ensureAuthToken, async (req, res) => {
  try {
    const userInfo = await dimo.user.get(req.user);
    res.json(userInfo);
  } catch (error) {
    console.error('Error get user:', error);
    res.status(500).json({ error: 'Failed to get user', details: error.message });
  }
});

// get list device makes
app.get('/deviceMakes', ensureAuthToken, async (req, res) => {
  try {
    const response = await dimo.devicedefinitions.listDeviceMakes();
    res.json(response);
  } catch (error) {
    console.error('Error get device makes:', error);
    res.status(500).json({ error: 'Failed to get device makes', details: error.message });
  }
});

// get user vehicles
app.get('/vehicles', ensureAuthToken, async (req, res) => {
  const privileged = process.env.client_id;
  const query = `{
    vehicles(filterBy: {privileged: "${privileged}"} first: 100) {
      totalCount
      nodes {
        tokenId
        owner
        imageURI
        definition {
          id
          make
          model
          year
        }
        aftermarketDevice {
          manufacturer {
            name
          }
        }
      }
    }
  }`;
  try {
    const response = await dimo.identity.query({query: query});
    res.json(response);
  } catch (error) {
    console.error('Error get vehicles:', error);
    res.status(500).json({ error: 'Failed to get vehicles', details: error.message });
  }
});

// get vehicle status by id
app.get('/vehicle/:vehicleId', ensureVehiclePrivilege, async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.vehicleId);
    const auth = req.user; // see ensureVehiclePrivilege
    const vehicleInfo = await dimo.devicedata.getVehicleStatus({...auth, tokenId: vehicleId});;
    res.json(vehicleInfo);
  } catch (error) {
    console.error('Error getting vehicle status:', error);
    res.status(500).json({ error: 'Error getting vehicle status', details: error.message });
  }
});

// get vehicle trips
app.get('/vehicle/:vehicleId/trips', ensureVehiclePrivilege, async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.vehicleId);
    const auth = req.user; // see ensureVehiclePrivilege
    const trips = await dimo.trips.list({...auth, tokenId: vehicleId});
    res.json(trips);
  } catch (error) {
    console.error('Error getting vehicle trips:', error);
    res.status(500).json({ error: 'Error getting vehicle trips', details: error.message });
  }
});

// get vehicle info (fuel, speed) in specific time interval per day
app.get('/vehicle/:vehicleId/info', ensureVehiclePrivilege, async (req, res) => {
  const vehicleId = parseInt(req.params.vehicleId);
  const startTime = req.query.startTime;
  const endTime = req.query.endTime;
  const auth = req.user; // see ensureVehiclePrivilege
  const result = await vehicleInfo(auth, vehicleId, startTime, endTime);
  if (result instanceof Error) {
    res.status(500).json({ error: 'Failed to get daily speed', details: result.message });
  } else {
    res.json(result);
  }
});

// Helpers

async function vehicleInfo(auth, vehicleId, startTime, endTime) {
  const privileged = process.env.client_id;
  const query = `{
    signals(
      tokenId: ${vehicleId},
      from: "${startTime}", to: "${endTime}", 
      interval: "24h" 
      ) 
    {
      timestamp
      maxFuelPercent: powertrainFuelSystemRelativeLevel(agg: MAX)
      avgFuelPercent: powertrainFuelSystemRelativeLevel(agg: AVG)
      maxSpeed: speed(agg: MAX)
      avgSpeed: speed(agg: AVG)
    }
  }`;
  try {
    const response = await dimo.telemetry.query({...auth, query: query});
    return response;
  } catch (error) {
    console.error('Error get daily speed:', error);
    return error;
  }
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});