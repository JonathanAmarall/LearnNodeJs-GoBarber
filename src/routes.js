import { Router } from 'express';

const routes = new Router();

routes.get('/', (req, res) => {
    return res.json({ message: 'Hello Jonathan Amaral!' });
});

export default routes;
