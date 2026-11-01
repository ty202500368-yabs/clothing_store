<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AddressResource;
use App\Models\Address;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class AddressController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return AddressResource::collection(
            $request->user()->addresses()->orderByDesc('is_default')->latest()->get()
        );
    }

    public function store(Request $request): AddressResource
    {
        $data = $this->validated($request);
        $user = $request->user();
        $isFirstAddress = $user->addresses()->count() === 0;
        $makeDefault = $data['is_default'] ?? $isFirstAddress;

        $address = DB::transaction(function () use ($user, $data, $makeDefault) {
            if ($makeDefault) {
                $user->addresses()->update(['is_default' => false]);
            }

            return $user->addresses()->create([
                ...$data,
                'is_default' => $makeDefault,
            ]);
        });

        return new AddressResource($address);
    }

    public function update(Request $request, Address $address): AddressResource
    {
        $this->authorizeAddress($request, $address);

        $data = $this->validated($request, partial: true);
        $makeDefault = $data['is_default'] ?? $address->is_default;

        DB::transaction(function () use ($request, $address, $data, $makeDefault) {
            if ($makeDefault && ! $address->is_default) {
                $request->user()->addresses()->update(['is_default' => false]);
            }

            $address->fill([...$data, 'is_default' => $makeDefault])->save();
        });

        return new AddressResource($address->refresh());
    }

    public function destroy(Request $request, Address $address): JsonResponse
    {
        $this->authorizeAddress($request, $address);

        $wasDefault = $address->is_default;
        $address->delete();

        if ($wasDefault) {
            $request->user()->addresses()->latest()->first()?->update(['is_default' => true]);
        }

        return response()->json(['message' => 'Address deleted.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'label' => ['nullable', 'string', 'max:100'],
            'recipient_name' => [$required, 'string', 'max:255'],
            'phone' => [$required, 'string', 'max:30'],
            'address_line' => [$required, 'string', 'max:255'],
            'city' => [$required, 'string', 'max:255'],
            'province' => [$required, 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'is_default' => ['sometimes', 'boolean'],
        ]);
    }

    private function authorizeAddress(Request $request, Address $address): void
    {
        abort_unless($address->user_id === $request->user()->id, 403);
    }
}
