const mongoose = require('mongoose');

const connectSecondaryDB = () => {
  const connection = mongoose.createConnection(
    'mongodb+srv://partimejobyt:iDdIoTrkzYxxmGvK@cluster0.3drrccw.mongodb.net/Nl_Retails?retryWrites=true&w=majority&appName=Cluster0'
  );

  connection.on('connected', () => {
    console.log('✅ Secondary MongoDB Connected Successfully!');
  });

  connection.on('error', (err) => {
    console.error('❌ Secondary MongoDB Connection Error:', err);
  });

  connection.on('disconnected', () => {
    console.warn('⚠️ Secondary MongoDB Disconnected');
  });

  return connection;
};

module.exports = connectSecondaryDB;