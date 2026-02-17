<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentResource extends JsonResource
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
            'nisn' => $this->nisn,
            'nis' => $this->nis,
            'email' => $this->user->email,
            'gender' => $this->gender,
            'address' => $this->address,
            'parent_phone' => $this->parent_phone,
            'class_id' => $this->class_id,
            'class_name' => $this->whenLoaded('classRoom', fn () => $this->classRoom->name),
            'major_id' => $this->whenLoaded('classRoom', fn () => $this->classRoom->major_id),
            'major_name' => $this->whenLoaded('classRoom', fn () => $this->classRoom->major?->name),
            'major' => $this->whenLoaded('classRoom', fn () => $this->classRoom->major?->code),
            'grade' => $this->whenLoaded('classRoom', function() {
                $grades = [
                    '10' => 'X',
                    '11' => 'XI',
                    '12' => 'XII'
                ];
                return $grades[$this->classRoom->grade] ?? $this->classRoom->grade;
            }),
            'is_class_officer' => $this->is_class_officer,
            'photo_url' => $this->user->photo_url ?? null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
