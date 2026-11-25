# CIS 3339 Homework 1 – Student Management System

A full-stack Student Management System migrated from plain HTML/JavaScript and a JSON file to:

- **Frontend:** Vue 3 (Composition API, `<script setup>`), Vue Router, Pinia, built with Vite
- **Backend:** Node.js + Express 5 REST API
- **Database:** MongoDB Community Edition (local) via Mongoose

Features: add / search / view / delete students, add / list / delete courses, enroll students in courses, list a course's roster, remove a student from a course. Duplicate students, courses, and enrollments are rejected, and deleting a student or course also deletes its enrollments.

---

## Required software

| Software | Version |
| --- | --- |
| Node.js (includes npm) | **20.19+ or 22.12+** (required by Vite) |
| MongoDB Community Edition | 6.0 or newer, running locally on the default port **27017** |
| A modern web browser | Chrome, Edge, Firefox, or Safari |

No MongoDB Atlas, cloud service, username, or password is needed.

## Environment variables

The real configuration file is committed at **`backend/.env`**:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/cis3339_homework1
PORT=3000
```

| Variable | Purpose | Value used |
| --- | --- | --- |
| `MONGODB_URI` | Local MongoDB connection string | `mongodb://127.0.0.1:27017/cis3339_homework1` |
| `PORT` | Port for the Express server | `3000` |

The server always reads `backend/.env`, no matter which folder you start it from.

## 1. Start MongoDB Community Edition

MongoDB must be running before (or shortly after) the app starts. If it is not running yet, the server keeps retrying every 5 seconds and the UI shows a "database unavailable" banner until it connects.

- **Windows:** MongoDB is normally installed as a service and starts automatically. To start it manually, open an **Administrator** command prompt and run:
  ```bat
  net start MongoDB
  ```
- **macOS (Homebrew):**
  ```bash
  brew services start mongodb-community
  ```
- **Linux (systemd):**
  ```bash
  sudo systemctl start mongod
  ```
- **Any OS (manual):**
  ```bash
  mongod --dbpath /path/to/an/empty/data/folder
  ```

You do **not** need to create the database, collections, or indexes. On startup the app automatically creates the `cis3339_homework1` database, the `students`, `courses`, and `enrollments` collections, and all unique indexes. No setup, seed, migration, or import command exists or is needed.

## 2. Install, build, and start (production)

Run these from the **project root** (the folder containing this README):

```bash
npm install
npm run build
npm start
```

| Command | What it does |
| --- | --- |
| `npm install` | Installs the root package, then automatically runs `npm install` inside `backend/` and `frontend/` |
| `npm run build` | Builds the Vue production assets into `frontend/dist/` |
| `npm start` | Starts the Express server, which serves the API **and** the built Vue app |

Then open:

### 👉 http://localhost:3000

Refreshing any page (for example `http://localhost:3000/courses`) works; the server returns the Vue app for every client-side route.

> If you prefer to run the commands per folder: `cd backend && npm install`, `cd frontend && npm install && npm run build`, then `cd backend && npm start`.

### Development mode (optional)

Run the API and the Vite dev server with hot reload in two terminals:

```bash
npm run dev:backend    # Express on http://localhost:3000 (restarts on changes)
npm run dev:frontend   # Vite on http://localhost:5173 (proxies /api to port 3000)
```

---

## Project structure

```
.
├── package.json              # root scripts: install / build / start
├── backend/
│   ├── .env                  # committed local configuration (no secrets)
│   ├── server.js             # entry point: starts HTTP server, connects to MongoDB
│   └── src/
│       ├── app.js            # Express app: /api routes, static Vue build, history fallback
│       ├── config.js         # loads backend/.env
│       ├── db.js             # connection with retry + automatic collection/index creation
│       ├── middleware/errors.js   # 503 when DB is down, JSON 404, central error handler
│       ├── models/           # Mongoose schemas: Student, Course, Enrollment
│       ├── routes/           # students.js, courses.js, enrollments.js
│       └── utils/
├── frontend/
│   ├── index.html
│   ├── vite.config.js        # Vue plugin, @ alias, /api dev proxy
│   └── src/
│       ├── main.js           # creates app, installs Pinia and Vue Router
│       ├── App.vue           # layout: header, status banner, <RouterView>, toasts, dialog
│       ├── router/           # routes: /, /students, /courses, /enrollments, 404
│       ├── stores/           # Pinia: students, courses, enrollments, notifications, confirm, system
│       ├── services/api.js   # fetch wrapper for the REST API
│       ├── composables/useForm.js  # reusable form state + validation
│       ├── components/       # layout/, ui/, students/, courses/, enrollments/
│       ├── views/            # one view per route
│       └── assets/main.css
└── images/                   # reference screenshots from the assignment
```

## REST API

All responses are JSON. Errors have the shape `{ "error": "message", "details": { "field": "message" } }`.

| Method | Endpoint | Description | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/api/health` | Server and database status | 200 | 503 |
| GET | `/api/students?q=John` | All students, or search by name (partial, case-insensitive) or exact student ID | 200 | |
| GET | `/api/students/:studentId` | One student plus enrolled courses | 200 | 404 |
| POST | `/api/students` | Body `{ name, studentId, phone, zip }` | 201 | 400, 409 |
| DELETE | `/api/students/:studentId` | Delete student **and their enrollments** | 200 | 404 |
| GET | `/api/courses` | All courses with enrollment counts | 200 | |
| GET | `/api/courses/:courseId/students` | Course roster | 200 | 404 |
| POST | `/api/courses` | Body `{ courseId, name }` | 201 | 400, 409 |
| DELETE | `/api/courses/:courseId` | Delete course **and its enrollments** | 200 | 404 |
| GET | `/api/enrollments` | All enrollments (filters: `?courseId=`, `?studentId=`) | 200 | 404 |
| POST | `/api/enrollments` | Body `{ studentId, courseId }` | 201 | 400, 404, 409 |
| DELETE | `/api/enrollments/:id` | Remove one enrollment | 200 | 400, 404 |

Every `/api` route returns **503** with a helpful message while MongoDB is unreachable.

## Data model and integrity

| Collection | Fields | Rules |
| --- | --- | --- |
| `students` | `name`, `studentId`, `phone`, `zip`, timestamps | all required; `studentId` 1–10 digits, **unique index**; phone 7–15 digits; ZIP `12345` or `12345-6789` |
| `courses` | `courseId`, `name`, timestamps | both required; `courseId` normalized (`cis3339` → `CIS 3339`), **unique index** |
| `enrollments` | `student` (ObjectId → students), `course` (ObjectId → courses), timestamps | **unique compound index** on `{ student, course }`; index on `course` |

- An enrollment is created only after both the student and the course are found (otherwise 404). If either is deleted while the request is running, the new enrollment is rolled back.
- Deleting a student runs `Enrollment.deleteMany({ student })`; deleting a course runs `Enrollment.deleteMany({ course })`.
- Duplicates are checked before saving (clear 409 message) **and** blocked by MongoDB unique indexes, so concurrent requests cannot create duplicates either.

## How the frontend uses Vue 3

- Every component uses `<script setup>` (Composition API); no Options API.
- **Vue Router** (HTML5 history mode) provides the Dashboard, Students, Courses, and Enrollments views plus a 404 page. The selected roster course is kept in the URL (`/enrollments?course=CIS%203339`), so a refresh keeps it.
- **Pinia** setup stores hold state shared across views: students and courses (used by their own views, the enrollment dropdowns, and the dashboard), enrollments/rosters, toast notifications, the confirmation dialog, and database status.
- `ref`, `reactive`, `computed`, `watch`, `onMounted`, `defineModel`, and a `useForm` composable handle state, validation, and events.
- Accessibility: labelled controls, `aria-invalid` / `aria-describedby` error messages, live regions for toasts and status, a native `<dialog>` for confirmations, skip link, focus management on navigation, visible focus outlines, and keyboard-friendly navigation. Tables collapse into cards on small screens.

## Testing checklist (matches the assignment)

1. **Students:** add John / 1001 / 555-1234 / 77001 → search "John" → add Jane / 1002 / 555-5678 / 77002 → add another student with ID 1001 (rejected: "A student with ID 1001 already exists.") → delete John.
2. **Courses:** add `CIS 3339` Enterprise Applications Development and `CIS 3368` Advanced Object-Oriented Programming → both listed → add `CIS 3339` again (rejected) → delete a course; the confirmation and success message show how many enrollments were removed.
3. **Enrollments:** enroll a student in a course → repeat the same enrollment (rejected) → enroll a second student → the roster shows both → delete a student and the roster/counts update.
4. **Persistence:** stop the server (`Ctrl+C`), run `npm start` again, refresh – data is still there. Inspect with `mongosh`:
   ```bash
   mongosh cis3339_homework1 --eval "db.students.find(); db.courses.find(); db.enrollments.find()"
   ```

## Troubleshooting

- **Yellow "database unavailable" banner / 503 errors:** MongoDB is not running. Start it (see step 1); the app reconnects automatically.
- **"Port 3000 is already in use":** stop the other process or change `PORT` in `backend/.env`.
- **"Frontend not built" page:** run `npm run build`, then `npm start`.
- **Vite error about the Node version:** upgrade Node.js to 20.19+ or 22.12+.
