import assert from 'node:assert';
import { HttpListingRepository } from '../services/listing/HttpListingRepository';
import { MockListingRepository } from '../services/listing/MockListingRepository';

async function main() {
  console.log('\n--- Coupons & Campaigns Integration Selftest ---\n');

  // Test 1: Mock repository methods
  const mockRepo = new MockListingRepository();
  const mockCoupons = await mockRepo.getActiveCoupons();
  assert(Array.isArray(mockCoupons), 'mock getActiveCoupons returns array');
  assert(mockCoupons.length > 0, 'mock has active coupons');
  console.log('ok  mock getActiveCoupons works (found:', mockCoupons.length, ')');

  const mockCampaigns = await mockRepo.getActiveCampaigns();
  assert(Array.isArray(mockCampaigns), 'mock getActiveCampaigns returns array');
  assert(mockCampaigns.length > 0, 'mock has active campaigns');
  console.log('ok  mock getActiveCampaigns works (found:', mockCampaigns.length, ')');

  const mockVal = await mockRepo.validateCoupon('INDIRIM20', 65000, 'PREMIUM');
  assert(mockVal.valid, 'mock validateCoupon INDIRIM20 is valid');
  assert.strictEqual(mockVal.discountAmountMinor, 13000, '20% of 65000 is 13000');
  assert.strictEqual(mockVal.finalAmountMinor, 52000, 'final amount is 52000');
  console.log('ok  mock validateCoupon calculates discount correctly');

  // Test 2: HTTP repository against local API
  const httpRepo = new HttpListingRepository('http://localhost:8080/api');
  try {
    const liveCoupons = await httpRepo.getActiveCoupons();
    assert(Array.isArray(liveCoupons), 'live getActiveCoupons returns array');
    console.log('ok  live GET /v1/coupons/active returned', liveCoupons.length, 'coupons');

    const liveCampaigns = await httpRepo.getActiveCampaigns();
    assert(Array.isArray(liveCampaigns), 'live getActiveCampaigns returns array');
    console.log('ok  live GET /v1/campaigns returned', liveCampaigns.length, 'campaigns');

    const liveVal = await httpRepo.validateCoupon('FIRSAT-1TVL', 65000, 'PREMIUM');
    assert(liveVal.valid, 'live validateCoupon FIRSAT-1TVL is valid');
    assert.strictEqual(liveVal.finalAmountMinor, 52000, 'final amount is 52000');
    console.log('ok  live POST /v1/coupons/validate verified discount (520 TL)');
  } catch (err) {
    console.error('API connection failed (is BE running?):', err);
    process.exit(1);
  }

  console.log('\nAll coupon & campaign tests passed successfully!\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
