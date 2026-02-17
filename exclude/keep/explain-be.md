# Backend Technical Explanation

## 1. System Flow & Architecture

The system follows a standard **Laravel MVC (Model-View-Controller)** architecture, adapted for API-first usage (serving a mobile/frontend app).

### Core Flows:

#### A. Attendance Flow (QR Code)
1.  **Teacher** generates a QR Code (or Token) for a specific Class Schedule.
2.  **Student** scans the QR Code via the mobile app.
3.  **System** validates:
    -   Is the token valid and active?
    -   Is the student in the correct class?
    -   Is the student within the valid radius (if geo-fencing is enabled)?
    -   Has the student already scanned?
4.  **Result:** Attendance record created (`status: present`).

#### B. Leave Permission Flow (New)
1.  **Student** requests leave (or Teacher initiates for them).
2.  **Teacher** grants "Izin Pulang" or "Dispensasi".
3.  **System** creates a `StudentLeavePermission` record (`status: active`).
4.  **Implication:** The student is technically "present" in class but externally "on leave".
5.  **Return:** When student returns, Teacher marks "Return". Status becomes `returned`.
6.  **Failure:** If time expires without return, system/teacher can mark as `expired` or `absent`.

## 2. Database Structure

The database is normalized to handle schools, classes, and schedules. Key relationships:

-   **Users:** Base table for Admin, Teacher, Student.
-   **Profiles:** `student_profiles`, `teacher_profiles` linked 1:1 to Users.
-   **Academic:** `classes`, `subjects`, `schedules` (link Class + Subject + Day + Time).
-   **Attendance:** `attendances` table links `student_id`, `schedule_id`, `date`, `status`.
-   **Leave Permissions:** `student_leave_permissions` (New) links `student_id`, `class_id`, `granted_by` (Teacher).

**Key Indexes:**
-   `attendances`: `[student_id, schedule_id]`, `[date, status]` for fast reporting.
-   `student_leave_permissions`: `[student_id, date]` to quickly check if a student is currently on leave.

## 3. Concurrent Data Testing & Race Conditions

### Scope of Concurrency
Concurrency issues arise when multiple actions happen simultaneously for the same resource.

#### Scenario 1: Double Scanning (Race Condition)
-   **Risk:** A student scans a QR code twice rapidly (milliseconds apart).
-   **Impact:** Two attendance records could be created for the same schedule.
-   **Prevention:**
    -   **Database Unique Constraint:** A unique index on `[student_id, schedule_id, date]` ensures the database rejects the second insert.
    -   **Atomic Locks:** Using Laravel's `Cache::lock()` during the scan process to prevent processing the same user ID simultaneously.

#### Scenario 2: Leave vs. Attendance (Logic Conflict)
-   **Risk:** A teacher marks a student "Absent" manually while another teacher grants "Leave Permission" at the same moment.
-   **Impact:** Conflicting status.
-   **Prevention:** Transactional Wrapping. Both operations should check the latest state within a `DB::transaction`.

### Memory Management
-   **N+1 Query Problem:** The system relies heavily on Relationships (`with(['user', 'class'])`). Ensure Eager Loading is used in Controllers (e.g., `Student::with('class')->get()`) to keep memory usage low and prevent 1000 queries for 1000 students.
-   **Large Exports:** For "Recap" features, chunking (`chunk()`) or Cursors (`cursor()`) must be used to avoid loading thousands of records into RAM at once.

## 4. Verification & Testing Plan

To verify the system stability:

1.  **Unit Tests:** Verify permission logic (can a student have 2 active leaves? No).
2.  **Load Testing:** Simulate 50 students scanning essentially continuously to test the Unique Constraint and Locking.
3.  **Integration Tests:** Verify the full flow of Grant Leave -> Mark Return -> check Dashboard stats update.
