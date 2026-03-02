# Faculty Management System (FMS)

This repo now includes:
- `backend`: Node.js + Express + MongoDB API
- `frontend`: React (Vite) web app

## 1. Backend setup

```powershell
cd backend
copy .env.example .env
npm install
npm run dev
```

Backend runs on `http://localhost:5000`.

## 2. Frontend setup

Open a second terminal:

```powershell
cd frontend
copy .env.example .env
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## 3. First use flow

1. Open `http://localhost:5173/register`
2. Create a user (choose `Admin` role to manage faculty)
3. Login and start adding faculty records
4. Admin can set/reset teacher password from faculty form
5. Teachers login using email + password
6. On first login/reset, teacher must change password in `Teacher Security`

## API endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/teacher-login`
- `POST /api/auth/teacher-change-password` (Teacher)
- `GET /api/faculty`
- `GET /api/faculty/:id`
- `POST /api/faculty` (Admin)
- `PUT /api/faculty/:id` (Admin)
- `PUT /api/faculty/:id/reset-password` (Admin)
- `DELETE /api/faculty/:id` (Admin)
- `POST /api/attendance/mark` (Admin)
- `GET /api/attendance` (Admin/Viewer/Teacher-own)
- `GET /api/attendance/summary` (Admin/Viewer/Teacher-own)
- `POST /api/leaves` (Teacher/Admin)
- `GET /api/leaves` (Teacher/Admin)
- `PUT /api/leaves/:id/status` (Admin approval)
- `GET /api/timetable`
- `POST /api/timetable` (Admin)
- `PUT /api/timetable/:id` (Admin)
- `DELETE /api/timetable/:id` (Admin)

## New modules included

- Attendance management with mark/update support
- Monthly attendance summary with attendance percentage
- Leave request workflow with admin approval/rejection
- Timetable/class assignment with faculty and classroom conflict detection

## Environment variables

Backend (`backend/.env`):
- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `CLIENT_ORIGIN`

Frontend (`frontend/.env`):
- `VITE_API_BASE_URL`
- `VITE_UPLOADS_BASE_URL`

## Production deploy checklist

1. Backend environment:
   - Set `PORT`, `MONGO_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`
   - Use a strong random `JWT_SECRET`
2. Frontend environment:
   - Set `VITE_API_BASE_URL` to your deployed backend URL (`https://.../api`)
   - Set `VITE_UPLOADS_BASE_URL` to your deployed backend URL
3. Build frontend:
   - `cd frontend && npm run build`
4. Start backend in production:
   - `cd backend && npm install --omit=dev && npm start`
5. Verify health endpoint:
   - `GET /api/health`
