import express from 'express';
import { DIMO } from '@dimo-network/dimo-node-sdk';

console.log(`Server running at http://localhost`);
const app = express();
const port = 3000;

app.use(express.json());

// Initialize DIMO client
const dimo = new DIMO('Production'); // Use 'Production' for production environment

// Authentication route using the 3-step process
app.post('/auth', async (req, res) => {
  const { client_id, domain, private_key } = req.body;

  try {
    // Step 1: Generate Challenge
    const challenge = await dimo.auth.generateChallenge({
      client_id: client_id,
      domain: domain,
      address: client_id
    });
    console.log(challenge);
    // Step 2: Sign Challenge
    const signature = await dimo.auth.signChallenge({
      message: challenge.challenge,
      private_key: private_key
    });
    console.log(signature);
    // Step 3: Submit Challenge
    const tokens = await dimo.auth.submitChallenge({
      client_id: client_id,
      domain: domain,
      state: challenge.state,
      signature: signature
    });
    console.log(tokens);
    // Return the access token
    res.json({ access_token: tokens.access_token });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(400).json({ error: 'Authentication failed', details: error.message });
  }
});

// Middleware to verify DIMO token (simplified for example purposes)
const verifyDimoToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token || !token.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Отсутствует или неверный токен' });
  }
  req.user = { headers: { "Authorization": token } };
  next();
};

// Protected route example
app.get('/protected', verifyDimoToken, async (req, res) => {
  try {
    // Example of using a protected endpoint
    const userInfo = await dimo.user.get(req.user);
    res.json({ message: 'Access granted', user: userInfo });
  } catch (error) {
    console.error('Error accessing protected route:', error);
    res.status(500).json({ error: 'Failed to access protected resource' });
  }
});

// New route for token exchange
app.post('/exchange', verifyDimoToken, async (req, res) => {
  const { vehicleTokenId } = req.body;
  const auth = req.user; // Assuming authentication data is stored in req.user
  console.log(auth);
  console.log(vehicleTokenId);
  try {
    const result = await dimo.tokenexchange.exchange({
      ...auth,
      privileges: [1,4,6],
      tokenId: vehicleTokenId
    });

    res.json({ message: 'Token exchange successful', result });
  } catch (error) {
    console.error('Error during token exchange:', error);
    res.status(500).json({ error: 'Error during token exchange', details: error.message });
  }
});

// Маршрут для получения информации о транспортном средстве
app.get('/vehicle/:vehicleId', verifyDimoToken, async (req, res) => {
  try {
    const vehicleId = req.params.vehicleId;
    const auth = req.user; // Assuming authentication data is stored in req.user
    console.log(auth);
    console.log(vehicleId);
    const vehicleInfo = await dimo.devicedata.getVehicleStatus({...req.user,  tokenId: vehicleId});;
    res.json({ message: 'Информация о транспортном средстве получена', vehicle: vehicleInfo });
  } catch (error) {
    console.error('Ошибка при получении информации о транспортном средстве:', error);
    res.status(500).json({ error: 'Ошибка при получении информации о транспортном средстве', details: error.message });
  }
});

// Маршрут для получения информации о поездках
app.get('/vehicle/:vehicleId/trips', verifyDimoToken, async (req, res) => {
  try {
    const vehicleId = req.params.vehicleId;
    const auth = req.user; // Assuming authentication data is stored in req.user
    console.log(auth);
    console.log(vehicleId);
    const trips = await dimo.trips.list({...req.user,  tokenId: vehicleId});
    res.json({ message: 'Информация о поездках получена', trips });
  } catch (error) {
    console.error('Ошибка при получении информации о поездках:', error);
    res.status(500).json({ error: 'Ошибка при получении информации о поездках', details: error.message });
  }
});

// Маршрут для получения текущего статуса транспортного средства
app.get('/vehicle/:vehicleId/status', verifyDimoToken, async (req, res) => {
  try {
    const vehicleId = req.params.vehicleId;
    const status = await dimo.vehicle.getStatus(req.user, vehicleId);
    res.json({ message: 'Текущий статус транспортного средства получен', status });
  } catch (error) {
    console.error('Ошибка при получении статуса транспортного средства:', error);
    res.status(500).json({ error: 'Ошибка при получении статуса транспортного средства', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});