<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ScheduleItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'daily_schedule_id',
        'subject_id',
        'teacher_id',
        'start_time',
        'end_time',
        'room',
        'keterangan',
    ];

    public function dailySchedule(): BelongsTo
    {
        return $this->belongsTo(DailySchedule::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(TeacherProfile::class, 'teacher_id');
    }
}
