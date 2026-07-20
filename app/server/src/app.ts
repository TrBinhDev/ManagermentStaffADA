import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { notFoundHandler } from './middlewares/notFound.middleware.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { departmentRouter } from './modules/department/department.routes.js';
import { positionRouter } from './modules/position/position.routes.js';
import { employeeRouter } from './modules/employee/employee.routes.js';
import { employeeProfileRouter } from './modules/employee-profile/employee-profile.routes.js';
import { managerAccountRouter } from './modules/manager-account/manager-account.routes.js';
import { positionHistoryRouter } from './modules/position-history/position-history.routes.js';
import { employmentPeriodRouter } from './modules/employment-period/employment-period.routes.js';
import { positionSalaryRateRouter } from './modules/position-salary-rate/position-salary-rate.routes.js';
import { shiftRouter } from './modules/shift/shift.routes.js';
import { shiftPositionCapacityRouter } from './modules/shift-position-capacity/shift-position-capacity.routes.js';
import { workScheduleRouter, workScheduleSummaryRouter } from './modules/work-schedule/work-schedule.routes.js';

export const app = express();

app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/auth', authRouter);
app.use('/departments', departmentRouter);
app.use('/positions', positionRouter);
app.use('/employees', employeeRouter);
app.use('/employees', employeeProfileRouter);
app.use('/manager-accounts', managerAccountRouter);
app.use('/employees', positionHistoryRouter);
app.use('/employees', employmentPeriodRouter);
app.use('/positions', positionSalaryRateRouter);
app.use('/shifts', shiftRouter);
app.use('/shifts', shiftPositionCapacityRouter);
app.use('/employees', workScheduleRouter);
app.use('/work-schedule', workScheduleSummaryRouter);

app.use(notFoundHandler);
app.use(errorHandler);