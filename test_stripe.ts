import Stripe from 'stripe';
import { config } from 'dotenv';
config();

async function testStripe() {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-06-20' as any
    });

    // Test 1: Get account info
    console.log('Testing Stripe API...');
    const account = await stripe.accounts.retrieve();
    console.log('✅ Account ID:', account.id);
    console.log('✅ Account Email:', account.email);
    console.log('✅ Business Profile:', account.business_profile?.name || 'Not set');
    
    // Test 2: List products
    const products = await stripe.products.list({ limit: 3 });
    console.log('✅ Products found:', products.data.length);
    products.data.forEach(p => {
      console.log(`  - ${p.name}: ${p.active ? 'Active' : 'Inactive'}`);
    });

    // Test 3: List prices
    const prices = await stripe.prices.list({ limit: 3 });
    console.log('✅ Prices configured:', prices.data.length);

    console.log('\n🎯 Stripe API is WORKING properly!');

  } catch (error: any) {
    console.error('❌ Stripe Error:', error.message);
    if (error.code === 'expired_api_key') {
      console.error('The API key has expired. Please update STRIPE_SECRET_KEY');
    }
  }
}

testStripe();
