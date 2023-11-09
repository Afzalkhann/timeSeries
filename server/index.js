const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const crypto = require('crypto');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const originalKey = 'your-secret-key-with-32-characters'; // Replace with a 32-byte key
const encryptionKey = originalKey.slice(0, 32); // Replace with a 32-byte key

// Connect to MongoDB
const mongoURI = 'mongodb://localhost:27017/timeseriesdb';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Define mongoose schema and model (adjust the schema according to your data structure)
const TimeSeriesSchema = new mongoose.Schema({
  name: String,
  origin: String,
  destination: String,
  secret_key: String,
  timestamp: Date,
});

const TimeSeriesModel = mongoose.model('TimeSeries', TimeSeriesSchema);

app.post('/api/save', async (req, res) => {
  try {
    const { encryptedMessage, iv } = req.body;

    const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, Buffer.from(iv, 'hex'));
    let decryptedData = decipher.update(encryptedMessage, 'hex', 'utf-8');
    decryptedData += decipher.final('utf-8');

    // Validate and save decryptedData to the database
    // ...
    const parsedData = JSON.parse(decryptedData);
    if (!parsedData || !parsedData.name || !parsedData.origin || !parsedData.destination || !parsedData.secret_key) {
      console.error('Invalid or incomplete data:', parsedData);
      return res.status(400).json({ error: 'Invalid Data' });
    }
    const timeSeriesData = new TimeSeriesModel(parsedData);
    await timeSeriesData.save();

    console.log('Data saved successfully:', timeSeriesData);

    console.log('Data received and processed successfully',decryptedData);



    return res.status(200).json({ message: 'Data processed successfully' });
  } catch (error) {
    console.error('Error processing data:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
