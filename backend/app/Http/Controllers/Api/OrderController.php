<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Cart;
use App\Models\Order;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $orders = $request->user()
            ->orders()
            ->with([
                'items.productVariant.product.images',
                'payments',
            ])
            ->latest('id')
            ->paginate(10);

        return OrderResource::collection($orders);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'delivery_method' => ['required', Rule::in(['delivery', 'pickup'])],
            'payment_method' => ['required', Rule::in(['gcash', 'cod'])],
            'address_id' => ['nullable', 'required_if:delivery_method,delivery', 'integer'],
            'gcash_reference' => ['nullable', 'required_if:payment_method,gcash', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $user = $request->user();
        $address = null;

        if ($data['delivery_method'] === 'delivery') {
            $address = $user->addresses()->find($data['address_id']);

            if (! $address) {
                throw ValidationException::withMessages([
                    'address_id' => ['Please select a valid delivery address.'],
                ]);
            }
        }

        $order = DB::transaction(function () use ($user, $data, $address) {
            $cart = Cart::where('user_id', $user->id)->lockForUpdate()->first();

            if (! $cart || $cart->items()->count() === 0) {
                throw ValidationException::withMessages([
                    'cart' => ['Your cart is empty.'],
                ]);
            }

            $cartItems = $cart->items()->get();
            $variants = ProductVariant::query()
                ->whereIn('id', $cartItems->pluck('product_variant_id'))
                ->lockForUpdate()
                ->with(['product', 'color', 'size'])
                ->get()
                ->keyBy('id');

            $subtotal = 0.0;

            foreach ($cartItems as $cartItem) {
                $variant = $variants->get($cartItem->product_variant_id);

                if (! $variant || ! $variant->is_active || ! $variant->product || ! $variant->product->is_active) {
                    throw ValidationException::withMessages([
                        'cart' => ['One of the products in your cart is no longer available.'],
                    ]);
                }

                if ($cartItem->quantity > $variant->stock_quantity) {
                    throw ValidationException::withMessages([
                        'cart' => ["{$variant->product->name} only has {$variant->stock_quantity} item(s) left."],
                    ]);
                }

                $subtotal += (float) $variant->price * $cartItem->quantity;
            }

            $subtotal = round($subtotal, 2);
            $shippingFee = $data['delivery_method'] === 'delivery'
                ? (float) config('store.shipping_fee', 50)
                : 0.0;
            $total = round($subtotal + $shippingFee, 2);

            do {
                $orderNumber = 'ORD-'.now()->format('Ymd').'-'.strtoupper(Str::random(6));
            } while (Order::where('order_number', $orderNumber)->exists());

            $order = new Order([
                'user_id' => $user->id,
                'payment_method' => $data['payment_method'],
                'delivery_method' => $data['delivery_method'],
                'delivery_recipient_name' => $address?->recipient_name,
                'delivery_phone' => $address?->phone,
                'delivery_address_line' => $address?->address_line,
                'delivery_city' => $address?->city,
                'delivery_province' => $address?->province,
                'delivery_postal_code' => $address?->postal_code,
                'notes' => $data['notes'] ?? null,
            ]);
            $order->order_number = $orderNumber;
            $order->status = 'pending';
            $order->subtotal = $subtotal;
            $order->shipping_fee = $shippingFee;
            $order->total = $total;
            $order->placed_at = now();
            $order->save();

            foreach ($cartItems as $cartItem) {
                $variant = $variants->get($cartItem->product_variant_id);
                $lineTotal = round((float) $variant->price * $cartItem->quantity, 2);

                $order->items()->create([
                    'product_variant_id' => $variant->id,
                    'product_name' => $variant->product->name,
                    'sku' => $variant->sku,
                    'color_name' => $variant->color?->name,
                    'size_name' => $variant->size?->name,
                    'unit_price' => $variant->price,
                    'quantity' => $cartItem->quantity,
                    'line_total' => $lineTotal,
                ]);

                $variant->decrement('stock_quantity', $cartItem->quantity);
            }

            $order->payments()->create([
                'method' => $data['payment_method'],
                'amount' => $total,
                'reference_number' => $data['payment_method'] === 'gcash'
                    ? $data['gcash_reference']
                    : null,
            ]);

            $cart->items()->delete();

            return $order;
        });

        $order->load(['items', 'payments']);

        return (new OrderResource($order))->response()->setStatusCode(201);
    }

    public function show(Request $request, Order $order): OrderResource
    {
        abort_unless($order->user_id === $request->user()->id, 403);

        $order->load([
            'items.productVariant.product.images',
            'payments',
        ]);

        return new OrderResource($order);
    }
}
