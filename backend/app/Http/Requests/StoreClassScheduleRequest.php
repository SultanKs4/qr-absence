<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreClassScheduleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'class_id' => ['required', 'exists:classes,id'],
            'semester' => ['required', 'integer', 'in:1,2'],
            'year' => ['required', 'integer', 'digits:4'],
            'is_active' => ['boolean'],
            'days' => ['required', 'array'],
            'days.*.day' => ['required', 'string', 'in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday'],
            'days.*.items' => ['array'],
            'days.*.items.*.subject_id' => ['nullable', 'exists:subjects,id'],
            'days.*.items.*.teacher_id' => ['required', 'exists:teacher_profiles,id'],
            'days.*.items.*.start_time' => ['required', 'date_format:H:i'],
            'days.*.items.*.end_time' => ['required', 'date_format:H:i', 'after:days.*.items.*.start_time'],
            'days.*.items.*.room' => ['nullable', 'string', 'max:50'],
            'days.*.items.*.keterangan' => ['nullable', 'string', 'max:255'],
        ];
    }
}
