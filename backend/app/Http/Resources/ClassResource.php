<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClassResource extends JsonResource
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
            'grade' => $this->grade,
            'label' => $this->label,
            'class_name' => $this->name, // Using the accessor defined in Classes model
            'major_id' => $this->major_id,
            'major' => $this->major?->code, // Direct major code like "RPL"
            'major_name' => $this->major?->name,
            'homeroom_teacher_id' => $this->homeroom_teacher_id,
            'homeroom_teacher_name' => $this->homeroomTeacher?->user?->name ?? 'Belum ditentukan',
            'schedule_image_url' => $this->schedule_image_path ? asset('storage/' . $this->schedule_image_path) : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
