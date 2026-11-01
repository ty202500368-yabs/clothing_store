<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'items' => CartItemResource::collection($this->whenLoaded('items')),
            'subtotal' => $this->whenLoaded('items', fn () => round(
                $this->items->sum(fn ($item) => (float) $item->productVariant->price * $item->quantity),
                2
            )),
            'total_items' => $this->whenLoaded('items', fn () => (int) $this->items->sum('quantity')),
        ];
    }
}
