<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TeacherProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'nip',
        'jabatan',
        'bidang',
        'konsentrasi_keahlian',
        'kode_guru',
        'homeroom_class_id',
        'subject',
    ];

    // User yang mengajar
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Kelas yang menjadi homeroom
    public function homeroomClass(): BelongsTo
    {
        return $this->belongsTo(Classes::class, 'homeroom_class_id');
    }



    // Item jadwal yang dijadwalkan
    public function scheduleItems(): HasMany
    {
        return $this->hasMany(ScheduleItem::class, 'teacher_id');
    }
}
