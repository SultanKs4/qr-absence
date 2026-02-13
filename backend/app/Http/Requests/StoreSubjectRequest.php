<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSubjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->user_type === 'admin';
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'unique:subjects,code'],
            'name' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Kode mata pelajaran wajib diisi',
            'code.string' => 'Format kode tidak valid',
            'code.unique' => 'Kode mata pelajaran sudah digunakan',
            'name.required' => 'Nama mata pelajaran wajib diisi',
            'name.string' => 'Format nama tidak valid',
        ];
    }
}
