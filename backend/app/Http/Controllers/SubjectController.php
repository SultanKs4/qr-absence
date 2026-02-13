<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSubjectRequest;
use App\Http\Requests\UpdateSubjectRequest;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    /**
     * List Subjects
     *
     * Retrieve a list of all subjects.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->integer('per_page', 15);

        if ($perPage === -1) {
            return response()->json(Subject::query()->latest()->get());
        }

        return response()->json(Subject::query()->latest()->paginate($perPage));
    }

    /**
     * Create Subject
     *
     * Create a new subject key/course.
     */
    public function store(StoreSubjectRequest $request): JsonResponse
    {
        $data = $request->validated();

        $subject = Subject::create($data);

        return response()->json($subject, 201);
    }

    /**
     * Show Subject
     *
     * Retrieve a specific subject by ID.
     */
    public function show(Subject $subject): JsonResponse
    {
        return response()->json($subject);
    }

    /**
     * Update Subject
     *
     * Update a specific subject by ID.
     */
    public function update(UpdateSubjectRequest $request, Subject $subject): JsonResponse
    {
        $data = $request->validated();

        $subject->update($data);

        return response()->json($subject);
    }

    /**
     * Delete Subject
     *
     * Delete a specific subject by ID.
     */
    public function destroy(Subject $subject): JsonResponse
    {
        $subject->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
