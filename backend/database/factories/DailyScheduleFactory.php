<?php

namespace Database\Factories;

use App\Models\ClassSchedule;
use App\Models\DailySchedule;
use Illuminate\Database\Eloquent\Factories\Factory;

class DailyScheduleFactory extends Factory
{
    protected $model = DailySchedule::class;

    public function definition(): array
    {
        return [
            'class_schedule_id' => ClassSchedule::factory(),
            'day' => fake()->randomElement(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
        ];
    }
}
