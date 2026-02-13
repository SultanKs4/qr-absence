<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTimeSlotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->user_type === 'admin';
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string'],
            'start_time' => ['sometimes', 'date_format:H:i'],
            'end_time' => ['sometimes', 'date_format:H:i', 'after:start_time'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.string' => 'Format nama tidak valid',
            'start_time.date_format' => 'Format waktu mulai harus HH:MM (contoh: 07:00)',
            'end_time.date_format' => 'Format waktu selesai harus HH:MM (contoh: 08:00)',
            'end_time.after' => 'Waktu selesai harus setelah waktu mulai',
        ];
    }
}
