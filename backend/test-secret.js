const config = require('./config/config');
const didService = require('./services/didService');

console.log('Testing GitHub Secret Configuration');
console.log('=====================================\n');

console.log('1. Checking environment variables...');
if (process.env.DID_API_KEY) {
  console.log('   SUCCESS: DID_API_KEY found in environment');
  console.log(`   Key length: ${process.env.DID_API_KEY.length} characters`);
} else {
  console.log('   FAIL: DID_API_KEY not found');
  process.exit(1);
}

console.log('\n2. Checking config module...');
if (config.didApiKey) {
  console.log('   SUCCESS: Config loaded API key');
  console.log(`   Port: ${config.port}`);
  console.log(`   Environment: ${config.nodeEnv}`);
} else {
  console.log('   FAIL: Config did not load API key');
  process.exit(1);
}

console.log('\n3. Testing D-ID API connection...');
didService.getCredits()
  .then(result => {
    if (result.success) {
      console.log('   SUCCESS: Connected to D-ID API');
      console.log('   Credits:', JSON.stringify(result.data, null, 2));
      console.log('\n=====================================');
      console.log('All tests passed! Backend is ready.');
      console.log('=====================================\n');
      process.exit(0);
    } else {
      console.log('   FAIL: D-ID API returned error');
      console.log('   Error:', result.error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.log('   FAIL: Exception occurred');
    console.log('   Error:', err.message);
    process.exit(1);
  });
