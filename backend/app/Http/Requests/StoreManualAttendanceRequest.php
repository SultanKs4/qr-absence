<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class StoreManualAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->user_type === 'admin' || $this->user()->user_type === 'teacher';
    }

    public function rules(): array
    {
        return [
            'attendee_type' => ['required', Rule::in(['student', 'teacher'])],
            'schedule_id' => ['required', 'exists:schedule_items,id'],
            'status' => [
                'required',
                Rule::in([
                    'present', 'late', 'excused', 'sick', 'absent', 'dinas', 'izin', 'pulang', 'return', 'alpha',
                    'hadir', 'tanpa-keterangan', 'terlambat', 'sakit', 'dispensasi'
                ]),
            ],
            'date' => [
                'required',
                'date',
                function ($attribute, $value, $fail) {
                    if (date('N', strtotime($value)) == 7) {
                        $fail('Kegiatan sekolah tidak tersedia di hari Minggu.');
                    }
                },
            ],
            'student_id' => ['nullable', 'exists:student_profiles,id', 'required_if:attendee_type,student'],
            'teacher_id' => ['nullable', 'exists:teacher_profiles,id', 'required_if:attendee_type,teacher'],
            'reason' => ['nullable', 'string', 'max:255'],
        ];
    }

    protected function prepareForValidation()
    {
        // Normalize status input to backend enum
        $status = $this->input('status');
        $map = [
            'alpha' => 'absent',
            'tanpa-keterangan' => 'absent',
            'pulang' => 'return',
            'hadir' => 'present',
            'sakit' => 'sick',
            'izin' => 'excused',
            'terlambat' => 'late',
        ];

        if (isset($map[$status])) {
            $this->merge(['status' => $map[$status]]);
        }
    }
}
