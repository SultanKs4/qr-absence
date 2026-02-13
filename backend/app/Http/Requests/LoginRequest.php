<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Login is publicly accessible
    }

    public function rules(): array
    {
        return [
            'login' => ['required', 'string'],
            'password' => ['nullable', 'string'], // Password optional for NISN login
        ];
    }

    public function messages(): array
    {
        return [
            'login.required' => 'Username, email, NISN, atau NIP wajib diisi',
            'login.string' => 'Format login tidak valid',
            'password.string' => 'Format password tidak valid',
        ];
    }
}
