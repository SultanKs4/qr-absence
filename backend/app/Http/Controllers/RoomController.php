<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRoomRequest;
use App\Http\Requests\UpdateRoomRequest;
use App\Models\Room;
use Illuminate\Http\JsonResponse;

class RoomController extends Controller
{
    /**
     * List Rooms
     *
     * Retrieve a list of all rooms.
     */
    public function index(): JsonResponse
    {
        return response()->json(Room::latest()->paginate());
    }

    /**
     * Create Room
     *
     * Create a new room.
     */
    public function store(StoreRoomRequest $request): JsonResponse
    {
        $data = $request->validated();

        $room = Room::create($data);

        return response()->json($room, 201);
    }

    /**
     * Show Room
     *
     * Retrieve a specific room by ID.
     */
    public function show(Room $room): JsonResponse
    {
        return response()->json($room);
    }

    /**
     * Update Room
     *
     * Update a specific room by ID.
     */
    public function update(UpdateRoomRequest $request, Room $room): JsonResponse
    {
        $data = $request->validated();

        $room->update($data);

        return response()->json($room);
    }

    /**
     * Delete Room
     *
     * Delete a specific room by ID.
     */
    public function destroy(Room $room): JsonResponse
    {
        $room->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
