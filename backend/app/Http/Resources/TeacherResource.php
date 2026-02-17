<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeacherResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->user->name,
            'nip' => $this->nip,
            'code' => $this->nip, // Virtual field untuk Mobile (backward compatible)
            'email' => $this->user->email,
            'phone' => $this->user->phone,
            'contact' => $this->user->contact,
            'subject' => $this->subject,
            'subject_name' => $this->subject, // Alias untuk Mobile
            'role' => $this->jabatan,
            'waka_field' => $this->bidang,
            'major_expertise' => $this->konsentrasi_keahlian,
            'homeroom_class_id' => $this->homeroom_class_id,
            'homeroom_class' => $this->whenLoaded('homeroomClass', function () {
                return [
                    'id' => $this->homeroomClass->id,
                    'name' => $this->homeroomClass->name,
                    'grade' => $this->homeroomClass->grade_roman, // Mapping to Roman
                    'major' => $this->homeroomClass->major?->code,
                    'major_name' => $this->homeroomClass->major?->name,
                ];
            }),
            'photo_url' => $this->user->photo_url ?? null,
            'schedule_image_path' => $this->schedule_image_path,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
