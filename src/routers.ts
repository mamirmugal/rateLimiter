import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Public');
});

router.get('/sale', (req, res) => {
  res.send('Sale!!!');
});

export default router;
