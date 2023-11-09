const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');

const originalKey = 'your-secret-key-with-32-characters'; // Replace with a 32-byte key
const encryptionKey = originalKey.slice(0, 32); // Replace with a 32-byte key

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const readDataFromFile = () => {
  try {
    const data = fs.readFileSync('data.json', 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data from file:', error.message);
    return null;
  }
};

const generateRandomData = (data) => {
  const { names, origins, destinations } = data;
  const randomData = {
    name: getRandomElement(names),
    origin: getRandomElement(origins),
    destination: getRandomElement(destinations),
  };
  randomData.secret_key = crypto.createHash('sha256').update(JSON.stringify(randomData)).digest('hex');
  return randomData;
};

const encryptMessage = async (data) => {
  const jsonData = JSON.stringify(data);
  const iv = crypto.randomBytes(16); // Generate a new IV for each message

  const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
  let encryptedMessage = cipher.update(jsonData, 'utf-8', 'hex');
  encryptedMessage += cipher.final('hex');

  return { encryptedMessage, iv: iv.toString('hex') };
};

const sendDataToServer = async () => {
  try {
    const data = readDataFromFile();
    if (!data) {
      console.error('Error reading data from file. Cannot send data to server.');
      return;
    }

    const randomData = generateRandomData(data);
    const { encryptedMessage, iv } = await encryptMessage(randomData);

    await axios.post('http://localhost:3000/api/save', {
      encryptedMessage: encryptedMessage,
      iv: iv,
    });

    console.log('Data sent to server successfully');
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
};

sendDataToServer();
