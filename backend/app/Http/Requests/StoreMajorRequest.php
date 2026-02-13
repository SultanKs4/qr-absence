<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMajorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->user_type === 'admin';
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:20', 'unique:majors,code'],
            'name' => ['required', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Kode jurusan wajib diisi',
            'code.string' => 'Format kode jurusan tidak valid',
            'code.max' => 'Kode jurusan maksimal 20 karakter',
            'code.unique' => 'Kode jurusan sudah digunakan',
            'name.required' => 'Nama jurusan wajib diisi',
            'name.string' => 'Format nama jurusan tidak valid',
            'name.max' => 'Nama jurusan maksimal 100 karakter',
            'category.string' => 'Format kategori tidak valid',
            'category.max' => 'Kategori maksimal 100 karakter',
        ];
    }
}
