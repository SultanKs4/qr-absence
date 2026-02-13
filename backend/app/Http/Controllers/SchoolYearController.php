<?php

namespace App\Http\Controllers;

use App\Models\SchoolYear;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SchoolYearController extends Controller
{
    /**
     * List School Years
     *
     * Retrieve a list of all school years.
     */
    public function index(): JsonResponse
    {
        return response()->json(SchoolYear::latest()->paginate());
    }

    /**
     * Create School Year
     *
     * Create a new school year.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string'],
            'start_year' => ['required', 'integer'],
            'end_year' => ['required', 'integer', 'gte:start_year'],
            'active' => ['nullable', 'boolean'],
        ]);

        $year = SchoolYear::create($data);

        return response()->json($year, 201);
    }

    /**
     * Show School Year
     *
     * Retrieve a specific school year by ID.
     */
    public function show(SchoolYear $schoolYear): JsonResponse
    {
        return response()->json($schoolYear);
    }

    /**
     * Update School Year
     *
     * Update a specific school year by ID.
     */
    public function update(Request $request, SchoolYear $schoolYear): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string'],
            'start_year' => ['sometimes', 'integer'],
            'end_year' => ['sometimes', 'integer'],
            'active' => ['nullable', 'boolean'],
        ]);

        $schoolYear->update($data);

        return response()->json($schoolYear);
    }

    /**
     * Delete School Year
     *
     * Delete a specific school year by ID.
     */
    public function destroy(SchoolYear $schoolYear): JsonResponse
    {
        $schoolYear->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
