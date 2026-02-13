<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreClassRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->user_type === 'admin';
    }

    public function rules(): array
    {
        return [
            'grade' => ['required', 'string', 'max:10'],
            'label' => ['required', 'string', 'max:20'],
            'major_id' => ['nullable', 'exists:majors,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'grade.required' => 'Tingkat kelas wajib diisi',
            'grade.string' => 'Format tingkat kelas tidak valid',
            'grade.max' => 'Tingkat kelas maksimal 10 karakter',
            'label.required' => 'Label kelas wajib diisi',
            'label.string' => 'Format label kelas tidak valid',
            'label.max' => 'Label kelas maksimal 20 karakter',
            'major_id.exists' => 'Jurusan tidak ditemukan',
        ];
    }
}
