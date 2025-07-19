// src/routes/dashboard.routes.ts
import express from 'express';
import { isAdmin, verifyUser } from '../middlewares/auth.middleware';
import {  dashboardOverviewHandler } from '../controllers/adminDashboard.controller';

const router = express.Router();

router.use(verifyUser,isAdmin)

router.get('/overview', dashboardOverviewHandler);

export default router;
