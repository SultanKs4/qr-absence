# Backend Architecture & System Explanation

This document provides a comprehensive overview of the `qr-absence` backend system, detailing its structure, data flow, concurrency handling, and memory management strategies.
It has been verified against the actual codebase as of **February 2026**.

---

## 1. System & Structure

The backend is built on **Laravel 12** and follows a standard **MVC (Model-View-Controller)** architecture, enhanced with Service layers for specific integrations.

### Core Components
-   **Models (`app/Models`)**: Represent database tables (e.g., `Attendance`, `StudentProfile`, `Schedule`).
-   **Controllers (`app/Http/Controllers`)**: Handle incoming HTTP requests and return JSON responses.
-   **Services (`app/Services`)**: Encapsulate complex external logic (e.g., `WhatsAppService`).
-   **API Resources (`app/Http/Resources`)**: Transform models into simplified JSON formats for the frontend/mobile app.

### Key Directories
-   `routes/api.php`: Defines all API endpoints and middleware groups.
-   `database/migrations`: Defines the database schema and integrity constraints.
-   `tests/Feature`: Contains automated tests to verify logic and architecture.

### Authentication & Roles
-   **Sanctum**: Used for token-based authentication (Mobile & Web).
-   **Middleware**:
    -   `auth:sanctum`: Ensures user is logged in.
    -   `role:admin,teacher,student`: Restricts access based on user type.
    -   `activity`: Logs user activity (custom middleware).

---

## 2. Request Flow

A typical request (e.g., **Scanning a QR Code**) follows this path:

1.  **Route Definition** (`routes/api.php`):
    -   The request hits `POST /api/attendance/scan`.
    -   Middleware: `auth:sanctum`, `throttle:scan`, `role:admin,teacher,student`.
2.  **Controller** (`AttendanceController::scan`):
    -   **Validation**: Checks if `token` exists and `device_id` is valid.
    -   **Authorization**: Checks if the user type matches the QR type (Student vs. Teacher).
    -   **Status Check**: Verifies if the student is currently on "Leave" (Izin/Sakit) to prevent conflicting attendance.
3.  **Logic & Transaction**:
    -   Opens a **Database Transaction**.
    -   Acquires an **Atomic Lock** (Cache-based) to prevent race conditions.
    -   Checks for existing attendance (Idempotency).
    -   Creates the `Attendance` record.
4.  **Response**:
    -   Returns a JSON object with the attendance details (HTTP 200).

---

## 3. Concurrent Data Testing & Race Conditions

**Concurrency** refers to multiple users (or the same user) trying to perform actions simultaneously. A critical scenario in this system is **Double Scanning**: a student scanning the same QR code twice within milliseconds.

### The Problem
If two requests reach the server at the exact same time:
1.  Request A checks "Is there attendance?" -> Answer: No.
2.  Request B checks "Is there attendance?" -> Answer: No.
3.  Request A creates attendance.
4.  Request B creates attendance (Duplicate!).

### The Solution (Implemented & Verified)
To prevent this, we use a multi-layered approach:

1.  **Atomic Locks (`Cache::lock`)**:
    -   Inside `AttendanceController::scan`, we implement a lock key: `attendance_scan_{user_id}_{schedule_id}_{date}`.
    -   Only **one** process can hold this lock at a time.
    -   If Request B comes while Request A is processing, it **waits** (up to 5 seconds) until Request A finishes.
    -   By the time Request B executes, Request A has committed the data, so Request B finds the record and returns "Presensi sudah tercatat".

2.  **Database Transactions (`DB::transaction`)**:
    -   Ensures that checking for existence and creating the record happen as a single unit of work from the database's perspective (though strictly speaking, application locks are the primary defense here due to MySQL nullable constraints).

3.  **Application Logic Check**:
    -   Before inserting, we explicitly query: `Attendance::where(...)->first()`.

### Verification Code
We logic-tested this protection in `tests/Feature/BackendArchitectureTest.php`.
```php
test('architecture: application logic rejects double scan', function () {
    // 1. First Scan
    $response1 = $this->actingAs($user)->postJson('/api/attendance/scan', ['token' => 'test-token']);
    $response1->assertStatus(200); // Created

    // 2. Second Scan (Simulated retry)
    $response2 = $this->actingAs($user)->postJson('/api/attendance/scan', ['token' => 'test-token']);
    $response2->assertStatus(200);
    $response2->assertJsonFragment(['message' => 'Presensi sudah tercatat']); // Rejected gracefully
});
```

---

## 4. Validations & Features

The system implements strict validations to ensure data integrity:

### QR & Schedule Validation
-   **Token Expiry**: Checks `expires_at` on the QR code.
-   **Role Match**: A student cannot scan a teacher's QR code.
-   **Leave Status**: If a student has an active "Izin" or "Sakit" permit for the day, they are **blocked** from scanning to avoid data inconsistency.

### Device Validation
-   **Device ID**: The system tracks `device_id` to ensure the student is using a registered device (if enforced). `last_used_at` is updated on every scan.

### Attendance Status Logic
-   **Grace Period**: The system compares the `scan_time` vs `schedule_start_time`.
    -   If `scan_time > start_time + grace_period` (default 15 mins), status is **`late`**.
    -   Otherwise, status is **`present`**.

---

## 5. Memory Management

Efficient memory usage is crucial for backend performance, especially when dealing with thousands of students.

### Strategies Used
1.  **Pagination (`paginate()`)**:
    -   Endpoints like `/api/attendance/history` and `/api/teachers` **never** return all records at once.
    -   They use Laravel's `paginate()` to return small chunks (e.g., 15-50 records) per page.
    -   **Verification**: Verified in `BackendArchitectureTest`.

2.  **Chunking**:
    -   In bulk operations (like `AttendanceController::close`), we process students in batches (if necessary) or fetch only required fields (`pluck('id')`) to minimize memory footprint.

3.  **Eager Loading (`with()`)**:
    -   We use `with(['student', 'schedule'])` to prevent **N+1 Query Problems**. This loads all related data in **2 queries** instead of N+1 queries, significantly reducing database load and memory usage.

### Test Verification
```php
test('architecture: memory management checks (pagination)', function () {
    $response = $this->actingAs($user)->getJson('/api/teachers');
    $response->assertJsonStructure(['data', 'links', 'meta']); // Confirms pagination is active
});
```
