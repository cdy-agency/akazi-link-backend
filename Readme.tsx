import React from 'react';

/**
 * Readme.tsx
 * Developer-facing API documentation component for the Job-Link backend.
 *
 * How to use: import and render in your docs site or Storybook to view.
 */
export default function Readme() {
  return (
    <div style={{ fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, Apple Color Emoji, Segoe UI Emoji', lineHeight: 1.5, padding: 24, color: '#111827' }}>
      <h2>Job-Link Backend API Overview</h2>
      <p>
        This backend is a TypeScript Express + Mongoose API with JWT authentication and Swagger documentation.
        It exposes role-based endpoints for Employees, Companies, and a SuperAdmin.
      </p>

      <h3>Base URL</h3>
      <ul>
        <li><strong>Development</strong>: <code>http://localhost:5000</code> (default)</li>
        <li><strong>Swagger UI</strong>: <code>http://localhost:5000/api-docs</code></li>
      </ul>

      <h3>Environment</h3>
      <pre style={{ background: '#f9fafb', padding: 16, borderRadius: 8, overflowX: 'auto' }}>
        <code>{`PORT=5000
MONGO_URI=mongodb://localhost:27017/joblink
JWT_SECRET=change_me
SUPERADMIN_EMAIL=admin@joblink.com
SUPERADMIN_PASSWORD=admin123`}</code>
      </pre>
      <p>
        A default SuperAdmin user is seeded on startup using <code>SUPERADMIN_EMAIL</code> and <code>SUPERADMIN_PASSWORD</code>.
      </p>

      <h3>Auth Model</h3>
      <ul>
        <li><strong>JWT</strong>: bearer tokens, 1 hour expiry</li>
        <li><strong>Header</strong>: <code>Authorization: Bearer &lt;token&gt;</code></li>
        <li><strong>Roles</strong>: <code>employee</code>, <code>company</code>, <code>superadmin</code></li>
        <li><strong>Company approval</strong>: company routes additionally require <code>isApproved === true</code></li>
      </ul>

      <h3>Data Models (simplified)</h3>
      <pre style={{ background: '#f9fafb', padding: 16, borderRadius: 8, overflowX: 'auto' }}>
        <code>{`User {
  _id: string
  email: string
  password: string
  role: 'employee' | 'company' | 'superadmin'
  createdAt: string
  updatedAt: string
}

Employee extends User {
  name: string
  dateOfBirth?: string (ISO date)
  phoneNumber?: string
}

Company extends User {
  companyName: string
  location?: string
  phoneNumber?: string
  website?: string
  logo?: string (URL)
  isApproved: boolean
}

Job {
  _id: string
  title: string
  description: string
  skills: string[]
  experience?: string
  employmentType: 'fulltime' | 'part-time' | 'internship'
  salary?: string
  category: string
  companyId: string | { _id, companyName, logo }
  createdAt: string
  updatedAt: string
}

Application {
  _id: string
  jobId: string | Job
  employeeId: string | Employee
  skills: string[]
  experience?: string
  appliedVia: 'normal' | 'whatsapp' | 'referral'
  status: 'pending' | 'reviewed' | 'interview' | 'hired' | 'rejected'
  notifications: { message: string; read: boolean; createdAt: string }[]
  createdAt: string
  updatedAt: string
}`}</code>
      </pre>

      <h3>Global Error Shape</h3>
      <pre style={{ background: '#f9fafb', padding: 16, borderRadius: 8, overflowX: 'auto' }}>
        <code>{`HTTP 500
{
  "message": "An unexpected error occurred",
  "error": "<error message>"
}`}</code>
      </pre>

      <h3>Auth Endpoints</h3>
      <ul>
        <li>
          <strong>POST /api/auth/register/employee</strong> — Register employee
          <div>Body: <code>{`{ name, email, password, dateOfBirth?, phoneNumber? }`}</code></div>
          <div>201: <code>{`{ message, employee }`}</code></div>
        </li>
        <li>
          <strong>POST /api/auth/register/company</strong> — Register company (requires admin approval)
          <div>Body: <code>{`{ companyName, email, password, location?, phoneNumber?, website?, logo? }`}</code></div>
          <div>201: <code>{`{ message, company }`}</code> with <code>company.isApproved === false</code></div>
        </li>
        <li>
          <strong>POST /api/auth/login</strong> — Login (employee/company/superadmin)
          <div>Body: <code>{`{ email, password }`}</code></div>
          <div>200: <code>{`{ message, token, role, isApproved? }`}</code></div>
        </li>
      </ul>

      <h3>Employee Endpoints</h3>
      <p>Require: <code>Authorization: Bearer &lt;token&gt;</code> and role <code>employee</code>.</p>
      <ul>
        <li><strong>GET /api/employee/profile</strong> — Get own profile. 200: <code>{`{ message, employee }`}</code></li>
        <li><strong>GET /api/employee/jobs?category=</strong> — List jobs, optionally by category. 200: <code>{`{ message, jobs }`}</code></li>
        <li><strong>GET /api/employee/suggestions?category=</strong> — Job suggestions (same shape as jobs). 200: <code>{`{ message, jobs }`}</code></li>
        <li>
          <strong>POST /api/employee/apply/:jobId</strong> — Apply to a job
          <div>Body: <code>{`{ skills?: string[], experience?: string, appliedVia?: 'normal'|'whatsapp'|'referral' }`}</code></div>
          <div>201: <code>{`{ message, application }`}</code></div>
        </li>
        <li><strong>GET /api/employee/applications</strong> — List own applications (job populated with company info). 200: <code>{`{ message, applications }`}</code></li>
        <li><strong>GET /api/employee/notifications</strong> — Aggregated notifications from applications. 200: <code>{`{ message, notifications }`}</code></li>
      </ul>

      <h3>Company Endpoints</h3>
      <p>
        Require: <code>Authorization: Bearer &lt;token&gt;</code>, role <code>company</code>, and company must be approved
        (unapproved companies receive 403 on these routes).
      </p>
      <ul>
        <li><strong>GET /api/company/profile</strong> — Get company profile. 200: <code>{`{ message, company }`}</code></li>
        <li>
          <strong>PATCH /api/company/profile</strong> — Update profile
          <div>Body (allowed fields): <code>{`{ companyName?, location?, phoneNumber?, website?, logo? }`}</code></div>
          <div>200: <code>{`{ message, company }`}</code></div>
        </li>
        <li>
          <strong>POST /api/company/job</strong> — Post a new job
          <div>Body (required): <code>{`{ title, description, employmentType, category }`}</code>; optional: <code>{`skills?, experience?, salary?`}</code></div>
          <div>201: <code>{`{ message, job }`}</code></div>
        </li>
        <li><strong>GET /api/company/jobs</strong> — List company jobs. 200: <code>{`{ message, jobs }`}</code></li>
        <li><strong>GET /api/company/applicants/:jobId</strong> — Applicants for a job (includes employee details). 200: <code>{`{ message, applicants }`}</code></li>
      </ul>

      <h3>Admin Endpoints</h3>
      <ul>
        <li>
          <strong>POST /api/admin/login</strong> — Login as SuperAdmin
          <div>Body: <code>{`{ email, password }`}</code></div>
          <div>200: <code>{`{ message, token, role: 'superadmin' }`}</code></div>
        </li>
      </ul>
      <p>Require: <code>Authorization: Bearer &lt;token&gt;</code> with role <code>superadmin</code> for the endpoints below:</p>
      <ul>
        <li>
          <strong>PATCH /api/admin/update-password</strong>
          <div>Body: <code>{`{ currentPassword, newPassword }`}</code></div>
          <div>200: <code>{`{ message }`}</code></div>
        </li>
        <li><strong>GET /api/admin/employees</strong> — List all employees (password excluded). 200: <code>{`{ message, employees }`}</code></li>
        <li><strong>GET /api/admin/companies</strong> — List all companies (password excluded). 200: <code>{`{ message, companies }`}</code></li>
        <li><strong>PATCH /api/admin/company/:id/approve</strong> — Approve a company. 200: <code>{`{ message, company }`}</code></li>
      </ul>

      <h3>Typical Client Usage</h3>
      <pre style={{ background: '#f9fafb', padding: 16, borderRadius: 8, overflowX: 'auto' }}>
        <code>{`// Base config
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000';

// 1) Login
async function login(email: string, password: string) {
  const res = await fetch(
    
 `${'${BASE_URL}'}/api/auth/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }
  );
  if (!res.ok) throw new Error('Login failed');
  return res.json(); // { message, token, role, isApproved? }
}

// 2) Authenticated request (employee jobs)
async function getEmployeeJobs(token: string, category?: string) {
  const url = new URL(`${'${BASE_URL}'}/api/employee/jobs`);
  if (category) url.searchParams.set('category', category);

  const res = await fetch(url, {
    headers: { Authorization: 
 `Bearer ${'${token}'}` },
  });
  if (!res.ok) throw new Error('Failed to fetch jobs');
  return res.json(); // { message, jobs }
}

// 3) Company posts a job
async function postJob(token: string, payload: {
  title: string; description: string; employmentType: 'fulltime'|'part-time'|'internship'; category: string;
  skills?: string[]; experience?: string; salary?: string;
}) {
  const res = await fetch(
    
 `${'${BASE_URL}'}/api/company/job`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 
 `Bearer ${'${token}'}`,
      },
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) throw new Error('Failed to post job');
  return res.json(); // { message, job }
}`}</code>
      </pre>

      <h3>Notes for Frontend</h3>
      <ul>
        <li><strong>Swagger</strong>: For full request/response schemas, visit <code>/api-docs</code>.</li>
        <li><strong>Token expiry</strong>: tokens expire after 1 hour; refresh via login as needed.</li>
        <li><strong>Company gating</strong>: company users can log in immediately but cannot access company routes until approved.</li>
        <li><strong>Security</strong>: never store JWT in localStorage in hostile environments; consider HTTP-only cookie if applicable.</li>
        <li><strong>Pagination</strong>: list endpoints currently do not implement pagination; plan for full-array responses.</li>
      </ul>

      <h3>Repository Structure (relevant)</h3>
      <pre style={{ background: '#f9fafb', padding: 16, borderRadius: 8, overflowX: 'auto' }}>
        <code>{`src/
  app.ts                  // Express app, Swagger, route mounting
  routes/
    auth.routes.ts        // /api/auth
    employee.routes.ts    // /api/employee (auth: employee)
    company.routes.ts     // /api/company (auth: company + approved)
    admin.routes.ts       // /api/admin (auth: superadmin)
  controllers/            // Implementation + Swagger JSDoc
  models/                 // Mongoose models (User discriminator pattern)
  middlewares/
    authMiddleware.ts     // authenticateToken, authorizeRoles
    errorHandler.ts       // global error shape
  utils/
    authUtils.ts          // bcrypt + JWT helpers
    seed.ts               // seedSuperAdmin on startup
  types/
    models.ts             // exported TS interfaces
    express.d.ts          // Request.user typing
`}</code>
      </pre>

      <p style={{ marginTop: 24, color: '#6b7280' }}>
        For questions or additions, extend this component or the Swagger JSDoc blocks in controllers.
      </p>
    </div>
  );
}