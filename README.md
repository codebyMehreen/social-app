# Circle — Social Store (Sign Up, Sign In, Add Friends, Chat)

A full-stack social app: users sign up, sign in, search for other people,
send/accept friend requests, view profiles, and message their friends.

- **Frontend:** Next.js (React) — `frontend/`
- **Backend:** FastAPI (Python) — `backend/`
- **Database:** SQLite (zero setup — a local file, upgrade to Postgres later)
- **Auth:** JWT tokens with bcrypt-hashed passwords

## Features

- Sign up / log in with secure password hashing (bcrypt) and JWT auth
- Search for other users by name
- Send, accept, and reject friend requests
- View any user's profile page with the right action (Add / Accept / Remove / Block)
- Edit your own profile (name, bio) via Settings
- Remove friends, block/unblock users
- Real-time-feel chat between friends (polling every 3 seconds)
- Tabbed navigation: Friends / Requests / Find People / Messages
- Fully responsive design

## Project structure

social-app/
├── backend/
│ ├── app/
│ │ ├── main.py # FastAPI app entrypoint
│ │ ├── database.py # DB connection
│ │ ├── models.py # User, FriendRequest, Block, Message tables
│ │ ├── schemas.py # Request/response validation
│ │ ├── auth.py # Password hashing + JWT
│ │ └── routers/
│ │ ├── auth_router.py # signup, login, me, update profile
│ │ ├── friends_router.py # search, requests, profiles, block
│ │ └── messages_router.py # chat between friends
│ └── requirements.txt
├── frontend/
│ ├── app/
│ │ ├── layout.js
│ │ ├── globals.css
│ │ ├── page.js # redirects to /login or /dashboard
│ │ ├── components/NavBar.js # shared tab navigation
│ │ ├── lib/api.js # talks to the FastAPI backend
│ │ ├── signup/page.js
│ │ ├── login/page.js
│ │ ├── dashboard/page.js # hub with summary cards
│ │ ├── friends/page.js
│ │ ├── requests/page.js
│ │ ├── find/page.js
│ │ ├── profile/[id]/page.js
│ │ ├── settings/page.js
│ │ └── chat/
│ │ ├── page.js # conversation list
│ │ └── [id]/page.js # individual conversation
│ └── package.json
└── README.md

## How to run it

### 1. Start the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Check it's alive at `http://localhost:8000` — you should see `{"status": "ok", ...}`.
Interactive API docs are auto-generated at `http://localhost:8000/docs`.

### 2. Start the frontend (separate terminal)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` — it'll redirect you to `/login`.

### 3. Try it out

1. Sign up, create an account
2. Open an incognito window, sign up a second account
3. Search for the first user's name in Find People, send a friend request
4. Switch to the first account, accept the request under Requests
5. Both accounts now show each other under Friends — click Message to chat

## Security notes

- `backend/app/auth.py` has a placeholder `SECRET_KEY` — **change this** before deploying anywhere real, ideally loaded from an environment variable.
- Passwords are hashed with bcrypt — never stored in plain text.
- CORS is currently locked to `http://localhost:3000` — update this when deploying.

## Roadmap

**Next up**

- [ ] Avatar image upload
- [ ] Real-time chat via WebSockets (currently polling every 3s)
- [ ] Unread message indicators
- [ ] Email verification on signup
- [ ] Rate limiting on `/auth/login`
- [ ] Deploy live: frontend on Vercel, backend on Render or Railway
