<?php

namespace Database\Factories;

use App\Models\DailySchedule;
use App\Models\ScheduleItem;
use App\Models\Subject;
use App\Models\TeacherProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

class ScheduleItemFactory extends Factory
{
    protected $model = ScheduleItem::class;

    public function definition(): array
    {
        return [
            'daily_schedule_id' => DailySchedule::factory(),
            'subject_id' => Subject::factory(),
            'teacher_id' => TeacherProfile::factory(),
            'start_time' => '07:00:00',
            'end_time' => '08:30:00',
            'room' => 'Lab '.fake()->numerify('##'),
        ];
    }
}
