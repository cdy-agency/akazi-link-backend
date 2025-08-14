Akazi Link Backend - API Models and Relationships (for Frontend Developers)

Overview
- This document summarizes the core backend data models, their relationships, and the primary REST endpoints you will use from the frontend.
- Tech stack: Express + Mongoose (MongoDB). Auth uses JWT. File uploads use rod-fileupload → Cloudinary.

Auth Basics
- Include Authorization: Bearer <token> for authenticated routes.
- Roles: employee, company, superadmin. Some routes are restricted by role and approval state.

User (Base Model)
- Fields: _id, email, password (hashed), role, image?, createdAt, updatedAt
- Discriminators: Employee, Company extend User with extra fields.

Company Model
- Inherits: email, password, role (company)
- Fields:
  - companyName: string (required)
  - location?: string
  - phoneNumber?: string
  - website?: string
  - logo?: FileInfo (uploaded via rod-fileupload)
  - about?: string
  - documents?: FileInfo[] (uploaded via rod-fileupload)
  - isApproved: boolean (admin approval) [derived status]
  - status: 'pending' | 'approved' | 'rejected' | 'disabled' | 'deleted'
  - isActive: boolean
  - rejectionReason?: string
  - disabledAt?: Date, deletedAt?: Date
  - profileCompletionStatus: 'incomplete' | 'pending_review' | 'complete'
  - profileCompletedAt?: Date
- FileInfo shape (saved in MongoDB):
  {
    url: string,
    public_id: string,
    format: string,
    size: number,
    name: string,
    type: string,
    time: string
  }

Employee Model
- Inherits: email, password, role (employee)
- Fields:
  - name: string (required)
  - dateOfBirth?: Date
  - phoneNumber?: string
  - jobPreferences?: string[]
  - about?: string
  - experience?: string
  - education?: string
  - profileImage?: string
  - skills?: string[]
  - documents?: string[]

Job Model
- Fields:
  - title: string (required)
  - description: string (required)
  - skills: string[]
  - image: string (Cloudinary URL saved from rod-fileupload)
  - experience?: string
  - employmentType: 'fulltime' | 'part-time' | 'internship' (required)
  - salary?: string
  - category: string
  - benefits?: string[]
  - companyId: ObjectId → Company

Application Model
- Fields:
  - jobId: ObjectId → Job
  - employeeId: ObjectId → Employee
  - skills?: string[]
  - experience?: string
  - appliedVia: 'normal' | 'whatsapp' | 'referral'
  - status: 'pending' | 'reviewed' | 'interview' | 'hired' | 'rejected'
  - notifications: [{ message, read, createdAt }]

WorkRequest Model
- Fields:
  - companyId: ObjectId → Company
  - employeeId: ObjectId → Employee
  - message?: string
  - status: 'pending' | 'accepted' | 'rejected'
  - notifications: [{ message, read, createdAt }]

Relationships
- User (base) → Employee, Company (discriminators)
- Company 1 - N Job (companyId on Job)
- Job 1 - N Application (jobId on Application)
- Employee 1 - N Application (employeeId on Application)
- Company 1 - N WorkRequest (companyId on WorkRequest)
- Employee 1 - N WorkRequest (employeeId on WorkRequest)

Key Endpoints (paths are prefixed with /api)

Auth
- POST /auth/register/employee
- POST /auth/register/company
  - Uses rod-fileupload with field "logo" to upload and attach req.body.logo (FileInfo)
- POST /auth/login
- PATCH /auth/company/complete (company can submit about + documents before approval)

Company (requires role=company; some actions require approval)
- GET /company/profile
- PATCH /company/profile
  - Update basic fields and optionally change password:
    - Only requires oldPassword if newPassword is provided
- PATCH /company/complete-profile
  - Accepts multipart/form-data with about, optional logo (File), documents (Files)
  - Sets profileCompletionStatus to 'pending_review'
- File operations (rod-fileupload):
  - POST  /company/upload/logo           (field: logo)        → saves req.body.logo (FileInfo) into company.logo
  - POST  /company/upload/documents      (field: documents)   → pushes FileInfo[] into company.documents
  - PATCH /company/update/logo           (field: logo)        → replaces company.logo
  - PATCH /company/update/documents      (field: documents)   → replaces company.documents entirely
  - DELETE /company/delete/logo
  - DELETE /company/delete/document/:index
- Jobs:
  - POST /company/job (field: image) → create job with image.url
  - GET  /company/jobs
  - GET  /company/applicants/:jobId
  - PATCH /company/applications/:applicationId/status
- Directory & requests:
  - GET  /company/employees
  - POST /company/work-requests

Admin (requires role=superadmin)
- POST  /admin/login
- PATCH /admin/update-password (field: image optional)
- GET   /admin/employees
- GET   /admin/companies
- Company account state:
  - PATCH /admin/company/:id/approve
  - PATCH /admin/company/:id/reject     (body: { rejectionReason })
  - PATCH /admin/company/:id/disable
  - PATCH /admin/company/:id/enable
  - DELETE /admin/company/:id/delete
- Company profile review flow:
  - GET   /admin/companies/pending-review
  - PATCH /admin/company/:id/approve-profile → sets isApproved=true, status=approved, profileCompletionStatus=complete
  - PATCH /admin/company/:id/reject-profile  → sets status=rejected, isActive=false, requires rejectionReason

Frontend Integration Notes
- File Uploads (rod-fileupload):
  - For single file: send multipart/form-data with field name matching backend route expectation (logo, image, etc.)
  - For multiple files: send multiple parts with same field name (documents)
  - After upload, backend stores FileInfo object(s) directly into the Company document.
- Company Profile Update:
  - Basic info via PATCH /company/profile (JSON)
  - Password change: include oldPassword and newPassword; omit both to skip change
  - Files via dedicated endpoints above
- Complete Profile flow:
  - Use PATCH /company/complete-profile with FormData (about, optional logo, optional documents)
  - Dashboard can check company.profileCompletionStatus and isApproved to gate features/banners

Common Response Shapes
- Most GET return { message, <resource> } where <resource> is company, employee, jobs, applicants, etc.
- File upload routes return { message, company } with updated company.

Error Handling
- Validation errors return 400 with message
- Auth/role errors return 401/403
- Server errors return 500 with message

Revision Tips
- If you send a plain string for logo, the Company.logo cast will fail. Always upload via the file routes or send the FileInfo object provided by rod-fileupload.
- When migrating existing data that has string logos, either backfill FileInfo or leave logo unset and re-upload.
