<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->user_type === 'admin';
    }

    public function rules(): array
    {
        return [
            'day' => ['sometimes', 'string', 'in:Monday,Tuesday,Wednesday,Thursday,Friday,Senin,Selasa,Rabu,Kamis,Jumat'],
            'start_time' => ['sometimes', 'date_format:H:i'],
            'end_time' => ['sometimes', 'date_format:H:i', 'after:start_time'],
            'title' => ['nullable', 'string', 'max:255'],
            'subject_name' => ['nullable', 'string', 'max:255'],
            'subject_id' => ['nullable', 'exists:subjects,id'],
            'teacher_id' => ['sometimes', 'exists:teacher_profiles,id'],
            'class_id' => ['sometimes', 'exists:classes,id'],
            'room' => ['nullable', 'string', 'max:50'],
            'semester' => ['sometimes', 'integer', 'min:1', 'max:2'],
            'year' => ['sometimes', 'integer', 'min:2020'],
        ];
    }
}
