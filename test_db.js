const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.ovtytmezwqybgzklemqs:%40shelfsense-in@aws-1-ap-south-1.pooler.supabase.com:5432/postgres'
});
client.connect()
  .then(() => { console.log('Connected successfully!'); client.end(); })
  .catch(err => { console.error('Connection error:', err); client.end(); });
