<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'is_active' => $this->is_active,
            'is_featured' => $this->is_featured,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'images' => ProductImageResource::collection($this->whenLoaded('images')),
            'variants' => ProductVariantResource::collection($this->whenLoaded('variants')),
            'min_price' => $this->whenLoaded('variants', fn () => (float) $this->variants->min('price')),
            'max_price' => $this->whenLoaded('variants', fn () => (float) $this->variants->max('price')),
            'total_stock' => $this->whenLoaded('variants', fn () => (int) $this->variants->sum('stock_quantity')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
