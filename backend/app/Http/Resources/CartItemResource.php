<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $variant = $this->whenLoaded('productVariant');

        return [
            'id' => $this->id,
            'quantity' => $this->quantity,
            'product_variant' => new ProductVariantResource($variant),
            'line_total' => $this->relationLoaded('productVariant') && $this->productVariant
                ? round((float) $this->productVariant->price * $this->quantity, 2)
                : null,
        ];
    }
}
