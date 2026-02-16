<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use App\Models\ScheduleItem;

class StudentLeavePermission extends Model
{
    protected $fillable = [
        'student_id',
        'class_id',
        'granted_by',
        'schedule_id',
        'type',
        'date',
        'start_time',
        'end_time',
        'reason',
        'attachment_path',
        'status',
        'returned_at',
        'returned_by',
        'is_full_day',
    ];

    protected $casts = [
        'date' => 'date',
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
        'returned_at' => 'datetime',
        'is_full_day' => 'boolean',
    ];

    protected $appends = ['attachment_url'];

    public function getAttachmentUrlAttribute(): ?string
    {
        if (! $this->attachment_path) {
            return null;
        }

        return \Illuminate\Support\Facades\Storage::disk('public')->url($this->attachment_path);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(StudentProfile::class, 'student_id');
    }

    public function classRoom(): BelongsTo
    {
        return $this->belongsTo(Classes::class, 'class_id');
    }

    public function granter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'granted_by');
    }

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(ScheduleItem::class, 'schedule_id');
    }

    public function returner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'returned_by');
    }

    /**
     * Check if the leave permission is currently active
     * (within the time range and not returned/expired)
     */
    public function isCurrentlyActive(): bool
    {
        if ($this->status !== 'active') {
            return false;
        }

        $now = now();
        $today = $now->toDateString();

        // Not same date
        if ($this->date->toDateString() !== $today) {
            return false;
        }

        $startTime = Carbon::parse($this->date->toDateString().' '.$this->start_time);

        // If end_time is set, check if current time is before end_time
        if ($this->end_time) {
            $endTime = Carbon::parse($this->date->toDateString().' '.$this->end_time);

            return $now->between($startTime, $endTime);
        }

        // No end_time means until end of school
        return $now->gte($startTime);
    }

    /**
     * Check if student should be hidden from attendance list for a specific schedule
     */
    public function shouldHideFromAttendance(ScheduleItem $schedule): bool
    {
        if ($this->status !== 'active') {
            return false;
        }

        // Full day sick/izin - hide from all schedules
        if ($this->is_full_day) {
            return true;
        }

        // For izin_pulang and dispensasi, check time overlap
        if (! $schedule->start_time || ! $schedule->end_time) {
            return false;
        }

        $permissionStart = Carbon::parse($this->start_time);
        $permissionEnd = $this->end_time
            ? Carbon::parse($this->end_time)
            : Carbon::parse('23:59:59'); // End of day if no end time

        $scheduleStart = Carbon::parse($schedule->start_time);
        $scheduleEnd = Carbon::parse($schedule->end_time);

        // Check if schedule time overlaps with permission time
        return $scheduleStart->lte($permissionEnd) && $scheduleEnd->gte($permissionStart);
    }

    /**
     * Mark student as returned
     */
    public function markReturned(int $userId): self
    {
        $this->update([
            'status' => 'returned',
            'returned_at' => now(),
            'returned_by' => $userId,
        ]);

        return $this;
    }

    /**
     * Mark as expired (student didn't return on time)
     */
    public function markExpired(): self
    {
        $this->update(['status' => 'expired']);

        return $this;
    }

    /**
     * Cancel the leave permission
     */
    public function cancel(): self
    {
        $this->update(['status' => 'cancelled']);

        return $this;
    }

    /**
     * Scope: Active permissions for today
     */
    public function scopeActiveToday($query)
    {
        return $query->where('date', now()->toDateString())
            ->where('status', 'active');
    }

    /**
     * Scope: Permissions for a specific class
     */
    public function scopeForClass($query, int $classId)
    {
        return $query->where('class_id', $classId);
    }

    /**
     * Scope: Full day permissions (sick/izin)
     */
    public function scopeFullDay($query)
    {
        return $query->where('is_full_day', true);
    }

    /**
     * Scope: Temporary permissions (izin_pulang/dispensasi)
     */
    public function scopeTemporary($query)
    {
        return $query->where('is_full_day', false);
    }
}
