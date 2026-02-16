<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Classes extends Model
{
    use HasFactory;

    protected $with = ['major']; // Eager load major by default

    protected $appends = ['name'];

    public function getNameAttribute(): string
    {
        return trim("{$this->grade} {$this->label}");
    }

    protected $fillable = [
        'grade',
        'label',
        'major_id',
    ];

    // Siswa untuk 
    public function students(): HasMany
    {
        return $this->hasMany(StudentProfile::class, 'class_id');
    }



    // Guru yang mengajar kelas
    public function homeroomTeacher(): HasOne
    {
        return $this->hasOne(TeacherProfile::class, 'homeroom_class_id');
    }

    // Jurusan yang diikuti kelas
    public function major(): BelongsTo
    {
        return $this->belongsTo(Major::class, 'major_id');
    }

    // Jadwal untuk kelas
    public function classSchedules(): HasMany
    {
        return $this->hasMany(ClassSchedule::class, 'class_id');
    }
}
