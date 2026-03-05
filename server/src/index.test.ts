import request from 'supertest';
import { describe, it, expect, beforeAll } from 'vitest';
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { generateRound } from '@shared/logic';

// start up a small server instance for tests
let app: express.Express;
let server: http.Server;

beforeAll(() => {
  app = express();
  const io = new SocketIOServer(server as any, {});
  app.get('/round', (req, res) => {
    res.json(generateRound());
  });
  server = http.createServer(app);
});

describe('server endpoints', () => {
  it('returns a round object', async () => {
    const res = await request(app).get('/round');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('grid');
    expect(res.body.grid.length).toBe(16);
    expect(res.body).toHaveProperty('target');
  });
});
