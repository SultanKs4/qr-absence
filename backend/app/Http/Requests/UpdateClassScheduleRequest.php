<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateClassScheduleRequest extends FormRequest
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
            'class_id' => ['sometimes', 'exists:classes,id'],
            'semester' => ['sometimes', 'integer', 'in:1,2'],
            'year' => ['sometimes', 'integer', 'digits:4'],
            'is_active' => ['boolean'],
            'days' => ['sometimes', 'array'],
            'days.*.day' => ['required_with:days', 'string', 'in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday'],
            'days.*.items' => ['array'],
            'days.*.items.*.subject_id' => ['nullable', 'exists:subjects,id'],
            'days.*.items.*.teacher_id' => ['required_with:days.*.items', 'exists:teacher_profiles,id'],
            'days.*.items.*.start_time' => ['required_with:days.*.items', 'date_format:H:i'],
            'days.*.items.*.end_time' => ['required_with:days.*.items', 'date_format:H:i', 'after:days.*.items.*.start_time'],
            'days.*.items.*.room' => ['nullable', 'string', 'max:50'],
            'days.*.items.*.keterangan' => ['nullable', 'string', 'max:255'],
        ];
    }
}
