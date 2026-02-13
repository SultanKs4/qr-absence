<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTimeSlotRequest;
use App\Http\Requests\UpdateTimeSlotRequest;
use App\Models\TimeSlot;
use Illuminate\Http\JsonResponse;

class TimeSlotController extends Controller
{
    /**
     * List Time Slots
     *
     * Retrieve a list of all time slots.
     */
    public function index(): JsonResponse
    {
        return response()->json(TimeSlot::latest()->paginate());
    }

    /**
     * Create Time Slot
     *
     * Create a new time slot.
     */
    public function store(StoreTimeSlotRequest $request): JsonResponse
    {
        $data = $request->validated();

        $slot = TimeSlot::create($data);

        return response()->json($slot, 201);
    }

    /**
     * Show Time Slot
     *
     * Retrieve a specific time slot by ID.
     */
    public function show(TimeSlot $timeSlot): JsonResponse
    {
        return response()->json($timeSlot);
    }

    /**
     * Update Time Slot
     *
     * Update a specific time slot by ID.
     */
    public function update(UpdateTimeSlotRequest $request, TimeSlot $timeSlot): JsonResponse
    {
        $data = $request->validated();

        $timeSlot->update($data);

        return response()->json($timeSlot);
    }

    /**
     * Delete Time Slot
     *
     * Delete a specific time slot by ID.
     */
    public function destroy(TimeSlot $timeSlot): JsonResponse
    {
        $timeSlot->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
