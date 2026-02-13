<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadScheduleImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->user_type, ['admin', 'teacher']);
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'image', 'max:2048'], // 2MB Max
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'File gambar wajib diunggah',
            'file.image' => 'File harus berupa gambar',
            'file.max' => 'Ukuran file maksimal 2MB',
        ];
    }
}
