<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClassSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'class_id',
        'semester',
        'year',
        'is_active',
    ];

    public function dailySchedules(): HasMany
    {
        return $this->hasMany(DailySchedule::class);
    }

    public function class(): BelongsTo
    {
        return $this->belongsTo(Classes::class, 'class_id');
    }
}
