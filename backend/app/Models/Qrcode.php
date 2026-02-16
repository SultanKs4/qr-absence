<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use App\Models\ScheduleItem;

class Qrcode extends Model
{
    use HasFactory;

    protected $fillable = [
        'token',
        'type',
        'schedule_id',
        'issued_by',
        'status',
        'expires_at',
        'is_active',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(ScheduleItem::class, 'schedule_id');
    }

    public function issuer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    public function isExpired(): bool
    {
        return $this->expires_at instanceof Carbon && $this->expires_at->isPast();
    }
}
