<?php

namespace App\Console\Commands;

use App\Models\Attendance;
use App\Models\Schedule;
use App\Models\StudentProfile;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class CloseDailyAttendance extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'attendance:close-daily {date? : The date to close attendance for (YYYY-MM-DD)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Close attendance for all schedules on a specific date, marking missing students as absent.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dateStr = $this->argument('date') ?? now()->toDateString();
        $date = Carbon::parse($dateStr);
        $day = $date->format('l');

        $this->info("Closing attendance for {$dateStr} ({$day})...");

        // Find all schedules for this day
        $schedules = Schedule::where('day', $day)->get();

        if ($schedules->isEmpty()) {
            $this->info('No schedules found for this day.');

            return;
        }

        $bar = $this->output->createProgressBar($schedules->count());
        $bar->start();

        foreach ($schedules as $schedule) {
            // Get all students in the class
            $students = StudentProfile::where('class_id', $schedule->class_id)->get();

            // Get existing attendance
            $existing = Attendance::where('schedule_id', $schedule->id)
                ->where('attendee_type', 'student')
                ->whereDate('date', $dateStr)
                ->pluck('student_id')
                ->all();

            foreach ($students as $student) {
                if (! in_array($student->id, $existing)) {
                    Attendance::create([
                        'attendee_type' => 'student',
                        'student_id' => $student->id,
                        'schedule_id' => $schedule->id,
                        'date' => $date,
                        'status' => 'absent',
                        'source' => 'system_close',
                        'reason' => 'Tidak hadir (Auto-close)',
                    ]);
                }
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Attendance closed successfully.');
    }
}
