<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMajorRequest;
use App\Http\Requests\UpdateMajorRequest;
use App\Models\Major;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MajorController extends Controller
{
    /**
     * List Majors
     *
     * Retrieve a list of all majors.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->integer('per_page', 15);

        if ($perPage === -1) {
            return response()->json(Major::query()->latest()->get());
        }

        return response()->json(Major::query()->latest()->paginate($perPage));
    }

    /**
     * Create Major
     *
     * Create a new major/department.
     */
    public function store(StoreMajorRequest $request): JsonResponse
    {
        $data = $request->validated();

        $major = Major::create($data);

        return response()->json($major, 201);
    }

    /**
     * Show Major
     *
     * Retrieve a specific major by ID.
     */
    public function show(Major $major): JsonResponse
    {
        return response()->json($major->load('classes'));
    }

    /**
     * Update Major
     *
     * Update a specific major by ID.
     */
    public function update(UpdateMajorRequest $request, Major $major): JsonResponse
    {
        $data = $request->validated();

        $major->update($data);

        return response()->json($major);
    }

    /**
     * Delete Major
     *
     * Delete a specific major by ID.
     */
    public function destroy(Major $major): JsonResponse
    {
        $major->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
