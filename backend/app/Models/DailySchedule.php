<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DailySchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'class_schedule_id',
        'day',
    ];

    public function classSchedule(): BelongsTo
    {
        return $this->belongsTo(ClassSchedule::class);
    }

    public function scheduleItems(): HasMany
    {
        return $this->hasMany(ScheduleItem::class);
    }
}
