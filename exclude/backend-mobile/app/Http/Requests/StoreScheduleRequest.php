<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->user_type === 'admin';
    }

    public function rules(): array
    {
        return [
            'day' => ['required', 'string', 'in:Monday,Tuesday,Wednesday,Thursday,Friday,Senin,Selasa,Rabu,Kamis,Jumat'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'title' => ['nullable', 'string', 'max:255'],
            'subject_name' => ['nullable', 'string', 'max:255'],
            'subject_id' => ['nullable', 'exists:subjects,id'],
            'teacher_id' => ['required', 'exists:teacher_profiles,id'],
            'class_id' => ['required', 'exists:classes,id'],
            'room' => ['nullable', 'string', 'max:50'],
            'semester' => ['required', 'integer', 'min:1', 'max:2'],
            'year' => ['required', 'integer', 'min:2020'],
        ];
    }

    public function prepareForValidation()
    {
        // Normalize day input if needed
        if ($this->day) {
            $this->merge([
                'day' => ucfirst(strtolower($this->day)),
            ]);
        }
    }
}
