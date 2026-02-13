<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSemesterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->user_type === 'admin';
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string'],
            'school_year_id' => ['required', 'exists:school_years,id'],
            'active' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama semester wajib diisi',
            'name.string' => 'Format nama semester tidak valid',
            'school_year_id.required' => 'Tahun ajaran wajib dipilih',
            'school_year_id.exists' => 'Tahun ajaran tidak ditemukan',
            'active.boolean' => 'Format status aktif tidak valid',
        ];
    }
}
