<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'status' => $this->status,
            'payment_method' => $this->payment_method,
            'delivery_method' => $this->delivery_method,
            'subtotal' => (float) $this->subtotal,
            'shipping_fee' => (float) $this->shipping_fee,
            'total' => (float) $this->total,
            'delivery_recipient_name' => $this->delivery_recipient_name,
            'delivery_phone' => $this->delivery_phone,
            'delivery_address_line' => $this->delivery_address_line,
            'delivery_city' => $this->delivery_city,
            'delivery_province' => $this->delivery_province,
            'delivery_postal_code' => $this->delivery_postal_code,
            'notes' => $this->notes,
            'placed_at' => $this->placed_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'user' => new UserResource($this->whenLoaded('user')),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
        ];
    }
}
