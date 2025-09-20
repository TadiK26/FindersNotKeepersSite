const request = require('supertest');
const app = require('../src/app'); // import the app w/o starting the server

describe('GET /api/status', () => {
  it('should return a 200 status and a success message', async () => {
    const res = await request(app).get('/api/status');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Server API is active.');
  });
});