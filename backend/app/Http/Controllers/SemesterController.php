<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSemesterRequest;
use App\Http\Requests\UpdateSemesterRequest;
use App\Models\Semester;
use Illuminate\Http\JsonResponse;

class SemesterController extends Controller
{
    /**
     * List Semesters
     *
     * Retrieve a list of all semesters with their associated school year.
     */
    public function index(): JsonResponse
    {
        return response()->json(Semester::with('schoolYear')->latest()->paginate());
    }

    /**
     * Create Semester
     *
     * Create a new semester.
     */
    public function store(StoreSemesterRequest $request): JsonResponse
    {
        $data = $request->validated();

        $semester = Semester::create($data);

        return response()->json($semester->load('schoolYear'), 201);
    }

    /**
     * Show Semester
     *
     * Retrieve a specific semester by ID.
     */
    public function show(Semester $semester): JsonResponse
    {
        return response()->json($semester->load('schoolYear'));
    }

    /**
     * Update Semester
     *
     * Update a specific semester by ID.
     */
    public function update(UpdateSemesterRequest $request, Semester $semester): JsonResponse
    {
        $data = $request->validated();

        $semester->update($data);

        return response()->json($semester->load('schoolYear'));
    }

    /**
     * Delete Semester
     *
     * Delete a specific semester by ID.
     */
    public function destroy(Semester $semester): JsonResponse
    {
        $semester->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
