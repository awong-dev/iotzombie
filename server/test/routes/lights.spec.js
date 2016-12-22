import bodyParser from 'body-parser';
import express from 'express';
import lights from '../../routes/lights';
import request from 'supertest';
import winston from 'winston';

// WARNING: Test order matters here. The API POSTs affect the next test. 
// While it'd be possible to reset the server state per test, it just
// didn't seem worth the effort to write that hook for now.
describe('lights router', () => {
  let app;
  const logger = winston;

  beforeEach(() => {
    app = express();
    app.use(bodyParser.json());

    const lightsRouter = lights({ logger });

    app.use('/lights', lightsRouter.ui);
    app.use('/api/lights', lightsRouter.api);
  });

  it('Rendering ui with no devices registered', (done) => {
    request(app)
      .get('/lights')
      .expect('Content-Type', /text\/html/)
      .expect(200)
      .expect(/No lights registered/, done);
  });

  it('/api/lights/device/:lightId', (done) => {
    request(app)
      .post('/api/lights/device/testLight')
      .send({
          name: 'test light',
          isOn: true,
          deviceSequence: '0',
        })
      .set('Accept', 'application/json')
      .expect('Content-Type', /application\/json/)
      .expect(200, done);
  });

  it('/api/lights/ui/:lightId', (done) => {
    request(app)
      .post('/api/lights/ui/testLight')
      .send({ isOn: true })
      .set('Accept', 'application/json')
      .expect('Content-Type', /application\/json/)
      .expect(200, done);
  });
});
