<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This table stores temporary student leave permissions:
     * - izin_pulang (permission to leave early - temporary, returns before end time)
     * - dispensasi (dispensation - similar to izin_pulang with set time)
     * - sakit (sick - full day, doesn't appear in attendance for all subjects)
     * - izin (permission - full day, doesn't appear in attendance for all subjects)
     */
    public function up(): void
    {
        Schema::create('student_leave_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('student_profiles')->cascadeOnDelete();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('granted_by')->constrained('users')->cascadeOnDelete(); // Teacher who granted
            $table->foreignId('schedule_id')->nullable()->constrained('schedule_items')->nullOnDelete(); // The schedule when permission was granted

            // Type of permission: 'izin_pulang' (leave early), 'dispensasi', 'sakit' (sick full day), 'izin' (permission full day)
            $table->enum('type', ['izin_pulang', 'dispensasi', 'sakit', 'izin'])->default('izin_pulang');

            $table->date('date'); // The date of permission
            $table->time('start_time'); // When the permission starts (usually lesson start time)
            $table->time('end_time')->nullable(); // When student should return (null = until end of school)

            $table->text('reason')->nullable();
            $table->string('attachment_path')->nullable(); // Supporting document

            // Status: 'active' = currently on leave, 'returned' = came back on time, 'expired' = didn't return (potential alpha)
            $table->enum('status', ['active', 'returned', 'expired', 'cancelled'])->default('active');

            $table->timestamp('returned_at')->nullable(); // When student actually returned
            $table->foreignId('returned_by')->nullable()->constrained('users')->nullOnDelete(); // Teacher who marked return

            $table->boolean('is_full_day')->default(false); // If true, student is izin/sakit for ALL subjects today

            $table->timestamps();

            // Indexes for performance
            $table->index(['student_id', 'date']);
            $table->index(['class_id', 'date']);
            $table->index(['date', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_leave_permissions');
    }
};
