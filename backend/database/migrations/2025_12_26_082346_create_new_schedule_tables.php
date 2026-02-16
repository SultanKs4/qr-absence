<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Class Schedule (Header)
        Schema::create('class_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->integer('semester')->comment('1: Ganjil, 2: Genap'); // Or enum
            $table->year('year'); // e.g., 2025
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. Daily Schedule (Hari)
        Schema::create('daily_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_schedule_id')->constrained('class_schedules')->cascadeOnDelete();
            $table->enum('day', ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
            $table->timestamps();
        });

        // 3. Schedule Item (Detail Mapel)
        Schema::create('schedule_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_schedule_id')->constrained('daily_schedules')->cascadeOnDelete();
            $table->foreignId('subject_id')->nullable()->constrained('subjects')->nullOnDelete();
            $table->foreignId('teacher_id')->constrained('teacher_profiles')->cascadeOnDelete();
            $table->time('start_time');
            $table->time('end_time');
            $table->string('room')->nullable();
            $table->string('keterangan')->nullable(); // "Jam ke 1-3"
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedule_items');
        Schema::dropIfExists('daily_schedules');
        Schema::dropIfExists('class_schedules');
    }
};
