<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSubjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->user_type === 'admin';
    }

    public function rules(): array
    {
        $subjectId = $this->route('subject')->id ?? $this->route('subject');

        return [
            'code' => ['sometimes', 'string', 'unique:subjects,code,'.$subjectId],
            'name' => ['sometimes', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.string' => 'Format kode tidak valid',
            'code.unique' => 'Kode mata pelajaran sudah digunakan',
            'name.string' => 'Format nama tidak valid',
        ];
    }
}
