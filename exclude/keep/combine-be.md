# Backend Merge Report: `backend` vs `exclude/backend-mobile`

## Executive Summary
The `exclude/backend-mobile` directory appears to be a more advanced version of the application backend, specifically enhanced to support mobile application features and complex business logic regarding student attendance and leave permissions. The `backend` directory contains the base version but lacks these newer features.

**Recommendation:** Merge features from `exclude/backend-mobile` into `backend`.

## Feature Comparison

| Feature | `backend` | `exclude/backend-mobile` | Status |
| :--- | :--- | :--- | :--- |
| **Student Leave Permissions** | ❌ Not Implemented | ✅ Implemented (New Table, Controller, Routes) | **Critical Missing Feature** |
| **Teacher Schedule Detail** | ❌ Not Implemented | ✅ Implemented (Detailed views, student lists) | **Critical Missing Feature** |
| **Dashboard Logic** | ⚠️ Basic Hardcoded Times | ✅ Dynamic Times from Settings, "On Leave" stats | **Improvement** |
| **Attendance Reporting** | ⚠️ Basic Querying | ✅ Refined Querying (Date ranges, Relations) | **Improvement** |
| **Routes** | ⚠️ Standard Set | ✅ Extended Set (Leave management, Teacher specific) | **Update Required** |
| **Database Schema** | ⚠️ 28 Migrations | ✅ 29 Migrations (Includes `leave_permissions`) | **Migration Required** |

## Detailed Analysis

### 1. New Core Feature: Student Leave Permissions
The mobile backend introduces a robust system for managing:
- **Temporary Leave (Izin Pulang/Dispensasi):** Students leaving during school hours.
- **Full Day Absence (Sakit/Izin):** Managed via specific permissions rather than just generic attendance attendance.

**Key Components:**
- **Table:** `student_leave_permissions`
- **Controller:** `StudentLeavePermissionController`
- **Logic:** Tracks `start_time`, `end_time`, `status` (active, returned, expired).

### 2. Enhanced Teacher Tools
The mobile backend adds `TeacherScheduleDetailController` which allows teachers to:
- View detailed student lists per schedule.
- Grant leave permissions directly from the schedule view.
- Mark students as "returned" or "absent" if they don't return from leave.

### 3. Dashboard Optimizations
The `DashboardController` in the mobile version is superior:
- **Dynamic Config:** Fetches `school_start_time` and `school_end_time` from the database (`Settings` model) instead of hardcoding `07:00` - `15:00`.
- **New Metrics:** Counts `on_leave` students separately.
- **Context:** Returns `is_homeroom` status and class name.

## Deep Analysis & Diff Findings
A recursive comparison reveals that `exclude/backend-mobile` is **NOT** a strict superset. It appears to be a feature branch based on an older version of `backend`.

**Crucial Differences:**
1.  **Requests:** `backend/app/Http/Requests/UpdateStudentRequest.php` has Stricter Validation (`unique:users,email`) than the mobile version.
2.  **Resources:** `backend/app/Http/Resources/AttendanceResource.php` includes **Attachment** logic (Webta features) that is missing in the mobile version.
3.  **Seeders:** The mobile version has different seeders, including `SampleAttendanceSeeder`.

**Conclusion:** We cannot simply "replace" files. We must **cherry-pick** the new features (Leave Permissions, Teacher Schedule Detail) and **merge** them into the `backend`, preserving the newer fixes (Validation, Attachments) already present in `backend`.

## Merge Strategy

1.  **New Files (Safe to Copy):**
    - `app/Http/Controllers/StudentLeavePermissionController.php`
    - `app/Http/Controllers/TeacherScheduleDetailController.php`
    - `app/Models/StudentLeavePermission.php`
    - `database/migrations/2026_02_11_170800_create_student_leave_permissions_table.php`

2.  **Files to Merge (Requires Care):**
    - `app/Http/Controllers/AttendanceController.php`: *Add* the new `studentsAbsences` logic, but *keep* existing Webta methods.
    - `app/Http/Controllers/DashboardController.php`: *Integrate* the dynamic start/end time logic.
    - `routes/api.php`: *Append* the new routes; do *not* overwrite existing Webta routes.

3.  **Files to Ignore (Backend is better):**
    - `app/Http/Requests/*` (Backend has better validation).
    - `app/Http/Resources/*` (Backend has attachment support).
    - `app/Jobs/*` (Identical or Backend is newer).

4.  **Database Migration:**
    - Copy the new migration file.
    - Run `php artisan migrate`.
