import express from 'express';
/* eslint new-cap: 0 */
const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
  res.render('index', { title: 'Express Application with MOST Web Framework Data Module' });
});

export default router;