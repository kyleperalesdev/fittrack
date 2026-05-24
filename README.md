# FitTrack — Fitness & Mesocycle Planner

## Prerequisites
- Node.js 20+
- MongoDB running locally (`mongod`) or a MongoDB Atlas connection string

## First-time setup

### 1. Configure the server
Copy and edit the server environment file:
```
server/.env
```
Update `MONGO_URI`, `JWT_SECRET`, and `INVITE_CODE` as needed.

### 2. Install all dependencies
```bash
npm run install:all
```

### 3. Seed the database (run once)
This creates the invite code and loads the exercise library (~65 exercises).
```bash
npm run seed
```

### 4. Start the app (dev mode)
```bash
npm run dev
```
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## Registration
- Go to http://localhost:5173/register
- Use invite code: `FITTRACK2024` (or whatever you set in `server/.env`)
- Create accounts for yourself and your wife separately

## Mesocycle Builder
1. Click **+ New Mesocycle**
2. Step 1 — Pick a name, duration (4–6 weeks), and split type
3. Step 2 — Drag exercises from the left sidebar into day columns
4. Adjust sets/reps/RPE inline on each exercise card
5. Toggle rest days with the ⏸ button on each column header
6. Click **Create Mesocycle** to save

## Split types available
| Split | Days |
|---|---|
| Push / Pull / Legs | Push, Pull, Legs, Rest, Push, Pull, Legs |
| Upper / Lower | Upper, Lower, Rest, Upper, Lower, Rest, Rest |
| Full Body | Full, Rest, Full, Rest, Full, Rest, Rest |
| Bro Split | Chest, Back, Shoulders, Arms, Legs, Rest, Rest |
| Custom | Fully configurable |

## Changing the invite code
Edit `INVITE_CODE` in `server/.env` and re-run `npm run seed`.
