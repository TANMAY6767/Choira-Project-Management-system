# Project and Task Management API

A REST API for user accounts, projects, tasks, and per-user dashboard statistics. User and project records are stored in MySQL; tasks are stored in MongoDB with Mongoose.

## Technologies

- Node.js, Express, and ES modules
- MySQL (`mysql2`) for users and projects
- MongoDB and Mongoose for tasks
- bcrypt for password hashing and JSON Web Tokens for authentication

## Setup

**Requirements:** Node.js, a running MySQL server, and a MongoDB instance (local or hosted).

1. Install dependencies with `npm install`.
2. Create a MySQL database, for example `project_management`.
3. Copy `.env.example` to `.env` and set the MySQL connection values, `MONGODB_URI`, and a long random `JWT_SECRET`.
4. Start the API with `npm run dev` (or `node server.js`). The service creates the `users` and `projects` tables when it starts. Mongoose creates the task collection when first used.
5. The default port is `8000`; override it with `PORT`.

Do not commit `.env` or real credentials. The example file contains placeholders only.

## Authentication

Register or log in to receive a JWT. Send it on protected endpoints using the `Authorization: Bearer <token>` header. Each account can access only its own projects and tasks.

## API

All request and response bodies use JSON. Success and error responses have `success`, `data`, `message`, and `statusCode`; errors also include `errors`. Paginated task responses also include `pagination`.

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| GET | `/api/health` | Health check | No |
| POST | `/api/auth/register` | Create an account | No |
| POST | `/api/auth/login` | Log in | No |
| GET | `/api/auth/me` | Get the current profile | Yes |
| PUT | `/api/auth/profile` | Update name, email, or password | Yes |
| POST | `/api/projects` | Create a project | Yes |
| GET | `/api/projects` | List your projects | Yes |
| GET | `/api/projects/:id` | Get a project | Yes |
| PUT | `/api/projects/:id` | Update a project | Yes |
| DELETE | `/api/projects/:id` | Delete a project and its tasks | Yes |
| POST | `/api/tasks` | Create a task for one of your projects | Yes |
| GET | `/api/tasks` | List and filter your tasks | Yes |
| GET | `/api/tasks/:id` | Get a task | Yes |
| PUT | `/api/tasks/:id` | Update a task | Yes |
| DELETE | `/api/tasks/:id` | Delete a task | Yes |
| GET | `/api/dashboard` | Get your project and task counts | Yes |

### Example Requests

#### 1. Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Sam Lee",
  "email": "sam@example.com",
  "password": "change-this-password"
}
```

Example response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "Sam Lee",
      "email": "sam@example.com"
    },
    "token": "<jwt>"
  },
  "message": "Account created",
  "statusCode": 201
}
```

#### 2. Create a project

Use the returned JWT as a bearer token.

```http
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Website refresh",
  "description": "Plan and build the new site",
  "status": "active"
}
```

#### 3. Create a task

Use the project ID returned by the project creation endpoint.

```http
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Draft homepage",
  "projectId": 1,
  "priority": "high",
  "status": "todo"
}
```

#### 4. Filter and paginate tasks

```http
GET /api/tasks?page=1&limit=10&status=todo&priority=high&projectId=1
Authorization: Bearer <token>
```

Example paginated response:

```json
{
  "success": true,
  "data": [],
  "message": "Tasks loaded",
  "statusCode": 200,
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalRecords": 0,
    "totalPages": 0
  }
}
```

### Task and Project Values

**Task statuses:** `todo`, `in_progress`, `completed`

**Task priorities:** `low`, `medium`, `high`

**Project statuses:** `active`, `completed`, `archived`

Task pagination defaults to `page=1` and `limit=10`. The maximum limit is `100`.

### Dashboard Fields

`GET /api/dashboard` returns the following statistics:

- `totalProjects`
- `activeProjects`
- `completedProjects`
- `totalTasks`
- `pendingTasks`
- `completedTasks`
- `highPriorityTasks`

Project counts are queried from MySQL, while task counts are queried from MongoDB.

## Verification

Run `npm test` for the response contract tests.

The database-backed API smoke flow has also been exercised against MySQL and MongoDB.

For manual regression checks, use Postman, Thunder Client, or another HTTP client to test:

- Registration and login
- Authenticated profile operations
- Project and task CRUD operations
- Task filters and pagination
- Invalid inputs and IDs
- Missing or invalid bearer tokens