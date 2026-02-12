<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingRequest extends FormRequest
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
            'school_name' => 'nullable|string|max:255',
            'school_logo' => 'nullable|image|max:2048',
            'school_mascot' => 'nullable|image|max:2048',
            'school_email' => 'nullable|email|max:255',
            'school_phone' => 'nullable|string|max:20',
            'school_address' => 'nullable|string|max:500',
            'school_subdistrict' => 'nullable|string|max:100',
            'school_district' => 'nullable|string|max:100',
            'school_city' => 'nullable|string|max:100',
            'school_province' => 'nullable|string|max:100',
            'school_postal_code' => 'nullable|string|max:20',
            'school_npsn' => 'nullable|string|max:50',
            'school_accreditation' => 'nullable|string|max:10',
            'school_headmaster' => 'nullable|string|max:255',
            'school_headmaster_nip' => 'nullable|string|max:50',
            'school_type' => 'nullable|string|max:50',
        ];
    }
}
